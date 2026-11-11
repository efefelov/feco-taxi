import { NextRequest, NextResponse } from 'next/server'
import { computeCalculator, type CalculatorInput } from '@/lib/pryamo/calculator-core'

/**
 * Калькулятор сравнения дохода: ПРЯМО vs Яндекс Такси
 *
 * Модель Яндекса (по данным судебной практики, отзывов, РОСАКАДЕМТРАНС):
 *  - номинальная комиссия 24%, волатильность до 37%
 *  - плюс «опции»/услуги таксопарков/платные подписки парков: фактические потери 30–50%
 *  - средневзвешенно берём 40% (оптимистично-консервативно)
 *  - чаевые: часть съедается экосистемой
 *
 * Модель ПРЯМО:
 *  - Pro-подписка: 2 490 ₽/мес, комиссия 0%
 *  - Без подписки: комиссия 12% фикс
 *  - Чаевые 100% водителю
 *
 * Сам расчёт живёт в calculator-core.ts — тот же код работает как
 * офлайн-фолбэк на статик-проде.
 */
export async function POST(req: NextRequest) {
  try {
    let body: CalculatorInput = {}
    try {
      body = (await req.json()) as CalculatorInput
    } catch {
      // пустое/битое тело — работаем на дефолтах
      body = {}
    }

    return NextResponse.json(computeCalculator(body))
  } catch (e) {
    console.error('POST /api/calculator error:', e)
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
}
