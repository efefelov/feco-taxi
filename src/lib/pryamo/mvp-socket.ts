'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
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
 */

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

  const book = useCallback((payload: { from: string; to: string; tariffId: string }) => {
    socketRef.current?.emit('mvp:book', payload)
  }, [])

  const cancel = useCallback(() => {
    socketRef.current?.emit('mvp:cancel', {})
  }, [])

  const rate = useCallback((payload: {
    rideId: string
    axes: { punctuality: number; driving: number; comfort: number; cleanliness: number }
    tip: number
  }) => {
    socketRef.current?.emit('ride:rate', payload)
  }, [])

  return { book, cancel, rate, connected, zones }
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
  const [online, setOnline] = useState(false)
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [identity, setIdentity] = useState<RideDriver | null>(null)
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
    return () => {
      s.disconnect()
      socketRef.current = null
    }
  }, [])

  const goOnline = useCallback(() => {
    socketRef.current?.emit('driver:go-online', {})
    setOnline(true)
  }, [])

  const goOffline = useCallback(() => {
    socketRef.current?.emit('driver:go-offline', {})
    setOnline(false)
  }, [])

  const accept = useCallback((orderId: string) => {
    socketRef.current?.emit('driver:accept', { orderId })
  }, [])

  const decline = useCallback((orderId: string) => {
    socketRef.current?.emit('driver:decline', { orderId })
  }, [])

  const advance = useCallback(() => {
    socketRef.current?.emit('driver:advance', {})
  }, [])

  return {
    connected,
    online,
    orders,
    identity,
    earnings,
    week,
    lastRides,
    goOnline,
    goOffline,
    accept,
    decline,
    advance,
  }
}
