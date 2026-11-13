import type { ZoneDTO } from '@/lib/pryamo/types'

/**
 * Оценка зоны подачи по строке адреса — для живого индикатора спроса
 * в форме заказа пассажира (движок шлёт demand:state каждые ~5 секунд).
 *
 * Зеркалит логику движка (resolveAddress): точное/префиксное совпадение улицы.
 * Отличия намеренные и в пользу смысла: «аэропорт…» и «…вокзал» — магниты
 * спроса, незнакомый адрес стабильно хэшируется в одну зону (чип не прыгает).
 */

const ZONE_IDS = ['center', 'north', 'south', 'west', 'east', 'airport'] as const

export type PickupZoneId = (typeof ZONE_IDS)[number]

/** Улицы по зонам — зеркало таблицы движка (мини-сервис ride-engine) */
const STREETS: Record<Exclude<PickupZoneId, 'airport'>, string[]> = {
  center: [
    'ул. тверская',
    'ленинский пр-т',
    'ул. петровка',
    'кузнецкий мост',
    'ул. никольская',
    'рождественский б-р',
    'ул. ильинка',
    'театральный пр-д',
    'ул. хохловка',
    'ул. маросейка',
    'ул. солянка',
    'неглинная ул.',
  ],
  north: [
    'ленинградское ш.',
    'ул. правды',
    'ул. расплетина',
    'дмитровское ш.',
    'ул. мишина',
    'просп. мира',
    'ул. академика королёва',
    'огородный пр-д',
    'ул. хачатуряна',
    'селезнёвская ул.',
    'ул. достоевского',
    'тихвинская ул.',
  ],
  south: [
    'варшавское ш.',
    'ул. академика янгеля',
    'липецкая ул.',
    'ул. бакинская',
    'каширское ш.',
    'борисовские пруды',
    'ул. ключевая',
    'ореховый б-р',
    'шипиловская ул.',
    'ул. лебедянская',
    'ул. маршала захарова',
    'задонский пр-д',
  ],
  west: [
    'кутузовский пр-т',
    'ул. крылатская',
    'можайское ш.',
    'ул. мосфильмовская',
    'ул. барклая',
    'ул. нежинская',
    'рублёвское ш.',
    'ул. рогова',
    'аменьевское ш.',
    'ул. лобачевского',
    'багратионовский пр-д',
    'ул. 1812 года',
  ],
  east: [
    'щёлковское ш.',
    'перовская ул.',
    'ш. энтузиастов',
    'сиреневый б-р',
    'ул. первомайская',
    'измайловский пр-т',
    'ул. верхняя первомайская',
    'семёновский вал',
    'ул. металлургов',
    'большая черкизовская ул.',
    'ул. преображенская',
    'никитинская ул.',
  ],
}

/** Хэш строки → стабильное число 0..1 (тот же FNV-1a, что в city-map) */
function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

/** Зона подачи по адресу: якоря → улицы движка → стабильный хэш */
export function resolvePickupZoneId(label: string): PickupZoneId {
  const norm = label.trim().toLowerCase()
  if (norm.length === 0) return 'center'
  // смысловые якоря спроса: аэропорт и вокзалы
  if (norm.includes('аэропорт')) return 'airport'
  if (norm.includes('вокзал')) return 'center'
  if (norm.length >= 4) {
    for (const zone of ZONE_IDS) {
      const list = zone === 'airport' ? null : STREETS[zone]
      if (!list) continue
      for (const st of list) {
        if (norm.startsWith(st) || st.startsWith(norm)) return zone
      }
    }
  }
  return ZONE_IDS[Math.floor(hash01(norm) * ZONE_IDS.length)]
}

export interface PickupDemand {
  zoneId: PickupZoneId
  name: string
  /** Спрос зоны, 0..100 */
  demand: number
  /** Коэффициент спроса, 1..1,5 (кап движка) */
  surge: number
  /** Заказов ждут в зоне прямо сейчас */
  ordersWaiting: number
  /** Свободных водителей в зоне */
  waitingDrivers: number
}

/** Текущее состояние спроса для зоны подачи пассажира. null — данных ещё нет. */
export function pickupDemand(zones: ZoneDTO[], label: string): PickupDemand | null {
  if (zones.length === 0) return null
  const zoneId = resolvePickupZoneId(label)
  const z = zones.find((x) => x.id === zoneId)
  if (!z || !Number.isFinite(z.surge)) return null
  return {
    zoneId,
    name: z.name,
    demand: z.demand,
    surge: Math.min(1.5, Math.max(1, z.surge)),
    ordersWaiting: z.ordersWaiting,
    waitingDrivers: z.waitingDrivers,
  }
}

/** «1,3» / «1,13» / «1,5» — русская запятая, без лишних нулей */
export function surgeLabel(surge: number): string {
  return surge.toFixed(2).replace(/\.?0+$/, '').replace('.', ',')
}
