'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { localEngine, LOCAL_ZONES, LOCAL_DRIVER, setLocalModeActive } from './mvp-local'
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
 * MVP-сокеты приложения «ПРЯМО» (движок :3003).
 *
 * Отличие от демо-хуков (socket.ts): обе роли живут одновременно в одном
 * оверлее приложения — заказ пассажира реально попадает в ленту водителя
 * (mvp:book), принятие связывает сессии обоих (driver:accept → общая
 * ride:state), водитель управляет этапами (driver:advance), пассажир
 * может отменить поиск (mvp:cancel).
 *
 * Офлайн-режим: если движок недоступен (статик-прод GitHub Pages, закрытый
 * порт), через ~3,5 секунды хуки переключаются на локальный мини-движок
 * (mvp-local.ts) с тем же контрактом — обе роли продолжают работать.
 */

const LOCAL_FALLBACK_MS = 3500

export interface MvpPassengerHandlers {
  onRideState: (ride: RideDTO) => void
  onCompleted: (ride: RideDTO, receipt: Receipt) => void
  onRated: (message: string) => void
  onFailed: (reason: string) => void
  onCancelled: (ok: boolean) => void
}

export function useMvpPassenger(handlers: MvpPassengerHandlers) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [localMode, setLocalMode] = useState(false)
  const [zones, setZones] = useState<ZoneDTO[]>([])
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const s = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    })
    socketRef.current = s
    s.on('connect', () => {
      setConnected(true)
      setLocalMode(false)
      setLocalModeActive(false)
      s.emit('passenger:join', {})
    })
    s.on('disconnect', () => setConnected(false))
    s.on('connect_error', () => setConnected(false))
    s.on('ride:state', (d: { ride: RideDTO }) => handlersRef.current.onRideState(d.ride))
    s.on('ride:completed', (d: { ride: RideDTO; receipt: Receipt }) =>
      handlersRef.current.onCompleted(d.ride, d.receipt)
    )
    s.on('ride:rated', (d: { ok: boolean; message: string }) => handlersRef.current.onRated(d.message))
    s.on('ride:failed', (d: { reason: string }) => handlersRef.current.onFailed(d.reason))
    s.on('ride:cancelled', (d: { ok: boolean }) => handlersRef.current.onCancelled(d.ok))
    // спрос по зонам: движок рассылает demand:state всем сокетам каждые ~5 с —
    // из него форма заказа берёт живой коэффициент для зоны подачи
    s.on('demand:state', (d: { zones: ZoneDTO[] }) => setZones(d.zones ?? []))
    return () => {
      s.disconnect()
      socketRef.current = null
    }
  }, [])

  // Переключение на локальный движок: если подключение не состоялось
  // за LOCAL_FALLBACK_MS — работаем офлайн (тот же контракт)
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!socketRef.current?.connected) setLocalMode(true)
    }, LOCAL_FALLBACK_MS)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (localMode) setLocalModeActive(true)
  }, [localMode])

  useEffect(() => {
    if (!localMode) return
    localEngine.joinPassenger(handlers)
    return () => localEngine.leavePassenger()
  }, [localMode, handlers])

  const book = useCallback(
    (payload: { from: string; to: string; tariffId: string }) => {
      if (localMode) localEngine.book(payload)
      else socketRef.current?.emit('mvp:book', payload)
    },
    [localMode]
  )

  const cancel = useCallback(() => {
    if (localMode) localEngine.cancel()
    else socketRef.current?.emit('mvp:cancel', {})
  }, [localMode])

  const rate = useCallback(
    (payload: {
      rideId: string
      axes: { punctuality: number; driving: number; comfort: number; cleanliness: number }
      tip: number
      /** Причины низкой оценки — обратная связь для водителя */
      reasons?: string[]
      /** true — это комплимент одним тапом (положительный фидбек), не жалоба */
      compliment?: boolean
    }) => {
      if (localMode) localEngine.rate(payload.rideId, payload.tip, payload.reasons, payload.compliment)
      else socketRef.current?.emit('ride:rate', payload)
    },
    [localMode]
  )

  return {
    book,
    cancel,
    rate,
    connected: localMode || connected,
    zones: localMode ? LOCAL_ZONES : zones,
  }
}

export interface MvpDriverHandlers {
  onOrderNew?: (order: OrderDTO) => void
  onRideState: (ride: RideDTO) => void
  onCompleted: (ride: RideDTO, receipt: Receipt) => void
  onAcceptFailed: (orderId: string, reason: string) => void
}

