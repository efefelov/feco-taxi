#!/usr/bin/env python3
"""Графики для docx-документов ПРЯМО (DejaVu Sans — кириллица)."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

AMBER = "#D4875A"
GOLD = "#C9A84C"
EMERALD = "#2A9D8F"
INK = "#1A2330"
GRID = "#E8E8E4"

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "axes.edgecolor": "#B8B8B4",
    "axes.labelcolor": INK,
    "text.color": INK,
    "xtick.color": "#5A6470",
    "ytick.color": "#5A6470",
    "axes.titlesize": 13,
    "axes.titleweight": "bold",
    "figure.dpi": 200,
})

# ── График 1 (стратегия): целевые заказы/день по контрольным неделям ──
fig, ax = plt.subplots(figsize=(7.2, 3.4))
weeks = ["Неделя 4", "Неделя 8", "Неделя 13"]
orders = [40, 200, 700]
bars = ax.bar(weeks, orders, width=0.52, color=[AMBER, AMBER, EMERALD], zorder=3)
for b, v in zip(bars, orders):
    ax.text(b.get_x() + b.get_width() / 2, v + 18, f"{v}", ha="center", va="bottom",
            fontsize=11, fontweight="bold", color=INK)
ax.set_title("Целевые заказы в день по контрольным неделям плана 90 дней")
ax.set_ylabel("Заказов в день (цель)")
ax.set_ylim(0, 800)
ax.grid(axis="y", color=GRID, zorder=0)
ax.spines[["top", "right"]].set_visible(False)
ax.set_axisbelow(True)
fig.tight_layout()
fig.savefig("chart-orders.png", facecolor="white")
plt.close(fig)

# ── График 2 (документы проекта): сценарии посева ──
fig, ax = plt.subplots(figsize=(7.2, 3.0))
labels = ["B-12\n1–2 города", "B-18\n3–4 города", "B-24\n5–7 городов"]
mids = [17.5, 40, 80]
lo = [15, 35, 70]
hi = [20, 45, 90]
bars = ax.barh(labels, mids, height=0.5, color=[GOLD, GOLD, GOLD], zorder=3)
for b, m, l, h in zip(bars, mids, lo, hi):
    ax.plot([l, h], [b.get_y() + b.get_height() / 2] * 2, color=INK, lw=1.4, zorder=4)
    ax.text(h + 1.5, b.get_y() + b.get_height() / 2, f"{l}–{h} млн ₽ / 12–24 мес",
            va="center", fontsize=10, color="#5A6470")
ax.set_title("Посевные сценарии: сумма раунда и горизонт (допущение)")
ax.set_xlabel("Сумма раунда, млн ₽")
ax.set_xlim(0, 118)
ax.grid(axis="x", color=GRID, zorder=0)
ax.spines[["top", "right"]].set_visible(False)
ax.set_axisbelow(True)
ax.invert_yaxis()
fig.tight_layout()
fig.savefig("chart-rounds.png", facecolor="white")
plt.close(fig)

print("charts: chart-orders.png, chart-rounds.png")
