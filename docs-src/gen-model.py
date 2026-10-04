#!/usr/bin/env python3
"""ПРЯМО · Когортная финансовая модель сценариев (B-12 / B-18 / B-24) + лист «Опция Ф (франшиза)».
Живые формулы, редактируемые допущения (синий шрифт), когортная матрица, PnL 24 мес, Review-сверка.
Опция Ф — стратегическая опция раунда: франшизные города при софт-ядре центра (B-12 + Ф, 36 мес).
Правка файла выполняется ТОЛЬКО перегенерацией этим скриптом: openpyxl load+save уничтожает чарты «Обзора»."""
import sys, os

XLSX_SKILL_DIR = "/home/z/my-project/skills/xlsx"
for sub in [XLSX_SKILL_DIR, os.path.join(XLSX_SKILL_DIR, "templates")]:
    if sub not in sys.path:
        sys.path.insert(0, sub)

import base
base.use_palette_explicit("bottega")  # тёмно-зелёная палитра под бренд (без синих акцентов)
# Кириллическая модель: Calibri доступен везде, тонкий штрих — болд разрешён
base.FONT_NAME = "Calibri"
base.HEADER_BOLD = True

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.chart import LineChart, Reference
from openpyxl.comments import Comment

P = base.PRIMARY
INPUT_FONT = Font(name=base.FONT_NAME, size=11, color="0000FF")          # IB: ручной ввод
INPUT_FILL = PatternFill("solid", fgColor="FFF9E7")                       # мягкая маркировка ввода
FORMULA_FONT = Font(name=base.FONT_NAME, size=11, color=base.NEUTRAL_900)
XREF_FONT = Font(name=base.FONT_NAME, size=11, color="008000")            # IB: межлистовые ссылки
CAPTION_FONT = Font(name=base.FONT_NAME, size=9, color=base.NEUTRAL_600)

FMT_INT = '#,##0'
FMT_RUB = '#,##0" \u20bd"'
FMT_RUB_MM = '#,##0.0,," \u043c\u043b\u043d \u20bd"'
FMT_PCT = '0.0%'
FMT_DEC = '#,##0.0'

MONTHS = 24
COL0 = 3  # месяц 1 в колонке C
def mcol(m):  # номер колонки месяца m (1..24)
    return COL0 + m - 1


def put(ws, row, col, value, font=None, fmt=None, fill=None, align=None, comment=None):
    c = ws.cell(row=row, column=col, value=value)
    c.font = font or FORMULA_FONT
    if fmt: c.number_format = fmt
    if fill: c.fill = fill
    c.alignment = align or Alignment(horizontal="right" if fmt else "left", vertical="center")
    if comment: c.comment = Comment(comment, "Z.ai")
    return c


def section(ws, row, text, col_start=2, col_end=6):
    ws.merge_cells(start_row=row, start_column=col_start, end_row=row, end_column=col_end)
    c = ws.cell(row=row, column=col_start, value=text)
    c.fill = PatternFill("solid", fgColor=P)
    c.font = Font(name=base.FONT_NAME, size=12, bold=True, color="FFFFFF")
    c.alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[row].height = 24


def label(ws, row, text, indent=False):
    c = ws.cell(row=row, column=2, value=("   " + text) if indent else text)
    c.font = Font(name=base.FONT_NAME, size=11, bold=False, color=base.NEUTRAL_900)
    c.alignment = Alignment(horizontal="left", vertical="center")


def caption(ws, row, text, col=2):
    c = ws.cell(row=row, column=col, value=text)
    c.font = CAPTION_FONT
    c.alignment = Alignment(horizontal="left", vertical="center", wrap_text=False)


wb = Workbook()
wb.properties.creator = "Z.ai"

# ───────────────────────────── Лист: Допущения ─────────────────────────────
ws_a = wb.active
ws_a.title = "Допущения"
base.setup_sheet(ws_a, "ПРЯМО · Допущения модели", last_col=5)
ws_a.column_dimensions["B"].width = 52
ws_a.column_dimensions["C"].width = 16
ws_a.column_dimensions["D"].width = 12
ws_a.column_dimensions["E"].width = 46

section(ws_a, 4, "Юнит-экономика поездки")
rows_unit = [
    ("Средний чек поездки, \u20bd", 825, FMT_RUB, "Факт: unit-расчёт проекта (чек 825 \u20bd)"),
    ("Комиссия ПРЯМО (PAYG)", 0.12, FMT_PCT, "Факт: оферта — 12% фикс"),
    ("Эквайринг, \u20bd/поездка", 12, FMT_RUB, "Факт: unit-расчёт"),
    ("ФГИС и инфраструктура, \u20bd/поездка", 20, FMT_RUB, "Факт: unit-расчёт"),
    ("Поддержка, \u20bd/поездка", 13, FMT_RUB, "Факт: unit-расчёт"),
]
r = 5
for name, val, fmt, src in rows_unit:
    label(ws_a, r, name)
    put(ws_a, r, 3, val, INPUT_FONT, fmt, INPUT_FILL, comment=src)
    caption(ws_a, r, "источник: " + src.split(":")[0].lower(), 4)
    r += 1
label(ws_a, 10, "Комиссия с чека, \u20bd")
put(ws_a, 10, 3, "=C5*C6", FORMULA_FONT, FMT_RUB)
label(ws_a, 11, "Маржа платформы с поездки PAYG, \u20bd")
put(ws_a, 11, 3, "=C10-C7-C8-C9", Font(name=base.FONT_NAME, size=11, bold=True, color=P), FMT_RUB,
    fill=PatternFill("solid", fgColor=base.SECONDARY))

section(ws_a, 13, "Подписка Pro")
label(ws_a, 14, "Цена Pro, \u20bd/мес")
put(ws_a, 14, 3, 2490, INPUT_FONT, FMT_RUB, INPUT_FILL, comment="Факт: оферта")
label(ws_a, 15, "Доля водителей на Pro")
put(ws_a, 15, 3, 0.40, INPUT_FONT, FMT_PCT, INPUT_FILL, comment="Допущение (ранние оценки проекта: ~40%)")
label(ws_a, 16, "Точка безразличия Pro для водителя, \u20bd/мес выручки")
put(ws_a, 16, 3, "=C14/C6", FORMULA_FONT, FMT_RUB)
label(ws_a, 17, "Нагрузка безубыточности Pro для платформы, поездок/мес")
put(ws_a, 17, 3, "=C14/(C7+C8+C9)", FORMULA_FONT, FMT_DEC,
    comment="Выше этой нагрузки Pro-водитель субсидирован платформой — цена лояльности, решение основателя")

section(ws_a, 19, "Водители и когорты")
label(ws_a, 20, "Заказов на активного водителя в день")
put(ws_a, 20, 3, 9, INPUT_FONT, FMT_DEC, INPUT_FILL,
    comment="Допущение. В реальной смене основателя 20 заказов за ночь; консервативное среднее по сети")
label(ws_a, 21, "Активных дней в месяц")
put(ws_a, 21, 3, 22, INPUT_FONT, FMT_INT, INPUT_FILL, comment="Допущение")
label(ws_a, 22, "Заказов на водителя в месяц")
put(ws_a, 22, 3, "=C20*C21", FORMULA_FONT, FMT_INT)
label(ws_a, 23, "Отток водителей (churn), %/мес")
put(ws_a, 23, 3, 0.06, INPUT_FONT, FMT_PCT, INPUT_FILL, comment="Допущение; калибруется данными беты")
label(ws_a, 24, "Оборот водителя (GMV), \u20bd/мес")
put(ws_a, 24, 3, "=C22*C5", FORMULA_FONT, FMT_RUB)

section(ws_a, 26, "Сценарные общие параметры")
label(ws_a, 27, "Новых водителей в месяц на активный город")
put(ws_a, 27, 3, 120, INPUT_FONT, FMT_INT, INPUT_FILL,
    comment="Допущение: ~1 000 водителей за ~6 месяцев на город („первая волна“)")
