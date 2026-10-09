'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowDown, BadgePercent, ShieldCheck, Timer, ReceiptText, TrendingDown, Users, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { openMvpApp } from '@/components/pryamo/mvp'
import { rub, num, plural } from '@/lib/pryamo/format'
import { CountUp } from '@/components/pryamo/count-up'
import { OnboardingTrigger } from '@/components/pryamo/onboarding'
import { useEngineStatus } from '@/lib/pryamo/socket'

// Оценка переплат водителями агрегаторам за день:
// ~9,3 млн поездок/день × 450 ₽ средний чек × ~40% совокупных потерь ≈ 1,68 млрд ₽/день
const DAILY_OVERPAY = 1_676_000_000

/** Формат счётчика «млрд ₽» — модульная константа для стабильной ссылки в CountUp */
const formatBillion = (v: number) => `~${v.toFixed(2).replace('.', ',')} млрд ₽`

function dayFraction(): number {
  const now = new Date()
  return (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400
}

function useOverpayCounter() {
  // SSR-безопасно: стартуем с 0, реальное значение — асинхронно после маунта
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLParagraphElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const perSecond = DAILY_OVERPAY / 86400
    let current = DAILY_OVERPAY * dayFraction()
    const t = setInterval(() => {
      current += perSecond * 1.2
      setValue(current)
    }, 1200)
    const t0 = setTimeout(() => setValue(current), 80)
    return () => {
      clearInterval(t)
      clearTimeout(t0)
    }
  }, [inView])

  return { value, ref }
}

/**
 * Профиль интенсивности поездок по часам (0–23): ночь тише,
 * утренний и вечерний часы пик круче.
 */
const HOUR_RATES = [
  0.32, 0.24, 0.18, 0.14, 0.18, 0.36, 0.78, 1.55, 2.15, 1.9, 1.4, 1.15, 1.05,
  1.08, 1.18, 1.3, 1.62, 2.1, 2.28, 1.85, 1.48, 1.15, 0.78, 0.5,
]

/** Кумулятивная доля переплат, накопленная к моменту fraction суток (0..1) */
function cumulativeAt(fraction: number): number {
  const total = HOUR_RATES.reduce((a, b) => a + b, 0)
  const hours = Math.min(24, Math.max(0, fraction * 24))
  const full = Math.floor(hours)
  let acc = HOUR_RATES.slice(0, full).reduce((a, b) => a + b, 0)
  if (full < 24) acc += (hours - full) * (HOUR_RATES[full] ?? 0)
  return acc / total
}

/**
 * Дневная кривая переплат: сплошная — с полуночи до «сейчас»,
 * пунктир — прогноз до конца суток (капитал дня ×1,68 млрд ₽).
 * Живая точка отмечает текущее время.
 */
