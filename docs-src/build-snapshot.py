#!/usr/bin/env python3
"""Сборка автономного HTML-снимка песочницы ПРЯМО.
Шаблон: docs-src/snapshot-template.html (токены @@IMG_*@@, @@TARIFFS_JSON@@).
Кадры: docs-src/preview/snapshot/*.jpg (или /tmp/snapj при первичной сборке).
Выход: public/pryamo-snapshot.html — один файл, работает офлайн.
Запуск: python3 build-snapshot.py
"""
import base64
import json
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SNAP_DIR = os.path.join(HERE, "preview", "snapshot")
TMP_DIR = "/tmp/snapj"
TARIFFS_SRC = "/tmp/tariffs.json"
TEMPLATE = os.path.join(HERE, "snapshot-template.html")
OUT = os.path.join(HERE, "..", "public", "pryamo-snapshot.html")

# при первичной сборке — переносим свежие кадры из /tmp в docs-src/preview/snapshot
os.makedirs(SNAP_DIR, exist_ok=True)
if os.path.isdir(TMP_DIR):
    for f in os.listdir(TMP_DIR):
        if f.endswith(".jpg"):
            shutil.copy2(os.path.join(TMP_DIR, f), os.path.join(SNAP_DIR, f))

TOKENS = {
    "@@TOP@@": "top.jpg",
    "@@DEMO@@": "demo.jpg",
    "@@TARIFFS@@": "tariffs.jpg",
    "@@CALC@@": "calc.jpg",
    "@@JOIN@@": "join.jpg",
    "@@MOBILE@@": "top-mobile.jpg",
}


def b64(path: str) -> str:
    with open(path, "rb") as fh:
        return "data:image/jpeg;base64," + base64.b64encode(fh.read()).decode("ascii")


def main() -> int:
    with open(TEMPLATE, encoding="utf-8") as fh:
        html = fh.read()

    for token, fname in TOKENS.items():
        path = os.path.join(SNAP_DIR, fname)
        if not os.path.isfile(path):
            print(f"ОШИБКА: нет кадра {path}", file=sys.stderr)
            return 1
        html = html.replace(token, b64(path))

    if os.path.isfile(TARIFFS_SRC):
        with open(TARIFFS_SRC, encoding="utf-8") as fh:
            tariffs = json.load(fh)["tariffs"]
        fields = ("id", "name", "baseFare", "perKm", "perMin", "multiplier", "carClass")
        slim = [{k: t[k] for k in fields} for t in tariffs]
    else:
        # фолбэк — то, что было в живом API на 12.10.2026
        slim = [
            {"id": "eco", "name": "Прямой", "baseFare": 79, "perKm": 14, "perMin": 6, "multiplier": 1, "carClass": "Kia Rio, Hyundai Solaris, VW Polo, Lada Vesta · до 5 лет"},
            {"id": "comfort", "name": "Ладный", "baseFare": 129, "perKm": 18, "perMin": 7, "multiplier": 1.35, "carClass": "Toyota Corolla, Skoda Octavia, Kia Cerato · до 4 лет"},
            {"id": "comfort-plus", "name": "Привольный", "baseFare": 169, "perKm": 21, "perMin": 8, "multiplier": 1.7, "carClass": "Простор для ног и мыслей"},
            {"id": "business", "name": "Барин", "baseFare": 299, "perKm": 30, "perMin": 12, "multiplier": 2.4, "carClass": "Бизнес-класс"},
            {"id": "van", "name": "Артель", "baseFare": 149, "perKm": 19, "perMin": 8, "multiplier": 1.5, "carClass": "7 мест · кресла без доплаты"},
            {"id": "intercity", "name": "Дальняк", "baseFare": 0, "perKm": 34, "perMin": 0, "multiplier": 1, "carClass": "Межгород"},
            {"id": "cargo", "name": "Хомяк", "baseFare": 299, "perKm": 28, "perMin": 0, "multiplier": 1.2, "carClass": "Перевозка вещей"},
        ]
    html = html.replace("@@TARIFFS_JSON@@", json.dumps(slim, ensure_ascii=False, separators=(",", ":")))

    for token in list(TOKENS) + ["@@TARIFFS_JSON@@"]:
        if token in html:
            print(f"ОШИБКА: токен {token} не заменён", file=sys.stderr)
            return 1

    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(html)
    os.chmod(OUT, 0o644)
    size = os.path.getsize(OUT)
    print(f"OK: {os.path.abspath(OUT)} — {size:,} байт ({size / 1024 / 1024:.2f} МБ)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
