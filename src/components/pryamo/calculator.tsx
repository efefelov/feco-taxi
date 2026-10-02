'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calculator as CalcIcon,
  Clock,
  CalendarDays,
  Banknote,
  Route,
  Crown,
  Share2,
  Check,
  RotateCcw,
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import type { CalculatorResult } from '@/lib/pryamo/types'
import { rub } from '@/lib/pryamo/format'
import { cn } from '@/lib/utils'

// recharts — тяжёлый: грузим отдельным чанком после гидрации
const CalculatorChart = dynamic(
  () => import('./calculator-chart').then((m) => m.CalculatorChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-xs text-zinc-600">график загружается…</span>
      </div>
    ),
  }
)

interface SliderDef {
  key: 'hoursPerDay' | 'daysPerMonth' | 'avgCheck' | 'ridesPerHour'
  label: string
  icon: React.ComponentType<{ className?: string }>
  min: number
  max: number
  step: number
  format: (v: number) => string
}

const SLIDERS: SliderDef[] = [
  { key: 'hoursPerDay', label: 'Часов за рулём в день', icon: Clock, min: 4, max: 16, step: 1, format: (v) => `${v} ч` },
  { key: 'daysPerMonth', label: 'Дней в месяц', icon: CalendarDays, min: 5, max: 30, step: 1, format: (v) => `${v} дн` },
  { key: 'avgCheck', label: 'Средний чек', icon: Banknote, min: 200, max: 1500, step: 25, format: (v) => `${v} ₽` },
  { key: 'ridesPerHour', label: 'Заказов в час', icon: Route, min: 0.5, max: 3.5, step: 0.1, format: (v) => `${v.toFixed(1)}` },
]

const DEFAULTS = { hoursPerDay: 10, daysPerMonth: 24, avgCheck: 450, ridesPerHour: 1.8 }

/** Копирование в буфер с fallback для старых контекстов */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

