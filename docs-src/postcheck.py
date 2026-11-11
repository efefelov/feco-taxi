#!/usr/bin/env python3
"""Проверка целостности docx после пост-обработки (воспроизведён в Task 19-b).

0 ошибок обязателен; ровно 2 ожидаемых предупреждения допустимы:
  [WARN] PageBreak-абзац сразу после блока содержания (by design: разрыв
         между секцией содержания и телом);
  [WARN] межстрочные интервалы: таблицы 276 при теле 312 (by design:
         компактные ячейки таблиц против плотного тела).

Запуск: python3 postcheck.py <file.docx> [...]
"""
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def check(path):
    errs, warns = [], []

    with zipfile.ZipFile(path) as z:
        bad = z.testzip()
        if bad:
            errs.append(f"zip повреждён: {bad}")
        names = z.namelist()
        data = {n: z.read(n) for n in names}

    # 1. XML-валидность всех частей
    for n in names:
        if n.endswith((".xml", ".rels")):
            try:
                ET.fromstring(data[n])
            except ET.ParseError as e:
                errs.append(f"XML битый: {n}: {e}")

    doc = data["word/document.xml"].decode("utf-8")

    # 2. Секции: обложка / содержание / тело
    sects = re.findall(r"<w:sectPr[ >].*?</w:sectPr>", doc, flags=re.S)
    if len(sects) != 3:
        errs.append(f"секций {len(sects)}, ожидалось 3")

    # 3. Пустые pgNumType (ломают нумерацию в WPS/Word)
    if "<w:pgNumType/>" in doc:
        errs.append("пустые <w:pgNumType/> не удалены")

    # 4. TOC: записи == закладки == заголовки, якоря и PAGEREF совпадают
    anchors = re.findall(r'<w:hyperlink w:anchor="(_Toc\d+)"', doc)
    pagerefs = re.findall(r"PAGEREF (_Toc\d+)", doc)
    bookmarks = re.findall(r'<w:bookmarkStart [^>]*w:name="(_Toc\d+)"', doc)
    heads = re.findall(r'<w:pStyle w:val="Heading[12]"/>', doc)
    if not anchors:
        errs.append("в TOC нет записей-плейсхолдеров")
    if not (len(anchors) == len(pagerefs) == len(bookmarks) == len(heads)):
        errs.append(f"рассинхрон TOC: записей {len(anchors)}, PAGEREF {len(pagerefs)}, "
                    f"закладок {len(bookmarks)}, заголовков {len(heads)}")
    if anchors != bookmarks:
        errs.append("якоря TOC не совпадают с закладками (порядок/набор)")
    cached = re.findall(
        r'<w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>(\d+)</w:t>', doc)
    if len(cached) != len(anchors):
        errs.append(f"кэшированных номеров страниц {len(cached)}, записей {len(anchors)}")

    # 5. Заголовок TOC-поля с уровнями 1-2
    if not re.search(r'<w:instrText[^>]*>\s*TOC \\h \\o &quot;1-2&quot;\s*</w:instrText>', doc) \
       and 'TOC \\h \\o "1-2"' not in doc:
        errs.append("instrText TOC уровней 1-2 не найден")

    # 6. Футеры: PAGE с форматом по секциям (римские для содержания, арабские для тела)
    rels = data["word/_rels/document.xml.rels"].decode("utf-8")
    rid_target = dict(re.findall(r'<Relationship[^>]*Id="(rId\d+)"[^>]*Target="([^"]+)"', rels))
    for m in re.finditer(r"<Relationship\b[^>]*>", rels):
        rid = re.search(r'Id="(rId\d+)"', m.group(0))
        tgt = re.search(r'Target="([^"]+)"', m.group(0))
        if rid and tgt:
            rid_target[rid.group(1)] = tgt.group(1)
    fmts = []
    for blk in sects:
        for rid in re.findall(r'<w:footerReference[^>]*r:id="(rId\d+)"', blk):
            fname = "word/" + rid_target.get(rid, "").lstrip("/")
            if fname not in data:
                errs.append(f"футер {fname} отсутствует")
                continue
            xml = data[fname].decode("utf-8")
            if re.search(r"<w:instrText[^>]*>\s*PAGE\s*</w:instrText>", xml):
                errs.append(f"{fname}: PAGE без формата (не пропатчен)")
            for fmt in ("ROMAN", "arabic"):
                if f"PAGE \\* {fmt}" in xml:
                    fmts.append(fmt)
    if "ROMAN" not in fmts:
        errs.append("нет футера с римской нумерацией (содержание)")
    if "arabic" not in fmts:
        errs.append("нет футера с арабской нумерацией (тело)")

    # 7. Медиа и связи
    for tgt in re.findall(r'Target="(media/[^"]+)"', rels):
        if "word/" + tgt not in names:
            errs.append(f"нет файла {tgt}")
    for rid in re.findall(r'r:id="(rId\d+)"', doc):
        if rid not in rid_target:
            errs.append(f"rId {rid} без Relationship")

    # 8. Ожидаемые предупреждения (by design)
    m = re.search(r"</w:sdt>(.{0,1200})", doc, flags=re.S)
    if m and '<w:br w:type="page"/>' in m.group(1):
        warns.append("PageBreak-абзац после блока содержания (ожидается: разрыв секций)")
    n276 = len(re.findall(r'<w:spacing [^>]*w:line="276"', doc))
    n312 = len(re.findall(r'<w:spacing [^>]*w:line="312"', doc))
    if n276 and n312:
        warns.append(f"межстрочные интервалы: {n276}x276 (таблицы) / {n312}x312 (тело) "
                     "(ожидается: компактные ячейки)")

    print(f"== {path}")
    print(f"   записей TOC: {len(anchors)}; секций: {len(sects)}; "
          f"номера тел: {cached[:8]}{'…' if len(cached) > 8 else ''}")
    for w in warns:
        print(f"   [WARN] {w}")
    for e in errs:
        print(f"   [ERR]  {e}")
    print(f"   ИТОГ: ошибок {len(errs)}, предупреждений {len(warns)}")
    return len(errs)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("использование: postcheck.py <file.docx> [...]")
    code = 0
    for p in sys.argv[1:]:
        if check(p):
            code = 1
    sys.exit(code)
