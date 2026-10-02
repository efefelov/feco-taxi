'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type {
  EarningsToday,
  LiveStats,
  OrderDTO,
  RideDTO,
  Receipt,
  WeekDay,
  ZoneDTO,
} from '@/lib/pryamo/types'

// ===== Хелперы-подписки =====

/**
 * Лёгкий статус демо-движка для навигации и hero:
 * одно соединение без входа в комнаты — движок рассылает stats:live всем.
 * Переподключается бесконечно, чтобы статус всегда был честным.
 */
export function useEngineStatus() {
  const [connected, setConnected] = useState(false)
  const [stats, setStats] = useState<LiveStats | null>(null)

  useEffect(() => {
    const s = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    })
    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))
    s.on('connect_error', () => setConnected(false))
    s.on('stats:live', (d: LiveStats) => setStats(d))
    return () => {
      s.disconnect()
    }
  }, [])

  return { connected, stats }
}

/** Запись в журнале ленты: судьба заказа после исчезновения из общего фида */
export interface FeedHistoryEntry {
  id: string
  /** mine — взяли вы; skipped — вы нажали «Мимо»; lost — забрал другой; expired — никто не взял */
  status: 'mine' | 'skipped' | 'lost' | 'expired'
  at: number
  order: OrderDTO
}

export function useDriverFeed(onOrder: (o: OrderDTO) => void) {
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [history, setHistory] = useState<FeedHistoryEntry[]>([])
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  /** Снапшоты заказов для журнала (ограничен 200 записями) */
  const ordersMapRef = useRef(new Map<string, OrderDTO>())
  /** Заказы, которые попытались взять вы (для различения «взяли вы» vs «другой водитель») */
  const mineRef = useRef(new Set<string>())
  /** Заказы, которые вы сознательно пропустили («Мимо») */
  const skippedRef = useRef(new Set<string>())

  const snapshot = useCallback((o: OrderDTO) => {
    const m = ordersMapRef.current
    m.set(o.id, o)
    if (m.size > 200) {
      const first = m.keys().next().value
      if (typeof first === 'string') m.delete(first)
    }
  }, [])

  useEffect(() => {
    const s = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
    })
    socketRef.current = s

    const upsert = (o: OrderDTO) =>
      setOrders((prev) => {
        const i = prev.findIndex((x) => x.id === o.id)
        if (i >= 0) {
          const next = [...prev]
          next[i] = o
          return next
        }
        return [...prev, o].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      })

    s.on('connect', () => {
      setConnected(true)
      s.emit('driver:join', {})
    })
    s.on('disconnect', () => setConnected(false))
    s.on('connect_error', () => setConnected(false))
    s.on('feed:state', (d: { orders: OrderDTO[] }) => {
      setOrders(d.orders ?? [])
      ;(d.orders ?? []).forEach(snapshot)
    })
    s.on('orders:new', (d: { order: OrderDTO }) => {
      upsert(d.order)
      snapshot(d.order)
      onOrder(d.order)
    })
    s.on('orders:update', (d: { order: OrderDTO }) => {
      upsert(d.order)
      snapshot(d.order)
    })
    s.on('orders:remove', (d: { id: string; reason?: 'taken' | 'expired' }) => {
      const snap = ordersMapRef.current.get(d.id)
      if (snap) {
        // Ваше действие информативнее исхода: сначала «взяли вы», затем «вы нажали Мимо»,
        // и только потом — чем закончилась жизнь заказа (истёк / у другого)
        const status: FeedHistoryEntry['status'] = mineRef.current.has(d.id)
          ? 'mine'
          : skippedRef.current.has(d.id)
            ? 'skipped'
            : d.reason === 'expired'
              ? 'expired'
              : 'lost'
        setHistory((prev) => [{ id: d.id, status, at: Date.now(), order: snap }, ...prev].slice(0, 40))
      }
      ordersMapRef.current.delete(d.id)
      setOrders((prev) => prev.filter((o) => o.id !== d.id))
    })

    return () => {
      s.disconnect()
    }
  }, [])

  /** Отметить: этот заказ пытаетесь взять вы (до emit driver:accept) */
  const markMine = useCallback((id: string) => {
    mineRef.current.add(id)
  }, [])

  /** Коррекция гонки: заказ успели взять раньше вас — переписываем судьбу записи */
  const markLost = useCallback((id: string) => {
    mineRef.current.delete(id)
    setHistory((prev) =>
      prev.map((h) => (h.id === id && h.status === 'mine' ? { ...h, status: 'lost' } : h))
    )
  }, [])

  /** Отметить: этот заказ вы сознательно пропустили («Мимо») */
  const markSkipped = useCallback((id: string) => {
    skippedRef.current.add(id)
  }, [])

  return { orders, connected, history, markMine, markLost, markSkipped }
}

