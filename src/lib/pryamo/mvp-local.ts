'use client'

import { useEffect, useState } from 'react'
import { estimatePrice } from '@/lib/pryamo/format'
import { TARIFF_FALLBACK } from '@/lib/pryamo/tariff-fallback'
import type {
  EarningsToday,
  OrderDTO,
  Receipt,
  RideDTO,
  RideDriver,
  WeekDay,
  ZoneDTO,
} from '@/lib/pryamo/types'

/**
 * Локальный мини-движок MVP: та же логика поездки, что у ride-engine (:3003),
 * но целиком в браузере. Включается автоматически, когда движок недоступен
 * (например, на статик-проде GitHub Pages).
 *
 * Три режима (setRoleMode):
 *  - 'both'          — оверлей на лендинге: обе роли в одном контексте;
 *  - 'passenger-page'— самостоятельное приложение пассажира (/passenger):
 *                      владеет прогрессом поездки; заказ уходит в приложение
 *                      водителя через BroadcastChannel, если оно открыто;
 *  - 'driver-page'   — самостоятельное приложение водителя (/driver):
 *                      лента и команды через BroadcastChannel; в одиночку
 *                      генерирует демо-заказы, чтобы лента жила.
 *
 * Связь вкладок: BroadcastChannel 'pryamo-engine-sync' + heartbeat раз в 2 с.
 * Если водителя рядом нет — пассажирский заказ через 5 с берёт автоматический
 * «движковый» водитель, чтобы демо не упиралось в тупик.
 */

export type RoleMode = 'both' | 'passenger-page' | 'driver-page'

export interface LocalPassengerHandlers {
  onRideState: (ride: RideDTO) => void
  onCompleted: (ride: RideDTO, receipt: Receipt) => void
  onRated: (message: string) => void
  onFailed: (reason: string) => void
  onCancelled: (ok: boolean) => void
}

export interface LocalDriverHandlers {
  onOrderNew?: (order: OrderDTO) => void
  onRideState: (ride: RideDTO) => void
  onCompleted: (ride: RideDTO, receipt: Receipt) => void
  onAcceptFailed: (orderId: string, reason: string) => void
}

// ===== Индикация офлайн-режима для интерфейса =====

let localModeActive = false
const localModeListeners = new Set<(v: boolean) => void>()

export function setLocalModeActive(v: boolean) {
  if (v !== localModeActive) {
    localModeActive = v
    localModeListeners.forEach((f) => f(v))
  }
}

export function useMvpLocalMode(): boolean {
  const [v, setV] = useState(localModeActive)
  useEffect(() => {
    localModeListeners.add(setV)
    return () => {
      localModeListeners.delete(setV)
    }
  }, [])
  return v
}

// ===== Статика для офлайн-режима =====

export const LOCAL_ZONES: ZoneDTO[] = [
  { id: 'center', name: 'Центр', x: 50, y: 42, demand: 72, surge: 1.2, waitingDrivers: 14, ordersWaiting: 6, avgWaitMin: 3 },
  { id: 'north', name: 'Север', x: 62, y: 14, demand: 35, surge: 1.0, waitingDrivers: 22, ordersWaiting: 2, avgWaitMin: 5 },
  { id: 'south', name: 'Юг', x: 44, y: 84, demand: 48, surge: 1.0, waitingDrivers: 17, ordersWaiting: 3, avgWaitMin: 4 },
  { id: 'west', name: 'Запад', x: 12, y: 55, demand: 28, surge: 1.0, waitingDrivers: 12, ordersWaiting: 1, avgWaitMin: 6 },
  { id: 'east', name: 'Восток', x: 86, y: 48, demand: 61, surge: 1.15, waitingDrivers: 9, ordersWaiting: 4, avgWaitMin: 4 },
  { id: 'airport', name: 'Аэропорт', x: 78, y: 8, demand: 55, surge: 1.25, waitingDrivers: 7, ordersWaiting: 3, avgWaitMin: 6 },
]

export const LOCAL_DRIVER: RideDriver = {
  name: 'Алексей П.',
  initials: 'АП',
  car: 'Kia Rio, белый',
  plate: 'О 123 РТ 77',
  rating: 4.93,
  rides: 2341,
}

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function makeWeek(todayIdx: number): WeekDay[] {
  return DAY_LABELS.map((day, i) => {
    const isToday = i === todayIdx
    const gross = isToday ? 0 : 7200 + Math.round(Math.sin(i * 2.3) * 1600) + i * 210
    return {
      day,
      gross,
      payout: Math.round(gross * 0.88),
      yandexPayout: Math.round(gross * 0.6),
      isToday,
    }
  })
}