function OverpayDayCurve({ fraction }: { fraction: number }) {
  const w = 200
  const h = 44
  const steps = 96 // точки каждые 15 минут
  const f = Math.min(1, Math.max(0, fraction))
  const nowIdx = Math.round(f * steps)

  const pointAt = (i: number): [number, number] => {
    const x = (i / steps) * w
    const y = h - 5 - cumulativeAt(i / steps) * (h - 12)
    return [x, y]
  }

  const pastPts: string[] = []
  for (let i = 0; i <= nowIdx; i++) {
    const [x, y] = pointAt(i)
    pastPts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  const futurePts: string[] = []
  for (let i = nowIdx; i <= steps; i++) {
    const [x, y] = pointAt(i)
    futurePts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  const [dotX, dotY] = pointAt(nowIdx)
  const area = `M0,${h} L${pastPts.join(' L')} L${dotX.toFixed(1)},${h} Z`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="mt-3 h-11 w-full max-w-md"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="day-curve-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* прогноз до полуночи */}
      <polyline
        points={futurePts.join(' ')}
        fill="none"
        stroke="#f43f5e"
        strokeOpacity="0.35"
        strokeWidth="1.25"
        strokeDasharray="3 3"
        vectorEffect="non-scaling-stroke"
      />
      {/* накоплено с полуночи */}
      <path d={area} fill="url(#day-curve-fill)" />
      <polyline
        points={pastPts.join(' ')}
        fill="none"
        stroke="#fb7185"
        strokeWidth="1.75"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* живая точка «сейчас» */}
      <circle
        cx={dotX}
        cy={dotY}
        r="2.6"
        fill="#fb7185"
        className="animate-pulse"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

interface ReceiptRow {
  label: string
  value: string
  negative?: boolean
  positive?: boolean
  note?: string
}

const RECEIPT_ROWS_YANDEX: ReceiptRow[] = [
  { label: 'Пассажир заплатил', value: '540 ₽' },
  { label: 'Комиссия агрегатора', value: '130 ₽', negative: true, note: '24%' },
  { label: 'Опции и сервисы парка', value: '54 ₽', negative: true, note: 'ещё 10%' },
  { label: 'Штраф за «низкую активность»', value: '32 ₽', negative: true, note: 'алгоритм' },
  { label: 'Итого водитель получил', value: '324 ₽', negative: true, note: '−40%' },
]

const RECEIPT_ROWS_PRYAMO: ReceiptRow[] = [
  { label: 'Пассажир заплатил', value: '540 ₽' },
  { label: 'Комиссия ПРЯМО', value: '65 ₽', note: '12% фикс' },
  { label: 'Скрытые списания', value: '0 ₽', note: 'нет' },
  { label: 'Чаевые (100%)', value: '0 ₽', note: 'пассажир решает' },
  { label: 'Итого водитель получил', value: '475 ₽', positive: true, note: '88%' },
]

function ReceiptCard({
  title,
  rows,
  tone,
}: {
  title: string
  rows: ReceiptRow[]
  tone: 'yandex' | 'pryamo'
}) {
  return (
    <div
      className={
        tone === 'pryamo'
          ? 'relative rounded-2xl border border-emerald-500/40 bg-zinc-900/80 p-5 shadow-2xl shadow-emerald-500/10 backdrop-blur'
          : 'relative rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-5 backdrop-blur'
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{title}</span>
        {tone === 'pryamo' ? (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            чек ПРЯМО
          </span>
        ) : (
          <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-400">
            как у монополиста
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-zinc-400">{r.label}</span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className={
                  r.negative
                    ? 'font-bold text-rose-400'
                    : r.positive
                      ? 'font-bold text-emerald-400'
                      : 'font-semibold text-zinc-200'
                }
              >
                {r.value}
              </span>
              {r.note && (
                <span
                  className={
                    r.negative
                      ? 'rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300'
                      : r.positive
                        ? 'rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300'
                        : 'rounded bg-zinc-700/50 px-1.5 py-0.5 text-[10px] text-zinc-400'
                  }
                >
                  {r.note}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="taxi-strip mt-4 h-2 w-full rounded-full opacity-60" aria-hidden="true" />
    </div>
  )
}

export function Hero() {
  const { value, ref } = useOverpayCounter()
  const [waveCount, setWaveCount] = useState<number | null>(null)
  const { stats: engineStats } = useEngineStatus()

  // Живой счётчик первой волны (соцдоказательство)
  useEffect(() => {
    fetch('/api/waitlist')
      .then((r) => r.json())
      .then((d) => setWaveCount(typeof d.count === 'number' ? d.count : null))
      .catch(() => setWaveCount(null))
  }, [])

  return (
    <section id="top" className="relative overflow-hidden bg-zinc-950 pb-20 pt-32 sm:pt-36 lg:pb-28">
      {/* фон */}
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 h-[300px] w-[420px] rounded-full bg-amber-500/8 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Стратегический концепт · инфраструктура вместо монополии
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Такси, где деньги
              <br />
              остаются у тех,
              <br />
              кто <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-amber-300">крутит баранку</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400"
            >
              <strong className="text-zinc-200">ПРЯМО</strong> — агрегатор с комиссией{' '}
              <strong className="text-emerald-400">12% фикс</strong> или{' '}
              <strong className="text-emerald-400">0% по подписке</strong>. Без баллов приоритета,
              без скрытых списаний, без привязки к чужому навигатору. Водитель видит выплату до
              принятия заказа — всегда.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button
                asChild
                size="lg"
                className="h-12 bg-emerald-500 px-7 text-base font-bold text-zinc-950 shadow-xl shadow-emerald-500/25 hover:bg-emerald-400"
              >
                <a href="#demo">
                  Попробовать живое демо
                  <ArrowDown className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                size="lg"
                onClick={() => openMvpApp('passenger')}
                className="h-12 border-amber-400/60 bg-amber-400/10 px-7 text-base font-bold text-amber-300 shadow-lg shadow-amber-400/10 hover:bg-amber-400/20 hover:text-amber-200"
                variant="outline"
              >
                Открыть MVP-приложение
                <ArrowDown className="ml-2 h-4 w-4 rotate-[-90deg]" />
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-zinc-700 bg-zinc-900/60 px-7 text-base font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white"
              >
                <a href="#calc">Сколько я теряю?</a>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-4"
            >
              <OnboardingTrigger variant="hero" />
              {waveCount !== null && waveCount > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                  <Users className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                  <span>
                    <span className="font-bold text-emerald-400">{waveCount}</span>{' '}
                    {plural(waveCount, 'водитель', 'водителя', 'водителей')} уже в списке первой
                    волны
                  </span>
                </p>
              )}
              {engineStats && engineStats.onlineDrivers > 0 && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                  <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" aria-hidden />
                  <span>
                    движок демо в этот момент:{' '}
                    <span className="font-bold text-zinc-300">
                      {num(engineStats.onlineDrivers)}{' '}
                      {plural(engineStats.onlineDrivers, 'водитель', 'водителя', 'водителей')}
                    </span>{' '}
                    онлайн ·{' '}
                    <span className="font-bold text-zinc-300">
                      {num(engineStats.completedToday)}{' '}
                      {plural(engineStats.completedToday, 'поездка', 'поездки', 'поездок')}
                    </span>{' '}
                    завершено
                  </span>
                </p>
              )}
            </motion.div>

            <motion.dl
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32 }}
              className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              {[
                { icon: BadgePercent, v: '12%', l: 'комиссия фикс' },
                { icon: ShieldCheck, v: '0 ₽', l: 'штрафов за отказ' },
                { icon: Timer, v: '~90 сек', l: 'среднее ожидание' },
                { icon: ReceiptText, v: '100%', l: 'чаевых водителю' },
              ].map((k) => (
                <div
                  key={k.l}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3.5 backdrop-blur"
                >
                  <k.icon className="h-4 w-4 text-emerald-400" />
                  <dt className="mt-2 text-xl font-black tabular-nums text-white">{k.v}</dt>
                  <dd className="text-xs text-zinc-500">{k.l}</dd>
                </div>
              ))}
            </motion.dl>
          </div>

          {/* Правая колонка: чеки */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-emerald-500/10 to-transparent blur-2xl" aria-hidden="true" />
            <div className="relative space-y-4">
              <ReceiptCard title="Одна и та же поездка · класс Прямой" rows={RECEIPT_ROWS_PRYAMO} tone="pryamo" />
              <ReceiptCard title="Одна и та же поездка · класс Эконом у монополиста" rows={RECEIPT_ROWS_YANDEX} tone="yandex" />
            </div>
          </motion.div>
        </div>

        {/* Живой счётчик переплат */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
          className="mt-16 rounded-2xl border border-rose-500/25 bg-gradient-to-r from-rose-500/8 via-zinc-900/60 to-zinc-900/60 p-6 sm:p-8"
        >
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="mt-1 rounded-xl bg-rose-500/15 p-2.5 text-rose-400">
                <TrendingDown className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-400">
                  Пока вы читаете эту страницу, водители России отдают агрегаторам и таксопаркам:
                </p>
                <p
                  ref={ref}
                  role="timer"
                  aria-label="Счётчик переплат водителей за сегодня"
                  className="mt-1 text-3xl font-black tabular-nums tracking-tight text-rose-400 sm:text-4xl"
                >
                  {rub(value)}
                </p>
                {value > 0 && <OverpayDayCurve fraction={value / DAILY_OVERPAY} />}
                <p className="sr-only" aria-live="polite">
                  Оценка переплат водителей агрегаторам за сегодня: примерно {rub(DAILY_OVERPAY)} за
                  полный день.
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  за сегодня · оценка: 9,3 млн поездок × 450 ₽ × ~40% совокупных потерь
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                с ПРЯМО оставалось бы водителям
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-emerald-400">
                <CountUp value={1.17} duration={1.4} format={formatBillion} srLabel="около 1,17 млрд ₽" />
              </p>
              <p className="text-[11px] text-emerald-500/80">каждый день</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