label(ws_a, 28, "Полевой запуск города (разовый), \u20bd")
put(ws_a, 28, 3, 450000, INPUT_FONT, FMT_RUB, INPUT_FILL, comment="Допущение: диапазон 300–600 тыс. \u20bd")
label(ws_a, 29, "Собственные средства на старте, \u20bd")
put(ws_a, 29, 3, 300000, INPUT_FONT, FMT_RUB, INPUT_FILL, comment="Допущение")
label(ws_a, 30, "CAC водителя (затраты на привлечение), \u20bd")
put(ws_a, 30, 3, 3600, INPUT_FONT, FMT_RUB, INPUT_FILL,
    comment="Допущение: полевой скрипт + реферальные 5% на 6 мес, размазанные на приведённого. Документ №1: CAC рефералки ≤ 5 400 \u20bd")

section(ws_a, 32, "Маржа платформы на водителя (blended)")
label(ws_a, 33, "Маржа платформы на активного водителя, \u20bd/мес")
put(ws_a, 33, 3, "=(1-C15)*C22*C11+C15*(C14-C22*(C7+C8+C9))",
    Font(name=base.FONT_NAME, size=11, bold=True, color=P), FMT_RUB,
    fill=PatternFill("solid", fgColor=base.SECONDARY),
    comment="PAYG-водитель даёт 198 поездок × 54 \u20bd; Pro-водитель — подписка минус переменные издержки его поездок")

hdr = ws_a.cell(row=35, column=2, value="Доля Pro (сензитивность)")
hdr.font = Font(name=base.FONT_NAME, size=11, bold=True, color=base.NEUTRAL_900)
put(ws_a, 35, 3, "Маржа платформы на водителя, \u20bd/мес", Font(name=base.FONT_NAME, size=11, bold=True, color=base.NEUTRAL_900))
for i, share in enumerate([0.0, 0.2, 0.4, 0.6, 0.8]):
    rr = 36 + i
    put(ws_a, rr, 2, share, INPUT_FONT, FMT_PCT, INPUT_FILL)
    put(ws_a, rr, 3, f"=(1-B{rr})*$C$22*$C$11+B{rr}*($C$14-$C$22*($C$7+$C$8+$C$9))", FORMULA_FONT, FMT_RUB)
caption(ws_a, 42, "Синие ячейки — редактируемые допущения; чёрные — формулы. Факты проекта: чек 825 \u20bd, комиссия 12%, Pro 2 490 \u20bd (оферта, лендинг).")

# ───────────────────────────── Лист: Сценарии ─────────────────────────────
ws_s = wb.create_sheet("Сценарии")
base.setup_sheet(ws_s, "Сценарии посева: параметры, сравнение, расчётный блок", last_col=26)
ws_s.column_dimensions["B"].width = 44
for m in range(1, MONTHS + 1):
    ws_s.column_dimensions[get_column_letter(mcol(m))].width = 11

section(ws_s, 4, "Параметры сценариев", 2, 5)
for col, name in [(2, "Параметр"), (3, "B-12"), (4, "B-18"), (5, "B-24")]:
    c = ws_s.cell(row=5, column=col, value=name)
    c.font = Font(name=base.FONT_NAME, size=11, bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor=P)
    c.alignment = Alignment(horizontal="center", vertical="center")
ws_s.row_dimensions[5].height = 24

scen_params = [
    ("Раунд (середина диапазона), млн \u20bd", [17.5, 40, 80], FMT_DEC, "Диапазоны: 15–20 / 35–45 / 70–90 млн \u20bd (документы проекта)"),
    ("ФОТ платформы на крейсере, \u20bd/мес", [1200000, 1450000, 1700000], FMT_RUB, "Допущение из документа «Бюджет»"),
    ("Месяц старта ФОТ", [3, 1, 1], FMT_INT, "B-12 позже собирает команду"),
    ("Месяц запуска города 1", [1, 1, 1], FMT_INT, None),
    ("Месяц запуска города 2", [8, 6, 5], FMT_INT, None),
    ("Месяц запуска города 3", [20, 11, 9], FMT_INT, None),
    ("Месяц запуска города 4", [None, 16, 13], FMT_INT, "Пусто — город не запускается на горизонте"),
    ("Месяц запуска города 5", [None, None, 17], FMT_INT, None),
    ("Месяц запуска города 6", [None, None, 21], FMT_INT, None),
    ("Месяц запуска города 7", [None, None, 23], FMT_INT, None),
]
r = 6
for name, vals, fmt, src in scen_params:
    label(ws_s, r, name)
    for j, v in enumerate(vals):
        cell = ws_s.cell(row=r, column=3 + j)
        if v is not None:
            cell.value = v
            cell.font = INPUT_FONT
            cell.fill = INPUT_FILL
            cell.number_format = fmt
        cell.alignment = Alignment(horizontal="right", vertical="center")
        if src: cell.comment = Comment(src, "Z.ai")
    r += 1

label(ws_s, 16, "Городов к месяцу 12")
label(ws_s, 17, "Городов к месяцу 18")
label(ws_s, 18, "Городов к месяцу 24")
for j in range(3):
    cl = get_column_letter(3 + j)
    put(ws_s, 16, 3 + j, f'=COUNTIF({cl}$9:{cl}$15,"<=12")', FORMULA_FONT, FMT_INT)
    put(ws_s, 17, 3 + j, f'=COUNTIF({cl}$9:{cl}$15,"<=18")', FORMULA_FONT, FMT_INT)
    put(ws_s, 18, 3 + j, f'=COUNTIF({cl}$9:{cl}$15,"<=24")', FORMULA_FONT, FMT_INT)

section(ws_s, 20, "Сравнение сценариев (итоги)", 2, 5)
comp_rows = [
    ("Активные водители к месяцу 12", FMT_INT),
    ("Активные водители к месяцу 18", FMT_INT),
    ("Активные водители к месяцу 24", FMT_INT),
    ("Заказов в день к месяцу 12", FMT_INT),
    ("GMV в месяц к месяцу 18, млн \u20bd", FMT_RUB_MM),
    ("Маржа платформы в месяц к месяцу 18, \u20bd", FMT_RUB),
    ("Операционный поток в месяц к месяцу 18, \u20bd", FMT_RUB),
    ("Касса на конец месяца 24, млн \u20bd", FMT_RUB_MM),
    ("Месяцев с положительной кассой (из 24)", FMT_INT),
]
r = 21
for name, fmt in comp_rows:
    label(ws_s, r, name)
    r += 1
# значения заполняются после расчётного блока (ниже) — формулы с ссылками

section(ws_s, 31, "Расчётный блок: 24 месяца (движок модели)", 2, 26)
label(ws_s, 32, "Месяц")
for m in range(1, MONTHS + 1):
    put(ws_s, 32, mcol(m), m, Font(name=base.FONT_NAME, size=11, bold=True, color=base.NEUTRAL_900), FMT_INT,
        align=Alignment(horizontal="center", vertical="center"))

