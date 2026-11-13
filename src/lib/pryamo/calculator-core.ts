import type { CalculatorResult } from '@/lib/pryamo/types'

/**
 * Логика калькулятора «ПРЯМО vs Яндекс» — одна функция для API-роута
 * и офлайн-фолбэка на статик-проде (GitHub Pages), чтобы числа нигде
 * не расходились.
 */

export interface CalculatorInput {
  hoursPerDay?: number
  daysPerMonth?: number
  avgCheck?: number
  ridesPerHour?: number
}

function clamp(v: number, min: number, max: number) {
  if (Number.isNaN(v)) return min
  return Math.min(Math.max(v, min), max)
}

export function computeCalculator(body: CalculatorInput): CalculatorResult {
  const hoursPerDay = clamp(body.hoursPerDay ?? 10, 2, 16)
  const daysPerMonth = clamp(body.daysPerMonth ?? 24, 5, 31)
  const avgCheck = clamp(body.avgCheck ?? 450, 150, 3000)
  const ridesPerHour = clamp(body.ridesPerHour ?? 1.8, 0.5, 4)

  const ridesPerMonth = Math.round(hoursPerDay * ridesPerHour * daysPerMonth)
  const grossMonthly = ridesPerMonth * avgCheck

  /**
   * Яндекс: модель по РЕАЛЬНЫМ чекам смены (YouPiter.Taxi, СПб, комфорт/комфорт+,
   * 2023 г.в., ноябрь 2026 — проверена на трёх выгрузках, сходится до десятых):
   *  - плавающая доля парка: касса за смену до ~19 тыс. → парк берёт 30%,
   *    19–22 тыс. → 25%, свыше 22 тыс. → 20% (пт-сб пороги выше — берём усреднённую шкалу);
   *  - комиссия агрегатора ~24% кассы — ПОВЕРХ доли парка;
   *  - налог (НПД) ~4% и «прочее» ~3% кассы.
   * Итог: водителю остаётся 39–49% кассы ДО ГСМ (в реальных чеках 38,7% / 45,9% / 49,5%
   * без ГСМ; чек с заправкой через Яндекс.Заправки — 35,3%). Формула сходится на всех
   * трёх чеках: 14503 → 5656 ₽, 22155 → 7975 ₽, 19738 → 9172 ₽.
   */
  const shiftGross = grossMonthly / daysPerMonth
  const parkShare = shiftGross >= 22000 ? 0.2 : shiftGross >= 19000 ? 0.25 : 0.3
  const aggregatorShare = 0.24
  const taxShare = 0.04
  const miscShare = 0.03
  const yandexLoss = parkShare + aggregatorShare + taxShare + miscShare // 0.51–0.61
  const yandexMonthly = grossMonthly * (1 - yandexLoss)

  // ПРЯМО с подпиской Pro
  const proPrice = 2490
  const pryamoProMonthly = grossMonthly - proPrice

  // ПРЯМО без подписки (12%)
  const pryamoPaygMonthly = grossMonthly * 0.88

  const diffMonthly = pryamoProMonthly - yandexMonthly
  const diffYearly = diffMonthly * 12
  const diffPercent = yandexMonthly > 0 ? (diffMonthly / yandexMonthly) * 100 : 0

  // Точка безразличия подписки: gross где 12% == 2 490 ₽
  const proBreakEven = Math.round(proPrice / 0.12 / 100) * 100 // ~20 800 ₽/мес оборота

  return {
    input: { hoursPerDay, daysPerMonth, avgCheck, ridesPerHour },
    ridesPerMonth,
    grossMonthly: Math.round(grossMonthly),
    yandex: {
      commissionRate: 'парк 20–30% (плавает) + агрегатор ~24% + налог ~4% — по реальным чекам',
      monthly: Math.round(yandexMonthly),
      yearly: Math.round(yandexMonthly * 12),
      lostYearly: Math.round(grossMonthly * yandexLoss * 12),
    },
    pryamoPro: {
      commissionRate: '0% (подписка 2 490 ₽/мес)',
      monthly: Math.round(pryamoProMonthly),
      yearly: Math.round(pryamoProMonthly * 12),
    },
    pryamoPayg: {
      commissionRate: '12% фикс',
      monthly: Math.round(pryamoPaygMonthly),
      yearly: Math.round(pryamoPaygMonthly * 12),
    },
    diffMonthly: Math.round(diffMonthly),
    diffYearly: Math.round(diffYearly),
    diffPercent: Math.round(diffPercent),
    proBreakEven,
  }
}
