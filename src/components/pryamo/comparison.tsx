'use client'

import { motion } from 'framer-motion'
import { Check, X, Scale, MoveHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Row {
  feature: string
  pryamo: { text: string; ok: boolean }
  yandex: { text: string; ok: boolean }
}

const ROWS: Row[] = [
  {
    feature: 'Комиссия с водителя',
    pryamo: { text: '8% фикс или 0% с Pro (1 990 ₽/мес)', ok: true },
    yandex: { text: '24%+, волатильность до 37%', ok: false },
  },
  {
    feature: 'Цена поездки',
    pryamo: { text: 'Фикс до конца поездки, одна для всех', ok: true },
    yandex: { text: 'Пересчёт «по трафику», A/B-цены', ok: false },
  },
  {
    feature: 'Что видит водитель',
    pryamo: { text: 'Чек пассажира и свою выплату ДО заказа', ok: true },
    yandex: { text: 'Только «выплату», без чека', ok: false },
  },
  {
    feature: 'Коэффициент спроса',
    pryamo: { text: 'Кап ×1,5, виден заранее, водителю — с ним', ok: true },
    yandex: { text: '×2–3, формула скрыта, водителю — не полностью', ok: false },
  },
  {
    feature: 'Распределение заказов',
    pryamo: { text: 'Первый нажал — получил. Отказ без штрафа', ok: true },
    yandex: { text: 'Приоритеты, «карточка качества», штраф за отказ', ok: false },
  },
  {
    feature: 'Рейтинг',
    pryamo: { text: '4 оси, медиана, затухание 90 дней', ok: true },
    yandex: { text: '1★ ≈ 10× пятёрок, без объяснений', ok: false },
  },
  {
    feature: 'Карта спроса для водителя',
    pryamo: { text: 'Живые цифры: заказы, водители, ожидание', ok: true },
    yandex: { text: 'Цветная заливка без данных', ok: false },
  },
  {
    feature: 'Навигатор',
    pryamo: { text: '2GIS / Яндекс / OsmAnd — выбор водителя', ok: true },
    yandex: { text: 'Только Яндекс.Навигатор', ok: false },
  },
  {
    feature: 'Потеря GPS-сигнала',
    pryamo: { text: 'Офлайн-буфер 15 минут, SMS-fallback', ok: true },
    yandex: { text: 'Срыв заказа и штраф', ok: false },
  },
  {
    feature: 'Чаевые',
    pryamo: { text: '100% водителю, мгновенно', ok: true },
    yandex: { text: 'Зачисление «по правилам платформы»', ok: false },
  },
  {
    feature: 'Споры и списания',
    pryamo: { text: 'Человек-арбитр, правила в оферте', ok: true },
    yandex: { text: 'Автоштрафы, поддержка шаблонами', ok: false },
  },
  {
    feature: 'Плотность машин (сейчас)',
    pryamo: { text: 'Стартуем с 1 города, честно говорим', ok: false },
    yandex: { text: 'Машина за ~5 минут почти везде', ok: true },
  },
]

export function Comparison() {
  return (
    <section id="compare" className="scroll-mt-20 bg-background py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">
            <Scale className="h-3.5 w-3.5" />
            Лицом к лицу
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            Честная таблица. Даже там, где мы пока проигрываем
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Единственное реальное преимущество монополиста — плотность сети машин. Всё остальное —
            вопрос экономики и уважения к водителю.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="table-scroll mt-12 overflow-x-auto rounded-2xl border border-zinc-200 shadow-xl shadow-zinc-200/50"
        >
          {/* Заголовок таблицы: на мобильных — горизонтальный скролл, min-w не даёт тексту обрезаться */}
          <div className="min-w-[600px] sm:min-w-0">
          <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-zinc-200 bg-zinc-50">
            <div className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 sm:px-6">
              Параметр
            </div>
            <div className="border-l border-zinc-200 bg-emerald-50/60 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-xs font-black text-zinc-950">П</span>
                <span className="text-sm font-black uppercase tracking-wide text-emerald-700">ПРЯМО</span>
              </div>
            </div>
            <div className="border-l border-zinc-200 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-800 text-xs font-black text-zinc-100">Я</span>
                <span className="text-sm font-black uppercase tracking-wide text-zinc-600">
                  Яндекс Такси
                </span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 bg-white">
            {ROWS.map((row, i) => (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-10px' }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                className="grid grid-cols-[1.2fr_1fr_1fr] text-sm transition-colors hover:bg-zinc-50/60"
              >
                <div className="px-4 py-3.5 font-semibold text-zinc-800 sm:px-6">{row.feature}</div>
                <div
                  className={cn(
                    'flex items-start gap-2 border-l border-zinc-100 px-4 py-3.5 sm:px-6',
                    row.pryamo.ok ? 'bg-emerald-50/40' : ''
                  )}
                >
                  <CellMark ok={row.pryamo.ok} />
                  <span className={row.pryamo.ok ? 'text-emerald-900' : 'text-zinc-600'}>
                    {row.pryamo.text}
                  </span>
                </div>
                <div className="flex items-start gap-2 border-l border-zinc-100 px-4 py-3.5 sm:px-6">
                  <CellMark ok={row.yandex.ok} />
                  <span className={row.yandex.ok ? 'text-zinc-700' : 'text-zinc-500'}>
                    {row.yandex.text}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          </div>
        </motion.div>

        <p className="mt-4 text-center text-xs text-zinc-400">
          По данным открытых источников, оферты, судебной практики и драйверских сообществ, 2024–2025
        </p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-400 sm:hidden">
          <MoveHorizontal className="h-3.5 w-3.5" aria-hidden />
          Таблицу можно прокрутить в сторону
        </p>
      </div>
    </section>
  )
}

function CellMark({ ok }: { ok: boolean }) {
  return ok ? (
    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} aria-label="Хорошо" />
  ) : (
    <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" strokeWidth={3} aria-label="Плохо" />
  )
}