engine_spec = [
    ("Новые водители/мес — {s}", 33, "new"),
    ("Активные водители — {s}", 36, "act"),
    ("ФОТ платформы, \u20bd — {s}", 39, "fot"),
    ("Полевые запуски, \u20bd — {s}", 42, "fld"),
    ("Операционный поток, \u20bd — {s}", 45, "flow"),
    ("Касса, \u20bd — {s}", 48, "cash"),
]
SCEN_NAMES = ["B-12", "B-18", "B-24"]
for j, sname in enumerate(SCEN_NAMES):
    cl = get_column_letter(3 + j)   # колонка параметров сценария (C/D/E)
    for tpl, row, kind in engine_spec:
        label(ws_s, row + j, tpl.format(s=sname), indent=True)
    for m in range(1, MONTHS + 1):
        c = get_column_letter(mcol(m))
        # новые водители: темп на город × число активных городов
        put(ws_s, 33 + j, mcol(m), f"=Допущения!$C$27*COUNTIF(${cl}$9:${cl}$15,\"<=\"&{c}$32)", FORMULA_FONT, FMT_INT)
        # активные: рекуррентно с оттоком (новые сценария — строка 33+j)
        if m == 1:
            put(ws_s, 36 + j, mcol(m), f"={c}{33+j}", FORMULA_FONT, FMT_INT)
        else:
            prev = get_column_letter(mcol(m) - 1)
            put(ws_s, 36 + j, mcol(m), f"={prev}{36+j}*(1-Допущения!$C$23)+{c}{33+j}", FORMULA_FONT, FMT_INT)
        # ФОТ: ramp 3 месяца до крейсера (крейсер — ${cl}$7, старт — ${cl}$8)
        put(ws_s, 39 + j, mcol(m),
            f"=IF({c}$32<${cl}$8,0,MIN(${cl}$7,${cl}$7/3*({c}$32-${cl}$8+1)))", FORMULA_FONT, FMT_RUB)
        # полевые: разовый платёж в месяц запуска нового города
        put(ws_s, 42 + j, mcol(m),
            f"=IF(COUNTIF(${cl}$9:${cl}$15,\"<=\"&{c}$32)>COUNTIF(${cl}$9:${cl}$15,\"<=\"&({c}$32-1)),Допущения!$C$28,0)",
            FORMULA_FONT, FMT_RUB)
        # операционный поток: маржа − ФОТ − полевые − маркетинг (новые × CAC)
        put(ws_s, 45 + j, mcol(m), f"={c}{36+j}*Допущения!$C$33-{c}{39+j}-{c}{42+j}-{c}{33+j}*Допущения!$C$30", FORMULA_FONT, FMT_RUB)
        # касса (раунд — ${cl}$6)
        if m == 1:
            put(ws_s, 48 + j, mcol(m), f"=${cl}$6*1000000+Допущения!$C$29+{c}45", FORMULA_FONT, FMT_RUB)
        else:
            prev = get_column_letter(mcol(m) - 1)
            put(ws_s, 48 + j, mcol(m), f"={prev}{48+j}+{c}45", FORMULA_FONT, FMT_RUB)

# сравнительная таблица: ссылки на блок
comp_formulas = [
    lambda j: f"={get_column_letter(mcol(12))}{36+j}",
    lambda j: f"={get_column_letter(mcol(18))}{36+j}",
    lambda j: f"={get_column_letter(mcol(24))}{36+j}",
    lambda j: f"={get_column_letter(mcol(12))}{36+j}*Допущения!$C$20",
    lambda j: f"={get_column_letter(mcol(18))}{36+j}*Допущения!$C$24",
    lambda j: f"={get_column_letter(mcol(18))}{36+j}*Допущения!$C$32",
    lambda j: f"={get_column_letter(mcol(18))}{45+j}",
    lambda j: f"={get_column_letter(mcol(24))}{48+j}",
    lambda j: f"=COUNTIF({get_column_letter(mcol(1))}{48+j}:{get_column_letter(mcol(24))}{48+j},\">0\")",
]
for i, (name, fmt) in enumerate(comp_rows):
    for j in range(3):
        put(ws_s, 21 + i, 3 + j, comp_formulas[i](j), XREF_FONT, fmt)
caption(ws_s, 52, "Движок: новые водители = темп × активные города; активные — рекуррентно с оттоком; касса = раунд + собственные средства + поток. Детальная раскладка активного сценария — лист PnL, сверка — Review.")
caption(ws_s, 53, "Синие ячейки — редактируемые. Пустые ячейки месяцев запуска означают, что город не запускается на горизонте 24 мес.")

# ───────────────────────────── Лист: PnL ─────────────────────────────
ws_p = wb.create_sheet("PnL")
base.setup_sheet(ws_p, "PnL · активный сценарий, детально, 24 месяца", last_col=26)
ws_p.column_dimensions["B"].width = 40
for m in range(1, MONTHS + 1):
    ws_p.column_dimensions[get_column_letter(mcol(m))].width = 12
ws_p.row_dimensions[3].height = 0  # скрытая строка номеров месяцев
ws_p.cell(row=3, column=2, value="мес.").font = CAPTION_FONT
for m in range(1, MONTHS + 1):
    c = ws_p.cell(row=3, column=mcol(m), value=m)
    c.font = CAPTION_FONT
    c.number_format = FMT_INT

hdr_row = 4
c = ws_p.cell(row=hdr_row, column=2, value="Показатель")
c.font = Font(name=base.FONT_NAME, size=11, bold=True, color="FFFFFF")
c.fill = PatternFill("solid", fgColor=P)
c.alignment = Alignment(horizontal="left", vertical="center")
for m in range(1, MONTHS + 1):
    c = ws_p.cell(row=hdr_row, column=mcol(m), value=f"м{m}")
    c.font = Font(name=base.FONT_NAME, size=11, bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor=P)
    c.alignment = Alignment(horizontal="center", vertical="center")
ws_p.row_dimensions[hdr_row].height = 24

SEL = "MATCH(Обзор!$C$4,'Сценарии'!$C$5:$E$5,0)"
pnl_rows = [
    ("Новые водители", FMT_INT, lambda c, m: f"=INDEX('Сценарии'!$C$33:$Z$35,{SEL},{c}$3)"),
    ("Активные водители", FMT_INT, lambda c, m: f"=INDEX('Сценарии'!$C$36:$Z$38,{SEL},{c}$3)"),
    ("Поездки за месяц", FMT_INT, lambda c, m: f"={c}6*Допущения!$C$22"),
    ("Заказов в день", FMT_INT, lambda c, m: f"={c}6*Допущения!$C$20"),
    ("GMV (валовая выручка), \u20bd", FMT_RUB, lambda c, m: f"={c}7*Допущения!$C$5"),
    ("Поездки PAYG", FMT_INT, lambda c, m: f"={c}7*(1-Допущения!$C$15)"),
    ("Поездки Pro", FMT_INT, lambda c, m: f"={c}7*Допущения!$C$15"),
    ("Комиссионная выручка, \u20bd", FMT_RUB, lambda c, m: f"={c}10*Допущения!$C$10"),
    ("Подписочная выручка Pro, \u20bd", FMT_RUB, lambda c, m: f"={c}6*Допущения!$C$15*Допущения!$C$14"),
    ("Выручка платформы, \u20bd", FMT_RUB, lambda c, m: f"={c}12+{c}13"),
    ("Переменные издержки, \u20bd", FMT_RUB, lambda c, m: f"={c}7*(Допущения!$C$7+Допущения!$C$8+Допущения!$C$9)"),
    ("Маржа платформы, \u20bd", FMT_RUB, lambda c, m: f"={c}14-{c}15"),
    ("ФОТ платформы, \u20bd", FMT_RUB, lambda c, m: f"=INDEX('Сценарии'!$C$39:$Z$41,{SEL},{c}$3)"),
    ("Полевые запуски, \u20bd", FMT_RUB, lambda c, m: f"=INDEX('Сценарии'!$C$42:$Z$44,{SEL},{c}$3)"),
    ("Маркетинг (привлечение), \u20bd", FMT_RUB, lambda c, m: f"={c}5*Допущения!$C$30"),
    ("Операционный поток, \u20bd", FMT_RUB, lambda c, m: f"={c}16-{c}17-{c}18-{c}19"),
    ("Накопленный поток, \u20bd", FMT_RUB, lambda c, m: (f"={c}20" if m == 1 else f"={get_column_letter(mcol(m)-1)}21+{c}20")),
    ("Касса (раунд + поток), \u20bd", FMT_RUB, lambda c, m: f"=INDEX('Сценарии'!$C$48:$Z$50,{SEL},{c}$3)"),
]
r = 5
for name, fmt, fgen in pnl_rows:
    is_total = name.startswith(("Маржа", "Операционный", "Касса"))
    lab = ws_p.cell(row=r, column=2, value=name)
    lab.font = Font(name=base.FONT_NAME, size=11, bold=is_total, color=base.NEUTRAL_900)
    for m in range(1, MONTHS + 1):
        cl = get_column_letter(mcol(m))
        cell = ws_p.cell(row=r, column=mcol(m), value=fgen(cl, m))
        cell.font = Font(name=base.FONT_NAME, size=11, bold=is_total, color=base.NEUTRAL_900)
        cell.number_format = fmt
        cell.alignment = Alignment(horizontal="right", vertical="center")
        if is_total:
            cell.fill = PatternFill("solid", fgColor=base.SECONDARY)
            cell.border = Border(top=Side(style="thin", color=base.NEUTRAL_200))
    ws_p.row_dimensions[r].height = 20
    r += 1
