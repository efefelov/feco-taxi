'use client'

import { useEffect, useState } from 'react'
import { motion, animate, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Microscope, AlertTriangle, CheckCircle2, Minus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { MarketStat } from '@/lib/pryamo/types'
import { cn } from '@/lib/utils'

const FALLBACK: MarketStat[] = [
  { id: 'share', label: 'Доля Яндекс Такси в онлайн-заказе такси РФ', value: 75, unit: '%', hint: 'Монополия по определению ФАС-профиля рынка', source: 'Finam / отчётность Яндекса 2024', tone: 'danger' },
  { id: 'market', label: 'Поездок на такси в России за 2024 год', value: 3.4, unit: 'млрд', hint: 'Рынок стагнирует — конкуренция ценой исчерпана', source: 'Коммерсантъ / Платформа ОФД', tone: 'neutral' },
  { id: 'commission-volatility', label: 'Волатильность комиссии Яндекса', value: 37, unit: '%', hint: 'Комиссия меняется алгоритмом в реальном времени', source: 'РОСАКАДЕМТРАНС', tone: 'danger' },
  { id: 'citymobil', label: 'Падение доли Ситимобил в Москве', value: 97, unit: '%', hint: 'С 28,7% (2020) до 0,86% (2024): второго игрока больше нет', source: 'ecomhub.ru, 2024', tone: 'danger' },
  { id: 'driver-loss', label: 'Фактические потери водителя от агрегатора', value: 40, unit: '%', hint: 'Комиссия 24%+ + опции + услуги парков + штрафы', source: 'Судебная практика, 2024', tone: 'danger' },
  { id: 'our-commission', label: 'Комиссия ПРЯМО — фикс', value: 12, unit: '%', hint: 'Или 0% с подпиской ПРЯМО Pro за 2 490 ₽/мес', source: 'Наша оферта', tone: 'success' },
]

export function MarketSection() {
  const [stats, setStats] = useState<MarketStat[] | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => setStats(d.stats?.length ? d.stats : FALLBACK))
      .catch(() => setStats(FALLBACK))
  }, [])

  const data = stats ?? FALLBACK

  return (
    <section id="problem" className="scroll-mt-20 bg-background py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-600">
            <Microscope className="h-3.5 w-3.5" />
            Монополия под микроскопом
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            75% рынка — это не победа сервиса.
            <br />
            Это налог на каждую поездку
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Данные из открытых источников, судебной практики и отчётности. Каждый пункт — прямое
            следствие отсутствия конкуренции.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(stats === null
            ? Array.from({ length: 6 })
            : data
          ).map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              {s === undefined ? (
                <Skeleton className="h-44 rounded-2xl" />
              ) : (
                <StatCard stat={s as MarketStat} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StatCard({ stat }: { stat: MarketStat }) {
  const valueRef = useRef<HTMLParagraphElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const inView = useInView(cardRef, { once: true, margin: '-60px' })

  const decimals = Number.isInteger(stat.value) ? 0 : 1

  // Count-up: цифра «набегает» при первом появлении карточки в вьюпорте
  useEffect(() => {
    if (!inView || !valueRef.current) return
    const node = valueRef.current
    const controls = animate(0, stat.value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent =
          decimals === 0
            ? Math.round(v).toLocaleString('ru-RU')
            : v.toFixed(decimals).replace('.', ',')
      },
    })
    return () => controls.stop()
  }, [inView, stat.value, decimals])
  const tone =
    stat.tone === 'danger'
      ? 'border-rose-200/70 bg-rose-50/40'
      : stat.tone === 'success'
        ? 'border-emerald-200/70 bg-emerald-50/40'
        : 'border-zinc-200 bg-zinc-50/40'

  const icon =
    stat.tone === 'danger' ? (
      <AlertTriangle className="h-5 w-5 text-rose-500" />
    ) : stat.tone === 'success' ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
    ) : (
      <Minus className="h-5 w-5 text-zinc-500" />
    )

  const valueColor =
    stat.tone === 'danger'
      ? 'text-rose-600'
      : stat.tone === 'success'
        ? 'text-emerald-600'
        : 'text-zinc-800'

  return (
    <div
      ref={cardRef}
      className={cn(
        'group h-full rounded-2xl border p-5 transition-shadow hover:shadow-lg hover:shadow-zinc-200/60',
        tone
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold leading-snug text-zinc-700">{stat.label}</p>
        <span className="shrink-0 rounded-xl bg-white/80 p-2 shadow-sm">{icon}</span>
      </div>
      <p className={cn('mt-3 text-4xl font-black tabular-nums tracking-tight', valueColor)}>
        <span ref={valueRef}>
          {decimals === 0
            ? stat.value.toLocaleString('ru-RU')
            : stat.value.toFixed(decimals).replace('.', ',')}
        </span>
        <span className="ml-1 text-lg font-bold">{stat.unit}</span>
      </p>
      <p className="mt-2 text-sm text-zinc-600">{stat.hint}</p>
      <p className="mt-3 border-t border-zinc-900/5 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        Источник: {stat.source}
      </p>
    </div>
  )
}