// ===== Хэлперы =====

function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

function kmFor(from: string, to: string): number {
  return Math.round((3 + hash01(from + to, 7) * 22) * 10) / 10
}

function tariffById(id: string) {
  return TARIFF_FALLBACK.find((t) => t.id === id) ?? TARIFF_FALLBACK[1] ?? TARIFF_FALLBACK[0]
}

function todayIdx(): number {
  const d = new Date().getDay()
  return (d + 6) % 7
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? 'В'
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase() || 'ВД'
}

// ===== Канал связи между вкладками =====

type SyncMsg =
  | { t: 'hb'; role: 'passenger' | 'driver' }
  | { t: 'order'; order: OrderDTO }
  | { t: 'ride'; ride: RideDTO }
  | { t: 'done'; ride: RideDTO; receipt: Receipt }
  | { t: 'rated'; rideId: string; tip: number; reasons?: string[] }
  | { t: 'cmd'; kind: 'accept' | 'decline' | 'advance'; orderId?: string; driver?: RideDriver }
  | { t: 'order-gone'; orderId: string }

const CHANNEL_NAME = 'pryamo-engine-sync'
const PEER_STALE_MS = 6000

let mode: RoleMode = 'both'
let channel: BroadcastChannel | null = null

/** Роль страницы задаётся один раз при монтировании standalone-приложения */
export function setRoleMode(m: RoleMode) {
  mode = m
  ensureChannel()
  if (m !== 'both') startHeartbeat()
}

function ensureChannel() {
  if (channel !== null || mode === 'both') return
  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = (e: MessageEvent<SyncMsg>) => handleRemote(e.data)
  } catch {
    channel = null // нет BroadcastChannel — работаем в соло-режиме
  }
}

function send(msg: SyncMsg) {
  ensureChannel()
  try {
    channel?.postMessage(msg)
  } catch {
    /* канал закрыт — не критично */
  }
}

let hbTimer: number | null = null

function startHeartbeat() {
  if (hbTimer !== null) return
  const role = mode === 'passenger-page' ? 'passenger' : 'driver'
  send({ t: 'hb', role })
  hbTimer = window.setInterval(() => send({ t: 'hb', role }), 2000)
}

function peerFresh(role: 'passenger' | 'driver'): boolean {
  return Date.now() - state.peer[role] < PEER_STALE_MS
}

// ===== Синглтон движка =====

interface LocalState {
  passenger: LocalPassengerHandlers | null
  driver: LocalDriverHandlers | null
  driverOnline: boolean
  ride: RideDTO | null
  order: OrderDTO | null
  /** Заказ пришёл из приложения пассажира (по каналу) — не демо */
  remoteOrder: boolean
  /** Поездка ведётся на этой странице (прогресс/таймеры — здесь) */
  ownsRide: boolean
  timers: number[]
  peer: { passenger: number; driver: number }
  earnings: EarningsToday
  week: WeekDay[]
  lastRides: RideDTO[]
  hoursStartedAt: number | null
  driverIdentity: RideDriver
  lastDemoAt: number
  lastRideMsgAt: number
}

const state: LocalState = {
  passenger: null,
  driver: null,
  driverOnline: false,
  ride: null,
  order: null,
  remoteOrder: false,
  ownsRide: false,
  timers: [],
  peer: { passenger: 0, driver: 0 },
  earnings: { gross: 0, payout: 0, commission: 0, rides: 0, hoursOnline: 0 },
  week: makeWeek(todayIdx()),
  lastRides: [],
  hoursStartedAt: null,
  driverIdentity: LOCAL_DRIVER,
  lastDemoAt: 0,
  lastRideMsgAt: 0,
}

function clearTimers() {
  state.timers.forEach((t) => window.clearTimeout(t))
  state.timers = []
}

function later(fn: () => void, ms: number) {
  state.timers.push(window.setTimeout(fn, ms))
}

function emitRide(ride: RideDTO) {
  state.ride = ride
  state.passenger?.onRideState(ride)
  state.driver?.onRideState(ride)
  state.lastRideMsgAt = Date.now()
  // зеркалим в приложение-партнёр
  if (state.ownsRide) send({ t: 'ride', ride })
}