export function useDemand() {
  const [zones, setZones] = useState<ZoneDTO[]>([])
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [updatedAt, setUpdatedAt] = useState<number>(0)

  useEffect(() => {
    const s = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
    })
    s.on('connect', () => s.emit('driver:join', {}))
    s.on('demand:state', (d: { zones: ZoneDTO[]; updatedAt?: string }) => {
      setZones(d.zones ?? [])
      setUpdatedAt(Date.now())
    })
    s.on('stats:live', (d: LiveStats) => setStats(d))
    return () => {
      s.disconnect()
    }
  }, [])

  return { zones, stats, updatedAt }
}

export interface PassengerRideHandlers {
  onRideState: (ride: RideDTO) => void
  onCompleted: (ride: RideDTO, receipt: Receipt) => void
  onRated: (msg: string) => void
}

export function usePassengerRide(handlers: PassengerRideHandlers) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const s = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
    })
    socketRef.current = s
    s.on('connect', () => {
      setConnected(true)
      s.emit('passenger:join', {})
    })
    s.on('disconnect', () => setConnected(false))
    s.on('connect_error', () => setConnected(false))
    s.on('ride:state', (d: { ride: RideDTO }) => handlersRef.current.onRideState(d.ride))
    s.on('ride:completed', (d: { ride: RideDTO; receipt: Receipt }) =>
      handlersRef.current.onCompleted(d.ride, d.receipt)
    )
    s.on('ride:rated', (d: { ok: boolean; message: string }) => handlersRef.current.onRated(d.message))
    return () => {
      s.disconnect()
      socketRef.current = null
    }
  }, [])

  const book = (payload: { from: string; to: string; tariffId: string }) =>
    socketRef.current?.emit('passenger:book', payload)

  const rate = (payload: {
    rideId: string
    axes: { punctuality: number; driving: number; comfort: number; cleanliness: number }
    tip: number
  }) => socketRef.current?.emit('ride:rate', payload)

  return { book, rate, connected }
}

export interface DriverRideHandlers {
  onRideState: (ride: RideDTO) => void
  onCompleted: (ride: RideDTO, receipt: Receipt) => void
  onEarnings: (today: EarningsToday, lastRides: RideDTO[]) => void
  onAcceptFailed: (orderId: string, reason: string) => void
}

export function useDriverRide(handlers: DriverRideHandlers) {
  const socketRef = useRef<Socket | null>(null)
  const [earnings, setEarnings] = useState<EarningsToday | null>(null)
  const [week, setWeek] = useState<WeekDay[]>([])
  const [lastRides, setLastRides] = useState<RideDTO[]>([])
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const s = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
    })
    socketRef.current = s
    s.on('connect', () => s.emit('driver:join', {}))
    s.on('ride:state', (d: { ride: RideDTO }) => handlersRef.current.onRideState(d.ride))
    s.on('ride:completed', (d: { ride: RideDTO; receipt: Receipt }) =>
      handlersRef.current.onCompleted(d.ride, d.receipt)
    )
    s.on('driver:earnings', (d: {
      today: EarningsToday
      week?: WeekDay[]
      lastRides: RideDTO[]
    }) => {
      setEarnings(d.today)
      if (d.week) setWeek(d.week)
      setLastRides(d.lastRides ?? [])
      handlersRef.current.onEarnings(d.today, d.lastRides ?? [])
    })
    s.on('driver:accept-failed', (d: { orderId: string; reason: string }) =>
      handlersRef.current.onAcceptFailed(d.orderId, d.reason)
    )
    return () => {
      s.disconnect()
      socketRef.current = null
    }
  }, [])

  const accept = (orderId: string) => socketRef.current?.emit('driver:accept', { orderId })
  const decline = (orderId: string) => socketRef.current?.emit('driver:decline', { orderId })

  return { accept, decline, earnings, week, lastRides }
}