caption(ws_p, 23, "Сценарий выбирается на листе «Обзор» (ячейка C4). Все строки — живые формулы от «Допущений» и движка «Сценариев»; сверка двух представлений — лист Review.")
ws_p.freeze_panes = "C5"

# ───────────────────────────── Лист: Когорты ─────────────────────────────
ws_c = wb.create_sheet("Когорты")
base.setup_sheet(ws_c, "Когорты водителей · активный сценарий (матрица распада)", last_col=26)
ws_c.column_dimensions["B"].width = 22
for m in range(1, MONTHS + 1):
    ws_c.column_dimensions[get_column_letter(mcol(m))].width = 9

c = ws_c.cell(row=4, column=2, value="Новые (когорта)")
c.font = Font(name=base.FONT_NAME, size=11, bold=True, color="FFFFFF")
c.fill = PatternFill("solid", fgColor=P)
c.alignment = Alignment(horizontal="left", vertical="center")
for m in range(1, MONTHS + 1):
    c = ws_c.cell(row=4, column=mcol(m), value=m)
    c.font = Font(name=base.FONT_NAME, size=11, bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor=P)
    c.number_format = FMT_INT
    c.alignment = Alignment(horizontal="center", vertical="center")
ws_c.row_dimensions[4].height = 24

for cohort in range(1, MONTHS + 1):
    r = 4 + cohort
    put(ws_c, r, 2, f"=INDEX('PnL'!$C$5:$Z$5,{cohort})", FORMULA_FONT, FMT_INT)
    for m in range(1, MONTHS + 1):
        cl = get_column_letter(mcol(m))
        if m < cohort:
            cell = ws_c.cell(row=r, column=mcol(m), value="")
        else:
            cell = ws_c.cell(row=r, column=mcol(m),
                             value=f"=IF({cl}$4>=ROW()-4,$B{r}*(1-Допущения!$C$23)^({cl}$4-(ROW()-4)),\"\")")
            cell.number_format = FMT_INT
        cell.font = Font(name=base.FONT_NAME, size=11, color=base.NEUTRAL_900)
        cell.alignment = Alignment(horizontal="right", vertical="center")
        if cohort % 2 == 0:
            cell.fill = PatternFill("solid", fgColor=base.NEUTRAL_100)
    ws_c.row_dimensions[r].height = 18

# строка лейблов когорт (слева от чисел) — добавим отдельной колонкой не удалось, подпишем числом в B? B уже занят новыми.
# Итоговая строка
tot_r = 5 + MONTHS
lab = ws_c.cell(row=tot_r, column=2, value="Итого активные")
lab.font = Font(name=base.FONT_NAME, size=11, bold=True, color=P)
for m in range(1, MONTHS + 1):
    cl = get_column_letter(mcol(m))
    cell = ws_c.cell(row=tot_r, column=mcol(m), value=f"=SUM({cl}5:{cl}{4+MONTHS})")
    cell.font = Font(name=base.FONT_NAME, size=11, bold=True, color=P)
    cell.number_format = FMT_INT
    cell.fill = PatternFill("solid", fgColor=base.SECONDARY)
    cell.border = Border(top=Side(style="thin", color=base.NEUTRAL_200))
    cell.alignment = Alignment(horizontal="right", vertical="center")
ws_c.row_dimensions[tot_r].height = 24
caption(ws_c, tot_r + 2, "Строка — когорта месяца входа (новые водители этого месяца), колонки — календарные месяцы. Значение: активные водители когорты с учётом оттока. «Итого активные» равен строке «Активные водители» листа PnL — проверяется в Review.")
ws_c.freeze_panes = "C5"

# ───────────────────────────── Лист: Опция Ф (франшиза) ─────────────────────────────
# Стратегическая опция раунда: франшизные города при софт-ядре центра (аналог «Додо Пицца»).
# Параметры — в конвенции листа «Допущения» (синий шрифт + мягкая заливка ввода, source-комментарии,
# пометки «(оценка)/(допущение)» в подписях). Лист строится генератором: правка готового файла
# через openpyxl load+save запрещена (потеря чартов «Обзора»).
FS = "Опция Ф (франшиза)"
MONTHS_F = 36
BOLD_FONT = Font(name=base.FONT_NAME, size=11, bold=True, color=P)

ws_f = wb.create_sheet(FS)
base.setup_sheet(ws_f, "ПРЯМО · Опция Ф — франшиза (стратегическая опция раунда)", last_col=38)
ws_f.column_dimensions["B"].width = 62
ws_f.column_dimensions["C"].width = 14
for m in range(2, MONTHS_F + 1):
    ws_f.column_dimensions[get_column_letter(mcol(m))].width = 11


def text_row(ws, row, head, body, height=42):
    """Текстовая строка блоков «Архитектура» и «Риски»: заголовок в B, текст в C:J с переносом."""
    h = ws.cell(row=row, column=2, value=head)
    h.font = Font(name=base.FONT_NAME, size=11, bold=True, color=base.NEUTRAL_900)
    h.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
    ws.merge_cells(start_row=row, start_column=3, end_row=row, end_column=10)
    t = ws.cell(row=row, column=3, value=body)
    t.font = Font(name=base.FONT_NAME, size=11, color=base.NEUTRAL_900)
    t.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
    ws.row_dimensions[row].height = height


def param(ws, row, name, val, fmt, src, note="(оценка)"):
    """Редактируемый параметр в конвенции «Допущений»: синий шрифт + заливка ввода + source-комментарий."""
    label(ws, row, name)
    put(ws, row, 3, val, INPUT_FONT, fmt, INPUT_FILL, comment=src)
    if note:
        caption(ws, row, note, 4)


def table_header(ws, row, cols):
    """Шапка таблицы (B, C, D, ...) в стиле модели: заливка PRIMARY, белый болд."""
    for col, h in cols:
        c = ws.cell(row=row, column=col, value=h)
        c.font = Font(name=base.FONT_NAME, size=11, bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor=P)
        c.alignment = Alignment(horizontal="left" if col == 2 else "right", vertical="center")
    ws.row_dimensions[row].height = 24


# ── Блок 1 · Архитектура центра и поля
section(ws_f, 4, "1 · Архитектура: центр и поле")
text_row(ws_f, 5, "Центр держит (ядро платформы)",
         "Приложение и бренд · движок заказа · анти-спешка · «верёвка» · ФГИС-шлюз · эквайринг · НПД-механика · школа городовых · KPI-аудит городов")
text_row(ws_f, 6, "Франчайзи держит (поле)",
         "Рекрутинг водителей · апелляции и локальная поддержка · локальный маркетинг и CAC · ФОТ полевой команды · капитал запуска города")
text_row(ws_f, 7, "Аналогия",
         "«Додо Пицца»: софт-ядро — в центре, франчайзи — в поле", 22)