function bumpEarnings(price: number, payout: number, commission: number) {
  state.earnings = {
    gross: state.earnings.gross + price,
    payout: state.earnings.payout + payout,
    commission: state.earnings.commission + commission,
    rides: state.earnings.rides + 1,
    hoursOnline: state.earnings.hoursOnline,
  }
  const wi = todayIdx()
  state.week = state.week.map((d, i) =>
    i === wi
      ? {
          ...d,
          gross: d.gross + price,
          payout: Math.round((d.gross + price) * 0.88),
          yandexPayout: Math.round((d.gross + price) * 0.6),
        }
      : d
  )
}

function finishRide(ride: RideDTO) {
  const price = ride.priceTotal
  const payout = Math.round(price * 0.88)
  const commission = price - payout
  const receipt: Receipt = { price, driverPayout: payout, commissionRub: commission, tip: 0 }

  const completed: RideDTO = { ...ride, status: 'completed', progress: 1 }
  const hadRide = state.ride !== null
  state.ride = null
  state.order = null
  state.remoteOrder = false
  clearTimers()

  bumpEarnings(price, payout, commission)
  state.lastRides = [completed, ...state.lastRides].slice(0, 6)

  state.passenger?.onCompleted(completed, receipt)
  if (state.driver) state.driver.onCompleted(completed, receipt)
  if (state.ownsRide && hadRide) send({ t: 'done', ride: completed, receipt })
}

function tickOnboard(ride: RideDTO) {
  const step = 0.04 + Math.random() * 0.02
  const next: RideDTO = { ...ride, progress: Math.min(1, ride.progress + step) }
  emitRide(next)
  if (next.progress >= 1) {
    later(() => finishRide(next), 600)
  } else {
    later(() => tickOnboard(next), 700 + Math.random() * 500)
  }
}

function assignRide(order: OrderDTO, driver: RideDriver, auto: boolean) {
  clearTimers()
  const km = order.distanceKm
  const etaMin = 3 + Math.round(Math.random() * 4)
  const ride: RideDTO = {
    id: order.id,
    status: 'arriving',
    driver,
    from: order.from,
    to: order.to,
    distanceKm: km,
    etaMin,
    progress: 0,
    priceTotal: order.priceTotal,
    driverPayout: order.driverPayout,
    tariffName: order.tariff.name,
    hint: auto
      ? 'Движок подобрал ближайшего водителя — он едет к вам'
      : `Водитель принял заказ. Подача ~${etaMin} мин`,
    startedAt: new Date().toISOString(),
  }
  state.order = null
  state.remoteOrder = false
  state.ownsRide = mode !== 'driver-page' || order.id.startsWith('demo-')
  emitRide(ride)
  // подача → в пути → прогресс до чека
  later(() => {
    const onboard: RideDTO = { ...ride, status: 'onboard', hint: 'В пути к назначению' }
    emitRide(onboard)
    later(() => tickOnboard(onboard), 400)
  }, 7000 + Math.random() * 3000)
}

function pushOrder(order: OrderDTO, remote = false) {
  state.order = order
  state.remoteOrder = remote
  if (state.driver && state.driverOnline) state.driver.onOrderNew?.(order)
  if (remote) return
  // Страховка от тупика: если рядом нет приложения водителя — через 5 с
  // заказ берёт автоматический «движковый» водитель
  const noDriverNear = mode === 'both' || (mode === 'passenger-page' && !peerFresh('driver'))
  if (noDriverNear) {
    later(() => {
      const stillSearching =
        state.order?.id === order.id &&
        (!state.ride || state.ride.status === 'searching')
      if (stillSearching) {
        assignRide(order, state.driverIdentity, true)
      }
    }, 5000)
  }
}

function makeDemoOrder(): OrderDTO {
  const t = tariffById('comfort')
  const km = 4 + Math.round(Math.random() * 14 * 10) / 10
  const min = Math.round(km * 2.2 + 4)
  const price = estimatePrice(t, km, min)
  const payout = Math.round(price * 0.88)
  const names = ['Ольга С.', 'Марат К.', 'Ирина В.', 'Павел Д.', 'Светлана Н.']
  const from = ['ул. Некрасова, 12', 'Лиговский пр-т, 50', 'Кузнечный пер., 3', 'Наб. Мойки, 41']
  const to = ['Пулково, терминал 1', 'Московский вокзал', 'Стадион «Газпром Арена»', 'ул. Рубинштейна, 18']
  return {
    id: `demo-${Date.now()}`,
    from: { label: from[Math.floor(Math.random() * from.length)], zoneId: 'center' },
    to: { label: to[Math.floor(Math.random() * to.length)], zoneId: 'east' },
    distanceKm: km,
    durationMin: min,
    tariff: { id: t.id, name: t.name, multiplier: t.multiplier },
    priceTotal: price,
    driverPayout: payout,
    commissionRub: price - payout,
    surge: 1,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 45000).toISOString(),
    watchingDrivers: 2 + Math.floor(Math.random() * 4),
  }
}

