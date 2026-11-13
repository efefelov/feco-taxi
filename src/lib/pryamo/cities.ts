/**
 * Межгород: реальные расстояния между узнаваемыми городами.
 *
 * Демо-адреса внутри города считаются хэшем (3–25 км), но если пассажир
 * пишет «Санкт-Петербург → Москва» — расстояние обязано быть настоящим,
 * иначе ценообразование ломается (1240 ₽ за 700 км — разорение водителей).
 *
 * Хранение: расстояние каждого города от СПб; межгород = модуль разности
 * (СПб→Москва 700, Москва→Казань 800, Новгород→Псков 90 — с точностью,
 * достаточной для прототипа).
 */

export interface CityRef {
  /** Варианты написания (в нижнем регистре), ищем подстрокой в адресе */
  names: string[]
  /** Расстояние от Санкт-Петербурга, км */
  kmFromSpb: number
}

export const CITIES: CityRef[] = [
  { names: ['санкт-петербург', 'спб', 'петербург'], kmFromSpb: 0 },
  { names: ['москва', 'мск'], kmFromSpb: 700 },
  { names: ['великий новгород', 'новгород'], kmFromSpb: 180 },
  { names: ['псков'], kmFromSpb: 270 },
  { names: ['тверь'], kmFromSpb: 540 },
  { names: ['петрозаводск'], kmFromSpb: 410 },
  { names: ['выборг'], kmFromSpb: 130 },
  { names: ['мурманск'], kmFromSpb: 1300 },
  { names: ['хельсинки'], kmFromSpb: 400 },
  { names: ['казань'], kmFromSpb: 1500 },
  { names: ['нижний новгород'], kmFromSpb: 1100 },
  { names: ['воронеж'], kmFromSpb: 1200 },
  { names: ['ярославль'], kmFromSpb: 850 },
  { names: ['смоленск'], kmFromSpb: 1000 },
  { names: ['калуга'], kmFromSpb: 850 },
  { names: ['рязань'], kmFromSpb: 950 },
  { names: ['владимир'], kmFromSpb: 950 },
  { names: ['краснодар'], kmFromSpb: 2100 },
  { names: ['сочи'], kmFromSpb: 2400 },
  { names: ['екатеринбург'], kmFromSpb: 2300 },
  { names: ['самара'], kmFromSpb: 1700 },
  { names: ['уфа'], kmFromSpb: 2100 },
  { names: ['минск'], kmFromSpb: 1100 },
]

/** Найти город в строке адреса (первое совпадение) */
export function findCity(label: string): CityRef | null {
  const norm = label.trim().toLowerCase()
  if (!norm) return null
  for (const city of CITIES) {
    for (const name of city.names) {
      if (norm.includes(name)) return city
    }
  }
  return null
}

/** Межгород: расстояние между двумя узнаваемыми городами, null — не межгород */
export function intercityKm(from: string, to: string): number | null {
  const a = findCity(from)
  const b = findCity(to)
  if (!a || !b) return null
  const km = Math.abs(a.kmFromSpb - b.kmFromSpb)
  return km >= 50 ? km : null // «Москва → Мытищи» не межгород
}

/** Длительность межгородской поездки: трасса ~85 км/ч + отдых каждые ~4 часа */
export function intercityDurationMin(km: number): number {
  return Math.round((km / 85) * 60 + (km / 400) * 30)
}
