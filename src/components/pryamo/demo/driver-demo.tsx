'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Radio,
  TrendingUp,
  Users,
  Timer,
  Package,
  Banknote,
  TrendingDown,
  Flame,
  MapPin,
  CarFront,
  Check,
  Eye,
  Handshake,
  ShieldCheck,
  History,
  MousePointerClick,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { CityMap } from './city-map'
import { DemandForecast } from './demand-forecast'
import { useDemand, useDriverFeed, useDriverRide } from '@/lib/pryamo/socket'
import type { FeedHistoryEntry } from '@/lib/pryamo/socket'
import { rub, num, plural } from '@/lib/pryamo/format'
import type { OrderDTO, RideDTO, WeekDay } from '@/lib/pryamo/types'

// recharts — тяжёлый: грузим отдельным чанком после гидрации
const WeekChart = dynamic(() => import('./week-chart').then((m) => m.WeekChart), {
  ssr: false,
  loading: () => (
    <div className="mt-4 flex h-56 items-center justify-center rounded-xl border border-emerald-500/20 bg-zinc-950/50 text-xs text-zinc-600">
      график недели загружается…
    </div>
  ),
})

function timeLeft(expiresAt: string): number {
  return Math.max(0, Math.round((+new Date(expiresAt) - Date.now()) / 1000))
}