text_row(ws_f, 8, "Принцип спроса",
         "Единое приложение и бренд: спрос живёт в приложении центра, франчайзи не владеет клиентской базой (анти-«ловушка Максима»)")

# ── Блок 2 · Делёж 99 ₽ с поездки
section(ws_f, 10, "2 · Делёж 99 ₽ с поездки: собственный город против франшизного")
param(ws_f, 11, "Поле и маркетинг собственного города, ₽/поездку (оценка)", 11, FMT_DEC,
       "Оценка: операционка зрелого города 1,5–2,5 млн ₽/мес при ~180 тыс. поездок/мес → 8–14 ₽/поездку. База 11.")
table_header(ws_f, 12, [(2, "Статья, ₽/поездку"), (3, "Собственный город"), (4, "Франшизный город")])
rows_del = [
    ("Комиссия ПРЯМО (собирает центр)", "=Допущения!$C$10", "=Допущения!$C$10",
     "Факт: оферта 12% фикс (Допущения C10 = 99 ₽)"),
    ("Эквайринг", "=-Допущения!$C$7", "=-Допущения!$C$7",
     "Факт: единый эквайринг-шлюз центра (Допущения C7)"),
    ("ФГИС и инфраструктура", "=-Допущения!$C$8", "=-Допущения!$C$8",
     "Факт: центральный ФГИС-шлюз и инфраструктура (Допущения C8)"),
    ("Поддержка", "=-Допущения!$C$9", 0,
     "Франшизный город: поддержка — на франчайзи (0 для центра)"),
    ("Поле и маркетинг города (оценка)", "=-$C$11", 0,
     "Франшизный город: поле, CAC и локальный маркетинг — на франчайзи (0 для центра)"),
    ("Доля франчайзи из пула города", 0, "=-($D$13+$D$14+$D$15)+$C$24",
     "Расчёт: пул (99−12−20) минус роялти центру (параметр C24, блок 3). При роялти 32–37 доля франчайзи ≈ 30–35 ₽"),
]
r = 13
for name, cv, dv, src in rows_del:
    label(ws_f, r, name)
    put(ws_f, r, 3, cv, FORMULA_FONT, FMT_RUB, comment=src)
    put(ws_f, r, 4, dv, FORMULA_FONT, FMT_RUB)
    ws_f.row_dimensions[r].height = 20
    r += 1
label(ws_f, 19, "Итого центру чистыми, ₽/поездку")
put(ws_f, 19, 3, "=SUM(C13:C18)", BOLD_FONT, FMT_RUB, fill=PatternFill("solid", fgColor=base.SECONDARY))
put(ws_f, 19, 4, "=SUM(D13:D18)", BOLD_FONT, FMT_RUB, fill=PatternFill("solid", fgColor=base.SECONDARY),
    comment="Франшизный итог = роялти центру (параметр C24); собственный = 99−12−20−13−поле. Сверяется в Review")
ws_f.row_dimensions[19].height = 22
label(ws_f, 20, "Центр получает, % от нетто собственного города (оценка)")
put(ws_f, 20, 3, "=D19/C19", BOLD_FONT, FMT_PCT)
caption(ws_f, 21, "Собственный город: центру ≈ 40–46 ₽ (при поле 8–14 ₽/поездку). Франшизный: ≈ 32–37 ₽ = роялти центру при нулевой операционке и нулевом капитале центра. ~80% экономики города — без капитала и управления городом.")

# ── Блок 3 · Параметры франшизы
section(ws_f, 23, "3 · Параметры франшизы (редактируемые)")
param(ws_f, 24, "Роялти центру, ₽/поездку (оценка)", 34, FMT_RUB,
       "База 34; диапазон 32–37 ₽/поездку. Управляет дележом (блок 2) и роялти-потоком (блок 5).")
param(ws_f, 25, "Паушаль при подключении города, ₽ (оценка)", 300000, FMT_RUB,
       "База 300 тыс.; диапазон 250–400 тыс. Фильтр серьёзности намерений, не источник прибыли. В кассу центра месяцем подключения города.")
param(ws_f, 26, "Школа городовых: стоимость выпуска, ₽ (оценка)", 125000, FMT_RUB,
       "Диапазон 100–150 тыс.; засчитывается в паушаль — обучение городовых оплачивает франчайзи.")
param(ws_f, 27, "Барабан школы: макс. выпусков городовых в месяц (допущение)", 1, FMT_INT,
       "Пропускная способность школы городовых; согласована с темпом подключения 1–2 города/мес. В формулах не участвует — проверять вручную при правке темпа.")
param(ws_f, 28, "Месяц старта франшизных городов (допущение)", 13, FMT_INT,
       "Ф3 по роадмапу проекта: после доказанной юнит-экономики собственных городов (B-12 к м12).")
param(ws_f, 29, "Франшизных городов в месяц, в среднем (оценка)", 1.5, FMT_DEC,
       "Диапазон 1–2 города/мес (барабан школы). Города подключаются дробно, потоки считаются в среднем.")
param(ws_f, 30, "Ramp франшизного города до целевых водителей, мес (допущение)", 6, FMT_INT,
       "Линейный набор водителей городом. Структура формул блока 5 рассчитана на ramp 6; при иной величине править окно набора (ramp+1 мес).")
param(ws_f, 31, "Целевые активные водители франшизного города (допущение)", 600, FMT_INT,
       "Консервативно к собственным городам модели (те выходят на ~1 000 водителей).")
label(ws_f, 32, "Заказов на водителя в месяц (ссылка на Допущения)")
put(ws_f, 32, 3, "=Допущения!$C$22", XREF_FONT, FMT_INT,
    comment="Тот же параметр, что в основной модели (Допущения C22); редактировать на листе «Допущения».")
caption(ws_f, 33, "Синие ячейки — редактируемые параметры в конвенции листа «Допущения». Пометки (оценка)/(допущение) — не факты оферты.")

# ── Блок 4 · Пример зрелого города
section(ws_f, 35, "4 · Пример зрелого города (оценка, всё формулами)")
param(ws_f, 36, "Активные водители зрелого города (оценка)", 1000, FMT_INT,
       "Зрелый собственный город модели выходит на ~1 000 водителей.")
param(ws_f, 37, "Заказов на водителя в месяц (оценка)", 180, FMT_INT,
       "Консервативнее параметра модели 198 (Допущения C22) — иллюстративная оценка для примера города.")
label(ws_f, 38, "Gross-комиссия города, ₽/мес")
put(ws_f, 38, 3, "=C36*C37*Допущения!$C$10", FORMULA_FONT, FMT_RUB,
    comment="1 000 водителей × 180 заказов × 99 ₽ ≈ 17,8 млн ₽/мес")
label(ws_f, 39, "Собственный город: маржа платформы, ₽/мес")
put(ws_f, 39, 3, "=C36*C37*Допущения!$C$11", FORMULA_FONT, FMT_RUB,
    comment="1 000 × 180 × 54 ₽ ≈ 9,7 млн ₽/мес")
param(ws_f, 40, "Операционка собственного города: нижняя оценка, ₽/мес", 1500000, FMT_RUB,
       "Оценка: полевая команда + локальный маркетинг зрелого города (документы проекта: 1,5–2,5 млн ₽/мес).")
param(ws_f, 41, "Операционка собственного города: верхняя оценка, ₽/мес", 2500000, FMT_RUB,
       "Оценка.")
label(ws_f, 42, "Собственный нетто центру, ₽/мес (нижняя операционка)")
put(ws_f, 42, 3, "=C39-C40", FORMULA_FONT, FMT_RUB)
label(ws_f, 43, "Собственный нетто центру, ₽/мес (верхняя операционка)")
put(ws_f, 43, 3, "=C39-C41", FORMULA_FONT, FMT_RUB)
label(ws_f, 44, "Франшизный город: центру, ₽/мес (затраты центра — 0)")
put(ws_f, 44, 3, "=C36*C37*$C$24", BOLD_FONT, FMT_RUB,
    fill=PatternFill("solid", fgColor=base.SECONDARY),
    comment="1 000 × 180 × роялти (база 34) ≈ 6,1 млн ₽/мес; диапазон 5,8–6,7 млн при роялти 32–37. Школа оплачена паушалью.")
