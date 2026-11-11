'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MapPin,
  ArrowRightLeft,
  ArrowUpDown,
  Dices,
  Search,
  Star,
  CarFront,
  Clock,
  Route as RouteIcon,
  Banknote,
  HandCoins,
  RotateCcw,
  BadgeCheck,
  Plus,
  History,
  User,
  CreditCard,
  Zap,
  Banknote as CashIcon,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Gift,
  X,
  Flame,
  Activity,
  HardDrive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { CityMap } from '../demo/city-map'
import { useMvpPassenger } from '@/lib/pryamo/mvp-socket'
import { estimatePrice, rub, minutesWord } from '@/lib/pryamo/format'
import {
  PASSENGER_HISTORY_LIMIT,
  loadPassengerHistory,
  savePassengerHistory,
} from '@/lib/pryamo/mvp-storage'
import { pickupDemand, surgeLabel } from '@/lib/pryamo/pickup-zone'
import { TARIFF_FALLBACK } from '@/lib/pryamo/tariff-fallback'
import type { Receipt, RideDTO, Tariff } from '@/lib/pryamo/types'

const ADDRESS_PRESETS = [
  'ул. Тверская, 7',
  'Ленинский пр-т, 45',
  'Кутузовский пр-т, 32',
  'ул. Арбат, 24',
  'Аэропорт Шереметьево, терминал C',
  'Белорусский вокзал',
  'ул. Профсоюзная, 128',
  'Москва-Сити, башня Федерация',
  'Парк Горького, вход 1',
  'Речной вокзал, 3',
  'ул. Садовая-Кудринская, 12',
  'Киевский вокзал, пл. Европы',
]

const PAYMENTS = [
  { id: 'card', label: 'Карта ··4821', icon: CreditCard },
  { id: 'sbp', label: 'СБП', icon: Zap },
  { id: 'cash', label: 'Наличные', icon: CashIcon },
] as const

type Payment = (typeof PAYMENTS)[number]['id']
type Screen = 'home' | 'live' | 'receipt'

function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

export interface PassengerHistoryItem {
  ride: RideDTO
  receipt: Receipt
  rated: boolean
  tip: number
  at: number
}

