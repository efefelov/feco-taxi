/**
 * ПРЯМО ride-engine — WebSocket-сервис живого рынка такси (порт 3003).
 *
 * Независимый мини-сервис (Bun + socket.io), вся симуляция в памяти, без БД.
 * Полный контракт событий описан в /home/z/my-project/worklog.md (часть 3.4).
 *
 * Клиент -> сервер:
 *   driver:join, passenger:join, passenger:book, ride:rate,
 *   driver:accept, driver:decline, driver:go-online, driver:go-offline
 *
 * Сервер -> клиент:
 *   feed:state, orders:new, orders:remove, demand:state, stats:live,
 *   ride:state { ride, hint }, ride:completed, driver:earnings,
 *   driver:online, driver:accept-failed, ride:rated
 *
 * Примечания к DTO:
 *  - RideDTO.driver = null, пока статус 'searching' (водитель ещё не назначен).
 *  - ride:state дополнительно несёт поле hint (строка-подсказка для UI) —
 *    аддитивное расширение контракта, фронтенд может его игнорировать.
 */

import { createServer } from 'http'
import { Server, type Socket } from 'socket.io'

const PORT = 3003 // фиксированный порт по контракту, НЕ из окружения

// ============================== Утилиты ==============================

const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min
const randFloat = (min: number, max: number): number => Math.random() * (max - min) + min
const round1 = (n: number): number => Math.round(n * 10) / 10
const round2 = (n: number): number => Math.round(n * 100) / 100
const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n))
const pick = <T>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)]

function log(msg: string): void {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`)
}

function isObj(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {}
}

function safe(fn: () => void): () => void {
  return () => {
    try {
      fn()
    } catch (err) {
      log(`ошибка обработчика: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}

