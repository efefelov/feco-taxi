// Типы контракта ride-engine (порт 3003) — см. worklog.md, часть 3.4

export interface Tariff {
  id: string
  name: string
  description: string
  multiplier: number
  baseFare: number
  perKm: number
  perMin: number
  carClass: string
  sortOrder: number
}

export interface MarketStat {
  id: string
  label: string
  value: number
  unit: string
  hint: string
  source: string
  tone: 'danger' | 'success' | 'neutral'
}

export interface DriverProfile {
  id: string
  name: string
  initials: string
  car: string
  plate: string
  rating: number
  rides: number
  years: number
  isPro: boolean
  city: string
}

export interface RideRecord {
  id: string
  driverName: string
  fromLabel: string
  toLabel: string
  distanceKm: number
  durationMin: number
  tariffName: string
  priceTotal: number
  driverPayout: number
  commission: number
  surge: number
  tip: number
  platform: string
  createdAt: string
}

// ===== WebSocket DTO =====

export interface OrderAddress {
  label: string
  zoneId: string
}

export interface OrderDTO {
  id: string
  from: OrderAddress
  to: OrderAddress
  distanceKm: number
  durationMin: number
  tariff: { id: string; name: string; multiplier: number }
  priceTotal: number
  driverPayout: number
  commissionRub: number
  surge: number
  createdAt: string
  expiresAt: string
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

export interface LiveStats {
  activeDrivers: number
  onlineDrivers: number
  ordersPerHour: number
  avgWaitSec: number
  completedToday: number
  grossTodayRub: number
}

export interface RideDriver {
  name: string
  initials: string
  car: string
  plate: string
  rating: number
  rides: number
}

export interface RideDTO {
  id: string
  status: 'searching' | 'arriving' | 'onboard' | 'completed'
  driver: RideDriver | null
  from: OrderAddress
  to: OrderAddress
  distanceKm: number
  etaMin: number
  progress: number
  priceTotal: number
  driverPayout: number
  tariffName: string
  hint?: string
  startedAt?: string
}

export interface Receipt {
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

export interface CalculatorResult {
  input: { hoursPerDay: number; daysPerMonth: number; avgCheck: number; ridesPerHour: number }
  ridesPerMonth: number
  grossMonthly: number
  yandex: { commissionRate: string; monthly: number; yearly: number; lostYearly: number }
  pryamoPro: { commissionRate: string; monthly: number; yearly: number }
  pryamoPayg: { commissionRate: string; monthly: number; yearly: number }
  diffMonthly: number
  diffYearly: number
  diffPercent: number
  proBreakEven: number
}
