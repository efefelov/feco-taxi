#!/usr/bin/env bash
# Деплой статик-прода ПРЯМО на GitHub Pages.
#
# 1) собирает статик (build-static.sh);
# 2) кладёт out/ в ветку gh-pages через git worktree;
# 3) пушит gh-pages в origin.
#
# Перед первым запуском: git remote add origin git@github.com:efefelov/feco-taxi.git
# GitHub Pages: Settings → Pages → Source: Deploy from branch → branch: gh-pages, / (root)
#
# Запуск: bash .zscripts/deploy-gh-pages.sh

set -euo pipefail
cd "$(dirname "$0")/.."

echo "== Деплой ПРЯМО на GitHub Pages =="

# 1. Сборка
bash .zscripts/build-static.sh

# 2. Worktree gh-pages
rm -rf .deploy-pages
git worktree prune

if git show-ref --verify --quiet refs/heads/gh-pages; then
  git worktree add .deploy-pages gh-pages
  rm -rf .deploy-pages/* .deploy-pages/.nojekyll 2>/dev/null || true
else
  git worktree add --orphan .deploy-pages gh-pages
  rm -rf .deploy-pages/* 2>/dev/null || true
fi

# 3. Контент
cp -r out/. .deploy-pages/
touch .deploy-pages/.nojekyll

# 4. Коммит и пуш
cd .deploy-pages
git add -A
if git diff --cached --quiet; then
  echo "Изменений нет — прод уже актуален"
else
  git commit -m "prod: статик-прод ПРЯМО (сборка $(date '+%Y-%m-%d %H:%M'))"
fi
cd ..
git worktree remove .deploy-pages --force
git push origin gh-pages

echo "== Прод обновлён: ветка gh-pages запушена =="
