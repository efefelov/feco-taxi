'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Microscope,
  Fuel,
  Droplets,
  ReceiptText,
  BadgePercent,
  Landmark,
  FileSpreadsheet,
  Timer,
  MapPin,
  AlertTriangle,
  Calculator as CalcIcon,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { rub } from '@/lib/pryamo/format'

/**
 * «Смена под микроскопом» — разбор реальной смены водителя монополиста
 * (ночь 01→02.10.2026: 20 заказов, 16 502 ₽, 10 ч 39 мин 57 с с пассажирами)
 * и та же смена на модели ПРЯМО: 12% фикс, без таксопарка, НПД с чистого дохода.
 * Все цифры — из отчёта водителя, без округлений «в нашу пользу».
 */

const GROSS = 16_502
const ORDERS = 20
const HOURS_WITH_PASSENGER = 10 + 39 / 60 + 57 / 3600 // 10:39:57

// Строки отчёта монополиста — как есть, копейка в копейку
const YANDEX_LINES = [
  { label: 'Комиссия агрегатора', note: '24,6%', value: -4058.21 },
  { label: 'Комиссия таксопарка-партнёра', note: '30,4%', value: -5010.6 },
  { label: 'Налог (СЗН)', note: '4,3%', value: -712.28 },
  { label: '«Прочее» — без расшифровки', note: '1,1%', value: -181.43 },
]
const YANDEX_NET_REPORTED = 7889.48

// Модель ПРЯМО на ту же смену
const PRYAMO_COMMISSION = GROSS * 0.12 // 1 980,24 ₽
const PRYAMO_TAX_NPD = (GROSS - PRYAMO_COMMISSION) * 0.06 // НПД 6% с выплаты на карту
const PRYAMO_NET = GROSS - PRYAMO_COMMISSION - PRYAMO_TAX_NPD // 13 650,45 ₽

// Расходы (одинаковы в обеих колонках)
const FUEL = 2500
const WASH = 700

const YANDEX_POCKET = YANDEX_NET_REPORTED - FUEL - WASH // 4 689,48 ₽
const PRYAMO_POCKET = PRYAMO_NET - FUEL - WASH // 10 450,45 ₽

// ПРЯМО Pro: 0% комиссии, НПД с полной выплаты, доля подписки 2 490 ₽ на смену
const PRO_PRICE = 2490
const PRO_PER_SHIFT = PRO_PRICE / 30
const PRYAMO_PRO_NET = GROSS - GROSS * 0.06
const PRYAMO_PRO_POCKET = PRYAMO_PRO_NET - FUEL - WASH - PRO_PER_SHIFT

const PER_HOUR = (v: number) => Math.round(v / HOURS_WITH_PASSENGER)
const MONTH_GAIN = (v: number) => Math.round((v - YANDEX_POCKET) * 26)

/** Режимы сравнения «в кармане» */
type Mode = 'yandex' | 'pryamo' | 'pro'

const MODES: Record<
  Mode,
  {
    label: string
    short: string
    pocket: number
    share: number // доля выручки, дошедшая до кармана
    perHour: number
    monthGain: number
    tone: 'rose' | 'emerald' | 'amber'
    note: string
  }
> = {
  yandex: {
    label: 'Монополист',
    short: 'Яндекс',
    pocket: YANDEX_POCKET,
    share: 28.4,
    perHour: PER_HOUR(YANDEX_POCKET),
    monthGain: 0,
    tone: 'rose',
    note: 'агрегатор + таксопарк + СЗН с полного чека',
  },
  pryamo: {
    label: 'ПРЯМО · 12% фикс',
    short: 'ПРЯМО 12%',
    pocket: PRYAMO_POCKET,
    share: 63.3,
    perHour: PER_HOUR(PRYAMO_POCKET),
    monthGain: MONTH_GAIN(PRYAMO_POCKET),
    tone: 'emerald',
    note: 'без таксопарка, НПД с чистой выплаты',
  },
  pro: {
    label: 'ПРЯМО · Pro (0%)',
    short: 'ПРЯМО Pro',
    pocket: PRYAMO_PRO_POCKET,
    share: 74.1,
    perHour: PER_HOUR(PRYAMO_PRO_POCKET),
    monthGain: MONTH_GAIN(PRYAMO_PRO_POCKET),
    tone: 'amber',
    note: 'подписка 2 490 ₽/мес — доля ≈ 83 ₽ на смену',
  },
}