label(ws_f, 45, "Франшизный: % от нетто собственного, середина (оценка)")
put(ws_f, 45, 3, "=C44/AVERAGE(C42:C43)", BOLD_FONT, FMT_PCT)
caption(ws_f, 46, "Зрелый город ≈ 17,8 млн ₽/мес gross-комиссии: собственный — 7,2–8,2 млн ₽/мес нетто после операционки; франшизный — 5,8–6,7 млн ₽/мес центру при нулевых затратах и капитале (оценки).")

# ── Блок 5 · Сценарий B-12 + Ф, 36 месяцев
section(ws_f, 48, "5 · Сценарий B-12 + Ф: 36 месяцев (м1–12 — как B-12, с м13 — франшизные города)", 2, 38)
label(ws_f, 49, "Месяц")
for m in range(1, MONTHS_F + 1):
    put(ws_f, 49, mcol(m), m, Font(name=base.FONT_NAME, size=11, bold=True, color=base.NEUTRAL_900), FMT_INT,
        align=Alignment(horizontal="center", vertical="center"))
ws_f.row_dimensions[49].height = 22

f_rows = [
    (50, "Собственные города (активные), шт", FMT_INT),
    (51, "Собственные активные водители, шт", FMT_INT),
    (52, "Поток собственных городов (маржа − полевые − маркетинг), ₽", FMT_RUB),
    (53, "Франшизные города, кумулятивно (в среднем), шт", FMT_DEC),
    (54, "Франшизные активные водители (ramp), шт", FMT_INT),
    (55, "Паушали — приток кассы, ₽", FMT_RUB),
    (56, "Школа городовых — выпуски (покрывается паушалью), ₽", FMT_RUB),
    (57, "Роялти центру, ₽/мес", FMT_RUB),
    (58, "ФОТ платформы (как в B-12), ₽", FMT_RUB),
    (59, "Суммарный поток, ₽", FMT_RUB),
    (60, "Касса (раунд B-12 + собственные средства + поток), ₽", FMT_RUB),
]
for row, name, fmt in f_rows:
    label(ws_f, row, name, indent=True)
    ws_f.row_dimensions[row].height = 20

AL = get_column_letter(mcol(MONTHS_F))  # колонка месяца 36
f_comment = {
    52: "Как в B-12 (движок «Сценариев», строка 45 без ФОТ): маржа − полевые запуски − маркетинг (CAC × новые)",
    54: "Ramp: каждый город линейно набирает (цель/ramp) водителей в месяц, пока не достигнет целевых; в месяц подключения — 0",
    55: "Паушаль — в кассу центра месяцем подключения города (параметр C25)",
    57: "Франшизные активные × заказы/водитель (C32) × роялти центру (C24)",
    60: "Посев раунда B-12 — как в движке: раунд + собственные средства + накопленный поток",
}
for m in range(1, MONTHS_F + 1):
    c = get_column_letter(mcol(m))
    p = get_column_letter(mcol(m) - 1)  # предыдущий месяц
    # собственные города: график запусков B-12
    put(ws_f, 50, mcol(m), f"=COUNTIF('Сценарии'!$C$9:$C$15,\"<=\"&{c}$49)", FORMULA_FONT, FMT_INT)
    # собственные активные: рекуррентно с оттоком (как движок B-12)
    if m == 1:
        put(ws_f, 51, mcol(m), f"=Допущения!$C$27*{c}50", FORMULA_FONT, FMT_INT)
    else:
        put(ws_f, 51, mcol(m), f"={p}51*(1-Допущения!$C$23)+Допущения!$C$27*{c}50", FORMULA_FONT, FMT_INT)
    # поток собственных городов: маржа − полевые − маркетинг (как в B-12)
    put(ws_f, 52, mcol(m),
        f"={c}51*Допущения!$C$33-IF(COUNTIF('Сценарии'!$C$9:$C$15,\"<=\"&{c}$49)>COUNTIF('Сценарии'!$C$9:$C$15,\"<=\"&({c}$49-1)),Допущения!$C$28,0)-Допущения!$C$27*{c}50*Допущения!$C$30",
        FORMULA_FONT, FMT_RUB)
    # франшизные города (кумулятивно, в среднем)
    if m == 1:
        put(ws_f, 53, mcol(m), f"=IF({c}$49<$C$28,0,$C$29)", FORMULA_FONT, FMT_DEC)
    else:
        put(ws_f, 53, mcol(m), f"=IF({c}$49<$C$28,0,{p}53+$C$29)", FORMULA_FONT, FMT_DEC)
    # франшизные активные водители: рекуррентно, ramp-окно шириной ramp+1 мес
    if m == 1:
        put(ws_f, 54, mcol(m), 0, FORMULA_FONT, FMT_INT,
            comment="В месяц подключения города водители — 0 (конвенция ramp): набор начинается со следующего месяца")
    else:
        put(ws_f, 54, mcol(m),
            f"={p}54+($C$31/$C$30)*MAX(0,{p}53-IF({c}$49-1-$C$30<1,0,INDEX($C$53:${AL}$53,1,{c}$49-1-$C$30)))",
            FORMULA_FONT, FMT_INT)
    # паушали и школа: прирост городов × ставка
    if m == 1:
        put(ws_f, 55, mcol(m), f"={c}53*$C$25", FORMULA_FONT, FMT_RUB, comment=f_comment.get(55))
        put(ws_f, 56, mcol(m), f"={c}53*$C$26", FORMULA_FONT, FMT_RUB,
            comment="Расход центра на выпуски школы городовых; нетто-эффект в кассе = паушаль минус школа (засчитывается в паушаль)")
    else:
        put(ws_f, 55, mcol(m), f"=({c}53-{p}53)*$C$25", FORMULA_FONT, FMT_RUB, comment=f_comment.get(55) if m == 2 else None)
        put(ws_f, 56, mcol(m), f"=({c}53-{p}53)*$C$26", FORMULA_FONT, FMT_RUB)
    # роялти-поток
    put(ws_f, 57, mcol(m), f"={c}54*$C$32*$C$24", FORMULA_FONT, FMT_RUB, comment=f_comment.get(57) if m == 1 else None)
    # ФОТ платформы — как в B-12
    put(ws_f, 58, mcol(m),
        f"=IF({c}$49<'Сценарии'!$C$8,0,MIN('Сценарии'!$C$7,'Сценарии'!$C$7/3*({c}$49-'Сценарии'!$C$8+1)))",
        FORMULA_FONT, FMT_RUB)
    # суммарный поток
    put(ws_f, 59, mcol(m), f"={c}52+{c}55-{c}56+{c}57-{c}58", BOLD_FONT, FMT_RUB,
        fill=PatternFill("solid", fgColor=base.SECONDARY))
    # касса
    if m == 1:
        put(ws_f, 60, mcol(m), f"='Сценарии'!$C$6*1000000+Допущения!$C$29+{c}59", BOLD_FONT, FMT_RUB,
            fill=PatternFill("solid", fgColor=base.SECONDARY), comment=f_comment.get(60))
    else:
        put(ws_f, 60, mcol(m), f"={p}60+{c}59", BOLD_FONT, FMT_RUB,
            fill=PatternFill("solid", fgColor=base.SECONDARY))

caption(ws_f, 61, "Собственные города — график B-12 (Сценарии C9:C15): 3 города к м20, далее без новых запусков. Франшизные — с месяца старта темпом из блока 3, ramp линейный; паушаль — месяцем подключения. ФОТ центра не масштабируется с сетью франшиз (допущение: KPI-аудит и школа — текущий штат); школа покрывается паушалью. Касса на м1–12 совпадает с движком B-12 — сверяется в Review.")

