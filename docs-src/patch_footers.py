#!/usr/bin/env python3
"""Пост-обработка docx: патч футеров (PAGE -> PAGE \\* ROMAN / \\* arabic)
и удаление пустых <w:pgNumType/> из секции обложки. Совместимость WPS/Word."""
import re
import sys
import shutil
import zipfile
import tempfile
import os


def patch(path):
    with zipfile.ZipFile(path, "r") as z:
        names = z.namelist()
        data = {n: z.read(n) for n in names}

    doc = data["word/document.xml"].decode("utf-8")

    # 1. Порядок секций -> их footerReference rId (в порядке появления)
    sect_blocks = re.findall(r"<w:sectPr[ >].*?</w:sectPr>", doc, flags=re.S)
    sect_footers = []  # (sect_index, [rIds])
    for i, blk in enumerate(sect_blocks):
        rids = re.findall(r'<w:footerReference[^>]*r:id="(rId\d+)"', blk)
        if rids:
            sect_footers.append((i, rids))

    # rels: rId -> target
    rels = data["word/_rels/document.xml.rels"].decode("utf-8")
    rid_target = dict(re.findall(r'<Relationship[^>]*Id="(rId\d+)"[^>]*Target="([^"]+)"', rels))
    # Некоторые rels идут Target раньше Id
    for m in re.finditer(r"<Relationship\b[^>]*>", rels):
        tag = m.group(0)
        rid = re.search(r'Id="(rId\d+)"', tag)
        tgt = re.search(r'Target="([^"]+)"', tag)
        if rid and tgt:
            rid_target[rid.group(1)] = tgt.group(1)

    fmt_by_file = {}
    for order, (si, rids) in enumerate(sect_footers):
        fmt = "ROMAN" if order == 0 else "arabic"
        for rid in rids:
            target = rid_target.get(rid, "")
            fname = "word/" + target.lstrip("/")
            fmt_by_file[fname] = fmt

    patched = []
    for fname, fmt in fmt_by_file.items():
        if fname not in data:
            continue
        xml = data[fname].decode("utf-8")
        new_xml, n = re.subn(
            r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
            r"\1 PAGE \\* " + fmt + r" \\* MERGEFORMAT \2",
            xml,
        )
        if n:
            data[fname] = new_xml.encode("utf-8")
            patched.append((fname, fmt, n))

    # 2. Удалить пустые <w:pgNumType/>
    doc2, removed = re.subn(r"<w:pgNumType/>", "", doc)
    data["word/document.xml"] = doc2.encode("utf-8")

    # 3. Перезапись zip
    fd, tmp = tempfile.mkstemp(suffix=".docx")
    os.close(fd)
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
        for n in names:
            z.writestr(n, data[n])
    shutil.move(tmp, path)

    print(f"patched footers: {patched}, removed empty pgNumType: {removed}, sections: {len(sect_blocks)}")


if __name__ == "__main__":
    for p in sys.argv[1:]:
        patch(p)