const MODE_ORDER: Mode[] = ['yandex', 'pryamo', 'pro']

function rubExact(v: number): string {
  // копейки без «причёсывания»: 4 058,21 ₽
  return v.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ₽'
}

export function ShiftEconomics() {
  const [mode, setMode] = useState<Mode>('pryamo')
  const m = MODES[mode]

  return (
    <section id="shift" className="scroll-mt-20 bg-zinc-50 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">
            <Microscope className="h-3.5 w-3.5" />
            Разбор реальной смены
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-balance text-zinc-900 sm:text-4xl">
            Смена под микроскопом: 20 заказов, 10 ч 40 мин с пассажирами
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Ночь 01→02.10.2026. Выручка {rub(GROSS)} за {ORDERS} поездок. Слева — строки настоящего
            отчёта водителя монополиста, справа — та же смена на модели ПРЯМО. Считаем вместе,
            копейка в копейку.
          </p>
        </motion.div>

        {/* Два отчёта */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Отчёт монополиста */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl shadow-zinc-300/40 sm:p-7"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                <ReceiptText className="h-4 w-4 text-rose-400" aria-hidden />
                Отчёт монополиста · как есть
              </span>
              <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                вычитания
              </span>
            </div>

            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-baseline justify-between gap-2 border-b border-zinc-800/60 pb-3">
                <span className="text-zinc-400">Выручка за смену · {ORDERS} заказов</span>
                <span className="font-bold text-zinc-100 tabular-nums">{rubExact(GROSS)}</span>
              </li>
              {YANDEX_LINES.map((l) => (
                <li key={l.label} className="flex items-baseline justify-between gap-2">
                  <span className="text-zinc-400">
                    {l.label}
                    {l.note && (
                      <span className="ml-1.5 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
                        {l.note}
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-rose-400 tabular-nums">
                    −{rubExact(-l.value)}
                  </span>
                </li>
              ))}
              <li className="mt-1 flex items-baseline justify-between gap-2 border-t border-zinc-800/60 pt-3">
                <span className="text-zinc-400">Чистыми по отчёту</span>
                <span className="font-bold text-zinc-100 tabular-nums">
                  {rubExact(YANDEX_NET_REPORTED)}
                  <span className="ml-1.5 text-[10px] font-semibold text-zinc-500">47,8%</span>
                </span>
              </li>
              <li className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Fuel className="h-3.5 w-3.5" aria-hidden /> Бензин
                </span>
                <span className="font-semibold text-zinc-300 tabular-nums">−{rub(FUEL)}</span>
              </li>
              <li className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Droplets className="h-3.5 w-3.5" aria-hidden /> Мойка
                </span>
                <span className="font-semibold text-zinc-300 tabular-nums">−{rub(WASH)}</span>
              </li>
            </ul>

            <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">
                В кармане после расходов
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-rose-300">
                {rubExact(YANDEX_POCKET)}
                <span className="ml-2 text-xs font-semibold text-rose-400/80">28,4% выручки</span>
              </p>
            </div>

            <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-zinc-500">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
              Сложите строки удержаний: 9 962,52 ₽ — а удержано по итогу 8 612,52 ₽. Разница в
              1 350 ₽ не расшифрована нигде. Отчёт не сходится сам с собой — попробуйте повторить
              это со своей сменой.
            </p>
          </motion.div>

          {/* Та же смена на ПРЯМО */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-2xl border border-emerald-500/40 bg-zinc-950 p-6 shadow-xl shadow-emerald-600/10 sm:p-7"
          >
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400" aria-hidden />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                <ReceiptText className="h-4 w-4 text-emerald-400" aria-hidden />
                Та же смена на ПРЯМО
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                12% фикс
              </span>
            </div>

            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-baseline justify-between gap-2 border-b border-zinc-800/60 pb-3">
                <span className="text-zinc-400">Выручка за смену · те же {ORDERS} заказов</span>
                <span className="font-bold text-zinc-100 tabular-nums">{rubExact(GROSS)}</span>
              </li>
              <li className="flex items-baseline justify-between gap-2">
                <span className="text-zinc-400">
                  Комиссия ПРЯМО
                  <span className="ml-1.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                    12%
                  </span>
                </span>
                <span className="font-bold text-zinc-200 tabular-nums">
                  −{rubExact(PRYAMO_COMMISSION)}
                </span>
              </li>
              <li className="flex items-baseline justify-between gap-2">
                <span className="text-zinc-400">
                  Таксопарк-посредник
                  <span className="ml-1.5 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                    напрямую
                  </span>
                </span>
                <span className="font-bold text-emerald-400 tabular-nums">0 ₽</span>
              </li>
              <li className="flex items-baseline justify-between gap-2">
                <span className="text-zinc-400">
                  Налог НПД 6%
                  <span className="ml-1.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                    с выплаты на карту
                  </span>
                </span>
                <span className="font-bold text-zinc-200 tabular-nums">
                  −{rubExact(PRYAMO_TAX_NPD)}
                </span>
              </li>
              <li className="flex items-baseline justify-between gap-2">
                <span className="text-zinc-400">«Прочее» без расшифровки</span>
                <span className="font-bold text-emerald-400 tabular-nums">0 ₽</span>
              </li>
              <li className="mt-1 flex items-baseline justify-between gap-2 border-t border-zinc-800/60 pt-3">
                <span className="text-zinc-400">Чистыми</span>
                <span className="font-bold text-zinc-100 tabular-nums">
                  {rubExact(PRYAMO_NET)}
                  <span className="ml-1.5 text-[10px] font-semibold text-zinc-500">82,7%</span>
                </span>
              </li>
              <li className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Fuel className="h-3.5 w-3.5" aria-hidden /> Бензин
                </span>
                <span className="font-semibold text-zinc-300 tabular-nums">−{rub(FUEL)}</span>
              </li>
              <li className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Droplets className="h-3.5 w-3.5" aria-hidden /> Мойка
                </span>
                <span className="font-semibold text-zinc-300 tabular-nums">−{rub(WASH)}</span>
              </li>
            </ul>

            <div className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                В кармане после расходов
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-emerald-300">
                {rubExact(PRYAMO_POCKET)}
                <span className="ml-2 text-xs font-semibold text-emerald-400/80">
                  63,3% выручки
                </span>
              </p>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
              НПД начисляем на сумму, фактически упавшую на карту (чек минус комиссия платформы):
              {rubExact(PRYAMO_TAX_NPD)} вместо {rubExact(GROSS * 0.06)} — если бы считали с
              полного чека, как у монополиста. Расходы для УСН «доходы минус расходы» в реестре —
              ниже.
            </p>
          </motion.div>
        </div>

        {/* Ответ на вопрос «какая же это комиссия?» */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-200/50 sm:p-7"
        >
          <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-zinc-900">
            <CalcIcon className="h-5 w-5 text-emerald-600" aria-hidden />
            «Так какая же это комиссия агрегатора?»
          </h3>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { v: '24,6%', l: 'номинальная комиссия агрегатора', tone: 'rose' },
              { v: '54,9%', l: 'агрегатор + таксопарк вместе', tone: 'rose' },
              { v: '60,4%', l: 'все удержания по строкам отчёта', tone: 'rose' },
              { v: '28,4%', l: 'чека реально доезжает до кармана', tone: 'emerald' },
            ].map((c) => (
              <div
                key={c.l}
                className={cn(
                  'rounded-xl border p-4 text-center',
                  c.tone === 'emerald'
                    ? 'border-emerald-300/70 bg-emerald-50'
                    : 'border-rose-200 bg-rose-50/60'
                )}
              >
                <p
                  className={cn(
                    'text-2xl font-black tabular-nums sm:text-3xl',
                    c.tone === 'emerald' ? 'text-emerald-700' : 'text-rose-600'
                  )}
                >
                  {c.v}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-snug text-zinc-600">{c.l}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600">
            За 10 ч 40 мин <em>с пассажирами</em> монополист оставил водителю{' '}
            <strong className="text-zinc-900">{PER_HOUR(YANDEX_POCKET)} ₽/час</strong> карманных.
            Та же смена на ПРЯМО — <strong className="text-emerald-700">{PER_HOUR(PRYAMO_POCKET)} ₽/час</strong>
            {' '}(+123%), на Pro — <strong className="text-amber-700">{PER_HOUR(PRYAMO_PRO_POCKET)} ₽/час</strong>.
            И это без учёта пустых пробегов и ожидания — они у обеих сторон одинаковы.
          </p>
        </motion.div>

        {/* Переключатель режима: из каждого рубля выручки — до кармана */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-200/50 sm:p-7"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight text-zinc-900">
                Из каждого рубля выручки — до кармана водителя
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Одна и та же смена, три модели. Переключайте — цифры пересчитываются.
              </p>
            </div>
            <div
              role="tablist"
              aria-label="Модель работы"
              className="flex w-full max-w-md rounded-xl border border-zinc-200 bg-zinc-100 p-1 lg:w-auto"
            >
              {MODE_ORDER.map((key) => {
                const mm = MODES[key]
                const active = mode === key
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setMode(key)}
                    className={cn(
                      'relative flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:text-sm',
                      active ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-800'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="shift-mode-pill"
                        className={cn(
                          'absolute inset-0 rounded-lg shadow-sm',
                          mm.tone === 'rose'
                            ? 'bg-rose-300'
                            : mm.tone === 'amber'
                              ? 'bg-amber-300'
                              : 'bg-emerald-300'
                        )}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative">{mm.short}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Полоса «до кармана» */}
          <div className="mt-6" aria-live="polite">
            <div className="relative h-9 overflow-hidden rounded-xl bg-zinc-100">
              <div className="absolute inset-0 flex">
                {MODE_ORDER.map((key) => (
                  <div
                    key={key}
                    className={cn(
                      'h-full border-r border-white/70 transition-[width] duration-500 last:border-r-0',
                      key === 'yandex' && 'bg-rose-300/80',
                      key === 'pryamo' && 'bg-emerald-400/80',
                      key === 'pro' && 'bg-amber-300/80'
                    )}
                    style={{ width: `${MODES[key].share}%` }}
                  />
                ))}
              </div>
              {/* Подписи внутри полосы */}
              <div className="absolute inset-0 flex">
                {MODE_ORDER.map((key) => (
                  <div
                    key={key}
                    className="flex h-full items-center justify-center overflow-hidden border-r border-white/40 text-[10px] font-black text-zinc-900 last:border-r-0 sm:text-xs"
                    style={{ width: `${MODES[key].share}%` }}
                    aria-hidden
                  >
                    <span className="truncate px-1">{MODES[key].share.toString().replace('.', ',')} коп.</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-semibold text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-300" aria-hidden /> Яндекс · 28,4 коп.
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden /> ПРЯМО 12% ·
                63,3 коп.
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <span className="h-2 w-2 rounded-full bg-amber-300" aria-hidden /> Pro · 74,1 коп.
              </span>
            </div>

            {/* Панель выбранного режима */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  'mt-5 grid grid-cols-2 gap-3 rounded-xl border p-4 sm:grid-cols-4',
                  m.tone === 'rose'
                    ? 'border-rose-200 bg-rose-50/50'
                    : m.tone === 'amber'
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-emerald-200 bg-emerald-50/50'
                )}
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    В кармане за смену
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-xl font-black tabular-nums sm:text-2xl',
                      m.tone === 'rose'
                        ? 'text-rose-600'
                        : m.tone === 'amber'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                    )}
                  >
                    {rub(Math.round(m.pocket))}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    ₽/час с пассажиром
                  </p>
                  <p className="mt-0.5 text-xl font-black tabular-nums text-zinc-900 sm:text-2xl">
                    {rub(m.perHour)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    За месяц · 26 смен
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-xl font-black tabular-nums sm:text-2xl',
                      mode === 'yandex' ? 'text-zinc-900' : 'text-emerald-700'
                    )}
                  >
                    {mode === 'yandex' ? rub(Math.round(YANDEX_POCKET * 26)) : `+${rub(m.monthGain)}`}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Модель
                  </p>
                  <p className="mt-0.5 text-xs font-semibold leading-snug text-zinc-700">
                    {m.note}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Налоги с расходами */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {[
            {
              icon: Landmark,
              title: 'Как у монополиста',
              tone: 'rose' as const,
              body: 'СЗН начисляется от полной стоимости поездки — налог платится с денег, которых водитель никогда не держал. По нашей смене это налог с 16 502 ₽ при кармане 4 689 ₽.',
            },
            {
              icon: BadgePercent,
              title: 'Как у нас: НПД 6%',
              tone: 'emerald' as const,
              body: 'Налоговая база — сумма, фактически зачисленная на карту: чек минус комиссия платформы. Платёж за ту же смену: 871,31 ₽ вместо 990,12 ₽. Реестр для ФНС платформа ведёт сама.',
            },
            {
              icon: FileSpreadsheet,
              title: 'УСН «доходы минус расходы»',
              tone: 'amber' as const,
              body: 'Топливо, ТО, мойки, стоянка и амортизация — в автоматическом реестре расходов по каждой смене. Выгрузка для декларации — одним файлом. Расходы честно уходят из налогооблагаемой базы — как и должно быть.',
            },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={cn(
                'rounded-2xl border p-6',
                c.tone === 'rose'
                  ? 'border-zinc-200 bg-white'
                  : c.tone === 'emerald'
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : 'border-amber-200 bg-amber-50/60'
              )}
            >
              <span
                className={cn(
                  'inline-flex rounded-xl p-2.5 ring-1',
                  c.tone === 'rose'
                    ? 'bg-zinc-100 text-zinc-600 ring-zinc-200'
                    : c.tone === 'emerald'
                      ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                      : 'bg-amber-100 text-amber-700 ring-amber-200'
                )}
              >
                <c.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 text-base font-bold text-zinc-900">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{c.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Цена по времени */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-7"
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
                <Timer className="h-5 w-5 text-amber-400" aria-hidden />
                Цена — по времени, а не только по километрам
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                В городе расстояние меряется пробками: 5 км в заторе — это 25 минут дороги, и это
                дороже для машины, чем 15 км по свободной трассе. Тариф ПРЯМО —{' '}
                <strong className="text-zinc-200">
                  минута в пути, взвешенная прогнозом скорости по графу дорог
                </strong>
                . Затор честно стоит денег: водитель не несёт убыток от простоя в трубе — и не
                пытается «нагнать» его нарушением.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Пассажиру при этом всё равно виден{' '}
                <strong className="text-zinc-200">фикс до начала поездки</strong> — пробки уже
                посчитаны в цену заранее, а не «докупаются» по дороге.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: MapPin, t: 'минута × прогноз пробок', d: 'граф дорог города' },
                { icon: Timer, t: 'фикс до поездки', d: 'без сюрпризов в чеке' },
                { icon: BadgePercent, t: 'кап ×1,5', d: 'коэффициент ограничен' },
                { icon: Fuel, t: 'водителю — с коэффициентом', d: 'полностью, не «пересчёт»' },
              ].map((x) => (
                <div
                  key={x.t}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 transition-colors hover:border-zinc-700"
                >
                  <x.icon className="h-4 w-4 text-emerald-400" aria-hidden />
                  <p className="mt-2 text-xs font-bold text-zinc-100">{x.t}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>


        {/* Три реальные смены YouPiter.Taxi — плавающая шкала и её последствия */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-zinc-900">
              <ReceiptText className="h-5 w-5 text-rose-500" aria-hidden />
              И это не одна смена: три выгрузки партнёра YouPiter.Taxi
            </h3>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              СПб · комфорт/комфорт+ · 2023 г.в. · ноябрь 2026
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            У партнёра плавающая шкала: чем больше касса за смену — тем больше доля водителя.
            Считаем удержания по трём реальным выгрузкам, копейка в копейку.
          </p>

          {/* Шкала */}
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              { share: '70/30', cond: 'касса ~14,5–19 тыс. (будни)' },
              { share: '75/25', cond: 'касса ~19–22 тыс. (будни)' },
              { share: '80/20', cond: 'касса свыше 22 тыс. (будни)' },
            ].map((x) => (
              <div key={x.share} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
                <p className="text-base font-black tabular-nums text-zinc-900">{x.share}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{x.cond} · в пт–сб пороги выше</p>
              </div>
            ))}
          </div>

          {/* Три чека */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-200">
                <tr>
                  <th className="px-3 py-2 font-bold">Смена</th>
                  <th className="px-3 py-2 font-bold">Касса</th>
                  <th className="px-3 py-2 font-bold">Удержания</th>
                  <th className="px-3 py-2 font-bold">Чистыми</th>
                  <th className="px-3 py-2 font-bold">Доля водителя</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-700">
                {[
                  { s: 'будни', g: '14 503 ₽', d: '8 940 ₽ — парк 30,0% + агрегатор 24,4% + налог 4,0% + прочее', n: '5 655,91 ₽', p: '38,7%' },
                  { s: 'вторая', g: '22 155 ₽', d: '14 600 ₽ — парк 19,6% + агрегатор 23,6% + налог 4,0% + ГСМ 3 176 ₽ (Я.Заправки)', n: '7 975,13 ₽', p: '35,3%' },
                  { s: 'третья', g: '19 738 ₽', d: '10 806 ₽ — парк 25,3% + агрегатор 23,7% + налог 4,1% + прочее', n: '9 171,70 ₽', p: '45,9%' },
                ].map((row) => (
                  <tr key={row.g}>
                    <td className="px-3 py-2.5 font-semibold text-zinc-900">{row.s}</td>
                    <td className="px-3 py-2.5 font-bold tabular-nums text-zinc-900">{row.g}</td>
                    <td className="px-3 py-2.5 text-zinc-600">{row.d}</td>
                    <td className="px-3 py-2.5 font-bold tabular-nums text-zinc-900">{row.n}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded bg-rose-500/10 px-1.5 py-0.5 font-bold tabular-nums text-rose-600">
                        {row.p}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              {
                title: 'Плавающая шкала = стимул к 14–16-часовым сменам',
                body: 'Доля растёт вместе с кассой, но 80/20 достижимы только на сменах 14–16 часов. Уставший водитель — это комплимент «Забота» на 24 из 150 поездок, а не на каждую.',
              },
              {
                title: 'Я.Заправки дают «дополнительный приоритет»',
                body: 'Встроенная заправка влияет на доступ к заказам — платная опция замаскирована под сервис. В ПРЯМО лента без приоритетов: заправка — инструмент, а не пропуск.',
              },
              {
                title: 'Рейтинг 4.88 — и 4 единицы без причин',
                body: '144 пятёрки с комплиментами по осям (вежливость 27, чистота 27, забота 24, вождение 22) — и 4 единицы без единого объяснения. Рейтинг 2.0 ПРЯМО обязывает указать причину низкой оценки.',
              },
            ].map((x) => (
              <div key={x.title} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-sm font-bold leading-snug text-zinc-900">{x.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">{x.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
            Рейтинг водителя из скрина: 144 × 5★, 2 × 4★, 4 × 1★ → 4.88. Наш Рейтинг 2.0 сохраняет
            комплименты-оси, но низкая оценка без причины технически невозможна.
          </p>
        </motion.div>

        <p className="mt-6 text-center text-xs leading-relaxed text-zinc-400">
          Источники цифр: личный отчёт водителя за смену 01→02.10.2026 (внутри удержаний
          таксопарка: режимы «Мой район» 1,02–9,15% и «По делам» 9,9%) и три выгрузки смен
          партнёра YouPiter.Taxi (СПб, ноябрь 2026). Расчёт справа — наша публичная формула:
          12% фикс + НПД 6% с чистой выплаты. Любую строку можно пересчитать самому — в этом
          смысл раздела.
        </p>
      </div>
    </section>
  )
}
