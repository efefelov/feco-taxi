'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BadgeRussianRuble, Car, Gauge, MapPin, ShieldCheck, ArrowRight } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import type { Tariff } from '@/lib/pryamo/types'
import { estimatePrice, rub } from '@/lib/pryamo/format'
import { cn } from '@/lib/utils'

const FALLBACK: Tariff[] = [
  { id: 'eco', name: 'Эконом', description: 'Быстро и недорого. Фикс цены до конца поездки.', multiplier: 1.0, baseFare: 79, perKm: 14, perMin: 6, carClass: 'Kia Rio, Hyundai Solaris, VW Polo', sortOrder: 1 },
  { id: 'comfort', name: 'Комфорт', description: 'Свежие машины, климат-контроль, максимум 4 года возраст.', multiplier: 1.35, baseFare: 129, perKm: 18, perMin: 7, carClass: 'Toyota Camry, Skoda Octavia', sortOrder: 2 },
  { id: 'comfort-plus', name: 'Комфорт+', description: 'Просторные салоны, вода, зарядки USB-C.', multiplier: 1.7, baseFare: 169, perKm: 21, perMin: 8, carClass: 'Toyota Camry 3.5, Kia K5', sortOrder: 3 },
  { id: 'business', name: 'Бизнес', description: 'Премиум-класс. Дресс-код водителя, встреча с табличкой.', multiplier: 2.4, baseFare: 299, perKm: 30, perMin: 12, carClass: 'Mercedes E, BMW 5, Audi A6', sortOrder: 4 },
  { id: 'van', name: 'Минивэн', description: 'До 6 пассажиров, багаж, детские кресла без доплаты.', multiplier: 1.5, baseFare: 149, perKm: 19, perMin: 8, carClass: 'VW Caravelle, Hyundai H-1', sortOrder: 5 },
  { id: 'intercity', name: 'Межгород', description: 'Поездки между городами. Цена за всю машину целиком.', multiplier: 1.0, baseFare: 0, perKm: 34, perMin: 0, carClass: 'Любой класс', sortOrder: 6 },
]

/** Длительность поездки по скорости города: ~27 км/ч + 3 мин на подачу/прогрев */
function estimateDuration(distanceKm: number): number {
  return Math.max(4, Math.round(distanceKm / 27 * 60 + 3))
}

