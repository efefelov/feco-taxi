'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { rub } from '@/lib/pryamo/format'

export interface CalculatorChartRow {
  name: string
  value: number
  fill: string
}

/**
 * Диаграмма калькулятора дохода. Вынесена в отдельный модуль и
 * подгружается динамически: recharts не попадает в первый бандл.
 */
export function CalculatorChart({ data }: { data: CalculatorChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 24, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#a1a1aa', fontSize: 12 }}
          axisLine={{ stroke: '#3f3f46' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#a1a1aa', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${Math.round(v / 1000)}к`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{
            background: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: 12,
            color: '#fafafa',
          }}
          formatter={(value) => [rub(Number(value)), 'Доход']}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={72}>
          <LabelList
            dataKey="value"
            position="top"
            formatter={(v: number) => `${Math.round(v / 1000)}к ₽`}
            style={{ fill: '#d4d4d8', fontSize: 11, fontWeight: 700 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
