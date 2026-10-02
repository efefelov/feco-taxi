'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

export interface ForecastPoint {
  hour: number
  label: string
  demand: number
}

/**
 * Диаграмма «Спрос по часам». Вынесена в отдельный модуль и
 * подгружается динамически: recharts не попадает в первый бандл.
 */
export function ForecastChart({ data, nowHour }: { data: ForecastPoint[]; nowHour: number | null }) {
  return (
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
            x={data[nowHour]?.label}
            stroke="#facc15"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