export function DriverDemo() {
  const [seen] = useState(() => new Set<string>())
  const [driverRide, setDriverRide] = useState<RideDTO | null>(null)

  const { orders, connected, history, markMine, markLost, markSkipped } = useDriverFeed((o) => {
    if (!seen.has(o.id)) {
      seen.add(o.id)
      toast({
        title: `Новый заказ: ${o.from.label} → ${o.to.label}`,
        description: `${o.distanceKm} км · выплата ${rub(o.driverPayout)}`,
      })
    }
  })

  const { zones, stats } = useDemand()

  const { accept, decline, earnings, week, lastRides } = useDriverRide({
    onRideState: (r) => setDriverRide(r),
    onCompleted: (r) => {
      setDriverRide(r)
      toast({
        title: 'Поездка завершена',
        description: `Выплата ${rub(r.driverPayout)} зачислена. Комиссия — только 8%.`,
      })
      setTimeout(() => setDriverRide(null), 6000)
    },
    onEarnings: () => {},
    onAcceptFailed: (id, reason) => {
      if (reason === 'taken') markLost(id)
      toast({
        title: reason === 'taken' ? 'Успели раньше вас' : 'Заказ недоступен',
        description: 'У нас это не штраф и не понижение приоритета. Просто не повезло.',
      })
    },
  })

  // Обёртки приёма/отказа: помечаем судьбу заказа для журнала ленты
  const handleAccept = (id: string) => {
    markMine(id)
    accept(id)
  }

  const handleDecline = (id: string) => {
    markSkipped(id)
    decline(id)
  }

  // Тикер времени истечения заказов
  const [, forceTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => forceTick((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const bestZone = useMemo(() => {
    if (!zones.length) return null
    return [...zones].sort((a, b) => b.demand - a.demand)[0]
  }, [zones])

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders]
  )

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      {/* Левая колонка: лента заказов + активная поездка */}
      <div className="flex min-w-0 flex-col gap-4">
        {/* Статус подключения */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-3.5 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={cn(
                  'absolute inline-flex h-full w-full rounded-full opacity-60',
                  connected ? 'animate-ping bg-emerald-400' : 'bg-rose-400'
                )}
              />
              <span
                className={cn(
                  'relative inline-flex h-2.5 w-2.5 rounded-full',
                  connected ? 'bg-emerald-400' : 'bg-rose-400'
                )}
              />
            </span>
            <span className="text-sm font-semibold text-zinc-200">
              {connected ? 'Вы онлайн · заказы летят' : 'Переподключение…'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-zinc-400">Отказ от заказа — без штрафа</span>
          </div>
        </div>

        {/* Активная поездка водителя */}
        <AnimatePresence>
          {driverRide && (
            <motion.div
              key="driver-ride"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/12 to-zinc-900/70 p-5 backdrop-blur"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CarFront className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-bold text-white">
                    {driverRide.status === 'arriving'
                      ? 'Едем к пассажиру'
                      : driverRide.status === 'onboard'
                        ? 'Пассажир в машине'
                        : 'Завершено'}
                  </h3>
                </div>
                <span className="rounded-lg bg-emerald-500/15 px-3 py-1 text-sm font-black tabular-nums text-emerald-300">
                  {rub(driverRide.driverPayout)}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                {driverRide.from.label} → {driverRide.to.label}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-1000"
                  style={{ width: `${Math.round((driverRide.progress ?? 0) * 100)}%` }}
                />
              </div>
              {driverRide.status === 'onboard' && (
                <p className="mt-2 text-xs text-zinc-500">
                  Осталось ~{driverRide.etaMin} мин · выплата фикс — не «оптимизируется»
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Лента заказов */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Package className="h-5 w-5 text-emerald-400" />
              Свободные заказы
              <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-sm font-black tabular-nums text-emerald-300">
                {sortedOrders.length}
              </span>
            </h3>
            <span className="text-xs text-zinc-500">первый взял — первый поехал</span>
          </div>

          <div className="feed-scroll max-h-[26rem] space-y-3 overflow-y-auto pr-2">
            <AnimatePresence initial={false}>
              {sortedOrders.map((o) => (
                <OrderCard key={o.id} order={o} onAccept={() => handleAccept(o.id)} onDecline={() => handleDecline(o.id)} />
              ))}
            </AnimatePresence>
            {sortedOrders.length === 0 && (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-sm text-zinc-500">
                {connected ? 'Ожидаем заказы… обычно каждые 5–10 секунд' : 'Подключаемся к движку…'}
              </div>
            )}
          </div>
        </div>

        {/* Журнал ленты: судьба каждого заказа + штрафа всегда ноль */}
        <OrderHistoryLog history={history} />
      </div>

      {/* Правая колонка: доход + спрос + платформа */}
      <div className="flex min-w-0 flex-col gap-4">
        {/* Доход за смену */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <Banknote className="h-5 w-5 text-emerald-400" />
            Смена сегодня
          </h3>
          {earnings ? (
            <>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Выплата на руки</p>
                  <p className="text-3xl font-black tabular-nums text-emerald-400">
                    {rub(earnings.payout)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">оборота</p>
                  <p className="text-xl font-bold tabular-nums text-zinc-300">{rub(earnings.gross)}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-zinc-950/60 p-2.5">
                  <p className="text-base font-black tabular-nums text-white">{earnings.rides}</p>
                  <p className="text-[10px] uppercase text-zinc-500">поездок</p>
                </div>
                <div className="rounded-lg bg-zinc-950/60 p-2.5">
                  <p className="text-base font-black tabular-nums text-white">
                    {earnings.hoursOnline.toFixed(1)}
                  </p>
                  <p className="text-[10px] uppercase text-zinc-500">часов</p>
                </div>
                <div className="rounded-lg bg-zinc-950/60 p-2.5">
                  <p className="text-base font-black tabular-nums text-rose-300">
                    {rub(earnings.commission)}
                  </p>
                  <p className="text-[10px] uppercase text-zinc-500">комиссия</p>
                </div>
              </div>

              {lastRides.length > 0 && (
                <div className="mt-4 space-y-1.5 border-t border-zinc-800 pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Последние поездки
                  </p>
                  {lastRides.slice(0, 4).map((r, i) => (
                    <div key={r.id ?? i} className="flex items-center justify-between text-xs">
                      <span className="max-w-44 truncate text-zinc-400">
                        <Check className="mr-1 inline h-3 w-3 text-emerald-500" />
                        {r.from?.label} → {r.to?.label}
                      </span>
                      <span className="font-bold tabular-nums text-emerald-400">
                        {rub(r.driverPayout)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 text-[11px] text-zinc-400">
                У монополиста с такого же оборота{' '}
                <strong className="text-rose-300">{rub(Math.round(earnings.gross * 0.4))}</strong>{' '}
                забрал бы агрегатор. У нас — {rub(earnings.commission)}.
                <span className="ml-1 font-bold text-emerald-300">
                  +{rub(Math.round(earnings.gross * 0.4 - earnings.commission))} в вашу пользу.
                </span>
              </div>

              {week.length > 0 && <WeekChart week={week} />}
            </>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">Загружаем данные смены…</p>
          )}
        </div>

        {/* Живая карта спроса */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
            <Flame className="h-5 w-5 text-amber-400" />
            Живой спрос по зонам
          </h3>
          <CityMap variant="demand" zones={zones} className="aspect-[5/3]" />
          {zones.length > 0 && (
            <div className="mt-3 space-y-2">
              {zones.map((z) => (
                <div
                  key={z.id}
                  className="flex items-center gap-3 rounded-lg px-1.5 py-1 text-xs transition-colors hover:bg-zinc-800/50"
                >
                  <span className="w-16 shrink-0 font-semibold text-zinc-300">{z.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${z.demand}%`,
                        background:
                          z.demand >= 75 ? '#f43f5e' : z.demand >= 55 ? '#f59e0b' : z.demand >= 35 ? '#eab308' : '#10b981',
                      }}
                    />
                  </div>
                  <span className="w-28 shrink-0 text-right tabular-nums text-zinc-500">
                    {z.ordersWaiting} зак. · ~{z.avgWaitMin} мин
                  </span>
                </div>
              ))}
              {bestZone && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3 text-xs text-emerald-200">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>
                    Совет зоны: <strong>{bestZone.name}</strong> — спрос {bestZone.demand}%,{' '}
                    {bestZone.waitingDrivers} {plural(bestZone.waitingDrivers, 'водитель', 'водителя', 'водителей')}{' '}
                    в очереди. Если x{bestZone.surge.toFixed(1)} — ваша доля вырастет вместе с коэффициентом.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Прогноз спроса по часам */}
        <DemandForecast zones={zones} />

        {/* Статистика платформы */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              icon={Users}
              label="водителей онлайн"
              value={num(stats.onlineDrivers)}
              accent="text-white"
            />
            <StatTile
              icon={Radio}
              label="заказов в час"
              value={num(stats.ordersPerHour)}
              accent="text-white"
            />
            <StatTile
              icon={Timer}
              label="среднее ожидание"
              value={`${Math.round(stats.avgWaitSec / 60)} мин`}
              accent="text-white"
            />
            <StatTile
              icon={TrendingDown}
              label="завершено сегодня"
              value={num(stats.completedToday)}
              accent="text-emerald-300"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function OrderCard({
  order,
  onAccept,
  onDecline,
}: {
  order: OrderDTO
  onAccept: () => void
  onDecline: () => void
}) {
  const left = timeLeft(order.expiresAt)
  const total = Math.max(
    1,
    Math.round((+new Date(order.expiresAt) - +new Date(order.createdAt)) / 1000)
  )
  const leftPct = Math.min(100, Math.round((left / total) * 100))
  const watching = order.watchingDrivers ?? 0

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="order-flash group rounded-xl border border-zinc-700/80 bg-zinc-950/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">{order.tariff.name}</span>
            {order.surge > 1.05 && (
              <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-amber-300">
                спрос ×{order.surge.toFixed(1)}
              </span>
            )}
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5',
                watching >= 15
                  ? 'bg-rose-500/15 text-rose-300'
                  : watching >= 8
                    ? 'bg-amber-400/15 text-amber-300'
                    : 'bg-emerald-500/15 text-emerald-300',
              )}
            >
              <Eye className="h-3 w-3" aria-hidden="true" />
              {watching > 0 &&
                `${watching} ${plural(watching, 'водитель видит', 'водителя видят', 'водителей видят')}`}
            </span>
          </div>
          <p className="mt-1.5 flex items-center gap-1 truncate text-sm font-semibold text-zinc-200">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            {order.from.label}
            <span className="ml-1 shrink-0 text-[11px] font-medium normal-case text-zinc-600">
              {order.distanceKm} км · {order.durationMin} мин
            </span>
          </p>
          <p className="flex items-center gap-1 truncate text-sm text-zinc-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            {order.to.label}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-black tabular-nums leading-none text-emerald-400">
            {rub(order.driverPayout)}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            чек {rub(order.priceTotal)} · −8%
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000',
              leftPct > 40 ? 'bg-emerald-500' : leftPct > 15 ? 'bg-amber-400' : 'bg-rose-500'
            )}
            style={{ width: `${leftPct}%` }}
          />
        </div>
        <span className="text-[11px] tabular-nums text-zinc-500">{left} с</span>
      </div>

      <div className="mt-3 flex gap-2 opacity-90 transition-opacity group-hover:opacity-100">
        <Button
          onClick={onAccept}
          size="sm"
          className="h-9 flex-1 bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
        >
          <Handshake className="mr-1.5 h-4 w-4" />
          Взять за {rub(order.driverPayout)}
        </Button>
        <Button
          onClick={onDecline}
          size="sm"
          variant="outline"
          className="h-9 border-zinc-700 px-3 text-zinc-500 hover:text-zinc-300"
          aria-label="Пропустить заказ без штрафа"
        >
          Мимо
        </Button>
      </div>
    </motion.article>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 transition-colors hover:border-emerald-500/30 hover:bg-zinc-900">
      <Icon className="h-4 w-4 text-emerald-400" />
      <p className={cn('mt-1.5 text-xl font-black tabular-nums', accent)}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
    </div>
  )
}

// ===== Журнал ленты: судьба каждого заказа =====

type HistoryFilter = 'all' | FeedHistoryEntry['status']

const HISTORY_STATUS: Record<
  FeedHistoryEntry['status'],
  { chip: string; icon: React.ComponentType<{ className?: string }>; chipCls: string; payCls: string }
> = {
  mine: {
    chip: 'взято вами',
    icon: Check,
    chipCls: 'bg-emerald-500/15 text-emerald-300',
    payCls: 'text-emerald-400',
  },
  skipped: {
    chip: 'вы нажали «Мимо»',
    icon: MousePointerClick,
    chipCls: 'bg-amber-400/10 text-amber-300',
    payCls: 'text-zinc-500',
  },
  lost: {
    chip: 'у другого водителя',
    icon: Eye,
    chipCls: 'bg-zinc-700/50 text-zinc-400',
    payCls: 'text-zinc-500',
  },
  expired: {
    chip: 'никто не взял',
    icon: Clock,
    chipCls: 'bg-zinc-800/80 text-zinc-500',
    payCls: 'text-zinc-600',
  },
}

function historyTime(at: number): string {
  return new Date(at).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function OrderHistoryLog({ history }: { history: FeedHistoryEntry[] }) {
  const [filter, setFilter] = useState<HistoryFilter>('all')

  const counts = useMemo(
    () => ({
      all: history.length,
      mine: history.filter((h) => h.status === 'mine').length,
      skipped: history.filter((h) => h.status === 'skipped').length,
      lost: history.filter((h) => h.status === 'lost').length,
      expired: history.filter((h) => h.status === 'expired').length,
    }),
    [history]
  )

  const filtered = filter === 'all' ? history : history.filter((h) => h.status === filter)

  const chips: { key: HistoryFilter; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'mine', label: 'Ваши' },
    { key: 'skipped', label: 'Пропущенные' },
    { key: 'lost', label: 'У других' },
    { key: 'expired', label: 'Истекли' },
  ]

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <History className="h-5 w-5 text-emerald-400" />
          Журнал ленты
          <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-sm font-black tabular-nums text-emerald-300">
            {history.length}
          </span>
        </h3>
        <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          штрафов за смену: 0 ₽
        </span>
      </div>
      <p className="mt-1.5 text-xs text-zinc-500">
        Судьба каждого заказа, который прошёл через ленту. У монополиста отказы из этой ленты
        роняют «карточку качества» — у нас просто остаются в журнале.
      </p>

      {history.length > 0 && (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chips.map((c) => {
              const n = counts[c.key]
              const isActive = filter === c.key
              return (
                <button
                  key={c.key}
                  onClick={() => setFilter(c.key)}
                  aria-pressed={isActive}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
                    isActive
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                      : 'border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                  )}
                >
                  {c.label} <span className="ml-0.5 font-black tabular-nums">{n}</span>
                </button>
              )
            })}
          </div>

          <div className="feed-scroll mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {filtered.map((h) => {
                const meta = HISTORY_STATUS[h.status]
                const o = h.order
                return (
                  <motion.div
                    key={h.id + h.at}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2.5 rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2 transition-colors hover:border-zinc-700"
                  >
                    <span
                      className={cn(
                        'shrink-0 rounded-md p-1.5',
                        meta.chipCls
                      )}
                    >
                      <meta.icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-zinc-300">
                        {o.from.label} → {o.to.label}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-zinc-600">
                        {o.tariff.name} · {meta.chip}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn('text-xs font-bold tabular-nums', meta.payCls)}>
                        {h.status === 'mine' ? '+' : ''}{rub(o.driverPayout)}
                      </p>
                      <p className="text-[10px] tabular-nums text-zinc-600">{historyTime(h.at)}</p>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-500">
                В этой категории пока пусто
              </div>
            )}
          </div>
        </>
      )}

      {history.length === 0 && (
        <div className="mt-3 flex h-28 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-500">
          Ждём первых разобранных заказов — обычно через 30–60 секунд
        </div>
      )}
    </div>
  )
}

/** График «доход за неделю»: ПРЯМО против гипотезы «у монополиста» (−40%) */
