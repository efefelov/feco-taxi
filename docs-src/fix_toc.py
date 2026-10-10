#!/usr/bin/env python3
"""Аудит (и хирургический фикс) кэшированных номеров страниц в поле TOC.

Перенос /tmp/fix_toc.py (Task 22) в пайплайн docs-src (P3 из worklog).
Запускается ПОСЛЕ add_toc_placeholders.py (и до/после patch_footers.py —
на пагинацию футеры не влияют).

Почему нужен: add_toc_placeholders.py считает страницу заголовка как
«ПОСЛЕДНЮЮ страницу рендера, содержащую текст заголовка». Если текст
заголовка повторается на более поздней странице (перекрёстная ссылка,
упоминание в другом разделе) — кэш уезжает вперёд (офби-ван из Task 22:
«3. Бюджет» был закэширован как 4).

Алгоритм (робастнее «последней страницы»):
1. Заголовки H1/H2 из document.xml — в порядке документа.
2. Рендер docx -> pdf -> тексты страниц.
3. Страницы TOC распознаём как страницы, где встречаются >= 3 нормированных
   текстов заголовков ДО первого вхождения первого заголовка.
4. Дальше — монотонный поиск: каждый заголовок ищем на странице >= страницы
   предыдущего (в порядке документа) — перекрёстные ссылки ДО раздела не
   могут наврать, ссылки ПОСЛЕ не мешают (берём первое вхождение).
5. Смещение: тело = страница первого H1 минус 1 (первый H1 = страница 1 тела,
   нумерация секции тела начинается с 1).
6. Сверяем с кэшем в XML каждой записи TOC (hyperlink anchor _Toc100000+i);
   расхождения печатаем; с --fix патчим кэш прямо в document.xml.

Запуск: python3 fix_toc.py <file.docx> [--fix]
Выход: 0 — расхождений нет (или все запатчены); 2 — есть расхождения без --fix
или заголовок не найден в теле (аудит не прошёл, кэш оставлен как был).
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile


def read_docx(path):
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        data = {n: z.read(n) for n in names}
    return names, data


def write_docx(path, names, data):
    fd, tmp = tempfile.mkstemp(suffix=".docx")
    os.close(fd)
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
        for n in names:
            z.writestr(n, data[n])
    shutil.move(tmp, path)


def find_headings(doc):
    """[(start, end, level, text)] — как в add_toc_placeholders.py."""
    res = []
    for m in re.finditer(r"<w:p(?: [^>]*)?>.*?</w:p>", doc, flags=re.S):
        blk = m.group(0)
        st = re.search(r'<w:pStyle w:val="Heading([12])"/>', blk)
        if not st:
            continue
        text = "".join(re.findall(r"<w:t(?: [^>]*)?>([^<]*)</w:t>", blk)).strip()
        if text:
            res.append((m.start(), m.end(), int(st.group(1)), text))
    return res


def render_pdf_pages(docx_path):
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(
            ["soffice", "--headless", "--convert-to", "pdf", "--outdir", td, docx_path],
            check=True, capture_output=True, timeout=300,
        )
        pdf = os.path.join(td, os.path.splitext(os.path.basename(docx_path))[0] + ".pdf")
        info = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True, check=True).stdout
        n = int(re.search(r"Pages:\s+(\d+)", info).group(1))
        pages = []
        for p in range(1, n + 1):
            txt = subprocess.run(
                ["pdftotext", "-f", str(p), "-l", str(p), pdf, "-"],
                capture_output=True, text=True, check=True,
            ).stdout
            pages.append(txt)
    return pages


def norm(s):
    return re.sub(r"\s+", "", s)


def cached_toc_pages(doc, n_headings):
    """Кэшированные номера страниц из записей TOC по якорю _Toc100000+i."""
    cached = {}
    for i in range(n_headings):
        m = re.search(
            r'<w:hyperlink w:anchor="_Toc%d".*?<w:fldChar w:fldCharType="separate"/>'
            r"</w:r><w:r><w:t>(\d+)</w:t></w:r>" % (100000 + i),
            doc, flags=re.S,
        )
        if m:
            cached[i] = int(m.group(1))
    return cached


def real_body_pages(headings, pages_txt):
    """(страницы тела по документу, смещение) монотонным поиском; None при провале."""
    npages = [norm(p) for p in pages_txt]
    keys = [norm(t) for _s, _e, _l, t in headings]

    # Страницы TOC: до тела; содержат много текстов заголовков сразу.
    toc_like = []
    for i, p in enumerate(npages):
        hits = sum(1 for k in keys if k in p)
        if hits >= 3:
            toc_like.append(i + 1)
    if not toc_like:
        # TOC из одной записи не найти — считаем, что TOC нет (не наш случай).
        toc_like = [0]

    result = []
    prev = toc_like[-1] + 1  # тело начинается после страницы содержания
    for idx, k in enumerate(keys):
        found = 0
        # старт с той же страницы, что и предыдущий заголовок: заголовки могут
        # делить страницу (монотонность "не убывает", а не "строго растёт").
        # prev хранится 1-based, поэтому range(prev-1) даёт 0-based индекс
        # страницы предыдущего заголовка; для первого заголовка это первая
        # страница после TOC (0-based toc_like[-1] == 1-based toc_like[-1]+1)
        for p in range(prev - 1, len(npages)):
            if k in npages[p]:
                found = p + 1
                break
        if found == 0:
            # fallback: последнее вхождение (как в add_toc_placeholders)
            for p in range(len(npages) - 1, -1, -1):
                if k in npages[p]:
                    found = p + 1
                    break
        if found == 0:
            print(f"  [AUDIT-FAIL] заголовок не найден в рендере: {headings[idx][3]!r}")
            return None, None
        result.append(found)
        prev = found
    offset = result[0] - 1  # первый H1 тела = страница 1 тела
    if offset < 0:
        return None, None
    return [p - offset for p in result], offset


def process(path, do_fix):
    names, data = read_docx(path)
    doc = data["word/document.xml"].decode("utf-8")
    headings = find_headings(doc)
    if not headings:
        print(f"{path}: заголовков нет, пропуск")
        return 0
    cached = cached_toc_pages(doc, len(headings))

    pages_txt = render_pdf_pages(path)
    real, offset = real_body_pages(headings, pages_txt)
    if real is None:
        print(f"{path}: аудит провалился, кэш не тронут")
        return 2

    diffs = []
    for i, (_s, _e, _l, text) in enumerate(headings):
        c = cached.get(i)
        r = real[i]
        if c is not None and c != r:
            diffs.append((i, text, c, r))

    if not diffs:
        print(f"{path}: TOC-кэш точен ({len(headings)} записей, смещение {offset}, "
              f"pdf-страниц {len(pages_txt)})")
        return 0

    for i, text, c, r in diffs:
        print(f"  [DIFF] {text!r}: кэш {c} -> реальность {r}")
    if not do_fix:
        print(f"{path}: {len(diffs)} расхождений, --fix не задан")
        return 2

    for i, text, c, r in diffs:
        anchor = 100000 + i
        pat = (
            r'(<w:hyperlink w:anchor="_Toc%d".*?<w:fldChar w:fldCharType="separate"/>'
            r"</w:r><w:r><w:t>)\d+(</w:t></w:r>)" % anchor
        )
        doc, n = re.subn(pat, r"\g<1>%d\g<2>" % r, doc, count=1, flags=re.S)
        if n != 1:
            print(f"  [PATCH-FAIL] не запатчено: {text!r}")
            return 2
    data["word/document.xml"] = doc.encode("utf-8")
    write_docx(path, names, data)
    print(f"{path}: запатчено {len(diffs)} кэш-номеров TOC")
    return 0


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--fix"]
    do_fix = "--fix" in sys.argv
    if not args:
        raise SystemExit("использование: fix_toc.py <file.docx> [...] [--fix]")
    rc = 0
    for p in args:
        rc = max(rc, process(p, do_fix))
    sys.exit(rc)
