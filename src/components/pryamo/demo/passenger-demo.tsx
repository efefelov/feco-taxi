'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MapPin,
  ArrowRightLeft,
  Dices,
  Search,
  Star,
  Banknote,
  ReceiptText,
  CarFront,
  Clock,
  Route as RouteIcon,
  HandCoins,
  RotateCcw,
  BadgeCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { CityMap } from './city-map'
import { usePassengerRide } from '@/lib/pryamo/socket'
import { estimatePrice, rub, minutesWord } from '@/lib/pryamo/format'
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

function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

type Phase = 'form' | 'live' | 'receipt'

export function PassengerDemo() {
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [from, setFrom] = useState('ул. Тверская, 7')
  const [to, setTo] = useState('Аэропорт Шереметьево, терминал C')
  const [tariffId, setTariffId] = useState('comfort')
  const [ride, setRide] = useState<RideDTO | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [phase, setPhase] = useState<Phase>('form')

  // Рейтинг 2.0
  const [axes, setAxes] = useState({ punctuality: 5, driving: 5, comfort: 5, cleanliness: 5 })
  const [tip, setTip] = useState(0)
  const [rated, setRated] = useState(false)

  useEffect(() => {
    fetch('/api/tariffs')
      .then((r) => r.json())
      .then((d) => {
        if (d.tariffs?.length) {
          setTariffs(d.tariffs)
          setTariffId(d.tariffs[1]?.id ?? d.tariffs[0]?.id)
        }
      })
      .catch(() => {})
  }, [])

  const { book, rate, connected } = usePassengerRide({
    onRideState: (r) => {
      setRide(r)
      if (r.status !== 'searching' && phaseRef.current === 'form') setPhase('live')
    },
    onCompleted: (r, rec) => {
      setRide(r)
      setReceipt(rec)
      setPhase('receipt')
    },
    onRated: (msg) => {
      setRated(true)
      toast({ title: 'Оценка отправлена', description: msg })
    },
  })

  const phaseRef = useRef<Phase>('form')
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

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
    setAxes({ punctuality: 5, driving: 5, comfort: 5, cleanliness: 5 })
    setTip(0)
    setPhase('live')
    book({ from: from.trim(), to: to.trim(), tariffId })
  }

  const reset = () => {
    setPhase('form')
    setRide(null)
    setReceipt(null)
    setRated(false)
  }

  const submitRate = () => {
    if (!ride) return
    rate({ rideId: ride.id, axes, tip })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      {/* Левая колонка: панель заказа */}
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {phase === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Заказать поездку</h3>
                <button
                  onClick={randomize}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
                  aria-label="Случайные адреса"
                >
                  <Dices className="h-3.5 w-3.5" />
                  Случайно
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                  <Input
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder="Откуда"
                    aria-label="Адрес подачи"
                    className="border-zinc-700 bg-zinc-950/60 pl-9 text-white placeholder:text-zinc-500"
                  />
                </div>
                <div className="relative">
                  <ArrowRightLeft className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" />
                  <Input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="Куда"
                    aria-label="Адрес назначения"
                    className="border-zinc-700 bg-zinc-950/60 pl-9 text-white placeholder:text-zinc-500"
                  />
                </div>
                <datalist id="addr-presets">
                  {ADDRESS_PRESETS.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>

              {/* Тарифы */}
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Класс машины
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {tariffs.slice(0, 6).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTariffId(t.id)}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-all',
                        tariffId === t.id
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                          : 'border-zinc-700 bg-zinc-950/40 hover:border-zinc-600'
                      )}
                      aria-pressed={tariffId === t.id}
                    >
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="mt-1 text-base font-black tabular-nums text-emerald-400">
                        {rub(estimatePrice(t, distanceKm, durationMin))}
                      </p>
                    </button>
                  ))}
                </div>
                {tariff && (
                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{tariff.carClass}</p>
                )}
              </div>

              {/* Оценка цены */}
              {price > 0 && (
                <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-zinc-300">Итого, фикс</span>
                    <span className="text-3xl font-black tabular-nums text-white">{rub(price)}</span>
                  </div>
                  <div className="mt-3 space-y-1.5 border-t border-emerald-500/15 pt-3 text-sm">
                    <div className="flex justify-between text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <RouteIcon className="h-3.5 w-3.5" /> {distanceKm} км · {durationMin}{' '}
                        {minutesWord(durationMin)}
                      </span>
                      <span />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Водитель получит</span>
                      <span className="font-bold text-emerald-400">{rub(Math.round(price * 0.92))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Комиссия ПРЯМО (8%)</span>
                      <span className="font-semibold text-zinc-300">{rub(Math.round(price * 0.08))}</span>
                    </div>
                    <p className="pt-1 text-[11px] text-emerald-300/90">
                      Пассажир и водитель видят одну цену. Без пересчётов «по трафику».
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={submitBook}
                disabled={!connected || !tariff}
                className="mt-4 h-12 w-full bg-emerald-500 text-base font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                <Search className="mr-2 h-4 w-4" />
                {connected ? 'Заказать за фикс-цену' : 'Подключение к движку…'}
              </Button>
            </motion.div>
          )}

          {phase === 'live' && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur"
            >
              <div className="flex items-center gap-2">
                {ride?.status === 'searching' || !ride ? (
                  <>
                    <Search className="h-5 w-5 animate-pulse text-emerald-400" />
                    <h3 className="text-lg font-bold text-white">Ищем водителя</h3>
                  </>
                ) : ride.status === 'arriving' ? (
                  <>
                    <CarFront className="h-5 w-5 text-amber-400" />
                    <h3 className="text-lg font-bold text-white">Водитель едет к вам</h3>
                  </>
                ) : (
                  <>
                    <RouteIcon className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-white">В пути</h3>
                  </>
                )}
              </div>

              <p className="mt-2 min-h-5 text-sm text-zinc-400">
                {ride?.hint ?? 'Ищем ближайшего водителя…'}
              </p>

              {ride?.driver && (
                <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-950/60 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-black text-emerald-300">
                      {ride.driver.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{ride.driver.name}</p>
                      <p className="truncate text-xs text-zinc-400">{ride.driver.car}</p>
                      <p className="text-xs font-semibold text-zinc-500">{ride.driver.plate}</p>
                    </div>
                    <div className="text-right">
                      <p className="flex items-center gap-1 text-sm font-bold text-amber-300">
                        <Star className="h-3.5 w-3.5 fill-amber-300" />
                        {ride.driver.rating.toFixed(2)}
                      </p>
                      <p className="text-[11px] text-zinc-500">{ride.driver.rides} поездок</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-zinc-950/60 p-3">
                  <Clock className="mx-auto h-4 w-4 text-zinc-500" />
                  <p className="mt-1 text-lg font-black tabular-nums text-white">
                    {ride?.etaMin ?? '—'}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">мин</p>
                </div>
                <div className="rounded-xl bg-zinc-950/60 p-3">
                  <RouteIcon className="mx-auto h-4 w-4 text-zinc-500" />
                  <p className="mt-1 text-lg font-black tabular-nums text-white">
                    {ride?.distanceKm?.toFixed(1) ?? '—'}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">км</p>
                </div>
                <div className="rounded-xl bg-zinc-950/60 p-3">
                  <Banknote className="mx-auto h-4 w-4 text-zinc-500" />
                  <p className="mt-1 text-lg font-black tabular-nums text-white">
                    {ride?.priceTotal ?? price}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">₽ фикс</p>
                </div>
              </div>

              {ride && ride.status === 'onboard' && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>{ride.from.label}</span>
                    <span>{ride.to.label}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-1000"
                      style={{ width: `${Math.round((ride.progress ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                onClick={reset}
                className="mt-4 w-full border-zinc-700 text-zinc-400 hover:text-white"
              >
                Отменить демо
              </Button>
            </motion.div>
          )}

          {phase === 'receipt' && receipt && (
            <motion.div
              key="receipt"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl border border-emerald-500/40 bg-zinc-900/70 p-5 backdrop-blur"
            >
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Поездка завершена</h3>
              </div>

              <div className="mt-4 space-y-2 rounded-xl border border-zinc-700 bg-zinc-950/60 p-4 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Поездка</span>
                  <span className="max-w-56 truncate text-right text-zinc-300">
                    {ride?.from?.label} → {ride?.to?.label}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Тариф</span>
                  <span className="font-semibold text-zinc-300">{ride?.tariffName}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-2 text-zinc-400">
                  <span>Пассажир заплатил</span>
                  <span className="font-bold text-white">{rub(receipt.price)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Комиссия ПРЯМО</span>
                  <span className="font-semibold text-zinc-300">
                    {rub(receipt.commissionRub)} · 8%
                  </span>
                </div>
                {receipt.tip > 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Чаевые (100% водителю)</span>
                    <span className="font-semibold text-emerald-400">{rub(receipt.tip)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-zinc-800 pt-2">
                  <span className="font-semibold text-zinc-300">Водитель получил</span>
                  <span className="text-xl font-black tabular-nums text-emerald-400">
                    {rub(receipt.driverPayout + receipt.tip)}
                  </span>
                </div>
              </div>

              {/* Рейтинг 2.0 */}
              {!rated ? (
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    Рейтинг 2.0 — оцените по осям
                  </p>
                  <div className="space-y-2">
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
                        className="flex items-center justify-between rounded-lg bg-zinc-950/50 px-3 py-2"
                      >
                        <span className="text-sm text-zinc-300">{label}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              onClick={() => setAxes((a) => ({ ...a, [key]: s }))}
                              aria-label={`${label}: ${s}`}
                              className="p-0.5"
                            >
                              <Star
                                className={cn(
                                  'h-5 w-5 transition-colors',
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

                  <p className="mb-1.5 mt-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Чаевые — 100% водителю
                  </p>
                  <div className="flex gap-2">
                    {[0, 50, 100, 200].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTip(t)}
                        className={cn(
                          'flex-1 rounded-lg border py-2 text-sm font-bold transition-all',
                          tip === t
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                        )}
                      >
                        {t === 0 ? 'Без чаевых' : `${t} ₽`}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={submitRate}
                    className="mt-3 h-11 w-full bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300"
                  >
                    <HandCoins className="mr-2 h-4 w-4" />
                    Отправить оценку{tip > 0 ? ` и ${tip} ₽` : ''}
                  </Button>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  <ReceiptText className="h-5 w-5 shrink-0 text-emerald-400" />
                  Спасибо! Оценка сохранена, чаевые переданы водителю полностью.
                </div>
              )}

              <Button
                variant="outline"
                onClick={reset}
                className="mt-3 w-full border-zinc-700 text-zinc-400 hover:text-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Заказать ещё
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[11px] leading-relaxed text-zinc-600">
          Демо-движок симулирует реальную работу агрегатора: заказы, назначение водителя, движение
          машины и честный чек. Данные не сохраняются.
        </p>
      </div>

      {/* Правая колонка: карта */}
      <div className="flex flex-col gap-4">
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
          searching={phase === 'live' && (!ride || ride.status === 'searching')}
          className="min-h-72 flex-1"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Фикс цены', value: 'до конца' },
            { label: 'Surge-кап', value: '×1,5' },
            { label: 'Чаевые', value: '100%' },
            { label: 'Пересчёт в пути', value: 'нет' },
          ].map((f) => (
            <div key={f.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center">
              <p className="text-sm font-black text-white">{f.value}</p>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
