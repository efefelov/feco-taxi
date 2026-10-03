'use client'

import { Zap, ShieldCheck, ArrowUpRight } from 'lucide-react'

const FOOTER_NAV: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Продукт',
    links: [
      { href: '#demo', label: 'Живое демо' },
      { href: '#tariffs', label: 'Тарифы' },
      { href: '#flow', label: 'Куда уходит чек' },
      { href: '#fair', label: 'Аукцион против очереди' },
      { href: '#tech', label: 'Навигатор и GPS' },
      { href: '#apps', label: 'Приложения и установка' },
      { href: '#game', label: 'Игра и лиги' },
    ],
  },
  {
    title: 'Экономика',
    links: [
      { href: '#shift', label: 'Смена под микроскопом' },
      { href: '#calc', label: 'Калькулятор потерь' },
      { href: '#compare', label: 'Честная таблица' },
      { href: '#rivals', label: 'Конкуренты' },
      { href: '#money', label: 'Монетизация' },
      { href: '#fleets', label: 'Таксопаркам' },
    ],
  },
  {
    title: 'Проект',
    links: [
      { href: '#problem', label: 'Проблема' },
      { href: '#law', label: 'Закон и отбор' },
      { href: '#founders', label: 'Инвесторам' },
      { href: '#roadmap', label: 'План запуска' },
      { href: '#faq', label: 'Вопросы' },
      { href: '#join', label: 'Первая волна' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950 text-zinc-400">
      {/* Шашечка — фирменный ритм такси */}
      <div className="taxi-strip h-1.5 w-full opacity-70" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
          {/* Бренд + обещание */}
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20">
                <Zap className="h-5 w-5" strokeWidth={2.6} />
              </span>
              <div>
                <p className="text-lg font-black tracking-tight text-white">ПРЯМО</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-400">
                  такси-агрегатор
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              Прямая дорога. Честная цена. Деньги водителю. Агрегатор, который зарабатывает
              вокруг поездки, а не на водителе.
            </p>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-2.5 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
              Комиссия 12% — зафиксирована в оферте
            </div>
          </div>

          {/* Мини-карта сайта */}
          <nav
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
            aria-label="Навигация в подвале"
          >
            {FOOTER_NAV.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  {col.title}
                </p>
                <ul className="mt-3 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <a
                        href={l.href}
                        className="text-sm text-zinc-400 underline-offset-4 transition-colors hover:text-emerald-300 hover:underline hover:decoration-emerald-500/50"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-zinc-900 pt-6 text-xs text-zinc-600 md:flex-row">
          <p>
            Концепт-демонстрация продукта. Симуляция агрегатора не является публичной офертой.
          </p>
          <p className="flex items-center gap-1">
            Сделано для водителей
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
            данные: открытые источники, 2024–2025
          </p>
        </div>
      </div>
    </footer>
  )
}
