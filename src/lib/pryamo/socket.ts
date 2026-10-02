'use client'

import { useEffect, useRef, useState } from 'react'
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

export function useDriverFeed(onOrder: (o: OrderDTO) => void) {
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)

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
    s.on('feed:state', (d: { orders: OrderDTO[] }) => setOrders(d.orders ?? []))
    s.on('orders:new', (d: { order: OrderDTO }) => {
      upsert(d.order)
      onOrder(d.order)
    })
    s.on('orders:update', (d: { order: OrderDTO }) => upsert(d.order))
    s.on('orders:remove', (d: { id: string }) =>
      setOrders((prev) => prev.filter((o) => o.id !== d.id))
    )

    return () => {
      s.disconnect()
    }
  }, [])

  return { orders, connected }
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