function safeArg<A>(fn: (arg: A) => void): (arg: A) => void {
  return (arg: A) => {
    try {
      fn(arg)
    } catch (err) {
      log(`ошибка обработчика: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}

// ============================== Типы DTO ==============================

export interface AddressPoint {
  label: string
  zoneId: string
}

export interface TariffRef {
  id: string
  name: string
  multiplier: number
}

export interface OrderDTO {
  id: string
  from: AddressPoint
  to: AddressPoint
  distanceKm: number
  durationMin: number
  tariff: TariffRef
  priceTotal: number
  driverPayout: number
  commissionRub: number
  surge: number
  createdAt: string
  expiresAt: string
  /** Сколько водителей сейчас видят этот заказ в своих лентах (аукцион, а не очередь) */
  watchingDrivers: number
}

export interface ZoneDTO {
  id: string
  name: string
  x: number
  y: number
  demand: number
  surge: number
  waitingDrivers: number
  ordersWaiting: number
  avgWaitMin: number
}

export interface DriverInfo {
  name: string
  initials: string
  car: string
  plate: string
  rating: number
  rides: number
}

export type RideStatus = 'searching' | 'arriving' | 'onboard' | 'completed'

export interface RideDTO {
  id: string
  status: RideStatus
  /** null, пока статус 'searching' — водитель ещё не найден */
  driver: DriverInfo | null
  from: AddressPoint
  to: AddressPoint
  distanceKm: number
  etaMin: number
  progress: number
  priceTotal: number
  driverPayout: number
  tariffName: string
  startedAt: string
}

export interface ReceiptDTO {
  price: number
  driverPayout: number
  commissionRub: number
  tip: number
}

export interface EarningsToday {
  gross: number
  payout: number
  commission: number
  rides: number
  hoursOnline: number
}

/** День недели в истории дохода: оборот, выплата на ПРЯМО и «что дал бы» монополист (−40%) */
export interface WeekDayDTO {
  day: string
  gross: number
  payout: number
  yandexPayout: number
  isToday: boolean
}

export interface LiveStatsDTO {
  activeDrivers: number
  onlineDrivers: number
  ordersPerHour: number
  avgWaitSec: number
  completedToday: number
  grossTodayRub: number
}

// ============================== Зоны ==============================

type ZoneId = 'center' | 'north' | 'south' | 'west' | 'east' | 'airport'

interface ZoneState {
  id: ZoneId
  name: string
  x: number
  y: number
  demand: number // 0..100, случайное блуждание
  surge: number // 1.0..1.5
}

const ZONES: ZoneState[] = [
  { id: 'center', name: 'Центр', x: 500, y: 300, demand: randFloat(45, 75), surge: 1 },
  { id: 'north', name: 'Север', x: 500, y: 100, demand: randFloat(25, 55), surge: 1 },
  { id: 'south', name: 'Юг', x: 500, y: 500, demand: randFloat(25, 55), surge: 1 },
  { id: 'west', name: 'Запад', x: 200, y: 300, demand: randFloat(25, 55), surge: 1 },
  { id: 'east', name: 'Восток', x: 800, y: 300, demand: randFloat(25, 55), surge: 1 },
  { id: 'airport', name: 'Аэропорт', x: 900, y: 80, demand: randFloat(30, 60), surge: 1 },
]

function zoneById(id: string): ZoneState {
  return ZONES.find((z) => z.id === id) ?? ZONES[0]
}

/** surge применяется, когда спрос зоны подачи больше 60 */
function surgeForZone(id: string): number {
  const z = zoneById(id)
  return z.demand > 60 ? round2(z.surge) : 1
}

function tickZones(): void {
  for (const z of ZONES) {
    z.demand = clamp(z.demand + randFloat(-6, 6), 5, 95)
    z.surge = Math.min(1.5, 1 + Math.max(0, z.demand - 60) / 100)
  }
}

function countOrdersFromZone(zoneId: string): number {
  let n = 0
  for (const o of orders.values()) {
    if (o.from.zoneId === zoneId) n += 1
  }
  return n
}

function zoneDTOs(): ZoneDTO[] {
  return ZONES.map((z) => ({
    id: z.id,
    name: z.name,
    x: z.x,
    y: z.y,
    demand: Math.round(z.demand),
    surge: round2(z.surge),
    // водителей на ожидании меньше при высоком спросе (обратная зависимость)
    waitingDrivers: Math.max(2, Math.round(34 - z.demand * 0.3) + randInt(-2, 2)),
    ordersWaiting: countOrdersFromZone(z.id) + Math.round(z.demand / 30),
    avgWaitMin: round1(2 + (z.demand / 100) * 10),
  }))
}

// ============================== Адреса ==============================

interface ZoneAddresses {
  streets: string[]
  fixed?: string[]
}

const ADDRESSES: Record<ZoneId, ZoneAddresses> = {
  center: {
    streets: [
      'ул. Тверская',
      'Ленинский пр-т',
      'ул. Петровка',
      'Кузнецкий Мост',
      'ул. Никольская',
      'Рождественский б-р',
      'ул. Ильинка',
      'Театральный пр-д',
      'ул. Хохловка',
      'ул. Маросейка',
      'ул. Солянка',
      'Неглинная ул.',
    ],
  },
  north: {
    streets: [
      'Ленинградское ш.',
      'ул. Правды',
      'ул. Расплетина',
      'Дмитровское ш.',
      'ул. Мишина',
      'просп. Мира',
      'ул. Академика Королёва',
      'Огородный пр-д',
      'ул. Хачатуряна',
      'Селезнёвская ул.',
      'ул. Достоевского',
      'Тихвинская ул.',
    ],
  },
  south: {
    streets: [
      'Варшавское ш.',
      'ул. Академика Янгеля',
      'Липецкая ул.',
      'ул. Бакинская',
      'Каширское ш.',
      'Борисовские Пруды',
      'ул. Ключевая',
      'Ореховый б-р',
      'Шипиловская ул.',
      'ул. Лебедянская',
      'ул. Маршала Захарова',
      'Задонский пр-д',
    ],
  },
  west: {
    streets: [
      'Кутузовский пр-т',
      'ул. Крылатская',
      'Можайское ш.',
      'ул. Мосфильмовская',
      'ул. Барклая',
      'ул. Нежинская',
      'Рублёвское ш.',
      'ул. Рогова',
      'Аминьевское ш.',
      'ул. Лобачевского',
      'Багратионовский пр-д',
      'ул. 1812 года',
    ],
  },
  east: {
    streets: [
      'Щёлковское ш.',
      'Перовская ул.',
      'ш. Энтузиастов',
      'Сиреневый б-р',
      'ул. Первомайская',
      'Измайловский пр-т',
      'ул. Верхняя Первомайская',
      'Семёновский вал',
      'ул. Металлургов',
      'Большая Черкизовская ул.',
      'ул. Преображенская',
      'Никитинская ул.',
    ],
  },
  airport: {
    streets: [],
    fixed: [
      'Аэропорт Кольцово, терминал A',
      'Аэропорт Кольцово, терминал B',
      'Аэропорт Кольцово, терминал C',
      'Аэропорт Кольцово, VIP-терминал',
      'Аэропорт Кольцово, привокзальная пл.',
      'Аэропорт Кольцово, парковка P1',
      'Аэропорт Кольцово, парковка P2',
      'Аэропорт Кольцово, парковка P4',
      'Аэропорт Кольцово, зона прилёта',
      'Аэропорт Кольцово, зона вылета',
      'Аэропорт Кольцово, камера хранения',
      'Аэропорт Кольцово, гостиница',
    ],
  },
}

function pickAddressFor(zone: ZoneState): AddressPoint {
  const a = ADDRESSES[zone.id]
  if (a.fixed && a.fixed.length > 0) {
    return { label: pick(a.fixed), zoneId: zone.id }
  }
  // случайная комбинация «улица + номер дома»
  return { label: `${pick(a.streets)}, ${randInt(1, 90)}`, zoneId: zone.id }
}

function randomAddress(avoidZoneId?: string): AddressPoint {
  let zone = pick(ZONES)
  if (avoidZoneId && zone.id === avoidZoneId) {
    zone = pick(ZONES.filter((z) => z.id !== avoidZoneId))
  }
  return pickAddressFor(zone)
}

/** Определяем зону по строке адреса; если не нашли — случайная зона */
function resolveAddress(label: string): AddressPoint {
  const norm = label.trim().toLowerCase()
  if (norm.length === 0) return randomAddress()
  for (const z of ZONES) {
    const fixed = ADDRESSES[z.id].fixed
    if (fixed) {
      for (const f of fixed) {
        if (f.toLowerCase() === norm) return { label, zoneId: z.id }
      }
    }
  }
  if (norm.length >= 4) {
    for (const z of ZONES) {
      for (const s of ADDRESSES[z.id].streets) {
        const sl = s.toLowerCase()
        if (norm.startsWith(sl) || sl.startsWith(norm)) {
          return { label, zoneId: z.id }
        }
      }
    }
  }
  return { label, zoneId: pick(ZONES).id }
}

// ============================== Тарифы ==============================

interface TariffDef {
  id: string
  name: string
  multiplier: number
  base: number // база посадки, руб
  perKm: number // руб/км
  perMin: number // руб/мин
  weight: number // вес для взвешенного выбора
}

const TARIFFS: TariffDef[] = [
  { id: 'eco', name: 'Эконом', multiplier: 1.0, base: 79, perKm: 14, perMin: 6, weight: 45 },
  { id: 'comfort', name: 'Комфорт', multiplier: 1.35, base: 79, perKm: 14, perMin: 6, weight: 25 },
  { id: 'comfort-plus', name: 'Комфорт+', multiplier: 1.7, base: 79, perKm: 14, perMin: 6, weight: 11 },
  { id: 'business', name: 'Бизнес', multiplier: 2.4, base: 79, perKm: 14, perMin: 6, weight: 6 },
  { id: 'van', name: 'Минивэн', multiplier: 1.5, base: 79, perKm: 14, perMin: 6, weight: 9 },
  // Межгород: специальный тариф 34 руб/км, множитель 1.0
  { id: 'intercity', name: 'Межгород', multiplier: 1.0, base: 79, perKm: 34, perMin: 6, weight: 4 },
]

const TOTAL_WEIGHT = TARIFFS.reduce((s, t) => s + t.weight, 0)

function pickWeightedTariff(): TariffDef {
  let r = Math.random() * TOTAL_WEIGHT
  for (const t of TARIFFS) {
    r -= t.weight
    if (r <= 0) return t
  }
  return TARIFFS[0]
}

function resolveTariff(tariffId: string | null | undefined): TariffDef {
  if (typeof tariffId === 'string') {
    const norm = tariffId.trim().toLowerCase().replace('_', '-')
    const found = TARIFFS.find((t) => t.id === norm)
    if (found) return found
  }
  return pickWeightedTariff()
}

/** Цена = (база + руб/км * км + руб/мин * мин) * множитель тарифа * surge, округление до 10 руб */
function computePrice(t: TariffDef, distanceKm: number, durationMin: number, surge: number): number {
  const raw = (t.base + t.perKm * distanceKm + t.perMin * durationMin) * t.multiplier * surge
  return Math.round(raw / 10) * 10
}

// ============================== Пул водителей ==============================

const FIRST_NAMES = [
  'Алексей', 'Артём', 'Виктор', 'Дмитрий', 'Игорь', 'Марат', 'Николай', 'Олег',
  'Павел', 'Роман', 'Сергей', 'Тимур', 'Юрий', 'Ильдар', 'Вадим', 'Кирилл',
] as const
const LAST_NAMES = [
  'Соколов', 'Кузнецов', 'Волков', 'Попов', 'Лебедев', 'Козлов', 'Новиков', 'Морозов',
  'Петров', 'Фролов', 'Гусев', 'Ларионов', 'Мухаметов', 'Сафин', 'Зайцев', 'Белов',
] as const
const PATRONYMICS = [
  'Сергеевич', 'Андреевич', 'Владимирович', 'Иванович', 'Александрович',
  'Романович', 'Маратович', 'Ильдарович', 'Николаевич', 'Юрьевич',
] as const
const CARS = [
  'Toyota Camry, серебристый', 'Kia Rio, белый', 'Hyundai Solaris, серый',
  'Skoda Octavia, чёрный', 'Volkswagen Polo, красный', 'Toyota Corolla, бежевый',
  'Renault Logan, белый', 'Lada Vesta, графитовый', 'Hyundai Elantra, тёмно-серый',
  'Kia Cerato, серебристый', 'Toyota Camry, чёрный', 'Skoda Superb, белый',
] as const
const PLATE_LETTERS = ['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'] as const

function makeDriver(): DriverInfo {
  const first = pick(FIRST_NAMES)
  const patronymic = pick(PATRONYMICS)
  const last = pick(LAST_NAMES)
  return {
    name: `${last} ${first} ${patronymic}`,
    initials: `${first[0]}.${patronymic[0]}.`,
    car: pick(CARS),
    plate: `${pick(PLATE_LETTERS)} ${randInt(100, 999)} ${pick(PLATE_LETTERS)}${pick(PLATE_LETTERS)} ${randInt(77, 99)}`,
    rating: round1(randFloat(4.6, 5.0)),
    rides: randInt(340, 12800),
  }
}

/** 12 предгенерированных водителей для назначения пассажирам */
const DRIVER_POOL: DriverInfo[] = Array.from({ length: 12 }, () => makeDriver())

// ============================== Лента заказов ==============================

const MAX_FEED = 8
const orders = new Map<string, OrderDTO>()
let orderCounter = 1000
let rideCounter = 5000

function nextOrderId(): string {
  orderCounter += 1
  return `ORD-${orderCounter}`
}

function nextRideId(): string {
  rideCounter += 1
  return `RD-${rideCounter}`
}

/** Геометрическая дистанция между зонами в км (карта 1000x600 нормированная) */
function zoneDistanceKm(a: ZoneState, b: ZoneState): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const km = Math.sqrt(dx * dx + dy * dy) * 0.038 * randFloat(0.88, 1.12)
  return round1(clamp(km, 2, 28))
}

function createOrder(): void {
  if (orders.size >= MAX_FEED) return
  const fromZone = pick(ZONES)
  const toZone = pick(ZONES.filter((z) => z.id !== fromZone.id))
  const tariff = pickWeightedTariff()
  const distanceKm =
    tariff.id === 'intercity' ? round1(randFloat(18, 28)) : zoneDistanceKm(fromZone, toZone)
  const durationMin = round1(distanceKm * 2.2 + 4)
  const surge = surgeForZone(fromZone.id)
  const priceTotal = computePrice(tariff, distanceKm, durationMin, surge)
  const driverPayout = Math.round(priceTotal * 0.88)
  const createdAt = new Date()
  // конкуренция за заказ: чем выше спрос в зоне подачи, тем больше водителей рядом видят ленту
  const watchingDrivers = Math.round(
    clamp(6 + fromZone.demand / 7 + randInt(-2, 3), 3, 24),
  )
  const order: OrderDTO = {
    id: nextOrderId(),
    from: pickAddressFor(fromZone),
    to: pickAddressFor(toZone),
    distanceKm,
    durationMin,
    tariff: { id: tariff.id, name: tariff.name, multiplier: round2(tariff.multiplier) },
    priceTotal,
    driverPayout,
    commissionRub: priceTotal - driverPayout,
    surge: round2(surge),
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + randInt(35, 60) * 1000).toISOString(),
    watchingDrivers,
  }
  orders.set(order.id, order)
  io.to('drivers').emit('orders:new', { order })
  log(
    `заказ ${order.id}: ${order.from.label} -> ${order.to.label}, ${order.distanceKm} км, ${order.priceTotal} руб (${order.tariff.id}${order.surge > 1 ? `, surge ${order.surge}` : ''}, видят ${order.watchingDrivers} водителей`,
  )
}

function removeOrder(id: string, reason: 'taken' | 'expired'): boolean {
  if (!orders.delete(id)) return false
  io.to('drivers').emit('orders:remove', { id, reason })
  return true
}

/** Жизнь заказа 35..60 сек, потом истекает */
function expireOrders(): void {
  const now = Date.now()
  for (const order of orders.values()) {
    if (now >= Date.parse(order.expiresAt)) {
      removeOrder(order.id, 'expired')
      log(`заказ ${order.id} истёк`)
    }
  }
}

/** Другие водители иногда забирают заказы из ленты */
function simulateOtherDriverTake(): void {
  if (orders.size === 0 || Math.random() >= 0.35) return
  const arr = [...orders.values()]
  const order = arr[randInt(0, arr.length - 1)]
  if (removeOrder(order.id, 'taken')) {
    log(`заказ ${order.id} забрал другой водитель`)
  }
}

// ============================== Живая статистика ==============================

const stats: LiveStatsDTO = {
  activeDrivers: 63,
  onlineDrivers: 188,
  ordersPerHour: 512,
  avgWaitSec: 254,
  completedToday: 12437,
  grossTodayRub: 5604800,
}

let bgRideAccumulator = 0

function tickStats(): void {
  stats.activeDrivers = Math.round(clamp(stats.activeDrivers + randFloat(-3, 3), 40, 90))
  stats.onlineDrivers = Math.round(clamp(stats.onlineDrivers + randFloat(-6, 6), 120, 260))
  stats.ordersPerHour = Math.round(clamp(stats.ordersPerHour + randFloat(-15, 15), 300, 700))
  stats.avgWaitSec = Math.round(clamp(stats.avgWaitSec + randFloat(-12, 12), 90, 420))
  // фоновые завершённые поездки: темп ~ ordersPerHour в час
  bgRideAccumulator += (stats.ordersPerHour / 3600) * 5
  let n = Math.floor(bgRideAccumulator)
  bgRideAccumulator -= n
  while (n > 0) {
    n -= 1
    stats.completedToday += 1
    stats.grossTodayRub += computePrice(pickWeightedTariff(), round1(randFloat(3, 22)), round1(randFloat(10, 52)), 1)
  }
}

// ============================== Жизненный цикл поездки ==============================

/** Подсказки фазы поиска водителя (ротация каждые 2 сек) */
const SEARCH_HINTS = [
  () => 'Ищем ближайшего водителя...',
  () => `Найдено ${pick([5, 8, 11, 12, 14, 17, 25, 28])} водителей рядом`,
  () => 'Подбираем машину под ваш тариф...',
  () => 'Согласовываем заказ с водителем...',
  () => 'Осталось совсем немного...',
] as const

interface RideSession {
  ride: RideDTO
  timer: ReturnType<typeof setInterval> | null
  perspective: 'passenger' | 'driver'
  phase: RideStatus | 'done'
  searchTicksLeft: number // тиков по 2 сек до назначения водителя (3..6 => 6..12 сек)
  hintIndex: number
  arriveEtaStart: number
  durationMin: number
}

function hintFor(session: RideSession): string {
  if (session.phase === 'searching') {
    return SEARCH_HINTS[session.hintIndex % SEARCH_HINTS.length]()
  }
  if (session.phase === 'arriving') {
    return session.perspective === 'driver' ? 'Вы едете к пассажиру' : 'Водитель выехал к вам'
  }
  if (session.phase === 'onboard') {
    return session.perspective === 'driver'
      ? 'Пассажир в салоне, следуйте к точке назначения'
      : 'Вы в пути'
  }
  return 'Поездка завершена'
}

function emitRideState(socket: Socket, session: RideSession): void {
  socket.emit('ride:state', { ride: session.ride, hint: hintFor(session) })
}

function startRideLifecycle(
  socket: Socket,
  ride: RideDTO,
  perspective: 'passenger' | 'driver',
  durationMin: number,
): void {
  const client = clients.get(socket.id)
  if (!client) return
  if (client.session?.timer) {
    clearInterval(client.session.timer)
    log(`поездка ${client.session.ride.id} прервана (новая поездка)`)
  }
  const session: RideSession = {
    ride,
    timer: null,
    perspective,
    phase: ride.status,
    searchTicksLeft: perspective === 'passenger' ? randInt(3, 6) : 0,
    hintIndex: 0,
    arriveEtaStart: ride.etaMin,
    durationMin,
  }
  client.session = session
  emitRideState(socket, session)
  session.timer = setInterval(() => {
    try {
      tickRide(socket, session)
    } catch (err) {
      log(`ошибка тика поездки: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, 2000)
}

function tickRide(socket: Socket, session: RideSession): void {
  const ride = session.ride
  if (session.phase === 'searching') {
    session.hintIndex += 1
    emitRideState(socket, session)
    session.searchTicksLeft -= 1
    if (session.searchTicksLeft <= 0) {
      ride.driver = { ...pick(DRIVER_POOL) }
      ride.status = 'arriving'
      ride.progress = 0
      ride.etaMin = randInt(3, 7)
      session.phase = 'arriving'
      session.arriveEtaStart = ride.etaMin
      emitRideState(socket, session)
      log(`поездка ${ride.id}: назначен водитель ${ride.driver.name}, ${ride.driver.car}, подача ~${ride.etaMin} мин`)
    }
    return
  }
  if (session.phase === 'arriving') {
    ride.progress = Math.min(0.25, round2(ride.progress + randFloat(0.07, 0.09)))
    ride.etaMin = Math.max(1, Math.ceil(session.arriveEtaStart * (1 - ride.progress / 0.25)))
    if (ride.progress >= 0.25) {
      ride.status = 'onboard'
      ride.etaMin = Math.max(1, Math.round(session.durationMin))
      session.phase = 'onboard'
      log(`поездка ${ride.id}: пассажир в салоне, в пути ${ride.etaMin} мин`)
    }
    emitRideState(socket, session)
    return
  }
  if (session.phase === 'onboard') {
    ride.progress = Math.min(1, round2(ride.progress + randFloat(0.033, 0.042)))
    ride.etaMin = Math.max(0, Math.round(session.durationMin * (1 - (ride.progress - 0.25) / 0.75)))
    if (ride.progress >= 1) {
      ride.progress = 1
      ride.etaMin = 0
      ride.status = 'completed'
      session.phase = 'done'
      completeRide(socket, session)
    } else {
      emitRideState(socket, session)
    }
    return
  }
  if (session.timer) {
    clearInterval(session.timer)
    session.timer = null
  }
}

function completeRide(socket: Socket, session: RideSession): void {
  const ride = session.ride
  if (session.timer) {
    clearInterval(session.timer)
    session.timer = null
  }
  const price = ride.priceTotal
  const payout = Math.round(price * 0.88)
  const receipt: ReceiptDTO = {
    price,
    driverPayout: payout,
    commissionRub: price - payout,
    tip: 0,
  }
  socket.emit('ride:completed', {
    ride: { ...ride, driver: ride.driver ? { ...ride.driver } : null },
    receipt,
  })
  stats.completedToday += 1
  stats.grossTodayRub += price
  log(`поездка ${ride.id}: завершена, ${price} руб (выплата водителю ${payout})`)
  const client = clients.get(socket.id)
  if (client && client.role === 'driver' && client.earnings) {
    client.earnings.gross += price
    client.earnings.payout += payout
    client.earnings.commission += price - payout
    client.earnings.rides += 1
    client.earnings.hoursOnline = round1(client.earnings.hoursOnline + 0.1)
    client.week = syncWeekToday(client.week, client.earnings.gross)
    client.lastRides.unshift({ ...ride, driver: ride.driver ? { ...ride.driver } : null })
    client.lastRides = client.lastRides.slice(0, 5)
    socket.emit('driver:earnings', {
      today: { ...client.earnings },
      week: client.week.map((d) => ({ ...d })),
      lastRides: client.lastRides.map((r) => ({ ...r, driver: r.driver ? { ...r.driver } : null })),
    })
  }
}

/** 3 последние завершённые поездки для стартового драйвер-дэша */
function makeLastRides(driver: DriverInfo): RideDTO[] {
  const rides: RideDTO[] = []
  for (let i = 0; i < 3; i++) {
    const from = randomAddress()
    const to = randomAddress(from.zoneId)
    const t = pick([TARIFFS[0], TARIFFS[1], TARIFFS[2]])
    const d = round1(randFloat(4, 18))
    const price = computePrice(t, d, round1(d * 2.2 + 4), 1)
    rides.push({
      id: nextRideId(),
      status: 'completed',
      driver: { ...driver },
      from,
      to,
      distanceKm: d,
      etaMin: 0,
      progress: 1,
      priceTotal: price,
      driverPayout: Math.round(price * 0.88),
      tariffName: t.name,
      startedAt: new Date(Date.now() - randInt(30, 360) * 60000).toISOString(),
    })
  }
  return rides.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
}

// ============================== История дохода за неделю ==============================

const WEEK_DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const // getDay(): 0=Вс

/**
 * 7 дней истории: 6 прошлых дней — правдоподобный оборот, сегодня — живые данные смены.
 * Пятница/суббота обычно сильнее (вечерний спрос), середина — ровнее.
 */
function makeWeekHistory(todayGross: number): WeekDayDTO[] {
  const today = new Date()
  const days: WeekDayDTO[] = []
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * 86400000)
    const dow = d.getDay()
    const isToday = i === 0
    let gross: number
    if (isToday) {
      gross = todayGross
    } else {
      // база 9..14 тыс, пятница/суббота бонусом
      gross = randInt(9, 14) * 1000 + randInt(0, 900)
      if (dow === 5 || dow === 6) gross += randInt(1200, 2600)
    }
    days.push({
      day: WEEK_DAYS[dow],
      gross,
      payout: Math.round(gross * 0.88),
      yandexPayout: Math.round(gross * 0.6),
      isToday,
    })
  }
  return days
}

/** Сегодняшняя запись недели догоняет живой оборот смены */
function syncWeekToday(week: WeekDayDTO[], gross: number): WeekDayDTO[] {
  return week.map((d) =>
    d.isToday
      ? { ...d, gross, payout: Math.round(gross * 0.88), yandexPayout: Math.round(gross * 0.6) }
      : d,
  )
}

// ============================== Состояние клиентов ==============================

interface ClientState {
  role: 'driver' | 'passenger' | null
  online: boolean
  identity: DriverInfo | null
  earnings: EarningsToday | null
  week: WeekDayDTO[]
  lastRides: RideDTO[]
  session: RideSession | null
}

/** socketId -> состояние (в т.ч. активная поездка с таймером) */
const clients = new Map<string, ClientState>()

// ============================== socket.io ==============================

const httpServer = createServer()
const io = new Server(httpServer, {
  // путь по умолчанию /socket.io — на нём Caddy проксирует трафик с XTransformPort=3003
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

io.on('connection', (socket: Socket) => {
  clients.set(socket.id, {
    role: null,
    online: false,
    identity: null,
    earnings: null,
    week: [],
    lastRides: [],
    session: null,
  })
  log(`подключение ${socket.id.slice(0, 8)} (клиентов: ${clients.size})`)

  socket.on(
    'driver:join',
    safe(() => {
      const client = clients.get(socket.id)
      if (!client) return
      client.role = 'driver'
      void socket.join('drivers')
      if (!client.identity) client.identity = makeDriver()
      if (!client.earnings) {
        // старт смены: правдоподобные числа вокруг ~27 поездок / ~12 480 руб
        const ridesDone = randInt(20, 34)
        const gross = ridesDone * randInt(420, 500)
        const payout = Math.round(gross * 0.88)
        client.earnings = {
          gross,
          payout,
          commission: gross - payout,
          rides: ridesDone,
          hoursOnline: round1(randFloat(6.5, 9.5)),
        }
        client.lastRides = makeLastRides(client.identity)
      }
      if (client.week.length === 0) client.week = makeWeekHistory(client.earnings.gross)
      socket.emit('feed:state', { orders: [...orders.values()] })
      socket.emit('demand:state', { zones: zoneDTOs(), updatedAt: new Date().toISOString() })
      socket.emit('stats:live', { ...stats })
      socket.emit('driver:earnings', {
        today: { ...client.earnings },
        week: client.week.map((d) => ({ ...d })),
        lastRides: client.lastRides.map((r) => ({ ...r, driver: r.driver ? { ...r.driver } : null })),
      })
      log(`водитель вошёл: ${socket.id.slice(0, 8)} (${client.identity.name})`)
    }),
  )

  socket.on(
    'passenger:join',
    safe(() => {
      const client = clients.get(socket.id)
      if (!client) return
      if (client.role === 'driver') void socket.leave('drivers')
      client.role = 'passenger'
      socket.emit('demand:state', { zones: zoneDTOs(), updatedAt: new Date().toISOString() })
      socket.emit('stats:live', { ...stats })
      log(`пассажир вошёл: ${socket.id.slice(0, 8)}`)
    }),
  )

  socket.on(
    'driver:go-online',
    safe(() => {
      const client = clients.get(socket.id)
      if (!client) return
      client.online = true
      socket.emit('driver:online', { online: true })
    }),
  )

  socket.on(
    'driver:go-offline',
    safe(() => {
      const client = clients.get(socket.id)
      if (!client) return
      client.online = false
      socket.emit('driver:online', { online: false })
    }),
  )

  socket.on(
    'driver:decline',
    safeArg<unknown>((raw) => {
      // Отказ от заказа — БЕЗ штрафа и понижения приоритета (наш дифференциатор)
      const p = isObj(raw)
      const orderId = typeof p.orderId === 'string' ? p.orderId : '(без id)'
      log(`водитель ${socket.id.slice(0, 8)} отказался от заказа ${orderId} — без штрафа`)
    }),
  )

  socket.on(
    'passenger:book',
    safeArg<unknown>((raw) => {
      const p = isObj(raw)
      const client = clients.get(socket.id)
      if (!client) return
      if (client.role !== 'passenger') client.role = 'passenger'
      // частичные/пустые поля -> случайные значения
      const fromRaw = typeof p.from === 'string' && p.from.trim() !== '' ? p.from.trim() : null
      const toRaw = typeof p.to === 'string' && p.to.trim() !== '' ? p.to.trim() : null
      const tariff = resolveTariff(typeof p.tariffId === 'string' ? p.tariffId : null)
      const from = fromRaw ? resolveAddress(fromRaw) : randomAddress()
      const to = toRaw ? resolveAddress(toRaw) : randomAddress(from.zoneId)
      const distanceKm = round1(3 + 21 * Math.random() * Math.random()) // 3..24 км
      const durationMin = round1(distanceKm * 2.2 + 4)
      const surge = surgeForZone(from.zoneId)
      const priceTotal = computePrice(tariff, distanceKm, durationMin, surge)
      const ride: RideDTO = {
        id: nextRideId(),
        status: 'searching',
        driver: null,
        from,
        to,
        distanceKm,
        etaMin: randInt(3, 6),
        progress: 0,
        priceTotal,
        driverPayout: Math.round(priceTotal * 0.88),
        tariffName: tariff.name,
        startedAt: new Date().toISOString(),
      }
      startRideLifecycle(socket, ride, 'passenger', durationMin)
      log(
        `пассажир ${socket.id.slice(0, 8)} заказал: ${from.label} -> ${to.label} (${tariff.id}, ${priceTotal} руб)`,
      )
    }),
  )

  socket.on(
    'ride:rate',
    safeArg<unknown>((raw) => {
      const p = isObj(raw)
      const rideId = typeof p.rideId === 'string' ? p.rideId : '(без id)'
      const tipNum = typeof p.tip === 'number' ? p.tip : Number(p.tip)
      const tip = Number.isFinite(tipNum) ? Math.max(0, Math.round(tipNum)) : 0
      const message =
        tip > 0
          ? 'Спасибо! Оценка сохранена. Чаевые 100% переданы водителю.'
          : 'Спасибо! Оценка сохранена.'
      socket.emit('ride:rated', { ok: true, message })
      log(`оценка поездки ${rideId} принята (чаевые: ${tip} руб)`)
    }),
  )

  socket.on(
    'driver:accept',
    safeArg<unknown>((raw) => {
      const p = isObj(raw)
      const orderId = typeof p.orderId === 'string' ? p.orderId : ''
      const client = clients.get(socket.id)
      if (!client) return
      const order = orderId !== '' ? orders.get(orderId) : undefined
      if (!order) {
        socket.emit('driver:accept-failed', { orderId, reason: 'taken' })
        log(`водитель ${socket.id.slice(0, 8)}: заказ ${orderId || '(пусто)'} уже недоступен`)
        return
      }
      if (client.session && client.session.phase !== 'done' && client.session.timer) {
        socket.emit('driver:accept-failed', { orderId, reason: 'busy' })
        log(`водитель ${socket.id.slice(0, 8)}: заказ ${orderId} отклонён (уже в поездке)`)
        return
      }
      orders.delete(orderId)
      // заказ удалён глобально, orders:remove получает и сам принимающий сокет
      io.to('drivers').emit('orders:remove', { id: orderId, reason: 'taken' })
      const identity = client.identity ?? makeDriver()
      const ride: RideDTO = {
        id: nextRideId(),
        status: 'arriving',
        driver: { ...identity },
        from: { ...order.from },
        to: { ...order.to },
        distanceKm: order.distanceKm,
        etaMin: randInt(3, 7),
        progress: 0,
        priceTotal: order.priceTotal,
        driverPayout: order.driverPayout,
        tariffName: order.tariff.name,
        startedAt: new Date().toISOString(),
      }
      startRideLifecycle(socket, ride, 'driver', order.durationMin)
      log(`водитель ${socket.id.slice(0, 8)} принял заказ ${orderId}: ${order.priceTotal} руб, выплата ${order.driverPayout}`)
    }),
  )

  socket.on('disconnect', () => {
    const client = clients.get(socket.id)
    if (client?.session?.timer) {
      clearInterval(client.session.timer)
      log(`поездка ${client.session.ride.id} остановлена (клиент отключился)`)
    }
    clients.delete(socket.id)
    log(`отключение ${socket.id.slice(0, 8)} (клиентов: ${clients.size})`)
  })
})

// ============================== Запуск и таймеры ==============================

// Главный тик 5 сек: спрос по зонам + живая статистика -> всем сокетам
setInterval(() => {
  try {
    tickZones()
    io.emit('demand:state', { zones: zoneDTOs(), updatedAt: new Date().toISOString() })
    tickStats()
    io.emit('stats:live', { ...stats })
  } catch (err) {
    log(`ошибка 5-сек тика: ${err instanceof Error ? err.message : String(err)}`)
  }
}, 5000)

// Проверка истечения заказов — каждую секунду
setInterval(() => {
  try {
    expireOrders()
  } catch (err) {
    log(`ошибка проверки заказов: ${err instanceof Error ? err.message : String(err)}`)
  }
}, 1000)

// Прочие водители забирают заказы — примерно раз в 15 сек
setInterval(() => {
  try {
    simulateOtherDriverTake()
  } catch (err) {
    log(`ошибка симуляции водителей: ${err instanceof Error ? err.message : String(err)}`)
  }
}, 15000)

// Создание заказов: случайный интервал 4..9 сек
function scheduleOrderCreation(): void {
  setTimeout(() => {
    try {
      createOrder()
    } catch (err) {
      log(`ошибка создания заказа: ${err instanceof Error ? err.message : String(err)}`)
    }
    scheduleOrderCreation()
  }, randInt(4000, 9000))
}

process.on('uncaughtException', (err) => {
  log(`uncaughtException: ${err.message}`)
})
process.on('unhandledRejection', (reason) => {
  log(`unhandledRejection: ${String(reason)}`)
})

httpServer.listen(PORT, () => {
  log(`ПРЯМО ride-engine запущен: порт ${PORT}, путь /socket.io`)
  log(`зон: ${ZONES.length}, водителей в пуле: ${DRIVER_POOL.length}, тарифов: ${TARIFFS.length}`)
  for (let i = 0; i < 4; i++) {
    createOrder()
  }
  scheduleOrderCreation()
})