function maybeDemoOrder() {
  if (mode !== 'driver-page') return
  if (!state.driverOnline) return
  if (state.order || state.ride) return
  if (Date.now() - state.lastDemoAt < 9000) return
  // демо-заказы только когда приложение пассажира рядом молчит
  if (peerFresh('passenger')) return
  state.lastDemoAt = Date.now()
  pushOrder(makeDemoOrder())
}

// ===== Обработка сообщений партнёра =====

function handleRemote(msg: SyncMsg) {
  switch (msg.t) {
    case 'hb':
      state.peer[msg.role] = Date.now()
      break
    case 'order':
      state.peer.passenger = Date.now()
      if (!state.ride || state.ride.status === 'searching') pushOrder(msg.order, true)
      break
    case 'ride':
      // зеркалим состояние поездки (страница-владелец — приложение пассажира).
      // «searching» — заказ ещё свободен: поездка для водителя не началась,
      // лента должна продолжать показывать заказ
      if (msg.ride.status === 'searching') break
      state.ride = msg.ride
      state.order = null
      state.driver?.onRideState(msg.ride)
      break
    case 'done': {
      state.ride = null
      state.order = null
      state.remoteOrder = false
      bumpEarnings(msg.ride.priceTotal, msg.receipt.driverPayout, msg.receipt.commissionRub)
      state.lastRides = [msg.ride, ...state.lastRides].slice(0, 6)
      if (state.driver) state.driver.onCompleted(msg.ride, msg.receipt)
      break
    }
    case 'rated':
      // чаевые приходят водителю после завершения поездки
      if (msg.tip > 0) {
        state.earnings = { ...state.earnings, payout: state.earnings.payout + msg.tip }
      }
      break
    case 'cmd':
      state.peer.driver = Date.now()
      if (msg.kind === 'accept' && msg.orderId && msg.driver) {
        const order = state.order
        const taken = state.ride && state.ride.status !== 'searching'
        if (order && order.id === msg.orderId && !taken) {
          assignRide(order, msg.driver, false)
        }
      } else if (msg.kind === 'decline' && msg.orderId) {
        if (state.order?.id === msg.orderId) {
          state.order = null
          state.remoteOrder = false
          state.passenger?.onFailed('declined')
        }
      } else if (msg.kind === 'advance') {
        advanceLocal()
      }
      break
    case 'order-gone':
      if (state.order?.id === msg.orderId) {
        state.order = null
        state.remoteOrder = false
      }
      break
  }
}

function advanceLocal() {
  const ride = state.ride
  if (!ride || ride.status === 'searching') return
  if (ride.status === 'arriving') {
    const onboard: RideDTO = { ...ride, status: 'onboard', hint: 'В пути к назначению' }
    emitRide(onboard)
    later(() => tickOnboard(onboard), 400)
  } else if (ride.status === 'onboard') {
    finishRide(ride)
  }
}