export function PassengerApp({ onOpenDriver }: { onOpenDriver?: () => void }) {
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [from, setFrom] = useState('ул. Тверская, 7')
  const [to, setTo] = useState('Аэропорт Шереметьево, терминал C')
  const [tariffId, setTariffId] = useState('comfort')
  const [payment, setPayment] = useState<Payment>('card')
  const [comment, setComment] = useState('')
  const [screen, setScreen] = useState<Screen>('home')
  const [tab, setTab] = useState<'ride' | 'history' | 'profile'>('ride')
  const [ride, setRide] = useState<RideDTO | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [failReason, setFailReason] = useState<string | null>(null)
  // Персистентность истории: оверлей MVP рендерится только на клиенте (при SSR
  // и гидратации он закрыт), поэтому ленивый инициализатор читает localStorage
  // ровно один раз при монтировании — без рассинхрона разметки; запись — эффектом
  const [initialHistory] = useState(() => loadPassengerHistory())
  const [history, setHistory] = useState<PassengerHistoryItem[]>(initialHistory)
  /** История восстановлена из localStorage этого устройства */
  const restored = initialHistory.length > 0

  useEffect(() => {
    savePassengerHistory(history)
  }, [history])

  // Рейтинг 2.0 по осям + чаевые
  const [axes, setAxes] = useState({ punctuality: 5, driving: 5, comfort: 5, cleanliness: 5 })
  const [tip, setTip] = useState(0)
  const [rated, setRated] = useState(false)

  const screenRef = useRef<Screen>('home')
  useEffect(() => {
    screenRef.current = screen
  }, [screen])

  useEffect(() => {
    fetch('/api/tariffs')
      .then((r) => r.json())
      .then((d) => {
        if (d.tariffs?.length) {
          setTariffs(d.tariffs)
          setTariffId(d.tariffs[1]?.id ?? d.tariffs[0]?.id)
        } else {
          setTariffs(TARIFF_FALLBACK)
          setTariffId(TARIFF_FALLBACK[1]?.id ?? TARIFF_FALLBACK[0]?.id)
        }
      })
      .catch(() => {
        // Статик-прод без API — канонический фолбэк тарифов
        setTariffs(TARIFF_FALLBACK)
        setTariffId(TARIFF_FALLBACK[1]?.id ?? TARIFF_FALLBACK[0]?.id)
      })
  }, [])

  const { book, cancel, rate, connected, zones } = useMvpPassenger({
    onRideState: (r) => {
      setRide(r)
      setFailReason(null)
      if (screenRef.current === 'home' && r.status !== 'searching') setScreen('live')
      if (r.status !== 'searching') setScreen('live')
    },
    onCompleted: (r, rec) => {
      setRide(r)
      setReceipt(rec)
      setScreen('receipt')
      setTab('ride')
      setHistory((prev) =>
        [
          { ride: r, receipt: rec, rated: false, tip: 0, at: Date.now() },
          ...prev,
        ].slice(0, PASSENGER_HISTORY_LIMIT)
      )
    },
    onRated: (message) => {
      setRated(true)
      toast({ title: 'Оценка отправлена', description: message })
    },
    onFailed: () => {
      setFailReason('expired')
      setScreen('home')
      toast({
        title: 'Водитель не найден',
        description:
          'Заказ прождал в ленте 45–75 секунд, и его никто не взял. Мы не показываем «вечный поиск» — попробуйте ещё раз.',
      })
    },
    onCancelled: (ok) => {
      if (ok) {
        setScreen('home')
        setRide(null)
        toast({
          title: 'Поиск отменён',
          description: 'Отмена до назначения водителя — бесплатна и всегда.',
        })
      } else {
        toast({
          title: 'Отмена недоступна',
          description: 'Водитель уже выехал — поездку можно завершить только по окончании.',
        })
      }
    },
  })

  const tariff = tariffs.find((t) => t.id === tariffId)

  const distanceKm = useMemo(
    () => Math.round((3 + hash01(from + to, 7) * 22) * 10) / 10,
    [from, to]
  )
  const durationMin = useMemo(() => Math.round(distanceKm * 2.2 + 4), [distanceKm])
  const price = useMemo(
    () => (tariff ? estimatePrice(tariff, distanceKm, durationMin) : 0),
    [tariff, distanceKm, durationMin]
  )

  // Живой спрос зоны подачи: demand:state прилетает каждые ~5 с
  const demand = useMemo(() => pickupDemand(zones, from), [zones, from])

  const randomize = () => {
    const f = ADDRESS_PRESETS[Math.floor(Math.random() * ADDRESS_PRESETS.length)]
    let t = ADDRESS_PRESETS[Math.floor(Math.random() * ADDRESS_PRESETS.length)]
    while (t === f) t = ADDRESS_PRESETS[Math.floor(Math.random() * ADDRESS_PRESETS.length)]
    setFrom(f)
    setTo(t)
  }

  const submitBook = () => {
    if (!from.trim() || !to.trim()) {
      toast({ title: 'Заполните адреса', description: 'Откуда и куда — обязательные поля.' })
      return
    }
    setRide(null)
    setReceipt(null)
    setRated(false)
    setFailReason(null)
    setAxes({ punctuality: 5, driving: 5, comfort: 5, cleanliness: 5 })
    setTip(0)
    setScreen('live')
    setTab('ride')
    book({ from: from.trim(), to: to.trim(), tariffId })
  }

  const resetToForm = () => {
    setScreen('home')
    setRide(null)
    setReceipt(null)
    setRated(false)
  }

  const submitRate = () => {
    if (!ride) return
    rate({ rideId: ride.id, axes, tip })
    setHistory((prev) => {
      const next = [...prev]
      if (next[0] && next[0].ride.id === ride.id) {
        next[0] = { ...next[0], rated: true, tip }
      }
      return next
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-950">
      {/* ===== Шапка приложения ===== */}
      <header className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950">
            <Zap className="h-4 w-4" strokeWidth={2.6} />
          </span>
          <div className="leading-none">
            <p className="text-sm font-black tracking-tight text-white">ПРЯМО</p>
            <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-emerald-400">
              приложение пассажира
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connected && (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 bg-emerald-400" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              движок онлайн
            </span>
          )}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-black text-zinc-200">
            ВЫ
          </span>
        </div>
      </header>

      {/* ===== Контент ===== */}
      <div className="pryamo-scroll min-h-0 flex-1 overflow-y-auto">
        {tab === 'ride' && (
          <AnimatePresence mode="wait">
            {screen === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4"
              >
                {failReason && (
                  <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                    <div className="text-xs leading-relaxed text-amber-200">
                      <p className="font-bold">Водитель не найден</p>
                      <p className="mt-0.5 text-amber-200/70">
                        Заказ прождал в ленте 45–75 секунд, и его никто не взял. Мы не показываем
                        «вечный поиск» — попробуйте заказать ещё раз.
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-black text-white">Куда едем?</h2>
                    <button
                      onClick={randomize}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
                      aria-label="Случайные адреса"
                    >
                      <Dices className="h-3.5 w-3.5" />
                      Случайно
                    </button>
                  </div>

                  <div className="relative mt-3.5 space-y-2.5">
                    <div className="relative">
                      <span
                        className="absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-emerald-400 bg-zinc-950"
                        aria-hidden
                      />
                      <Input
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        placeholder="Откуда"
                        aria-label="Адрес подачи"
                        className="border-zinc-700 bg-zinc-950/60 pl-9 text-sm text-white placeholder:text-zinc-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setFrom(to)
                        setTo(from)
                      }}
                      className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
                      aria-label="Поменять адреса местами"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                    <div className="relative">
                      <span
                        className="absolute left-[11px] top-1/2 h-2.5 w-2 -translate-y-1/2 rotate-45 border-r-2 border-b-2 border-amber-400 bg-zinc-950"
                        aria-hidden
                      />
                      <Input
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder="Куда"
                        aria-label="Адрес назначения"
                        className="border-zinc-700 bg-zinc-950/60 pl-9 text-sm text-white placeholder:text-zinc-500"
                      />
                    </div>
                  </div>

                  {/* Тарифы — горизонтальная лента */}
                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Класс машины
                    </p>
                    <div className="pryamo-scroll flex gap-2 overflow-x-auto pb-1">
                      {tariffs.slice(0, 6).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTariffId(t.id)}
                          className={cn(
                            'min-w-[104px] shrink-0 rounded-xl border p-3 text-left transition-all',
                            tariffId === t.id
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-zinc-700 bg-zinc-950/40 hover:border-zinc-600'
                          )}
                          aria-pressed={tariffId === t.id}
                        >
                          <p className="text-xs font-bold text-white">{t.name}</p>
                          <p className="mt-1 text-sm font-black tabular-nums text-emerald-400">
                            {rub(estimatePrice(t, distanceKm, durationMin))}
                          </p>
                          <p className="mt-0.5 text-[10px] text-zinc-500">
                            подача ~{4 + Math.floor(hash01(t.id) * 5)} мин
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Оплата + комментарий */}
                  <div className="mt-4 space-y-2.5">
                    <div className="flex gap-2">
                      {PAYMENTS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPayment(p.id)}
                          className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-[11px] font-bold transition-all',
                            payment === p.id
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                          )}
                          aria-pressed={payment === p.id}
                        >
                          <p.icon className="h-3.5 w-3.5" aria-hidden />
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <MessageSquare
                        className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
                        aria-hidden
                      />
                      <Input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Комментарий водителю (необязательно)"
                        aria-label="Комментарий водителю"
                        className="border-zinc-700 bg-zinc-950/60 pl-9 text-xs text-white placeholder:text-zinc-500"
                      />
                    </div>
                  </div>

                  {/* Оценка цены */}
                  {price > 0 && (
                    <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-semibold text-zinc-300">Итого, фикс до конца</span>
                        <span className="text-2xl font-black tabular-nums text-white">{rub(price)}</span>
                      </div>
                      <div className="mt-2.5 space-y-1 border-t border-emerald-500/15 pt-2.5 text-xs">
                        <div className="flex justify-between text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <RouteIcon className="h-3 w-3" aria-hidden /> {distanceKm} км · {durationMin}{' '}
                            {minutesWord(durationMin)}
                          </span>
                          <span />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Водитель получит · 88%</span>
                          <span className="font-bold text-emerald-400">
                            {rub(Math.round(price * 0.88))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Комиссия ПРЯМО · 12% фикс</span>
                          <span className="font-semibold text-zinc-300">
                            {rub(Math.round(price * 0.12))}
                          </span>
                        </div>
                      </div>

                      {/* Индикатор спроса зоны подачи (обновляется каждые ~5 с) */}
                      {demand && (
                        <div className="mt-2.5 border-t border-emerald-500/15 pt-2.5">
                          <span
                            className={cn(
                              'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-snug',
                              demand.surge > 1
                                ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                                : 'border-zinc-700 bg-zinc-950/60 text-zinc-400'
                            )}
                            title={`Зона подачи: ${demand.name} · спрос ${demand.demand}%`}
                          >
                            {demand.surge > 1 ? (
                              <Flame className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
                            ) : (
                              <Activity className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
                            )}
                            <span className="min-w-0">
                              <span className="sr-only">
                                Зона подачи: {demand.name}, спрос {demand.demand}%.{' '}
                              </span>
                              {demand.surge > 1 ? (
                                <>
                                  Спрос <span className="tabular-nums">×{surgeLabel(demand.surge)}</span> ·
                                  кап <span className="tabular-nums">×1,5</span> — весь коэффициент
                                  водителю
                                </>
                              ) : (
                                <>
                                  Пиков нет — коэффициент <span className="tabular-nums">1,0</span>
                                </>
                              )}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={submitBook}
                    disabled={!connected || !tariff}
                    className="mt-4 h-12 w-full bg-emerald-500 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {connected ? `Заказать за ${rub(price)}` : 'Подключение к движку…'}
                  </Button>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-zinc-600">
                    <ShieldCheck className="h-3 w-3 text-emerald-500/70" aria-hidden />
                    Отмена до подачи водителя — всегда бесплатна
                  </p>
                </div>

                {/* Подсказка: заказ уйдёт живому водителю */}
                <button
                  onClick={() => onOpenDriver?.()}
                  className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-3.5 text-left transition-colors hover:border-amber-400/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/25">
                    <CarFront className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-white">
                      Заказ увидит живой водитель
                    </span>
                    <span className="block text-[11px] leading-snug text-zinc-500">
                      Он появится в ленте приложения водителя — откройте вторую роль и примите
                      свой же заказ
                    </span>
                  </span>
                </button>
              </motion.div>
            )}

            {screen === 'live' && (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4"
              >
                {/* Карта */}
                <CityMap
                  variant="ride"
                  ride={
                    ride ?? {
                      from: { label: from, zoneId: '' },
                      to: { label: to, zoneId: '' },
                      status: 'searching' as const,
                      progress: 0,
                    } as RideDTO
                  }
                  searching={!ride || ride.status === 'searching'}
                  className="h-56 w-full overflow-hidden rounded-2xl border border-zinc-800"
                />

                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                  <div className="flex items-center gap-2">
                    {ride?.status === 'searching' || !ride ? (
                      <>
                        <Search className="h-5 w-5 animate-pulse text-emerald-400" />
                        <h3 className="text-base font-black text-white">Ищем водителя</h3>
                      </>
                    ) : ride.status === 'arriving' ? (
                      <>
                        <CarFront className="h-5 w-5 text-amber-400" />
                        <h3 className="text-base font-black text-white">Водитель едет к вам</h3>
                      </>
                    ) : (
                      <>
                        <RouteIcon className="h-5 w-5 text-emerald-400" />
                        <h3 className="text-base font-black text-white">В пути</h3>
                      </>
                    )}
                  </div>
                  <p className="mt-1.5 min-h-5 text-xs text-zinc-400">
                    {ride?.hint ?? 'Ищем ближайшего водителя…'}
                  </p>

                  {ride?.driver && (
                    <div className="mt-3.5 rounded-xl border border-zinc-700 bg-zinc-950/60 p-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-xs font-black text-emerald-300">
                          {ride.driver.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-white">{ride.driver.name}</p>
                          <p className="truncate text-[11px] text-zinc-400">{ride.driver.car}</p>
                          <p className="text-[11px] font-semibold text-zinc-500">{ride.driver.plate}</p>
                        </div>
                        <div className="text-right">
                          <p className="flex items-center gap-1 text-sm font-bold text-amber-300">
                            <Star className="h-3 w-3 fill-amber-300" aria-hidden />
                            {ride.driver.rating.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-zinc-500">{ride.driver.rides} поездок</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-zinc-950/60 p-2.5">
                      <Clock className="mx-auto h-3.5 w-3.5 text-zinc-500" aria-hidden />
                      <p className="mt-1 text-base font-black tabular-nums text-white">
                        {ride?.etaMin ?? '—'}
                      </p>
                      <p className="text-[9px] uppercase tracking-wide text-zinc-500">мин</p>
                    </div>
                    <div className="rounded-xl bg-zinc-950/60 p-2.5">
                      <RouteIcon className="mx-auto h-3.5 w-3.5 text-zinc-500" aria-hidden />
                      <p className="mt-1 text-base font-black tabular-nums text-white">
                        {ride?.distanceKm?.toFixed(1) ?? '—'}
                      </p>
                      <p className="text-[9px] uppercase tracking-wide text-zinc-500">км</p>
                    </div>
                    <div className="rounded-xl bg-zinc-950/60 p-2.5">
                      <Banknote className="mx-auto h-3.5 w-3.5 text-zinc-500" aria-hidden />
                      <p className="mt-1 text-base font-black tabular-nums text-white">
                        {ride?.priceTotal ?? price}
                      </p>
                      <p className="text-[9px] uppercase tracking-wide text-zinc-500">₽ фикс</p>
                    </div>
                  </div>

                  {ride && ride.status === 'onboard' && (
                    <div className="mt-3.5">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span className="max-w-[45%] truncate">{ride.from.label}</span>
                        <span className="max-w-[45%] truncate text-right">{ride.to.label}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-1000"
                          style={{ width: `${Math.round((ride.progress ?? 0) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {(ride?.status === 'searching' || !ride) && (
                    <Button
                      variant="outline"
                      onClick={() => cancel()}
                      className="mt-3.5 w-full border-zinc-700 text-xs text-zinc-400 hover:text-white"
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Отменить поиск
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {screen === 'receipt' && receipt && (
              <motion.div
                key="receipt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4"
              >
                <div className="rounded-2xl border border-emerald-500/40 bg-zinc-900/70 p-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-5 w-5 text-emerald-400" aria-hidden />
                    <h3 className="text-base font-black text-white">Поездка завершена</h3>
                  </div>

                  <div className="mt-3.5 space-y-2 rounded-xl border border-zinc-700 bg-zinc-950/60 p-3.5 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Поездка</span>
                      <span className="max-w-48 truncate text-right text-zinc-300">
                        {ride?.from?.label} → {ride?.to?.label}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Тариф · {PAYMENTS.find((p) => p.id === payment)?.label}</span>
                      <span className="font-semibold text-zinc-300">{ride?.tariffName}</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-800 pt-2 text-zinc-400">
                      <span>Оплачено</span>
                      <span className="font-bold text-white">{rub(receipt.price)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Комиссия ПРЯМО</span>
                      <span className="font-semibold text-zinc-300">
                        {rub(receipt.commissionRub)} · 12%
                      </span>
                    </div>
                    {tip > 0 && (
                      <div className="flex justify-between text-zinc-400">
                        <span>Чаевые (100% водителю)</span>
                        <span className="font-semibold text-emerald-400">{rub(tip)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-zinc-800 pt-2">
                      <span className="font-semibold text-zinc-300">Водитель получил</span>
                      <span className="text-base font-black tabular-nums text-emerald-400">
                        {rub(receipt.driverPayout + tip)}
                      </span>
                    </div>
                  </div>

                  {!rated ? (
                    <div className="mt-4">
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        <Star className="h-3 w-3 text-amber-400" aria-hidden />
                        Рейтинг 2.0 — по осям, с апелляцией
                      </p>
                      <div className="space-y-1.5">
                        {(
                          [
                            ['punctuality', 'Пунктуальность'],
                            ['driving', 'Вождение'],
                            ['comfort', 'Комфорт'],
                            ['cleanliness', 'Чистота'],
                          ] as const
                        ).map(([key, label]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between rounded-lg bg-zinc-950/50 px-3 py-1.5"
                          >
                            <span className="text-xs text-zinc-300">{label}</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setAxes((a) => ({ ...a, [key]: s }))}
                                  aria-label={`${label}: ${s}`}
                                  className="p-0.5"
                                >
                                  <Star
                                    className={cn(
                                      'h-4 w-4 transition-colors',
                                      axes[key] >= s
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-zinc-600 hover:text-zinc-400'
                                    )}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="mb-1.5 mt-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Чаевые — 100% водителю
                      </p>
                      <div className="flex gap-1.5">
                        {[0, 50, 100, 200].map((t) => (
                          <button
                            key={t}
                            onClick={() => setTip(t)}
                            className={cn(
                              'flex-1 rounded-lg border py-2 text-xs font-bold transition-all',
                              tip === t
                                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                            )}
                          >
                            {t === 0 ? 'Без' : `${t} ₽`}
                          </button>
                        ))}
                      </div>

                      <Button
                        onClick={submitRate}
                        className="mt-3 h-10 w-full bg-amber-400 text-xs font-bold text-zinc-950 hover:bg-amber-300"
                      >
                        <HandCoins className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                        Отправить оценку{tip > 0 ? ` и ${tip} ₽` : ''}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
                      <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                      Спасибо! Оценка сохранена{tip > 0 ? `, чаевые ${rub(tip)} переданы водителю полностью` : ''}.
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={resetToForm}
                    className="mt-3 w-full border-zinc-700 text-xs text-zinc-400 hover:text-white"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Заказать ещё
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {tab === 'history' && (
          <div className="p-4">
            <h2 className="text-base font-black text-white">История поездок</h2>
            {restored && history.length > 0 && (
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-600">
                <HardDrive className="h-3 w-3 shrink-0" aria-hidden />
                история сохранена на этом устройстве
              </p>
            )}
            {history.length === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
                <History className="h-8 w-8 text-zinc-700" aria-hidden />
                <p className="text-sm font-semibold text-zinc-400">Поездок пока нет</p>
                <p className="text-xs text-zinc-600">
                  Закажите первую — она появится здесь с честным чеком
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {history.map((h) => (
                  <div key={h.ride.id + h.at} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-xs text-zinc-400">
                        {h.ride.from?.label} → {h.ride.to?.label}
                      </p>
                      <p className="shrink-0 text-sm font-black tabular-nums text-white">
                        {rub(h.receipt.price)}
                      </p>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-600">
                      <span>
                        {h.ride.tariffName} · {h.ride.distanceKm} км ·{' '}
                        {new Date(h.at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        {h.rated ? (
                          <>
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                            {h.tip > 0 ? `+ ${rub(h.tip)} чаевых` : 'оценено'}
                          </>
                        ) : (
                          'без оценки'
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="space-y-3 p-4">
            <h2 className="text-base font-black text-white">Профиль</h2>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-sm font-black text-zinc-200">
                  ВЫ
                </span>
                <div>
                  <p className="text-sm font-bold text-white">Пассажир ПРЯМО</p>
                  <p className="text-[11px] text-zinc-500">
                    {PAYMENTS.find((p) => p.id === payment)?.label} · способ оплаты по умолчанию
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">Фикс-цена всегда</p>
                  <p className="text-[10px] text-zinc-500">
                    пересчётов в пути нет — ни при каких пробках
                  </p>
                </div>
              </div>
            </div>

            {/* Гарантии по итогам разбора отзывов Яндекса (см. yandex-reviews.ts) */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Гарантии ПРЯМО — по итогам разбора 100 отзывов Яндекс Go
              </p>
              <ul className="mt-2.5 space-y-2 text-[11px] leading-relaxed">
                {[
                  'Точка подачи видна вам и водителю одинаково — расхождение = ошибка карты, компенсация автоматом',
                  'Платное ожидание — только после 10 минут и с уведомлением, задним числом не включится',
                  'Водитель отменил после «выехал» — компенсация на счёт без «промокод вместо денег»',
                  'Поддержка — живой человек, ответ ≤ 15 минут; статус жалобы виден по трекингу',
                ].map((g) => (
                  <li key={g} className="flex items-start gap-2 text-zinc-300">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
            <button className="flex w-full items-center justify-between rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 text-left transition-colors hover:border-amber-400/40">
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/25">
                  <Gift className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-xs font-bold text-white">
                    Пригласи друга — по 300 ₽
                  </span>
                  <span className="block text-[10px] text-zinc-500">
                    бонус гасится 10% каждой поездкой
                  </span>
                </span>
              </span>
            </button>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-[11px] leading-relaxed text-zinc-500">
              «ПРЯМО MVP» — интерактивный прототип приложения. Поездки выполняет движок симуляции
              на WebSocket (порт 3003): заказы, водители, цены и чеки считаются по правилам ПРЯМО
              в реальном времени.
            </div>
          </div>
        )}
      </div>

      {/* ===== Нижняя навигация ===== */}
      <nav
        className="grid grid-cols-3 border-t border-zinc-800/70 bg-zinc-950"
        aria-label="Разделы приложения пассажира"
      >
        {(
          [
            { id: 'ride', label: 'Поездка', icon: Plus },
            { id: 'history', label: 'История', icon: History },
            { id: 'profile', label: 'Профиль', icon: User },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors',
              tab === t.id ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
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
