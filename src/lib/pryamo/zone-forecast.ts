import type { ZoneDTO } from '@/lib/pryamo/types'

/**
 * Прогноз спроса по часам — «в 18:00 Восток будет ×1,35, вставай туда к 17:40».
 *
 * Для прототипа кривые детерминированные (по типу зоны): бизнес-пики центра,
 * утренние/вечерние магниты аэропорта, вечерние жилые районы. В реальном движке
 * сюда ляжет история заказов: demand(зона, час) по прошлым неделям + текущий
 * приток запросов. Формула коэффициента единая со всей платформой:
 * ступени 1,0 / 1,2 / 1,35 / 1,5, кап ×1,5, весь коэффициент — водителю.
 */

export type ForecastShift = 0 | 1 | 2

/** Пороги коэффициента — единая шкала платформы */
export function surgeFromDemand(demand: number): number {
  if (demand >= 85) return 1.5
  if (demand >= 65) return 1.35
  if (demand >= 40) return 1.2
  return 1
}

/** Базовый фон зоны днём (без пиков) */
const BASE: Record<string, number> = {
  center: 45,
  north: 28,
  south: 30,
  west: 26,
  east: 34,
  airport: 50,
}

/** Профили пиков: [час, добавка] — форма кривой по типу зоны */
const PEAKS: Record<string, Array<[number, number]>> = {
  // центр: офисные утро+вечер, пятничный отток
  center: [[9, 22], [10, 18], [18, 25], [19, 22], [20, 12]],
  // аэропорт: утренние вылеты и вечерние прилёты, ночью спад
  airport: [[6, 20], [7, 24], [8, 18], [17, 16], [19, 22], [20, 24], [21, 16], [23, 12]],
  // жилые районы: утренний вывоз + вечерний возврат
  north: [[8, 18], [9, 12], [18, 22], [19, 24], [20, 14]],
  south: [[8, 16], [9, 14], [18, 20], [19, 24], [20, 16]],
  west: [[8, 14], [9, 10], [18, 18], [19, 20], [20, 12]],
  east: [[8, 16], [9, 12], [17, 18], [18, 24], [19, 26], [20, 16]],
}

/** Прогноз спроса зоны на заданный час: demand 0..100 и коэффициент по шкале */
export function zoneForecast(zone: ZoneDTO, hour: number): { demand: number; surge: number } {
  const peaks = PEAKS[zone.id] ?? PEAKS.east
  let bump = 0
  for (const [h, v] of peaks) {
    // пик «размазан» на соседний час (60% в пиковый час, 30% в соседние)
    const dist = Math.min(Math.abs(hour - h), Math.abs(hour - h - 24), Math.abs(hour - h + 24))
    if (dist <= 1) bump += v * (dist === 0 ? 1 : 0.45)
  }
  const nightDip = hour >= 2 && hour <= 5 ? 0.55 : 1
  const demand = Math.max(6, Math.min(100, Math.round((BASE[zone.id] ?? 30 + 0) * nightDip + bump)))
  return { demand, surge: surgeFromDemand(demand) }
}

/** Час «сейчас + сдвиг» в формате 0..23 */
export function forecastHour(shift: ForecastShift, now = new Date()): number {
  return (now.getHours() + shift) % 24
}

/** Подпись «сейчас» / «через час · в 18:00» */
export function forecastLabel(shift: ForecastShift, now = new Date()): string {
  if (shift === 0) return 'сейчас'
  const h = forecastHour(shift, now)
  return `через ${shift} ч · в ${String(h).padStart(2, '0')}:00`
}

/** Премиум-зоны: короткие поездки там не бывают убыточными — минимальная цена зоны */
const ZONE_MIN_FARE: Record<string, number> = {
  center: 300,
  airport: 350,
}

export function zoneMinFare(zoneId: string | null | undefined): number | null {
  if (!zoneId) return null
  return ZONE_MIN_FARE[zoneId] ?? null
}

/** Является ли зона премиум-подачей (для бейджа в теплокарте) */
export function isPremiumZone(zoneId: string): boolean {
  return zoneId in ZONE_MIN_FARE
}
