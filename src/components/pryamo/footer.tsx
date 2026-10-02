'use client'

import { Zap, ShieldCheck, ArrowUpRight } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950">
              <Zap className="h-5 w-5" strokeWidth={2.6} />
            </span>
            <div>
              <p className="text-base font-black tracking-tight text-white">ПРЯМО</p>
              <p className="text-xs text-zinc-500">
                Прямая дорога. Честная цена. Деньги водителю.
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" aria-label="Навигация в подвале">
            <a href="#problem" className="transition-colors hover:text-white">Проблема</a>
            <a href="#compare" className="transition-colors hover:text-white">Сравнение</a>
            <a href="#demo" className="transition-colors hover:text-white">Демо</a>
            <a href="#calc" className="transition-colors hover:text-white">Калькулятор</a>
            <a href="#money" className="transition-colors hover:text-white">Монетизация</a>
          </nav>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-2.5 text-xs font-semibold text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            Комиссия 8% — зафиксирована в оферте
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-zinc-900 pt-6 text-xs text-zinc-600 md:flex-row">
          <p>
            Концепт-демонстрация продукта. Симуляция агрегатора не является публичной офертой.
          </p>
          <p className="flex items-center gap-1">
            Сделано для водителей
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            данные: открытые источники, 2024–2025
          </p>
        </div>
      </div>
    </footer>
  )
}