export function IncomeCalculator() {
  const [values, setValues] = useState(DEFAULTS)
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [shared, setShared] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const sharedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Восстановление настроек из ссылки «поделиться расчётом»: ?h=10&d=24&c=450&r=1.8#calc
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const num = (v: string | null): number | null => {
      const n = Number(v)
      return v !== null && Number.isFinite(n) ? n : null
    }
    const clamp = (n: number | null, min: number, max: number) =>
      n !== null && n >= min && n <= max ? n : null
    const h = clamp(num(sp.get('h')), 4, 16)
    const d = clamp(num(sp.get('d')), 5, 30)
    const c = clamp(num(sp.get('c')), 200, 1500)
    const r = clamp(num(sp.get('r')), 0.5, 3.5)
    if (h === null && d === null && c === null && r === null) return
    setValues((prev) => ({
      hoursPerDay: h !== null ? Math.round(h) : prev.hoursPerDay,
      daysPerMonth: d !== null ? Math.round(d) : prev.daysPerMonth,
      avgCheck: c !== null ? Math.round(c / 25) * 25 : prev.avgCheck,
      ridesPerHour: r !== null ? Math.round(r * 10) / 10 : prev.ridesPerHour,
    }))
  }, [])

  useEffect(() => {
    return () => {
      if (sharedTimerRef.current) clearTimeout(sharedTimerRef.current)
    }
  }, [])

  const recalc = useCallback(async (v: typeof DEFAULTS) => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setLoading(true)
    try {
      const r = await fetch('/api/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
        signal: ac.signal,
      })
      const d = (await r.json()) as CalculatorResult
      setResult(d)
    } catch {
      /* aborted or network error — keep old result */
    } finally {
      if (!ac.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    recalc(values)
  }, [values, recalc])

  const chartData = result
    ? [
        { name: 'Валовый оборот', value: result.grossMonthly, fill: '#a1a1aa' },
        { name: 'На Яндексе', value: result.yandex.monthly, fill: '#f43f5e' },
        { name: 'ПРЯМО 8%', value: result.pryamoPayg.monthly, fill: '#34d399' },
        { name: 'ПРЯМО Pro', value: result.pryamoPro.monthly, fill: '#059669' },
      ]
    : []

  const onShare = useCallback(async () => {
    const u = new URL(window.location.href)
    u.search = `?h=${values.hoursPerDay}&d=${values.daysPerMonth}&c=${values.avgCheck}&r=${values.ridesPerHour}`
    u.hash = '#calc'
    const url = u.toString()
    const text = result
      ? `Мой расчёт: ${values.hoursPerDay} ч × ${values.daysPerMonth} дн, чек ${values.avgCheck} ₽ — на ПРЯМО Pro ${rub(result.pryamoPro.monthly)} против ${rub(result.yandex.monthly)} у монополии (+${rub(result.diffMonthly)} в месяц). Посчитай свой:`
      : 'Посчитай, сколько ты теряешь на комиссии такси:'
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'ПРЯМО — калькулятор дохода водителя', text, url })
      } catch {
        /* пользователь отменил шторку — ничего не делаем */
      }
    } else {
      await copyText(url)
    }
    setShared(true)
    if (sharedTimerRef.current) clearTimeout(sharedTimerRef.current)
    sharedTimerRef.current = setTimeout(() => setShared(false), 2600)
  }, [values, result])

  const onReset = useCallback(() => {
    setValues(DEFAULTS)
  }, [])

  return (
    <section id="calc" className="scroll-mt-20 bg-zinc-950 py-20 text-zinc-100 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <CalcIcon className="h-3.5 w-3.5" />
            Калькулятор убытков монополии
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Сколько вы отдаёте за право возить людей
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Подвигайте ползунки под свой график. Модель Яндекса: эффективная комиссия ~40% (номинал
            24% + волатильность + опции). Модель ПРЯМО: 8% или подписка.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Панель управления */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur"
          >
            {SLIDERS.map((s) => (
              <div key={s.key}>
                <div className="mb-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                    <s.icon className="h-4 w-4 text-emerald-400" />
                    {s.label}
                  </label>
                  <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-sm font-bold tabular-nums text-emerald-300">
                    {s.format(values[s.key])}
                  </span>
                </div>
                <Slider
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={[values[s.key]]}
                  onValueChange={([v]) => setValues((prev) => ({ ...prev, [s.key]: v }))}
                  aria-label={s.label}
                  className="[&_[data-slot=slider-range]]:bg-emerald-500"
                />
                <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
                  <span>{s.format(s.min)}</span>
                  <span>{s.format(s.max)}</span>
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                <Crown className="h-4 w-4" />
                Точка безразличия Pro
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                {result ? (
                  <>
                    Подписка выгоднее 8% при обороте от{' '}
                    <strong className="text-emerald-300">{rub(result.proBreakEven)}</strong> в месяц.
                    При ваших настройках оборот{' '}
                    <strong className="text-white">{rub(result.grossMonthly)}</strong> —{' '}
                    {result.grossMonthly >= result.proBreakEven ? (
                      <span className="font-bold text-emerald-300">берите Pro</span>
                    ) : (
                      <span className="font-bold text-amber-300">пока платите 8%</span>
                    )}
                    .
                  </>
                ) : (
                  'Считаем…'
                )}
              </p>
            </div>
          </motion.div>

          {/* Результаты */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {result ? (
                <>
                  <ResultCard
                    label="На Яндексе"
                    sub={result.yandex.commissionRate}
                    value={rub(result.yandex.monthly)}
                    tone="yandex"
                  />
                  <ResultCard
                    label="ПРЯМО Pro"
                    sub={result.pryamoPro.commissionRate}
                    value={rub(result.pryamoPro.monthly)}
                    tone="pryamo"
                  />
                  <ResultCard
                    label="Разница в месяц"
                    sub={`+${result.diffPercent.toLocaleString('ru-RU')}% · ${result.ridesPerMonth} поездок`}
                    value={`${rub(result.diffMonthly, { sign: true })}`}
                    tone="diff"
                  />
                </>
              ) : (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl bg-zinc-800/60" />)
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                  Доход в месяц, ₽
                </h3>
                {loading && <span className="text-xs text-emerald-400">пересчёт…</span>}
              </div>
              <div className="h-72">
                {result && <CalculatorChart data={chartData} />}
              </div>
            </div>

            {result && (
              <>
                <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-rose-500/25 bg-gradient-to-r from-rose-500/10 to-transparent p-5 sm:flex-row">
                  <div>
                    <p className="text-sm text-zinc-400">
                      За год монополия заберёт у вас (при тех же настройках):
                    </p>
                    <p className="text-2xl font-black tabular-nums text-rose-400">
                      {rub(result.yandex.lostYearly)}
                    </p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-sm text-zinc-400">Годовая разница с ПРЯМО Pro:</p>
                    <p className="text-2xl font-black tabular-nums text-emerald-400">
                      {rub(result.diffYearly, { sign: true })}
                    </p>
                  </div>
                </div>

                {/* Виральность: поделиться расчётом + сброс */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={onShare}
                    className={cn(
                      'inline-flex h-11 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-all active:scale-[0.98]',
                      shared
                        ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                        : 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:border-amber-300 hover:bg-amber-400/20'
                    )}
                    aria-live="polite"
                  >
                    {shared ? (
                      <>
                        <Check className="h-4 w-4" strokeWidth={2.6} />
                        Ссылка скопирована
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4" />
                        Поделиться расчётом
                      </>
                    )}
                  </button>
                  <button
                    onClick={onReset}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 text-sm font-semibold text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 active:scale-[0.98]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Сбросить
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function ResultCard({
  label,
  sub,
  value,
  tone,
}: {
  label: string
  sub: string
  value: string
  tone: 'yandex' | 'pryamo' | 'diff'
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 backdrop-blur transition-transform hover:-translate-y-0.5',
        tone === 'yandex' && 'border-rose-500/30 bg-rose-500/8',
        tone === 'pryamo' && 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/10',
        tone === 'diff' && 'border-amber-400/30 bg-amber-400/8'
      )}
    >
      <p
        className={cn(
          'text-xs font-bold uppercase tracking-wider',
          tone === 'yandex' && 'text-rose-300',
          tone === 'pryamo' && 'text-emerald-300',
          tone === 'diff' && 'text-amber-300'
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-2 text-2xl font-black tabular-nums tracking-tight sm:text-3xl',
          tone === 'yandex' && 'text-rose-400',
          tone === 'pryamo' && 'text-emerald-400',
          tone === 'diff' && 'text-amber-300'
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] text-zinc-500">{sub}</p>
    </div>
  )
}
