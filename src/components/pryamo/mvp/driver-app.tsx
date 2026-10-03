'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  CarFront,
  Wallet,
  User,
  Zap,
  Power,
  MapPin,
  Navigation,
  Route as RouteIcon,
  Clock,
  Eye,
  Users,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Star,
  ShieldCheck,
  BadgePercent,
  Timer,
  Link2,
  Banknote,
  Flame,
  Handshake,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useMvpDriver } from '@/lib/pryamo/mvp-socket'
import { rub, plural } from '@/lib/pryamo/format'
import type { OrderDTO, RideDTO } from '@/lib/pryamo/types'

// recharts — тяжёлый, грузим отдельным чанком
const WeekChart = dynamic(() => import('../demo/week-chart').then((m) => m.WeekChart), {
  ssr: false,
  loading: () => (
    <div className="mt-3 flex h-40 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/50 text-[10px] text-zinc-600">
      график недели загружается…
    </div>
  ),
})

function timeLeft(expiresAt: string): number {
  return Math.max(0, Math.round((+new Date(expiresAt) - Date.now()) / 1000))
}

type Tab = 'shift' | 'earnings' | 'profile'

export function DriverApp({ onOpenPassenger }: { onOpenPassenger?: () => void }) {
  const [tab, setTab] = useState<Tab>('shift')
  const [driverRide, setDriverRide] = useState<RideDTO | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [seen] = useState(() => new Set<string>())

  // Тикер для обратного отсчёта заказов
  const [, forceTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => forceTick((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const {
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
  } = useMvpDriver({
    onOrderNew: (o) => {
      if (!seen.has(o.id)) {
        seen.add(o.id)
        if (online) {
          toast({
            title: `Новый заказ: ${o.from.label} → ${o.to.label}`,
            description: `${o.distanceKm} км · выплата ${rub(o.driverPayout)} · видят ${o.watchingDrivers} водителей`,
          })
        }
      }
    },
    onRideState: (r) => {
      setDriverRide(r)
      if (r.status !== 'completed' && r.status !== 'searching') setTab('shift')
    },
    onCompleted: (r) => {
      setDriverRide(r)
      toast({
        title: 'Поездка завершена',
        description: `Выплата ${rub(r.driverPayout)} зачислена. Комиссия — только 12%.`,
      })
      setTimeout(() => setDriverRide((cur) => (cur?.id === r.id ? null : cur)), 5000)
    },
    onAcceptFailed: (id, reason) => {
      toast({
        title: reason === 'taken' ? 'Успели раньше вас' : 'Заказ недоступен',
        description:
          reason === 'busy'
            ? 'Сначала завершите текущую поездку — верёвка: один активный заказ.'
            : 'У нас это не штраф и не понижение приоритета. Просто не повезло.',
      })
    },
  })

  const inRide = driverRide !== null && driverRide.status !== 'completed'
  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders]
  )

  // Показатель «выплата»: с Pro комиссия 0 (образовательный переключатель)
  const payoutNow = earnings ? (isPro ? earnings.gross : earnings.payout) : 0
  const proDelta = earnings ? earnings.commission - (earnings.gross > 20750 ? 2490 : 0) : 0

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-950">
      {/* ===== Шапка ===== */}
      <header className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-zinc-950">
            <CarFront className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <div className="leading-none">
            <p className="text-sm font-black tracking-tight text-white">ПРЯМО</p>
            <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-amber-400">
              приложение водителя
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {identity && (
            <span className="hidden items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold text-zinc-300 sm:flex">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
              {identity.rating.toFixed(2)}
            </span>
          )}
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold',
              online
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400'
            )}
            role="status"
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                online ? 'animate-pulse bg-emerald-400' : 'bg-zinc-500'
              )}
            />
            {online ? 'на линии' : 'офлайн'}
          </span>
        </div>
      </header>

      {/* ===== Контент ===== */}
      <div className="pryamo-scroll min-h-0 flex-1 overflow-y-auto">
        {tab === 'shift' && (
          <div className="space-y-3 p-4">
            {/* Тумблер смены */}
            <button
              onClick={() => (online ? goOffline() : goOnline())}
              className={cn(
                'flex w-full items-center justify-between rounded-2xl border p-4 transition-all',
                online
                  ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 to-zinc-900'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              )}
              aria-pressed={online}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl ring-1',
                    online
                      ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-500 ring-zinc-700'
                  )}
                >
                  <Power className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-left">
                  <span className="block text-sm font-black text-white">
                    {online ? 'Вы на линии' : 'Начать смену'}
                  </span>
                  <span className="block text-[11px] text-zinc-500">
                    {online
                      ? `заказы летят · сейчас в ленте ${orders.length}`
                      : 'выйдите на линию — и лента оживёт'}
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  'relative h-7 w-12 rounded-full transition-colors',
                  online ? 'bg-emerald-500' : 'bg-zinc-700'
                )}
                aria-hidden
              >
                <span
                  className={cn(
                    'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all',
                    online ? 'left-6' : 'left-1'
                  )}
                />
              </span>
            </button>

            {/* Активная поездка */}
            <AnimatePresence>
              {inRide && driverRide && (
                <motion.div
                  key="active-ride"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-400/10 to-zinc-900"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4.5 w-4.5 text-amber-400" aria-hidden />
                        <p className="text-sm font-black text-white">
                          {driverRide.status === 'arriving'
                            ? 'Едете к пассажиру'
                            : 'Пассажир в салоне'}
                        </p>
                      </div>
                      <span className="rounded-lg bg-amber-400/15 px-2.5 py-1 text-sm font-black tabular-nums text-amber-300">
                        +{rub(driverRide.driverPayout)}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
                        <p className="text-xs font-semibold text-zinc-200">{driverRide.from.label}</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
                        <p className="text-xs font-semibold text-zinc-200">{driverRide.to.label}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <RouteIcon className="h-3 w-3" aria-hidden />
                        {driverRide.distanceKm} км
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden />
                        ~{driverRide.etaMin} мин
                      </span>
                      <span className="flex items-center gap-1">
                        <Banknote className="h-3 w-3" aria-hidden />
                        чек {rub(driverRide.priceTotal)} · ваши 88%
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-1000"
                        style={{ width: `${Math.round((driverRide.progress ?? 0) * 100)}%` }}
                      />
                    </div>

                    {/* Управление этапами — верёвка ТОС */}
                    {driverRide.status === 'arriving' ? (
                      <Button
                        onClick={() => advance()}
                        className="mt-3.5 h-11 w-full bg-emerald-500 text-xs font-bold text-zinc-950 hover:bg-emerald-400"
                      >
                        <Check className="mr-1.5 h-4 w-4" aria-hidden />
                        Пассажир сел — в путь
                      </Button>
                    ) : (
                      <Button
                        onClick={() => advance()}
                        className="mt-3.5 h-11 w-full bg-amber-400 text-xs font-bold text-zinc-950 hover:bg-amber-300"
                      >
                        <Check className="mr-1.5 h-4 w-4" aria-hidden />
                        Завершить поездку
                      </Button>
                    )}
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-zinc-600">
                      <Link2 className="h-3 w-3 text-amber-500/70" aria-hidden />
                      верёвка: новый заказ предложат после завершения этого
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Лента заказов */}
            {!online ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
                <Power className="h-8 w-8 text-zinc-700" aria-hidden />
                <p className="text-sm font-semibold text-zinc-400">Смена не начата</p>
                <p className="text-xs text-zinc-600">
                  Выйдите на линию — лента заказов оживёт. Комиссия та же: 12%.
                </p>
              </div>
            ) : inRide ? (
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-amber-400 ring-1 ring-zinc-700">
                  <Link2 className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">Лента приторможена — вы в поездке</p>
                  <p className="text-[11px] leading-snug text-zinc-500">
                    Барабан-буфер-верёвка: один активный заказ, следующие предложат после завершения
                  </p>
                </div>
                <span className="ml-auto shrink-0 rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-black tabular-nums text-zinc-400">
                  {orders.length}
                </span>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-0.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    <Flame className="h-3.5 w-3.5 text-amber-400" aria-hidden />
                    Лента заказов · аукцион
                  </p>
                  <p className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500">
                    <ShieldCheck className="h-3 w-3 text-emerald-500/70" aria-hidden />
                    «Мимо» — без штрафа
                  </p>
                </div>

                {sortedOrders.length === 0 && (
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
                    <Timer className="h-8 w-8 text-zinc-700" aria-hidden />
                    <p className="text-sm font-semibold text-zinc-400">Лента пуста на секунду</p>
                    <p className="text-xs text-zinc-600">движок создаёт заказы каждые 4–9 секунд</p>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {sortedOrders.map((o) => (
                    <OrderCard key={o.id} order={o} onAccept={accept} onDecline={decline} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Подсказка: ваш заказ из пассажирского приложения */}
            <button
              onClick={() => onOpenPassenger?.()}
              className="flex w-full items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 text-left transition-colors hover:border-emerald-500/40"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
                <Users className="h-4.5 w-4.5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-white">
                  Здесь появятся и ваши заказы
                </span>
                <span className="block text-[11px] leading-snug text-zinc-500">
                  Закажите поездку в роли пассажира — она придёт в эту ленту, и вы примете её сами
                </span>
              </span>
            </button>
          </div>
        )}

        {tab === 'earnings' && (
          <div className="space-y-3 p-4">
            <h2 className="text-base font-black text-white">Заработок</h2>

            {earnings ? (
              <>
                <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-zinc-900 to-zinc-950 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Чистыми сегодня
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <p className="text-3xl font-black tabular-nums text-white">
                      {rub(isPro ? earnings.gross : earnings.payout)}
                    </p>
                    {isPro && (
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        Pro: 0% комиссии
                      </span>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-zinc-950/60 p-2.5">
                      <p className="text-sm font-black tabular-nums text-zinc-200">
                        {rub(earnings.gross)}
                      </p>
                      <p className="text-[9px] uppercase tracking-wide text-zinc-500">оборот</p>
                    </div>
                    <div className="rounded-xl bg-zinc-950/60 p-2.5">
                      <p className="text-sm font-black tabular-nums text-zinc-200">
                        {rub(earnings.commission)}
                      </p>
                      <p className="text-[9px] uppercase tracking-wide text-zinc-500">
                        комиссия 12% {isPro ? '(вернётся с Pro)' : ''}
                      </p>
                    </div>
                    <div className="rounded-xl bg-zinc-950/60 p-2.5">
                      <p className="text-sm font-black tabular-nums text-zinc-200">
                        {earnings.rides}
                      </p>
                      <p className="text-[9px] uppercase tracking-wide text-zinc-500">
                        {plural(earnings.rides, 'поездка', 'поездки', 'поездок')}
                      </p>
                    </div>
                    <div className="rounded-xl bg-zinc-950/60 p-2.5">
                      <p className="text-sm font-black tabular-nums text-zinc-200">
                        {earnings.hoursOnline.toString().replace('.', ',')} ч
                      </p>
                      <p className="text-[9px] uppercase tracking-wide text-zinc-500">на линии</p>
                    </div>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 border-t border-emerald-500/15 pt-2.5 text-[10px] leading-relaxed text-emerald-300/80">
                    <TrendingUp className="h-3 w-3 shrink-0" aria-hidden />
                    У монополиста этот же оборот оставил бы вам {rub(Math.round(earnings.gross * 0.6))} —
                    на {rub(Math.round(earnings.gross * 0.28))} меньше.
                  </p>
                </div>

                {week.length > 0 && <WeekChart week={week} />}

                {lastRides.length > 0 && (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Последние поездки
                    </p>
                    <div className="mt-2.5 space-y-2">
                      {lastRides.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-2 rounded-xl bg-zinc-950/50 px-3 py-2"
                        >
                          <p className="min-w-0 truncate text-[11px] text-zinc-400">
                            {r.from?.label} → {r.to?.label}
                          </p>
                          <span className="shrink-0 text-xs font-black tabular-nums text-emerald-400">
                            +{rub(r.driverPayout)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
                <Wallet className="h-8 w-8 text-zinc-700" aria-hidden />
                <p className="text-sm font-semibold text-zinc-400">Ждём данные смены…</p>
                <p className="text-xs text-zinc-600">движок загрузит их в течение пары секунд</p>
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="space-y-3 p-4">
            <h2 className="text-base font-black text-white">Профиль</h2>

            {identity ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/15 text-sm font-black text-amber-300 ring-1 ring-amber-400/25">
                    {identity.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{identity.name}</p>
                    <p className="truncate text-[11px] text-zinc-400">{identity.car}</p>
                    <p className="text-[11px] font-semibold text-zinc-500">{identity.plate}</p>
                  </div>
                  <div className="ml-auto shrink-0 text-right">
                    <p className="flex items-center gap-1 text-sm font-bold text-amber-300">
                      <Star className="h-3 w-3 fill-amber-300 text-amber-300" aria-hidden />
                      {identity.rating.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-zinc-500">{identity.rides} поездок</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-6 text-xs text-zinc-500">
                Профиль водителя загружается…
              </div>
            )}

            {/* Модель комиссии / Pro */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
                    <BadgePercent className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-white">
                      {isPro ? 'Подписка Pro активна' : '12% с поездки'}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {isPro ? '0% комиссии · 2 490 ₽/мес' : 'или 0% с подпиской Pro · 2 490 ₽/мес'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPro((v) => !v)}
                  className={cn(
                    'relative h-7 w-12 shrink-0 rounded-full transition-colors',
                    isPro ? 'bg-emerald-500' : 'bg-zinc-700'
                  )}
                  role="switch"
                  aria-checked={isPro}
                  aria-label="Переключить модель оплаты на подписку Pro"
                >
                  <span
                    className={cn(
                      'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all',
                      isPro ? 'left-6' : 'left-1'
                    )}
                  />
                </button>
              </div>
              {earnings && (
                <div
                  className={cn(
                    'mt-3 rounded-xl border p-3 text-[11px] leading-relaxed',
                    isPro
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
                      : 'border-zinc-700/60 bg-zinc-950/50 text-zinc-400'
                  )}
                >
                  {isPro ? (
                    <>
                      С Pro ваш доход сегодня был бы{' '}
                      <span className="font-black text-emerald-300">{rub(earnings.gross)}</span> — вся
                      выручка без комиссии. Подписка окупается от ~21 000 ₽ оборота в месяц.
                    </>
                  ) : (
                    <>
                      С Pro вы бы получили на{' '}
                      <span className="font-bold text-emerald-300">
                        {rub(Math.max(0, proDelta))}
                      </span>{' '}
                      больше за смену (комиссия {rub(earnings.commission)} минус доля подписки ~83 ₽).
                      Окупается от ~21 000 ₽ оборота в месяц.
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Анти-спешка и гарантии */}
            <div className="space-y-2">
              {[
                {
                  icon: X,
                  title: 'Отказ от заказа — без штрафа',
                  body: '«Мимо» не понижает приоритет: приоритетов не существует, есть аукцион',
                },
                {
                  icon: Clock,
                  title: 'Время в пробке — оплачивается',
                  body: 'минута стоит денег независимо от скорости движения',
                },
                {
                  icon: Handshake,
                  title: 'Налог — с чистой выплаты',
                  body: 'НПД считается от вашего дохода, а не от стоимости поездки, как у монополиста',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-emerald-400">
                    <f.icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-white">{f.title}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== Нижняя навигация ===== */}
      <nav
        className="grid grid-cols-3 border-t border-zinc-800/70 bg-zinc-950"
        aria-label="Разделы приложения водителя"
      >
        {(
          [
            { id: 'shift', label: 'Смена', icon: CarFront },
            { id: 'earnings', label: 'Доход', icon: Wallet },
            { id: 'profile', label: 'Профиль', icon: User },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors',
              tab === t.id ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            )}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <t.icon className="h-5 w-5" aria-hidden />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

function OrderCard({
  order,
  onAccept,
  onDecline,
}: {
  order: OrderDTO
  onAccept: (id: string) => void
  onDecline: (id: string) => void
}) {
  const left = timeLeft(order.expiresAt)
  const urgent = left <= 10
  const soon = left <= 25

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
            <p className="truncate text-xs font-semibold text-zinc-200">{order.from.label}</p>
          </div>
          <div className="mt-1.5 flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
            <p className="truncate text-xs font-semibold text-zinc-200">{order.to.label}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-black leading-none tabular-nums text-amber-300">
            +{rub(order.driverPayout)}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">чек {rub(order.priceTotal)}</p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <RouteIcon className="h-3 w-3" aria-hidden />
          {order.distanceKm} км · ~{Math.round(order.durationMin)} мин
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" aria-hidden />
          видят {order.watchingDrivers ?? '—'}
        </span>
        <span className="font-semibold text-zinc-400">{order.tariff.name}</span>
        {order.surge > 1 && (
          <span className="rounded bg-rose-500/15 px-1.5 py-0.5 font-bold text-rose-300">
            спрос ×{order.surge.toFixed(2).replace('.', ',')}
          </span>
        )}
      </div>

      {/* Прогресс жизни заказа */}
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            urgent ? 'bg-rose-400' : soon ? 'bg-amber-400' : 'bg-emerald-500'
          )}
          style={{ width: `${Math.min(100, (left / 60) * 100)}%` }}
        />
      </div>

      <div className="mt-2.5 flex gap-2">
        <Button
          onClick={() => onDecline(order.id)}
          variant="outline"
          className="h-10 flex-1 border-zinc-700 text-[11px] font-semibold text-zinc-400 hover:text-white"
        >
          Мимо
        </Button>
        <Button
          onClick={() => onAccept(order.id)}
          className="h-10 flex-[2] bg-emerald-500 text-[11px] font-bold text-zinc-950 hover:bg-emerald-400"
        >
          <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Взять · {rub(order.driverPayout)}
        </Button>
      </div>
      <p className="mt-1.5 text-center text-[9px] text-zinc-600">
        до истечения {left} {plural(left, 'секунда', 'секунды', 'секунд')}
      </p>
    </motion.div>
  )
}
