import type { Receipt, RideDTO, WeekDay } from '@/lib/pryamo/types'

/**
 * Персистентность MVP-приложений ПРЯМО (localStorage, hydration-safe).
 *
 * Правила:
 *  - чтение ТОЛЬКО внутри useEffect (никогда при рендере — SSR/гидратация);
 *  - запись обёрнута в try/catch: переполненная квота или приватный режим
 *    не должны ронять приложение — просто живём без сохранения;
 *  - ключи версионируются (v1), внутри JSON тоже поле version — при смене
 *    формата старые данные отбрасываются молча.
 */

export const PASSENGER_STORAGE_KEY = 'pryamo:mvp:passenger:v1'
export const DRIVER_STORAGE_KEY = 'pryamo:mvp:driver:v1'

/** Лимит истории поездок пассажира на устройстве */
export const PASSENGER_HISTORY_LIMIT = 50

/** Локальная дата вида 2026-01-02 (без UTC-сдвига полуночи) */
export function localDay(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function isStr(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== ''
}

// ===== Пассажир: история поездок =====

export interface StoredPassengerHistoryItem {
  ride: RideDTO
  receipt: Receipt
  rated: boolean
  tip: number
  at: number
}

interface StoredPassengerState {
  version: 1
  history: StoredPassengerHistoryItem[]
}

function isValidHistoryItem(v: unknown): v is StoredPassengerHistoryItem {
  if (!isObj(v)) return false
  const ride = v.ride
  const receipt = v.receipt
  if (!isObj(ride) || !isObj(receipt)) return false
  if (!isStr(ride.id)) return false
  if (!isObj(ride.from) || !isStr(ride.from.label)) return false
  if (!isObj(ride.to) || !isStr(ride.to.label)) return false
  return (
    isNum(receipt.price) &&
    isNum(receipt.driverPayout) &&
    isNum(receipt.commissionRub) &&
    isNum(receipt.tip) &&
    typeof v.rated === 'boolean' &&
    isNum(v.tip) &&
    isNum(v.at)
  )
}

/** Загрузка истории поездок пассажира (валидация + лимит). null/[] — если данных нет. */
export function loadPassengerHistory(): StoredPassengerHistoryItem[] {
  try {
    if (typeof window === 'undefined') return []
    const raw = window.localStorage.getItem(PASSENGER_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!isObj(parsed) || parsed.version !== 1 || !Array.isArray(parsed.history)) return []
    return parsed.history.filter(isValidHistoryItem).slice(0, PASSENGER_HISTORY_LIMIT)
  } catch {
    return []
  }
}

export function savePassengerHistory(history: StoredPassengerHistoryItem[]): void {
  try {
    if (typeof window === 'undefined') return
    const state: StoredPassengerState = {
      version: 1,
      history: history.slice(0, PASSENGER_HISTORY_LIMIT),
    }
    window.localStorage.setItem(PASSENGER_STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* квота/приватный режим — молча пропускаем */
  }
}

// ===== Водитель: заработок смены =====

export interface StoredDriverEarnings {
  version: 1
  /** День сохранения (локальная дата): при смене дня смена начинается заново */
  day: string
  gross: number
  payout: number
  commission: number
  rides: number
  hoursOnline: number
  week: WeekDay[]
}

function isValidWeekDay(v: unknown): v is WeekDay {
  if (!isObj(v)) return false
  return (
    isStr(v.day) &&
    isNum(v.gross) &&
    isNum(v.payout) &&
    isNum(v.yandexPayout) &&
    typeof v.isToday === 'boolean'
  )
}

function isValidDriverEarnings(v: unknown): v is StoredDriverEarnings {
  if (!isObj(v) || v.version !== 1) return false
  if (!isStr(v.day)) return false
  if (!isNum(v.gross) || !isNum(v.payout) || !isNum(v.commission)) return false
  if (!isNum(v.rides) || !isNum(v.hoursOnline)) return false
  if (!Array.isArray(v.week) || !v.week.every(isValidWeekDay)) return false
  return v.gross >= 0 && v.payout >= 0 && v.rides >= 0
}

/**
 * Загрузка заработка водителя. Возвращает данные только если они сохранены
 * СЕГОДНЯ (локальная дата) — вчерашняя смена не переносится на новый день.
 */
export function loadDriverEarnings(): StoredDriverEarnings | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(DRIVER_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isValidDriverEarnings(parsed)) return null
    if (parsed.day !== localDay()) return null
    return parsed
  } catch {
    return null
  }
}

export function saveDriverEarnings(state: StoredDriverEarnings): void {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(DRIVER_STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* квота/приватный режим — молча пропускаем */
  }
}
