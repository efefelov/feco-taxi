'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
} from 'recharts'
import { Sunrise, Sunset, Clock4, TrendingUp, MoonStar } from 'lucide-react'
import type { ZoneDTO } from '@/lib/pryamo/types'

// Базовый суточный профиль спроса (0..100): ночной провал, утренний пик,
// дневное плато, вечерний пик, спад. Модулируется живым спросом зон.
const BASE_CURVE = [
  14, 9, 6, 5, 7, 14, 26, 44, 68, 82, 86, 74, 58, 50, 46, 48, 57, 72, 84, 88, 78, 58, 38, 22,
]

function hourLabel(h: number): string {
  return `${String(h).padStart(2, '0')}:00`
}

interface Point {
  hour: number
  label: string
  demand: number
}

export function DemandForecast({ zones }: { zones: ZoneDTO[] }) {
  const [nowHour, setNowHour] = useState<number | null>(null)

  // Час берём после маунта — SSR-безопасно (асинхронно, вне рендера)
  useEffect(() => {
    const t = setTimeout(() => setNowHour(new Date().getHours()), 0)
    return () => clearTimeout(t)
  }, [])

  const avgDemand = useMemo(
    () => (zones.length ? zones.reduce((a, z) => a + z.demand, 0) / zones.length : 50),
    [zones]
  )

  const data: Point[] = useMemo(() => {
    // Подмешиваем живой средний спрос, чтобы график «дышал» вместе с картой
    const shift = (avgDemand - 50) * 0.25
    return BASE_CURVE.map((v, h) => ({
      hour: h,
      label: hourLabel(h),
      demand: Math.max(4, Math.min(100, Math.round(v + shift))),
    }))
  }, [avgDemand])

  const peaks = useMemo(() => {
    const morning = data.slice(6, 11)
    const evening = data.slice(16, 22)
    return {
      morning: { max: Math.max(...morning.map((d) => d.demand)) },
      evening: { max: Math.max(...evening.map((d) => d.demand)) },
    }
  }, [data])

  const advice = useMemo(() => {
    const h = nowHour ?? 12
    const v = data[h]?.demand ?? 50
    if (v >= 75)
      return {
        tone: 'hot' as const,
        text: 'Вы в часе пик — заказы идут плотно. Не берите длинные межгород: короткие поездки в пике выгоднее.',
      }
    if (v >= 50)
      return {
        tone: 'good' as const,
        text: 'Рабочий спрос. Хорошее время для средних поездок в Центр и к вокзалам.',
      }
    if (h >= 0 && h <= 5)
      return {
        tone: 'night' as const,
        text: 'Ночь: мало заказов, но высока доля Бизнеса и Аэропорта. Проверьте зону Аэропорта на карте.',
      }
    return {
      tone: 'calm' as const,
      text: 'Спокойный час — лучшее время для перерыва или ТО. До вечернего пика успеете вернуться.',
    }
  }, [nowHour, data])

  const toneClass =
    advice.tone === 'hot'
      ? 'border-rose-500/30 bg-rose-500/8 text-rose-200'
      : advice.tone === 'good'
        ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-200'
        : advice.tone === 'night'
          ? 'border-indigo-0 border-zinc-700 bg-zinc-800/60 text-zinc-300'
          : 'border-amber-400/30 bg-amber-400/8 text-amber-200'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          Спрос по часам
        </h3>
        {nowHour !== null && (
          <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-bold tabular-nums text-zinc-300">
            сейчас {hourLabel(nowHour)}
          </span>
        )}
      </div>

      <div className="mt-4 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={{ stroke: '#3f3f46' }}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}`}
              domain={[0, 100]}
            />
            <Tooltip
              cursor={{ stroke: '#52525b', strokeDasharray: '4 4' }}
              contentStyle={{
                background: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: 12,
                color: '#fafafa',
                fontSize: 12,
              }}
              labelStyle={{ color: '#a1a1aa', fontWeight: 700 }}
              formatter={(value) => [`${value}%`, 'Спрос']}
            />
            <Area
              type="monotone"
              dataKey="demand"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#demandFill)"
              dot={false}
              activeDot={{ r: 4, fill: '#facc15', stroke: '#18181b', strokeWidth: 2 }}
            />
            {nowHour !== null && (
              <ReferenceLine
                x={hourLabel(nowHour)}
                stroke="#facc15"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Пики дня */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-zinc-950/60 p-2.5">
          <Sunrise className="h-4 w-4 shrink-0 text-amber-400" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-white">7:00–10:00</p>
            <p className="text-[10px] text-zinc-500">утренний пик ~{peaks.morning.max}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-zinc-950/60 p-2.5">
          <Sunset className="h-4 w-4 shrink-0 text-amber-400" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-white">17:00–21:00</p>
            <p className="text-[10px] text-zinc-500">вечерний пик ~{peaks.evening.max}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-zinc-950/60 p-2.5">
          <MoonStar className="h-4 w-4 shrink-0 text-zinc-500" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-white">22:00–5:00</p>
            <p className="text-[10px] text-zinc-500">ночь, доля Бизнеса</p>
          </div>
        </div>
      </div>

      {/* Совет */}
      <div className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed ${toneClass}`}>
        <Clock4 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{advice.text}</span>
      </div>

      <p className="mt-2 text-[10px] text-zinc-600">
        Прогноз-модель ПРЯМО: история заказов города по часам, обновляется каждый час. У монополиста
        такой график — платная «аналитика» для избранных.
      </p>
    </motion.div>
  )
}
