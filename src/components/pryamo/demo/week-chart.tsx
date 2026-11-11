'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Banknote } from 'lucide-react'
import { rub } from '@/lib/pryamo/format'
import type { WeekDay } from '@/lib/pryamo/types'

/**
 * График «Доход за неделю: ПРЯМО против монополиста».
 * Вынесен в отдельный модуль и подгружается динамически:
 * recharts не попадает в первый бандл страницы.
 */
export function WeekChart({ week }: { week: WeekDay[] }) {
  const data = week.map((d) => ({
    day: d.isToday ? 'Сегодня' : d.day,
    pryamo: d.payout,
    yandex: d.yandexPayout,
    isToday: d.isToday,
  }))
  const weekGain = week.reduce((s, d) => s + (d.payout - d.yandexPayout), 0)
  const today = data.findIndex((d) => d.isToday)

  return (
    <div className="mt-4 rounded-xl border border-emerald-500/20 bg-zinc-950/50 p-3.5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          <Banknote className="h-3.5 w-3.5 text-emerald-400" />
          Доход за неделю: ПРЯМО против монополиста
        </p>
        <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-black tabular-nums text-emerald-300">
          +{rub(weekGain)} за неделю
        </span>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="wkPryamo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="wkYandex" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={{ stroke: '#3f3f46' }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${Math.round(v / 1000)}к`}
            />
            <Tooltip
              cursor={{ stroke: '#52525b', strokeDasharray: '4 4' }}
              contentStyle={{
                background: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#e4e4e7',
              }}
              formatter={(value: number | string | Array<number | string>, name: string) => {
                const label = name === 'pryamo' ? 'ПРЯМО (12%)' : 'Монополист (−40%)'
                return [rub(Number(value)), label]
              }}
              labelFormatter={() => ''}
            />
            <Area
              type="monotone"
              dataKey="yandex"
              stroke="#f43f5e"
              strokeWidth={1.5}
              fill="url(#wkYandex)"
              name="yandex"
              dot={false}
              activeDot={{ r: 3, fill: '#f43f5e' }}
            />
            <Area
              type="monotone"
              dataKey="pryamo"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#wkPryamo)"
              name="pryamo"
              dot={false}
              activeDot={{ r: 3, fill: '#10b981' }}
            />
            {today >= 0 && (
              <ReferenceDot
                x={data[today].day}
                y={data[today].pryamo}
                r={4}
                fill="#10b981"
                stroke="#064e3b"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
        Красная линия — что забрал бы агрегатор-монополист с того же оборота. Зелёная — ваши деньги
        на ПРЯМО. Разрыв каждую неделю — в вашем кармане.
      </p>
    </div>
  )
}
