#!/usr/bin/env bash
# Статик-сборка ПРЯМО для GitHub Pages (прод: efefelov/feco-taxi → /feco-taxi/)
#
# Что делает:
#  1) временно убирает API-роуты (export несовместим с серверными хендлерами);
#  2) собирает BUILD_STATIC=1 next build → out/ (basePath /feco-taxi, trailing slash);
#  3) кладёт .nojekyll; фронтенд на статике работает на фолбэках
#     (тарифы/статы) и локальном мини-движке MVP (mvp-local.ts).
#
# Запуск: bun run build:static  (или bash .zscripts/build-static.sh)
# Деплой: bash .zscripts/deploy-gh-pages.sh (сборка + пуш в ветку gh-pages)

set -euo pipefail
cd "$(dirname "$0")/.."

API_DIR=src/app/api
STASH_DIR=.api-static-stash

echo "== Статик-сборка ПРЯМО (GitHub Pages) =="

# 1. Временно спрятать API-роуты
if [ -d "$API_DIR" ]; then
  mkdir -p "$STASH_DIR"
  rm -rf "$STASH_DIR/api"
  mv "$API_DIR" "$STASH_DIR/api"
  echo "API-роуты временно убраны: $API_DIR → $STASH_DIR/api"
fi
# Гарантия возврата даже при ошибке сборки
restore_api() {
  if [ -d "$STASH_DIR/api" ] && [ ! -d "$API_DIR" ]; then
    mv "$STASH_DIR/api" "$API_DIR"
    echo "API-роуты возвращены на место"
  fi
}
trap restore_api EXIT

# 2. Сборка
rm -rf out
BUILD_STATIC=1 bun x next build

# 3. GitHub Pages: без Jekyll
touch out/.nojekyll

echo "== Готово: out/ собран ($(find out -type f | wc -l) файлов) =="