/** Глобальное событие: выбрать класс в демо пассажира (из секции тарифов) */
function pickTariffInDemo(id: string) {
  window.dispatchEvent(new CustomEvent('pryamo:tariff-pick', { detail: { id } }))
  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function TariffsSection() {
  const [tariffs, setTariffs] = useState<Tariff[] | null>(null)
  const [distance, setDistance] = useState(9)

  useEffect(() => {
    fetch('/api/tariffs')
      .then((r) => r.json())
      .then((d) => setTariffs(Array.isArray(d.tariffs) && d.tariffs.length ? d.tariffs : FALLBACK))
      .catch(() => setTariffs(FALLBACK))
  }, [])

  const duration = useMemo(() => estimateDuration(distance), [distance])
  const data = tariffs ?? FALLBACK

  return (
    <section id="tariffs" className="scroll-mt-20 bg-zinc-50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
            <BadgeRussianRuble className="h-3.5 w-3.5" />
            Прайс, который не плавает
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            Тарифы из оферты, а не из алгоритма
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Формула каждой цены — на виду. Подвиньте расстояние: цена в карточках
            посчитается по формуле тарифа. Что увидели — то и заплатили: пересчётов
            «по факту» не существует.
          </p>
        </motion.div>

        {/* Симулятор поездки */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mx-auto mt-10 max-w-3xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-200/50 sm:p-6"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <label htmlFor="tariff-distance" className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <MapPin className="h-4 w-4 text-emerald-600" aria-hidden />
                  Поездка на{' '}
                  <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-base font-black tabular-nums text-emerald-700">
                    {distance} км
                  </span>
                </label>
                <span className="flex items-center gap-1 text-xs font-medium text-zinc-500">
                  <Gauge className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                  ~{duration} мин в пути
                </span>
              </div>
              <Slider
                id="tariff-distance"
                className="mt-4"
                min={1}
                max={40}
                step={1}
                value={[distance]}
                onValueChange={(v) => setDistance(v[0] ?? distance)}
                aria-label="Расстояние поездки в километрах"
              />
              <p className="mt-2 text-xs text-zinc-400">
                Длительность оцениваем по скорости города ~27 км/ч. Для межгорода
                тариф считается только по километрам.
              </p>
            </div>
            <div className="shrink-0 rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-5 py-3.5 text-center sm:w-44">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                Кап коэффициента
              </p>
              <p className="mt-0.5 text-2xl font-black tabular-nums text-emerald-700">×1,5</p>
              <p className="text-[11px] text-emerald-600/80">виден до заказа</p>
            </div>
          </div>
        </motion.div>

        {/* Сетка тарифов */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(tariffs === null ? Array.from({ length: 6 }) : data).map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              className="h-full"
            >
              {t === undefined ? (
                <Skeleton className="h-72 rounded-2xl" />
              ) : (
                <TariffCard tariff={t as Tariff} distanceKm={distance} durationMin={duration} />
              )}
            </motion.div>
          ))}
        </div>

        {/* Нижняя полоса гарантий */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-600 shadow-sm"
        >
          {[
            'Формула зафиксирована в оферте',
            'Водитель видит выплату до принятия',
            'Пересчёт в пути — нет',
          ].map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
              {s}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function TariffCard({ tariff, distanceKm, durationMin }: { tariff: Tariff; distanceKm: number; durationMin: number }) {
  const price = estimatePrice(tariff, distanceKm, durationMin)
  const payout = Math.round(price * 0.92)
  const isPopular = tariff.id === 'eco'

  const parts: string[] = []
  if (tariff.baseFare > 0) parts.push(`${Math.round(tariff.baseFare)} ₽`)
  if (tariff.perKm > 0) parts.push(`${Math.round(tariff.perKm)} ₽/км`)
  if (tariff.perMin > 0) parts.push(`${Math.round(tariff.perMin)} ₽/мин`)

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-6',
        isPopular
          ? 'border-emerald-300/80 bg-white shadow-md shadow-emerald-100 hover:shadow-emerald-200/70'
          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-zinc-200/60'
      )}
    >
      {isPopular && (
        <span className="absolute -top-2.5 left-5 rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-950 shadow-sm">
          выбирают чаще всего
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-black tracking-tight text-zinc-900">{tariff.name}</h3>
          <p className="mt-1 text-sm leading-snug text-zinc-600">{tariff.description}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold tabular-nums',
            isPopular ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
          )}
        >
          ×{tariff.multiplier.toFixed(2).replace('.', ',')}
        </span>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs leading-snug text-zinc-500">
        <Car className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
        <span>{tariff.carClass}</span>
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {parts.map((p) => (
          <span
            key={p}
            className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600"
          >
            {p}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <div className="rounded-xl bg-zinc-50 p-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-zinc-500">Такая поездка стоит</span>
            <span className="text-2xl font-black tabular-nums tracking-tight text-zinc-900">
              {rub(price)}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2 border-t border-zinc-200/70 pt-1.5">
            <span className="text-xs font-medium text-zinc-500">водитель получит</span>
            <span className="text-sm font-bold tabular-nums text-emerald-700">
              {rub(payout)}
              <span className="ml-1 text-[10px] font-semibold text-emerald-600/70">92%</span>
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[11px] text-zinc-400">Фикс до конца поездки · чаевые сверх цены</p>
          <button
            onClick={() => pickTariffInDemo(tariff.id)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 -m-1 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            aria-label={`Попробовать тариф ${tariff.name} в живом демо`}
          >
            В демо
            <ArrowRight className="h-3 w-3" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