# ── Блок 5.1 · Сравнение с чистым B-24
section(ws_f, 63, "5.1 · Сравнение: B-12 + Ф против чистого B-24 (оценка)")
table_header(ws_f, 64, [(2, "Метрика"), (3, "B-12 + Ф"), (4, "Чистый B-24")])
label(ws_f, 65, "Городов к м36")
put(ws_f, 65, 3, f"={AL}50+{AL}53", XREF_FONT, FMT_INT,
    comment="Собственные города по графику B-12 + франшизные города кумулятивно")
put(ws_f, 65, 4, "=COUNTIF('Сценарии'!$E$9:$E$15,\"<=\"&36)", XREF_FONT, FMT_INT,
    comment="B-24: 7 городов на горизонте модели 24 мес; темп после м24 не моделируется")
label(ws_f, 66, "Активные водители к м36 (B-24 — к м24)")
put(ws_f, 66, 3, f"={AL}51+{AL}54", XREF_FONT, FMT_INT)
put(ws_f, 66, 4, "=INDEX('Сценарии'!$C$36:$Z$38,3,24)", XREF_FONT, FMT_INT,
    comment="B-24 — активные водители к м24 (горизонт модели)")
label(ws_f, 67, "Потребность в раунде, млн ₽ (середина)")
put(ws_f, 67, 3, "='Сценарии'!$C$6", XREF_FONT, FMT_DEC, comment="B-12 + Ф: раунд B-12, диапазон 15–20 млн ₽")
put(ws_f, 67, 4, "='Сценарии'!$E$6", XREF_FONT, FMT_DEC, comment="B-24: диапазон 70–90 млн ₽")
label(ws_f, 68, "Вывод (оценка)")
ws_f.merge_cells(start_row=68, start_column=3, end_row=68, end_column=6)
concl = ws_f.cell(row=68, column=3,
                  value='=IF(AND(C65>=D65,C66>=D66),"«B-12 + Ф» достигает охвата чистого B-24 к м36 без большого раунда (оценка)","«B-12 + Ф» не достигает охвата B-24 — поднять темп франшизы или раунд")')
concl.font = BOLD_FONT
concl.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
ws_f.row_dimensions[68].height = 34
caption(ws_f, 69, "Чистый B-24: 7 городов и ~6 700 активных водителей к м24 за раунд 70–90 млн ₽. B-12 + Ф: собственные города по графику B-12 + франшизная сеть за раунд 15–20 млн ₽ — охват городов и водителей выше (оценка).")

# ── Блок 6 · Риски и контр-ходы
section(ws_f, 71, "6 · Риски и контр-ходы")
text_row(ws_f, 72, "ФГИС / 176-ФЗ",
         "Конструкция «единый агрегатор + операционные партнёры-агенты»; обязательная юрпроработка (не юрзаключение) до подписания первых договоров франшизы")
text_row(ws_f, 73, "Качество и анти-спешка",
         "Конституция бренда в договоре франшизы + роялти от «качественной выручки» (поездки с CSI ≥ порога) + право дефраншиза при систематических нарушениях")
text_row(ws_f, 74, "«Ловушка Максима»",
         "Единое приложение и бренд: спрос живёт в приложении центра, франчайзи не владеет клиентской базой — сеть не распадается на локальные приложения")
text_row(ws_f, 75, "Отбор франчайзи",
         "Из действующих таксопарков-партнёров; пилот на городе-спутнике до тиражирования; паушаль — фильтр серьёзности намерений")
text_row(ws_f, 76, "Инвест-рамка",
         "Asset-light экспансия после доказанной юнит-экономики: франшиза расширяет, а не заменяет собственные города; большой раунд не нужен до масштабирования ядра")
caption(ws_f, 77, "Риски — качественные (не квантифицированы); юрпроработка конструкции обязательна до Ф3 (месяц старта франшизы, параметр C28).")

# ───────────────────────────── Лист: Обзор ─────────────────────────────
ws_o = wb.create_sheet("Обзор", 0)
base.setup_sheet(ws_o, "ПРЯМО · Когортная финансовая модель сценариев", last_col=9)
ws_o.column_dimensions["B"].width = 44
for col in "CDEFGHI":
    ws_o.column_dimensions[col].width = 15

label(ws_o, 4, "Активный сценарий (список: B-12 / B-18 / B-24)")
sel_cell = ws_o.cell(row=4, column=3, value="B-18")
sel_cell.font = Font(name=base.FONT_NAME, size=12, bold=True, color="0000FF")
sel_cell.fill = INPUT_FILL
sel_cell.alignment = Alignment(horizontal="center", vertical="center")
dv = DataValidation(type="list", formula1='"B-12,B-18,B-24"', allow_blank=False,
                    promptTitle="Сценарий", prompt="Выберите B-12, B-18 или B-24 — модель пересчитается")
ws_o.add_data_validation(dv)
dv.add(ws_o.cell(row=4, column=3))
caption(ws_o, 5, "Выберите сценарий — листы PnL и Когорты пересчитаются под него.")

section(ws_o, 7, "Ключевые показатели активного сценария")
kpi_rows = [
    ("Раунд (середина диапазона), млн \u20bd", f"=INDEX('Сценарии'!$C$6:$E$6,{SEL})", FMT_DEC),
    ("Активные водители к месяцу 12", f"=PnL!{get_column_letter(mcol(12))}6", FMT_INT),
    ("Активные водители к месяцу 18", f"=PnL!{get_column_letter(mcol(18))}6", FMT_INT),
    ("Активные водители к месяцу 24", f"=PnL!{get_column_letter(mcol(24))}6", FMT_INT),
    ("Заказов в день к месяцу 12", f"=PnL!{get_column_letter(mcol(12))}8", FMT_INT),
    ("Маржа платформы в месяц к месяцу 18, \u20bd", f"=PnL!{get_column_letter(mcol(18))}16", FMT_RUB),
    ("Операционный поток в месяц к месяцу 18, \u20bd", f"=PnL!{get_column_letter(mcol(18))}20", FMT_RUB),
    ("Касса на конец месяца 24, млн \u20bd", f"=PnL!{get_column_letter(mcol(24))}22", FMT_RUB_MM),
    ("Месяцев с положительной кассой (из 24)", "=COUNTIF(PnL!C22:Z22,\">0\")", FMT_INT),
]
r = 8
for name, formula, fmt in kpi_rows:
    label(ws_o, r, name)
    put(ws_o, r, 3, formula, XREF_FONT, fmt)
    ws_o.row_dimensions[r].height = 20
    r += 1

section(ws_o, 18, "Сравнение сценариев")
hdrs = ["Метрика", "B-12", "B-18", "B-24"]
for col, h in enumerate(hdrs, start=2):
    c = ws_o.cell(row=19, column=col, value=h)
    c.font = Font(name=base.FONT_NAME, size=11, bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor=P)
    c.alignment = Alignment(horizontal="left" if col == 2 else "right", vertical="center")
ws_o.row_dimensions[19].height = 24
r = 20
for i, (name, fmt) in enumerate(comp_rows):
    label(ws_o, r, name, indent=True)
    for j in range(3):
        put(ws_o, r, 3 + j, f"='Сценарии'!{get_column_letter(3+j)}{21+i}", XREF_FONT, fmt)
    if i % 2 == 0:
        for col in range(2, 6):
            ws_o.cell(row=r, column=col).fill = PatternFill("solid", fgColor=base.NEUTRAL_100)
    r += 1

caption(ws_o, 30, "Ограничения модели: льготы «первой волны» (0% на 3 месяца) не учтены в выручке; налоги юридического лица, споры/возвраты и CAPEX не моделируются (операционная модель). Маркетинг учтён через CAC водителя (Допущения C30). Все синие ячейки — редактируемые допущения.")

