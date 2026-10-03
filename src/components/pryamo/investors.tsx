'use client'

import { motion } from 'framer-motion'
import {
  Briefcase,
  TrendingUp,
  Wallet,
  ArrowRight,
  Wrench,
} from 'lucide-react'

/**
 * «Основателям и инвесторам» — unit-экономика честной комиссии 12%
 * и структура маржи. Инструменты ТРИЗ/ТОС и growth hacks — в секции
 * «Инженерия потока» (#engineering), сюда ведёт перекрёстная ссылка.
 */

export function Investors() {
  return (
    <section id="founders" className="scroll-mt-20 bg-zinc-950 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <Briefcase className="h-3.5 w-3.5 text-amber-400" />
            Основателям и инвесторам
          </span>
          <h2 className="mt-4 text-balance text-3xl font-black tracking-tight text-white sm:text-4xl">
            Честная маржа вместо жадной комиссии
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            12% — это комиссия, из которой платятся эквайринг, ФГИС, поддержка и остаётся маржа
            роста. Инструменты — мафия-оффер, барабан-буфер-верёвка и ТРИЗ — разобраны в
            секции «Инженерия потока».
          </p>
        </motion.div>

        {/* Перекрёстная ссылка на инженерную секцию */}
        <motion.a
          href="#engineering"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-gradient-to-r from-emerald-500/10 via-zinc-900 to-zinc-900 px-6 py-4 transition-colors hover:border-emerald-500/40"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
              <Wrench className="h-4.5 w-4.5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-white">
                Инженерия потока: ТРИЗ, ТОС и growth hacks
              </span>
              <span className="block text-xs text-zinc-500">
                мафия-оффер · барабан-буфер-верёвка · рост без рекламы
              </span>
            </span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
        </motion.a>

        {/* Unit-экономика 12% + основатели */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-7"
          >
            <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
              <TrendingUp className="h-5 w-5 text-emerald-400" aria-hidden />
              Почему 12%, а не 8
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              12% — вдвое ниже официальной комиссии монополиста. Этого хватает, чтобы не жать
              водителя и не жать себя:
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { k: 'комиссия со среднего чека 825 ₽', v: '≈ 99 ₽' },
                { k: 'эквайринг и платежи', v: '−12 ₽' },
                { k: 'ФГИС, путевые, медосмотры — инфраструктура', v: '−20 ₽' },
                { k: 'поддержка и спорные случаи', v: '−13 ₽' },
              ].map((r) => (
                <li
                  key={r.k}
                  className="flex items-baseline justify-between gap-3 border-b border-zinc-800/60 pb-2.5"
                >
                  <span className="text-zinc-400">{r.k}</span>
                  <span className="font-bold tabular-nums text-zinc-200">{r.v}</span>
                </li>
              ))}
              <li className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-emerald-300">маржа платформы на заказ</span>
                <span className="font-black tabular-nums text-emerald-400">≈ 54 ₽</span>
              </li>
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              Подписка Pro 2 490 ₽/мес: водителю окупается от ~21 000 ₽ оборота, платформа получает
              предсказуемую выручку и удержание. Каждый 1% рынка такси РФ ≈ 15 млрд ₽ GMV ≈
              1,8 млрд ₽ нашей выручки в год.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 via-zinc-900 to-zinc-950 p-6 sm:p-7"
          >
            <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
              <Wallet className="h-5 w-5 text-amber-400" aria-hidden />
              Основатель должен кушать вкусно
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              Честная маржа вместо жадной комиссии — это стратегия, а не благотворительность.
              Структура издержек втрое легче монополиста, доля растущего рынка вместо дани с
              застывшего чека, дивиденды учредителей — с маржи платформы, а не со «штрафов за
              отказ».
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { v: '12%', l: 'комиссия — в оферте, навсегда' },
                { v: '~54 ₽', l: 'маржа со среднего заказа' },
                { v: '×1,8', l: 'рост цены этой доли рынка' },
              ].map((x) => (
                <div
                  key={x.l}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-center"
                >
                  <p className="text-lg font-black tabular-nums text-amber-400">{x.v}</p>
                  <p className="mt-1 text-[10px] font-semibold leading-snug text-zinc-500">{x.l}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              Экономика, в которой едят все: водитель — 88% чека, пассажир — предсказуемую цену,
              команда — рынок, основатели — маржу роста. «Вкусно кушать» и «спокойно спать» —
              совместимые опции, если не строить доход на чужой спешке.
            </p>
            <a
              href="#join"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              Стать частью первой волны
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
