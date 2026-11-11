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
 * (например, на статик-проде GitHub Pages). Обе роли — пассажир и водитель —
 * живут в одном оверлее, поэтому заказ пассажира реально попадает в ленту
 * водителя; если водитель «спит», через ~5 секунд заказ берёт автоматический
 * «движковый» водитель, чтобы демо не упиралось в тупик.
 */

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

// ===== Статика для офлайн-режима =====

// ===== Индикация офлайн-режима для интерфейса =====

let localModeActive = false
const localModeListeners = new Set<(v: boolean) => void>()

/** Хуки MVP вызывают при переключении на локальный движок */
export function setLocalModeActive(v: boolean) {
  if (v !== localModeActive) {
    localModeActive = v
    localModeListeners.forEach((f) => f(v))
  }
}

/** Подписка для UI: работает ли MVP прямо сейчас на локальном движке */
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

// ===== Синглтон движка =====

interface LocalState {
  passenger: LocalPassengerHandlers | null
  driver: LocalDriverHandlers | null
  driverOnline: boolean
  ride: RideDTO | null
  order: OrderDTO | null
  timers: number[]
  earnings: EarningsToday
  week: WeekDay[]
  lastRides: RideDTO[]
  hoursStartedAt: number | null
}

const state: LocalState = {
  passenger: null,
  driver: null,
  driverOnline: false,
  ride: null,
  order: null,
  timers: [],
  earnings: { gross: 0, payout: 0, commission: 0, rides: 0, hoursOnline: 0 },
  week: makeWeek(todayIdx()),
  lastRides: [],
  hoursStartedAt: null,
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
  if (state.driver) state.driver.onRideState(ride)
}

function finishRide(ride: RideDTO) {
  const price = ride.priceTotal
  const payout = Math.round(price * 0.88)
  const commission = price - payout
  const receipt: Receipt = { price, driverPayout: payout, commissionRub: commission, tip: 0 }

  const completed: RideDTO = { ...ride, status: 'completed', progress: 1 }
  state.ride = null
  clearTimers()

  // Доход водителя
  state.earnings = {
    gross: state.earnings.gross + price,
    payout: state.earnings.payout + payout,
    commission: state.earnings.commission + commission,
    rides: state.earnings.rides + 1,
    hoursOnline: state.earnings.hoursOnline,
  }
  const wi = todayIdx()
  state.week = state.week.map((d, i) =>
    i === wi ? { ...d, gross: d.gross + price, payout: Math.round((d.gross + price) * 0.88), yandexPayout: Math.round((d.gross + price) * 0.6) } : d
  )
  state.lastRides = [completed, ...state.lastRides].slice(0, 6)

  state.passenger?.onCompleted(completed, receipt)
  if (state.driver) state.driver.onCompleted(completed, receipt)
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
  if (state.order) {
    state.order = null // заказ ушёл из ленты
  }
  emitRide(ride)
  // подача → в пути
  later(() => {
    const onboard: RideDTO = { ...ride, status: 'onboard', hint: 'В пути к назначению' }
    emitRide(onboard)
    later(() => tickOnboard(onboard), 400)
  }, 7000 + Math.random() * 3000)
}

function pushOrder(order: OrderDTO) {
  state.order = order
  if (state.driver && state.driverOnline) state.driver.onOrderNew?.(order)
  // Страховка от тупика: если водитель офлайн или не принял за 5 секунд —
  // берёт автоматический «движковый» водитель (демо должно завершаться).
  // Статус searching — тоже активная поездка, поэтому проверяем статус, а не null
  later(() => {
    const stillSearching =
      state.order?.id === order.id &&
      (!state.ride || state.ride.status === 'searching')
    if (stillSearching) {
      assignRide(order, LOCAL_DRIVER, true)
    }
  }, 5000)
}

export const localEngine = {
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
      hint: 'Заказ в ленте водителей — берут по аукциону, без приоритетов',
    }
    emitRide(searching)
    later(() => pushOrder(order), 900)
  },
  cancel() {
    // Отмена бесплатна, только пока водитель не назначен (статус «searching»);
    // после «выехал» — недоступна, как в настоящем движке
    if (!state.ride || state.ride.status === 'searching') {
      clearTimers()
      state.order = null
      state.ride = null
      state.passenger?.onCancelled(true)
    } else {
      state.passenger?.onCancelled(false)
    }
  },
  rate(rideId: string, tip: number, reasons?: string[]) {
    void rideId
    const parts: string[] = []
    if (reasons && reasons.length) parts.push(`водитель увидит причины: ${reasons.join(', ')}`)
    if (tip > 0) parts.push(`чаевые ${tip} ₽ переданы водителю полностью`)
    state.passenger?.onRated(
      parts.length ? `Оценка сохранена — ${parts.join('; ')}` : 'Оценка сохранена. Спасибо!'
    )
  },
  accept(orderId: string) {
    const order = state.order
    // searching — заказ ещё свободен, брать можно
    const taken = state.ride && state.ride.status !== 'searching'
    if (!order || order.id !== orderId || taken) {
      state.driver?.onAcceptFailed(orderId, 'taken')
      return
    }
    assignRide(order, LOCAL_DRIVER, false)
  },
  decline(orderId: string) {
    if (state.order?.id === orderId) {
      state.order = null
      state.passenger?.onFailed('declined')
    }
  },
  advance() {
    const ride = state.ride
    if (!ride) return
    if (ride.status === 'searching') return
    if (ride.status === 'arriving') {
      const onboard: RideDTO = { ...ride, status: 'onboard', hint: 'В пути к назначению' }
      emitRide(onboard)
      later(() => tickOnboard(onboard), 400)
    } else if (ride.status === 'onboard') {
      finishRide(ride)
    }
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