# блок «Опция Ф (справочно)» — ниже обоих чартов (якоря чартов B32/B50 не трогаем)
section(ws_o, 69, "Опция Ф (справочно)")
label(ws_o, 70, "Роялти центру на поездку (франшиза), ₽")
put(ws_o, 70, 3, f"='{FS}'!$C$24", XREF_FONT, FMT_RUB)
label(ws_o, 71, "Паушаль при подключении города, ₽")
put(ws_o, 71, 3, f"='{FS}'!$C$25", XREF_FONT, FMT_RUB)
label(ws_o, 72, "Касса на м36 сценария B-12 + Ф, млн ₽")
put(ws_o, 72, 3, f"='{FS}'!${AL}$60", XREF_FONT, FMT_RUB_MM)
ws_o.row_dimensions[72].height = 20
caption(ws_o, 73, "Стратегическая опция раунда — франшиза: архитектура центра/поля, делёж 99 ₽, параметры, сценарий B-12 + Ф на 36 мес, риски и контр-ходы — см. лист «Опция Ф (франшиза)».")

# графики
ch1 = LineChart()
ch1.title = "Активные водители по месяцам"
ch1.style = 10
ch1.width, ch1.height = 20, 9
data = Reference(ws_s, min_col=2, min_row=36, max_col=26, max_row=38)
ch1.add_data(data, titles_from_data=True, from_rows=True)
cats = Reference(ws_s, min_col=3, min_row=32, max_col=26, max_row=32)
ch1.set_categories(cats)
ch1.y_axis.title = "активные водители"
ch1.x_axis.title = "месяц"
for i, s in enumerate(ch1.series):
    s.graphicalProperties.line.solidFill = [base.PRIMARY, base.ACCENT_POSITIVE, base.ACCENT_WARNING][i]
    s.graphicalProperties.line.width = 22000
    s.smooth = False
ws_o.add_chart(ch1, "B32")

ch2 = LineChart()
ch2.title = "Касса по сценариям (раунд + операционный поток), \u20bd"
ch2.style = 10
ch2.width, ch2.height = 20, 9
data2 = Reference(ws_s, min_col=2, min_row=48, max_col=26, max_row=50)
ch2.add_data(data2, titles_from_data=True, from_rows=True)
ch2.set_categories(cats)
ch2.y_axis.title = "\u20bd"
ch2.x_axis.title = "месяц"
ch2.y_axis.number_format = '#,##0,,"M"'
for i, s in enumerate(ch2.series):
    s.graphicalProperties.line.solidFill = [base.PRIMARY, base.ACCENT_POSITIVE, base.ACCENT_WARNING][i]
    s.graphicalProperties.line.width = 22000
    s.smooth = False
ws_o.add_chart(ch2, "B50")

# ───────────────────────────── Лист: Review ─────────────────────────────
ws_r = wb.create_sheet("Review")
ws_r.sheet_properties.tabColor = "FFC000"
base.setup_sheet(ws_r, "Review · сверка модели", last_col=6)
ws_r.column_dimensions["B"].width = 56
ws_r.column_dimensions["C"].width = 18
ws_r.column_dimensions["D"].width = 18
ws_r.column_dimensions["E"].width = 12
for col, h in [(2, "Проверка"), (3, "Ожидание"), (4, "Факт"), (5, "Статус")]:
    c = ws_r.cell(row=4, column=col, value=h)
    c.font = Font(name=base.FONT_NAME, size=11, bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor=P)
    c.alignment = Alignment(horizontal="left" if col == 2 else "right", vertical="center")
ws_r.row_dimensions[4].height = 24

N12, N18, N24 = (get_column_letter(mcol(x)) for x in (12, 18, 24))
checks = [
    ("Маржа платформы с поездки PAYG = 54 \u20bd", 54, "=Допущения!C11", FMT_RUB),
    ("Точка безразличия Pro = 2 490 / 12% \u2248 20 750 \u20bd", 20750, "=Допущения!C16", FMT_RUB),
    ("Активные к м12: PnL = движок Сценариев", f"=INDEX('Сценарии'!$C$36:$Z$38,{SEL},12)", f"=PnL!{N12}6", FMT_INT),
    ("Активные к м24: PnL = матрица Когорт (итог)", f"=PnL!{N24}6", f"=Когорты!{N24}{5+MONTHS}", FMT_INT),
    ("Маржа PnL м24 = активные × маржа на водителя", f"=PnL!{N24}6*Допущения!C33", f"=PnL!{N24}16", FMT_RUB),
    ("Касса PnL м24 = движок Сценариев", f"=INDEX('Сценарии'!$C$48:$Z$50,{SEL},24)", f"=PnL!{N24}22", FMT_RUB),
    ("Выручка м24 = комиссия + подписка", f"=PnL!{N24}12+PnL!{N24}13", f"=PnL!{N24}14", FMT_RUB),
    ("Городов к м24 у B-24 = 7", 7, "='Сценарии'!E18", FMT_INT),
]
r = 5
for name, exp, act, fmt in checks:
    label(ws_r, r, name)
    put(ws_r, r, 3, exp, FORMULA_FONT, fmt)
    put(ws_r, r, 4, act, XREF_FONT, fmt)
    st = ws_r.cell(row=r, column=5, value=f'=IF(ABS(C{r}-D{r})<0.01,"PASS","FAIL")')
    st.font = Font(name=base.FONT_NAME, size=11, bold=True, color=base.ACCENT_POSITIVE)
    st.alignment = Alignment(horizontal="center", vertical="center")
    r += 1
caption(ws_r, r + 1, "Все проверки — живые формулы: PASS сходится, FAIL — искать расхождение в соответствующем листе.")

# проверки листа «Опция Ф (франшиза)» — отдельным блоком ниже, существующие строки не трогаем
section(ws_r, 16, "Проверки листа «Опция Ф (франшиза)»", 2, 6)
f_checks = [
    ("Опция Ф: франшизный делёж = роялти центру",
     f"='{FS}'!$C$24", f"='{FS}'!$D$19", FMT_RUB),
    ("Опция Ф: собственный делёж = 99−12−20−13−поле",
     "=Допущения!C10-Допущения!C7-Допущения!C8-Допущения!C9-" + f"'{FS}'!$C$11", f"='{FS}'!$C$19", FMT_RUB),
    ("Опция Ф: касса B-12+Ф м12 = движку B-12",
     "=INDEX('Сценарии'!$C$48:$Z$50,1,12)", f"='{FS}'!$N$60", FMT_RUB),
    ("Опция Ф: паушали в кассе = города м36 × паушаль",
     f"='{FS}'!${AL}$53*'{FS}'!$C$25", f"=SUM('{FS}'!$C$55:${AL}$55)", FMT_RUB),
    ("Опция Ф: роялти-поток м36 > 0",
     1, f"=IF('{FS}'!${AL}$57>0,1,0)", FMT_INT),
]
r = 17
for name, exp, act, fmt in f_checks:
    label(ws_r, r, name)
    put(ws_r, r, 3, exp, FORMULA_FONT, fmt)
    put(ws_r, r, 4, act, XREF_FONT, fmt)
    st = ws_r.cell(row=r, column=5, value=f'=IF(ABS(C{r}-D{r})<0.01,"PASS","FAIL")')
    st.font = Font(name=base.FONT_NAME, size=11, bold=True, color=base.ACCENT_POSITIVE)
    st.alignment = Alignment(horizontal="center", vertical="center")
    r += 1
caption(ws_r, r + 1, "Проверки опции Ф — живые формулы: делёж 99 ₽ сходится в обеих колонках, касса B-12 + Ф на м1–12 совпадает с движком B-12, паушали учтены в кассе, роялти-поток м36 положителен.")

wb.save("/home/z/my-project/public/docs/pryamo-financial-model.xlsx")
print("saved: pryamo-financial-model.xlsx")