export function useMvpDriver(handlers: MvpDriverHandlers) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [localMode, setLocalMode] = useState(false)
  const [online, setOnline] = useState(false)
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [identity, setIdentity] = useState<RideDriver | null>(null)
  const [earnings, setEarnings] = useState<EarningsToday | null>(null)
  const [week, setWeek] = useState<WeekDay[]>([])
  const [lastRides, setLastRides] = useState<RideDTO[]>([])
  const [zones, setZones] = useState<ZoneDTO[]>([])
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const s = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
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
      setLocalMode(false)
      setLocalModeActive(false)
      s.emit('driver:join', {})
      // после переподключения восстанавливаем онлайн-статус, если был
      setOnline((was) => {
        if (was) s.emit('driver:go-online', {})
        return was
      })
    })
    s.on('disconnect', () => setConnected(false))
    s.on('connect_error', () => setConnected(false))
    s.on('feed:state', (d: { orders: OrderDTO[] }) => setOrders(d.orders ?? []))
    s.on('orders:new', (d: { order: OrderDTO }) => {
      upsert(d.order)
      handlersRef.current.onOrderNew?.(d.order)
    })
    s.on('orders:update', (d: { order: OrderDTO }) => upsert(d.order))
    s.on('orders:remove', (d: { id: string }) =>
      setOrders((prev) => prev.filter((o) => o.id !== d.id))
    )
    s.on('driver:identity', (d: { driver: RideDriver }) => setIdentity(d.driver))
    s.on('driver:online', (d: { online: boolean }) => setOnline(d.online))
    s.on('driver:earnings', (d: { today: EarningsToday; week?: WeekDay[]; lastRides?: RideDTO[] }) => {
      setEarnings(d.today)
      if (d.week) setWeek(d.week)
      setLastRides(d.lastRides ?? [])
    })
    s.on('ride:state', (d: { ride: RideDTO }) => handlersRef.current.onRideState(d.ride))
    s.on('ride:completed', (d: { ride: RideDTO; receipt: Receipt }) =>
      handlersRef.current.onCompleted(d.ride, d.receipt)
    )
    s.on('driver:accept-failed', (d: { orderId: string; reason: string }) =>
      handlersRef.current.onAcceptFailed(d.orderId, d.reason)
    )
    s.on('demand:state', (d: { zones: ZoneDTO[] }) => setZones(d.zones ?? []))
    return () => {
      s.disconnect()
      socketRef.current = null
    }
  }, [])

  // Переключение на локальный движок: если подключение не состоялось
  // за LOCAL_FALLBACK_MS — работаем офлайн (тот же контракт)
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!socketRef.current?.connected) setLocalMode(true)
    }, LOCAL_FALLBACK_MS)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (localMode) setLocalModeActive(true)
  }, [localMode])

  // Офлайн-режим: тот же контракт на локальном мини-движке
  useEffect(() => {
    if (!localMode) return
    localEngine.joinDriver(handlers)
    setIdentity(LOCAL_DRIVER)
    setOnline(localEngine.isDriverOnline())
    const snap = localEngine.driverSnapshot()
    setOrders(snap.orders)
    setEarnings(snap.earnings)
    setWeek(snap.week)
    setLastRides(snap.lastRides)
    setZones(LOCAL_ZONES)
    // Срез состояния обновляем каждые 2 с: лента, доход, неделя;
    // тик подмешивает демо-заказы, когда приложение пассажира рядом молчит
    const t = window.setInterval(() => {
      localEngine.tick()
      const s2 = localEngine.driverSnapshot()
      setOrders(s2.orders)
      setEarnings(s2.earnings)
      setWeek(s2.week)
      setLastRides(s2.lastRides)
    }, 2000)
    return () => {
      window.clearInterval(t)
      localEngine.leaveDriver()
    }
  }, [localMode, handlers])

  const goOnline = useCallback(() => {
    if (localMode) {
      localEngine.goOnline()
      setOnline(true)
      const snap = localEngine.driverSnapshot()
      setEarnings(snap.earnings)
      setWeek(snap.week)
    } else {
      socketRef.current?.emit('driver:go-online', {})
      setOnline(true)
    }
  }, [localMode])

  const goOffline = useCallback(() => {
    if (localMode) {
      localEngine.goOffline()
      setOnline(false)
    } else {
      socketRef.current?.emit('driver:go-offline', {})
      setOnline(false)
    }
  }, [localMode])

  const accept = useCallback(
    (orderId: string) => {
      if (localMode) localEngine.accept(orderId)
      else socketRef.current?.emit('driver:accept', { orderId })
    },
    [localMode]
  )

  const decline = useCallback(
    (orderId: string) => {
      if (localMode) localEngine.decline(orderId)
      else socketRef.current?.emit('driver:decline', { orderId })
    },
    [localMode]
  )

  const advance = useCallback(() => {
    if (localMode) localEngine.advance()
    else socketRef.current?.emit('driver:advance', {})
  }, [localMode])

  return {
    connected: localMode || connected,
    online,
    orders,
    identity,
    earnings,
    week,
    lastRides,
    zones,
    goOnline,
    goOffline,
    accept,
    decline,
    advance,
  }
}