export const localEngine = {
  setIdentity(identity: Partial<RideDriver>) {
    state.driverIdentity = { ...state.driverIdentity, ...identity }
  },
  joinPassenger(handlers: LocalPassengerHandlers) {
    state.passenger = handlers
  },
  leavePassenger() {
    state.passenger = null
  },
  joinDriver(handlers: LocalDriverHandlers) {
    state.driver = handlers
  },
  leaveDriver() {
    state.driver = null
  },
  goOnline() {
    state.driverOnline = true
    state.hoursStartedAt = state.hoursStartedAt ?? Date.now()
  },
  goOffline() {
    state.driverOnline = false
  },
  book(payload: { from: string; to: string; tariffId: string }) {
    if (mode === 'driver-page') return
    if (state.ride || state.order) return
    const t = tariffById(payload.tariffId)
    const km = kmFor(payload.from, payload.to)
    const min = Math.round(km * 2.2 + 4)
    const price = estimatePrice(t, km, min)
    const order: OrderDTO = {
      id: `local-${Date.now()}`,
      from: { label: payload.from, zoneId: 'center' },
      to: { label: payload.to, zoneId: 'east' },
      distanceKm: km,
      durationMin: min,
      tariff: { id: t.id, name: t.name, multiplier: t.multiplier },
      priceTotal: price,
      driverPayout: Math.round(price * 0.88),
      commissionRub: price - Math.round(price * 0.88),
      surge: 1,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 45000).toISOString(),
      watchingDrivers: 3,
    }
    const searching: RideDTO = {
      id: order.id,
      status: 'searching',
      driver: null,
      from: order.from,
      to: order.to,
      distanceKm: km,
      etaMin: Math.round(2 + hash01(order.id) * 3),
      progress: 0,
      priceTotal: price,
      driverPayout: order.driverPayout,
      tariffName: t.name,
      hint:
        mode === 'passenger-page'
          ? 'Заказ в ленте водителей — если рядом открыто приложение водителя, заказ возьмут живьём'
          : 'Заказ в ленте водителей — берут по аукциону, без приоритетов',
    }
    state.ownsRide = true
    emitRide(searching)
    send({ t: 'order', order })
    later(() => pushOrder(order), 900)
  },
  cancel() {
    // Отмена бесплатна, только пока водитель не назначен (статус «searching»)
    if (!state.ride || state.ride.status === 'searching') {
      clearTimers()
      if (state.order) send({ t: 'order-gone', orderId: state.order.id })
      state.order = null
      state.ride = null
      state.ownsRide = false
      state.passenger?.onCancelled(true)
    } else {
      state.passenger?.onCancelled(false)
    }
  },
  rate(rideId: string, tip: number, reasons?: string[], compliment?: boolean) {
    void rideId
    const parts: string[] = []
    if (reasons && reasons.length) {
      parts.push(
        compliment
          ? `водитель получит комплименты: ${reasons.join(', ')}`
          : `водитель увидит причины: ${reasons.join(', ')}`
      )
    }
    if (tip > 0) parts.push(`чаевые ${tip} ₽ переданы водителю полностью`)
    state.passenger?.onRated(
      parts.length ? `Оценка сохранена — ${parts.join('; ')}` : 'Оценка сохранена. Спасибо!'
    )
    if (tip > 0) send({ t: 'rated', rideId, tip, reasons })
  },
  accept(orderId: string) {
    if (mode === 'passenger-page') return
    // Поездка уже ведётся локально (демо-заказ в соло) — ищем её в ленте
    const order = state.order
    if (order && order.id === orderId && order.id.startsWith('demo-') && !peerFresh('passenger')) {
      const taken = state.ride && state.ride.status !== 'searching'
      if (!taken) assignRide(order, state.driverIdentity, false)
      return
    }
    // Заказ от живого пассажира — команда на его страницу
    send({ t: 'cmd', kind: 'accept', orderId, driver: state.driverIdentity })
  },
  decline(orderId: string) {
    if (mode === 'passenger-page') return
    if (state.order?.id === orderId && state.order.id.startsWith('demo-') && !peerFresh('passenger')) {
      state.order = null
      return
    }
    send({ t: 'cmd', kind: 'decline', orderId })
    if (state.order?.id === orderId) state.order = null
  },
  advance() {
    if (mode === 'passenger-page') {
      advanceLocal()
      return
    }
    if (state.ownsRide) {
      advanceLocal()
    } else {
      send({ t: 'cmd', kind: 'advance' })
    }
  },
  /** Демо-тик: водительская страница периодически подмешивает демо-заказы */
  tick() {
    // Фантомная поездка: приложение пассажира закрылось посреди поездки —
    // обновления прекратились, сбрасываем, чтобы лента ожила
    if (
      mode === 'driver-page' &&
      state.ride &&
      !state.ownsRide &&
      !peerFresh('passenger') &&
      Date.now() - state.lastRideMsgAt > 8000
    ) {
      state.ride = null
      state.order = null
      clearTimers()
    }
    maybeDemoOrder()
  },
  earnings(): EarningsToday {
    if (state.hoursStartedAt) {
      return {
        ...state.earnings,
        hoursOnline: Math.max(0.1, (Date.now() - state.hoursStartedAt) / 3_600_000),
      }
    }
    return state.earnings
  },
  week(): WeekDay[] {
    return state.week
  },
  lastRides(): RideDTO[] {
    return state.lastRides
  },
  /** Срез состояния для водителя: лента, доход, неделя, последние поездки */
  driverSnapshot() {
    return {
      orders: state.order && !state.ride ? [state.order] : [],
      earnings: this.earnings(),
      week: state.week,
      lastRides: state.lastRides,
    }
  },
  isDriverOnline(): boolean {
    return state.driverOnline
  },
}
