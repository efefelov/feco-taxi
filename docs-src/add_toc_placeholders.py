#!/usr/bin/env python3
"""Пост-обработка docx: placeholder-записи в поле TOC (уровни 1-2) + закладки-якоря.

Что делает (воспроизведён в Task 19-b по состоянию файла раунда 18-a):
1. Находит в теле заголовки Heading1/Heading2 в порядке появления.
2. Оборачивает каждый в bookmarkStart/End вида _Toc100000+i.
3. Вставляет в поле TOC (между fldChar separate и end) записи-плейсхолдеры
   с PAGEREF-полями и кэшированными номерами страниц (H1 -> стиль "9",
   H2 -> стиль "11" с отступом 360), как их рисует Word после обновления поля.
4. Кэшированные номера страниц вычисляет рендером: soffice -> pdf -> pdftotext;
   страница тела = страница PDF - смещение (обложка + содержание).

Запуск: python3 add_toc_placeholders.py <file.docx> [...]
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from xml.sax.saxutils import escape


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
    """[(start, end, level, text)] для абзацев с pStyle Heading1/Heading2."""
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


def add_bookmarks(doc, headings):
    """Вставить bookmarkStart после pPr и bookmarkEnd перед закрывающим </w:p>."""
    out, last = [], 0
    for i, (s, e, _lvl, _text) in enumerate(headings):
        bid = 100000 + i
        out.append(doc[last:s])
        blk = doc[s:e]
        m = re.search(r"<w:p(?: [^>]*)?>(?:<w:pPr>.*?</w:pPr>)?", blk, flags=re.S)
        ins = m.end()
        out.append(
            blk[:ins]
            + f'<w:bookmarkStart w:id="{bid}" w:name="_Toc{bid}"/>'
            + blk[ins:-len("</w:p>")]
            + f'<w:bookmarkEnd w:id="{bid}"/>'
            + "</w:p>"
        )
        last = e
    out.append(doc[last:])
    return "".join(out)


def toc_entry(bid, text, page, level):
    style = "9" if level == 1 else "11"
    ind = '<w:ind w:left="360"/>' if level == 2 else ""
    return (
        f'<w:p><w:pPr><w:pStyle w:val="{style}"/>'
        f'<w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9026"/></w:tabs>'
        f'<w:spacing w:before="120" w:after="60"/>{ind}</w:pPr>'
        f'<w:hyperlink w:anchor="_Toc{bid}" w:history="1">'
        f'<w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr>'
        f'<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'
        f"<w:r><w:tab/></w:r>"
        f'<w:r><w:fldChar w:fldCharType="begin"/></w:r>'
        f'<w:r><w:instrText xml:space="preserve"> PAGEREF _Toc{bid} \\h </w:instrText></w:r>'
        f'<w:r><w:fldChar w:fldCharType="separate"/></w:r>'
        f"<w:r><w:t>{page}</w:t></w:r>"
        f'<w:r><w:fldChar w:fldCharType="end"/></w:r>'
        f"</w:hyperlink></w:p>"
    )


def insert_toc_entries(doc, headings, pages):
    """Переписать поле TOC: разбить begin/instrText/separate на отдельные runs
    и вставить записи-плейсхолдеры перед абзацем с fldChar end."""
    m = re.search(
        r'<w:sdt><w:sdtPr><w:alias w:val="Table of Contents"/>.*?</w:sdtContent></w:sdt>',
        doc, flags=re.S,
    )
    if not m:
        raise SystemExit("TOC-поле не найдено")
    blk = m.group(0)
    old_head = (
        '<w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/>'
        '<w:instrText xml:space="preserve">TOC \\h \\o &quot;1-2&quot;</w:instrText>'
        '<w:fldChar w:fldCharType="separate"/></w:r></w:p>'
    )
    new_head = (
        '<w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>'
        '<w:r><w:instrText xml:space="preserve">TOC \\h \\o &quot;1-2&quot;</w:instrText></w:r>'
        '<w:r><w:fldChar w:fldCharType="separate"/></w:r></w:p>'
    )
    if old_head in blk:
        blk = blk.replace(old_head, new_head, 1)
    entries = "".join(
        toc_entry(100000 + i, text, pages[i], lvl)
        for i, (_s, _e, lvl, text) in enumerate(headings)
    )
    end_p = "<w:p><w:r><w:fldChar w:fldCharType=\"end\"/></w:r></w:p>"
    blk = blk.replace(end_p, entries + end_p, 1)
    return doc[: m.start()] + blk + doc[m.end():]


def render_pdf_pages(docx_path):
    """Список текстов страниц PDF (1-based индексация через [i-1])."""
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


def compute_pages(headings, pages_txt):
    """Номер тела = последняя страница PDF с текстом заголовка, минус смещение."""
    npages = [norm(p) for p in pages_txt]

    def last_page(text):
        key = norm(text)
        hit = 0
        for i, p in enumerate(npages):
            if key in p:
                hit = i + 1
        return hit

    offset = None
    result = []
    for _s, _e, _lvl, text in headings:
        pdf_page = last_page(text)
        if pdf_page == 0:
            raise SystemExit(f"Заголовок не найден в рендере: {text!r}")
        if offset is None:
            offset = pdf_page - 1  # первая H1 тела = страница 1 тела
        result.append(pdf_page - offset)
    return result


TOC_STYLES = (
    '<w:style w:type="paragraph" w:styleId="9" '
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    '<w:name w:val="toc 1"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="39"/>'
    "<w:pPr><w:tabs><w:tab w:val=\"right\" w:leader=\"dot\" w:pos=\"9026\"/></w:tabs>"
    '<w:spacing w:before="120" w:after="60"/></w:pPr>'
    "<w:rPr><w:b/><w:bCs/></w:rPr></w:style>"
    '<w:style w:type="paragraph" w:styleId="11" '
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    '<w:name w:val="toc 2"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="39"/>'
    "<w:pPr><w:tabs><w:tab w:val=\"right\" w:leader=\"dot\" w:pos=\"9026\"/></w:tabs>"
    '<w:ind w:left="360"/><w:spacing w:before="60" w:after="40"/></w:pPr></w:style>'
    '<w:style w:type="paragraph" w:styleId="12" '
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    '<w:name w:val="toc 3"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="39"/>'
    "<w:pPr><w:tabs><w:tab w:val=\"right\" w:leader=\"dot\" w:pos=\"9026\"/></w:tabs>"
    '<w:ind w:left="720"/><w:spacing w:before="40" w:after="20"/></w:pPr></w:style>'
)


def patch_styles_and_settings(data):
    """styles.xml: стили toc 1-3 ("9"/"11"/"12") с табуляцией-точками, outlineLvl
    в Heading1-6 (иначе TOC-поле не находит заголовки); settings.xml:
    updateFields=true (Word/LibreOffice обновляют поле при открытии)."""
    st = data["word/styles.xml"].decode("utf-8")
    if 'w:styleId="9"' not in st:
        st = st.replace("</w:styles>", TOC_STYLES + "</w:styles>", 1)
    for i in range(1, 7):
        st, n = re.subn(
            r'(<w:style w:type="paragraph" w:styleId="Heading%d"><w:name w:val="Heading %d"/>)' % (i, i),
            r'\1<w:pPr><w:outlineLvl w:val="%d"/></w:pPr>' % (i - 1),
            st, count=1,
        )
        if n == 0:
            raise SystemExit(f"стиль Heading{i} не найден для outlineLvl")
    data["word/styles.xml"] = st.encode("utf-8")

    se = data["word/settings.xml"].decode("utf-8")
    if "<w:updateFields" not in se:
        if "</w:compat>" in se:
            se = se.replace("</w:compat>", "</w:compat><w:updateFields w:val=\"true\"/>", 1)
        else:
            se = se.replace("</w:settings>", "<w:updateFields w:val=\"true\"/></w:settings>", 1)
    data["word/settings.xml"] = se.encode("utf-8")


def strip_generated_toc(doc):
    """docx>=9.9 сам заполняет поле TOC: записи-абзацы (hyperlink + PAGEREF _TocN)
    врастают в абзацы поля TOC, закладки _TocN ставятся на заголовки (атрибуты
    name/id в любом порядке). Пайплайн рассчитан на пустое поле: пересобираем
    sdt-скелет (begin/instrText/separate + end) и вычищаем все _Toc-закладки.
    Идемпотентно: повторный прогон чистит и записи add_toc (_Toc100000+)."""
    m = re.search(
        r'<w:sdt><w:sdtPr><w:alias w:val="Table of Contents"/>.*?</w:sdtContent></w:sdt>',
        doc, flags=re.S,
    )
    if m:
        pr = re.search(r'<w:sdtPr>.*?</w:sdtPr>', m.group(0), flags=re.S).group(0)
        skeleton = (
            "<w:sdt>" + pr + "<w:sdtContent>"
            '<w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>'
            '<w:r><w:instrText xml:space="preserve">TOC \\h \\o &quot;1-2&quot;</w:instrText></w:r>'
            '<w:r><w:fldChar w:fldCharType="separate"/></w:r></w:p>'
            '<w:p><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>'
            "</w:sdtContent></w:sdt>"
        )
        doc = doc[: m.start()] + skeleton + doc[m.end():]
    # закладки _Toc: собрать id (любой порядок атрибутов), удалить start и парные end
    ids = set()
    for mm in re.finditer(r'<w:bookmarkStart [^>]*w:name="_Toc\d+"[^>]*/>', doc):
        idm = re.search(r'w:id="(\d+)"', mm.group(0))
        if idm:
            ids.add(idm.group(1))
    if ids:
        doc = re.sub(r'<w:bookmarkStart [^>]*w:name="_Toc\d+"[^>]*/>', "", doc)
        doc = re.sub(
            r'<w:bookmarkEnd w:id="(\d+)"/>',
            lambda mm: "" if mm.group(1) in ids else mm.group(0),
            doc,
        )
    return doc


def process(path):
    names, data = read_docx(path)
    doc = data["word/document.xml"].decode("utf-8")
    doc = strip_generated_toc(doc)
    headings = find_headings(doc)
    if not headings:
        print(f"{path}: заголовков не найдено, пропуск")
        return
    doc = add_bookmarks(doc, headings)
    patch_styles_and_settings(data)

    # проход 1: черновые номера "1" -> рендер -> реальные номера -> проход 2
    data["word/document.xml"] = insert_toc_entries(doc, headings, [1] * len(headings)).encode("utf-8")
    write_docx(path, names, data)
    pages_txt = render_pdf_pages(path)
    real = compute_pages(headings, pages_txt)
    data["word/document.xml"] = insert_toc_entries(doc, headings, real).encode("utf-8")
    write_docx(path, names, data)

    h1 = sum(1 for h in headings if h[2] == 1)
    h2 = sum(1 for h in headings if h[2] == 2)
    print(f"{path}: TOC {len(headings)} записей (H1={h1}, H2={h2}), "
          f"pdf-страниц: {len(pages_txt)}, страницы тела: {real}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("использование: add_toc_placeholders.py <file.docx> [...]")
    for p in sys.argv[1:]:
        process(p)
