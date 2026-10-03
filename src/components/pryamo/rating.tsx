'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Scale, History, Layers, Sigma } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Демонстрация честного рейтинга.
 * Старая модель: среднее арифметическое, где 1★ тянет рейтинг вниз непропорционально.
 * Новая: медиана по последним N оценкам с затуханием веса + защита от выброса.
 */
function simulateOld(ratings: number[]): number {
  return ratings.reduce((a, b) => a + b, 0) / ratings.length
}

function simulateNew(ratings: number[]): number {
  // Медиана последних 30 оценок + байесовское сглаживание к 4.85 (уверенность по числу поездок)
  const recent = ratings.slice(0, 30)
  const sorted = [...recent].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  const w = Math.min(1, sorted.length / 30) // вес собственного рейтинга
  return median * w + 4.85 * (1 - w)
}

const AXES = [
  { key: 'punctuality', label: 'Пунктуальность', hint: 'приехал вовремя' },
  { key: 'driving', label: 'Вождение', hint: 'плавно и безопасно' },
  { key: 'comfort', label: 'Комфорт', hint: 'температура, музыка, тишина' },
  { key: 'cleanliness', label: 'Чистота', hint: 'салон и запах' },
] as const

export function RatingSection() {
  // история: 96% пятёрок, 3% четвёрок, 1% прочего — реалистичное распределение
  // Детерминированный PRNG (mulberry32) — одинаковые значения на SSR и клиенте
  const [history] = useState<number[]>(() => {
    let seed = 20240517
    const rnd = () => {
      seed |= 0
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    const h: number[] = []
    for (let i = 0; i < 120; i++) {
      const r = rnd()
      if (r < 0.93) h.push(5)
      else if (r < 0.97) h.push(4)
      else h.push(3)
    }
    return h
  })
  const [badStar, setBadStar] = useState(false)

  const withBad = badStar ? [1, ...history] : history
  const oldBefore = simulateOld(history)
  const oldAfter = simulateOld(withBad)
  const newBefore = simulateNew(history)
  const newAfter = simulateNew(withBad)

  return (
    <section id="rating" className="scroll-mt-20 bg-zinc-50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
            <Scale className="h-3.5 w-3.5" />
            Рейтинг 2.0
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            Одна звезда не должна рушить репутацию
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            У монополиста водитель с рейтингом 4,90 получает несправедливую единицу — и «падает в
            карточке качества». Нажмите кнопку и посмотрите, что делает та же единица у нас.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Симулятор */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-200/40"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Водитель: 120 оценок, 93% — пятёрки</h3>
                <p className="text-sm text-zinc-500">Нажмите, чтобы пассажир поставил несправедливую 1★</p>
              </div>
            </div>

            <button
              onClick={() => setBadStar((v) => !v)}
              className={cn(
                'mt-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-5 text-base font-bold transition-all',
                badStar
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100'
              )}
            >
              {badStar ? 'Убрать несправедливую оценку' : 'Поставить несправедливую 1★'}
              <Star className={cn('h-5 w-5', badStar ? 'fill-emerald-500 text-emerald-500' : 'fill-rose-400 text-rose-400')} />
            </button>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className={cn('rounded-xl border p-4 transition-all', badStar ? 'border-rose-300 bg-rose-50/60' : 'border-zinc-200')}>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Рейтинг у монополиста
                </p>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className={cn('text-4xl font-black tabular-nums transition-colors', badStar ? 'text-rose-500' : 'text-zinc-800')}>
                    {(badStar ? oldAfter : oldBefore).toFixed(2)}
                  </span>
                  {badStar && (
                    <span className="rounded-lg bg-rose-100 px-2 py-1 text-sm font-bold tabular-nums text-rose-600">
                      −{(oldBefore - oldAfter).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-rose-400 transition-all duration-500"
                    style={{ width: `${((badStar ? oldAfter : oldBefore) / 5) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs leading-snug text-zinc-500">
                  Среднее арифметическое: одна 1★ отменяет ~10 пятёрок
                </p>
              </div>

              <div className={cn('rounded-xl border p-4 transition-all', badStar ? 'border-emerald-300 bg-emerald-50/60' : 'border-zinc-200')}>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Рейтинг ПРЯМО 2.0
                </p>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-4xl font-black tabular-nums text-emerald-600">
                    {(badStar ? newAfter : newBefore).toFixed(2)}
                  </span>
                  {badStar && (
                    <span className="rounded-lg bg-emerald-100 px-2 py-1 text-sm font-bold tabular-nums text-emerald-700">
                      −{(newBefore - newAfter).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${((badStar ? newAfter : newBefore) / 5) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs leading-snug text-zinc-500">
                  Медиана + сглаживание по числу поездок: выброс поглощён
                </p>
              </div>
            </div>
          </motion.div>

          {/* Принципы */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            {[
              {
                icon: Layers,
                title: 'Многомерность вместо одной цифры',
                text: 'Пунктуальность, вождение, комфорт, чистота — раздельные оси. «4,6» ничего не значит; «чистота 4,9, вождение 4,2» — конкретика, с которой водитель может работать.',
              },
              {
                icon: Sigma,
                title: 'Медиана вместо среднего',
                text: 'Среднее арифметическое позволяет одной единице уничтожить десять пятёрок. Медиана устойчива к выбросам — это базовая статистика, которой монополист пренебрегает.',
              },
              {
                icon: History,
                title: 'Затухание 90 дней',
                text: 'Оценка двухлетней давности ничего не говорит о водиле сегодня. Каждые 90 дней вес старых оценок падает вдвое — рейтинг живёт вместе с водителем.',
              },
              {
                icon: Scale,
                title: 'Вес по числу поездок',
                text: 'У водителя с 10 000 поездок байесовское сглаживание защищает от любого всплеска. Новичок стартует с нейтрального 4,85 и быстро зарабатывает свою репутацию.',
              },
            ].map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <span className="shrink-0 rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                  <p.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-zinc-900">{p.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">{p.text}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Оси рейтинга */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {AXES.map((a) => (
            <div key={a.key} className="rounded-2xl border border-zinc-200 bg-white p-5 text-center shadow-sm">
              <div className="flex justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-2 font-bold text-zinc-900">{a.label}</p>
              <p className="text-xs text-zinc-500">{a.hint}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
