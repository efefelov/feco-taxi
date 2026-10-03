#!/usr/bin/env python3
"""ПРЯМО · Когортная финансовая модель сценариев (B-12 / B-18 / B-24).
Живые формулы, редактируемые допущения (синий шрифт), когортная матрица, PnL 24 мес, Review-сверка."""
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
    ("Касса на конец месяца 24, млн \u20bd", f"=PnL!{get_column_letter(mcol(24))}22/1000000", FMT_RUB_MM),
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

wb.save("/home/z/my-project/public/docs/pryamo-financial-model.xlsx")
print("saved: pryamo-financial-model.xlsx")
