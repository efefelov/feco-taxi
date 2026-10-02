'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gavel, Layers, Play, Square, RotateCcw, Hand, CircleAlert, Check, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { estimatePrice, plural, rub } from '@/lib/pryamo/format'
import { cn } from '@/lib/utils'

// ===== АУКЦИОН ПРЯМО =====

interface AuctionOrder {
  id: string
  from: string
  to: string
  km: number
  min: number
  payout: number
}

interface Bot {
  id: number
  name: string
  reaction: number
  grabbed: boolean
}

const STREETS_FROM = ['ул. Тверская, 7', 'пр. Ленина, 42', 'ул. Хохловка, 61', 'Рождественский б-р, 77', 'ул. Ключевая, 13', 'Рублёвское ш., 4']
const STREETS_TO = ['Аэропорт, терминал C', 'ул. Садовая, 12', 'ЖД-вокзал', 'ТЦ «Меркурий»', 'пл. Победы, 1', 'ул. Строителей, 25']
const BOT_NAMES = ['Сергей К.', 'Ахмед Р.', 'Дмитрий В.', 'Рустам Ш.', 'Олег П.', 'Виктор Л.']
const ECO = { baseFare: 79, perKm: 14, perMin: 6, multiplier: 1 }

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

function makeOrder(n: number): AuctionOrder {
  const km = 3 + Math.floor(Math.random() * 18)
  const min = Math.max(4, Math.round((km / 27) * 60 + 3))
  const surge = 1 + Math.floor(Math.random() * 4) * 0.1
  const price = estimatePrice(ECO, km, min, surge)
  return {
    id: `A-${1000 + n}`,
    from: pick(STREETS_FROM),
    to: pick(STREETS_TO),
    km,
    min,
    payout: Math.round(price * 0.92),
  }
}

function makeBots(): Bot[] {
  const names = [...BOT_NAMES].sort(() => Math.random() - 0.5).slice(0, 3)
  return names.map((name, i) => ({
    id: i,
    name,
    reaction: 1.4 + Math.random() * 2.8,
    grabbed: false,
  }))
}

type AuctionPhase = 'idle' | 'live' | 'won' | 'lost'

function AuctionPanel() {
  const [phase, setPhase] = useState<AuctionPhase>('idle')
  const [order, setOrder] = useState<AuctionOrder | null>(null)
  const [bots, setBots] = useState<Bot[]>([])
  const [winner, setWinner] = useState<string>('')
  const [score, setScore] = useState({ taken: 0, missed: 0 })
  const [orderN, setOrderN] = useState(0)
  const [urgent, setUrgent] = useState(false)

  const takenRef = useRef(false)
  const timersRef = useRef<number[]>([])
  const counterRef = useRef(0)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
  }, [])

  const nextOrder = useCallback(() => {
    counterRef.current += 1
    takenRef.current = false
    setWinner('')
    setOrder(makeOrder(counterRef.current))
    setOrderN(counterRef.current)
    setBots(makeBots())
    setPhase('live')
    setUrgent(false)
  }, [])

  // После результата — следующий заказ через паузу (пока смена идёт)
  useEffect(() => {
    if (phase === 'won' || phase === 'lost') {
      const t = window.setTimeout(() => nextOrder(), 2300)
      return () => clearTimeout(t)
    }
  }, [phase, nextOrder])

  useEffect(() => () => clearTimers(), [clearTimers])

  const startShift = () => {
    setScore({ taken: 0, missed: 0 })
    counterRef.current = 0
    nextOrder()
  }

  const stopShift = () => {
    clearTimers()
    setPhase('idle')
    setOrder(null)
    setBots([])
  }

  const take = () => {
    if (phase !== 'live' || takenRef.current) return
    takenRef.current = true
    clearTimers()
    setPhase('won')
    setScore((s) => ({ ...s, taken: s.taken + 1 }))
  }

  // Боты «думают»: каждый по своему таймеру; самый быстрый забирает заказ
  useEffect(() => {
    if (phase !== 'live' || !bots.length) return
    const botTimers = bots.map((b) =>
      window.setTimeout(() => {
        if (takenRef.current) return
        takenRef.current = true
        clearTimers()
        setWinner(b.name)
        setBots((prev) => prev.map((x) => (x.id === b.id ? { ...x, grabbed: true } : x)))
        setPhase('lost')
        setScore((s) => ({ ...s, missed: s.missed + 1 }))
      }, b.reaction * 1000)
    )
    timersRef.current.push(...botTimers)
    // Подсветка «поторопитесь» за секунду до самого быстрого бота
    const fastest = Math.min(...bots.map((b) => b.reaction))
    const warn = window.setTimeout(() => setUrgent(true), Math.max(0, (fastest - 1) * 1000))
    timersRef.current.push(warn)
    return () => {
      botTimers.forEach((t) => clearTimeout(t))
      clearTimeout(warn)
    }
  }, [orderN, phase])

  const running = phase === 'live' || phase === 'won' || phase === 'lost'

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5 shadow-xl shadow-emerald-500/5 sm:p-6">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-300">
          <Gavel className="h-4 w-4" aria-hidden />
          ПРЯМО · аукцион
        </span>
        {running && (
          <Button
            variant="outline"
            size="sm"
            onClick={stopShift}
            className="h-8 border-zinc-700 bg-transparent px-3 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <Square className="mr-1 h-3 w-3" aria-hidden />
            Закончить смену
          </Button>
        )}
      </div>
      <h3 className="relative mt-3 text-lg font-black tracking-tight text-white">
        Кто первый нажал — того и заказ
      </h3>
      <p className="relative mt-1 text-sm leading-relaxed text-zinc-400">
        Никаких «карточек качества». Ваша скорость — единственный фактор. Отказ («Мимо») не
        существует: не взяли — просто не взяли.
      </p>

      {/* Счёт смены */}
      <div className="relative mt-4 grid grid-cols-3 gap-2">
        {[
          { v: score.taken, l: plural(score.taken, 'заказ взят', 'заказа взято', 'заказов взято'), tone: 'emerald' },
          { v: score.missed, l: 'упущено мимо', tone: 'zinc' },
          { v: 0, l: 'штрафов', tone: 'emerald' },
        ].map((s) => (
          <div
            key={s.l}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-center',
              s.tone === 'emerald' ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-zinc-700/60 bg-zinc-800/40'
            )}
          >
            <p
              className={cn(
                'text-xl font-black tabular-nums',
                s.tone === 'emerald' ? 'text-emerald-400' : 'text-zinc-200'
              )}
            >
              {s.v}
            </p>
            <p className="text-[10px] font-medium leading-tight text-zinc-500">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Поле игры */}
      <div className="relative mt-4 flex min-h-[280px] flex-1 flex-col">
        <AnimatePresence mode="wait">
          {phase === 'idle' ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700/70 bg-zinc-900/40 p-6 text-center"
            >
              <Play className="h-8 w-8 text-emerald-400" aria-hidden />
              <p className="mt-3 max-w-[240px] text-sm text-zinc-400">
                Выйдите на смену и попробуйте перехватывать заказы быстрее ботов
              </p>
              <Button
                onClick={startShift}
                className="mt-4 h-11 bg-emerald-500 px-6 font-bold text-zinc-950 hover:bg-emerald-400"
              >
                <Play className="mr-1.5 h-4 w-4" aria-hidden />
                Начать смену
              </Button>
            </motion.div>
          ) : order ? (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.28 }}
              className={cn(
                'flex flex-1 flex-col rounded-xl border p-4 transition-colors sm:p-5',
                phase === 'won'
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : phase === 'lost'
                    ? 'border-zinc-700/70 bg-zinc-900/60'
                    : urgent
                      ? 'border-amber-500/50 bg-zinc-900/70'
                      : 'border-emerald-500/20 bg-zinc-900/60'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Заказ {order.id}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-zinc-200">
                    {order.from} → {order.to}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {order.km} км · ~{order.min} мин
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-black tabular-nums text-emerald-400">
                    {rub(order.payout)}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    к выплате · фикс
                  </p>
                </div>
              </div>

              {/* Боты-конкуренты с полосами реакции */}
              <div className="mt-4 space-y-2">
                {bots.map((b) => (
                  <div key={b.id} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'w-24 shrink-0 truncate text-xs font-medium',
                        b.grabbed ? 'text-rose-400' : 'text-zinc-400'
                      )}
                    >
                      {b.name}
                    </span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                      {phase === 'live' && (
                        <motion.div
                          className={cn(
                            'absolute inset-y-0 left-0 rounded-full',
                            b.grabbed ? 'bg-rose-500' : 'bg-zinc-600'
                          )}
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: b.reaction, ease: 'linear' }}
                        />
                      )}
                      {phase !== 'live' && (
                        <div
                          className={cn(
                            'absolute inset-y-0 left-0 rounded-full',
                            b.grabbed ? 'bg-rose-500' : 'bg-zinc-700'
                          )}
                          style={{ width: b.grabbed ? '100%' : '40%' }}
                        />
                      )}
                    </div>
                    <span className="w-16 shrink-0 text-right text-[10px] font-semibold text-zinc-500">
                      {b.grabbed ? 'взял!' : `${b.reaction.toFixed(1)} с`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Кнопка / результат */}
              <div className="mt-auto pt-4">
                {phase === 'live' ? (
                  <Button
                    onClick={take}
                    size="lg"
                    className={cn(
                      'h-12 w-full text-base font-black transition-all',
                      urgent
                        ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                        : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
                    )}
                  >
                    <Hand className="mr-2 h-4 w-4" aria-hidden />
                    Взять за {rub(order.payout)}
                  </Button>
                ) : phase === 'won' ? (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300"
                  >
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                    Заказ ваш — {rub(order.payout)} к выплате. Скорость решает, не баллы.
                  </motion.p>
                ) : (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm font-medium text-zinc-300"
                  >
                    <X className="h-4 w-4 shrink-0 text-rose-400" aria-hidden />
                    <span>
                      {winner} нажал на {(Math.min(...bots.map((b) => b.reaction)) - 0.1).toFixed(1).replace('.', ',')} с
                      раньше. Штраф — 0 ₽, приоритет не пострадал.
                    </span>
                  </motion.p>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ===== ОЧЕРЕДЬ МОНОПОЛИСТА =====

const INITIAL_PRIORITY = 92
const INITIAL_QUEUE = [
  { name: 'Игорь П.', balls: 96 },
  { name: 'Марат С.', balls: 95 },
  { name: 'Вы', balls: INITIAL_PRIORITY },
  { name: 'Ким А.', balls: 87 },
  { name: 'Саша В.', balls: 84 },
  { name: 'Лев Д.', balls: 78 },
]

const EXTRA_DRIVERS = [
  { name: 'Гриша Т.', balls: 93 },
  { name: 'Динис Х.', balls: 91 },
  { name: 'Тимур Б.', balls: 89 },
  { name: 'Эдуард М.', balls: 88 },
  { name: 'Илья Ж.', balls: 86 },
]

function QueuePanel() {
  const [priority, setPriority] = useState(INITIAL_PRIORITY)
  const [refusals, setRefusals] = useState(0)
  const [blocked, setBlocked] = useState(false)
  const [shake, setShake] = useState(0)
  const [extra, setExtra] = useState(0)

  const queue = useMemo(() => {
    const rows = [...INITIAL_QUEUE]
    for (let i = 0; i < extra; i++) {
      const d = EXTRA_DRIVERS[i % EXTRA_DRIVERS.length] as { name: string; balls: number }
      // вставляем сверху — «обгоняют» вас
      const insertAt = Math.max(0, rows.findIndex((r) => r.name === 'Вы') - (i % 2))
      rows.splice(insertAt, 0, { ...d })
    }
    return rows.map((r) => (r.name === 'Вы' ? { ...r, balls: priority } : r))
  }, [extra, priority])

  const position = queue.findIndex((r) => r.name === 'Вы') + 1
  const orderShown = { km: 18, note: '«доход по факту»' }

  const refuse = () => {
    if (blocked) return
    const next = refusals + 1
    setRefusals(next)
    setPriority((p) => Math.max(0, p - 12))
    setExtra((e) => Math.min(e + 1, 5))
    setShake((s) => s + 1)
    if (next >= 4) setBlocked(true)
  }

  const reset = () => {
    setPriority(INITIAL_PRIORITY)
    setRefusals(0)
    setBlocked(false)
    setExtra(0)
  }

  const orderGoesTo = queue.find((r) => r.name !== 'Вы')?.name ?? '—'

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-rose-500/25 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-5 shadow-xl shadow-rose-500/5 sm:p-6">
      <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-300">
          <Layers className="h-4 w-4" aria-hidden />
          Монополист · очередь
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="h-8 border-zinc-700 bg-transparent px-3 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          <RotateCcw className="mr-1 h-3 w-3" aria-hidden />
          Сбросить
        </Button>
      </div>
      <h3 className="relative mt-3 text-lg font-black tracking-tight text-white">
        «Карточка качества» решает за вас
      </h3>
      <p className="relative mt-1 text-sm leading-relaxed text-zinc-400">
        Заказ виден не всем, выплаты не видно вовсе. Отказ от невыгодного заказа — минус баллы
        приоритета и падение в очереди.
      </p>

      {/* Заказ — уходит мимо вас */}
      <div
        key={shake}
        className={cn(
          'relative mt-4 rounded-xl border p-4',
          blocked ? 'border-rose-500/50 bg-rose-500/10' : 'border-rose-500/25 bg-zinc-900/60'
        )}
      >
        <motion.div
          key={`sh-${shake}`}
          initial={shake > 0 ? { x: 0 } : false}
          animate={shake > 0 ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Заказ ушёл {orderGoesTo}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-zinc-200">
              Заречье → Аэропорт, {orderShown.km} км
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
              <Eye className="h-3 w-3 text-zinc-600" aria-hidden />
              выплата скрыта · {orderShown.note}
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-400">
            не вам
          </span>
        </motion.div>
      </div>

      {/* Очередь с баллами */}
      <div className="relative mt-4 flex-1">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Очередь на следующий заказ · вы {position}-й
        </p>
        <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1 feed-scroll">
          {queue.map((r) => {
            const isYou = r.name === 'Вы'
            return (
              <motion.div
                key={r.name}
                layout
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border px-3 py-2',
                  isYou
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-zinc-800 bg-zinc-900/50'
                )}
              >
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm font-semibold',
                    isYou ? 'text-amber-300' : 'text-zinc-300'
                  )}
                >
                  {isYou && (
                    <span className="mr-1.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
                      Вы
                    </span>
                  )}
                  {isYou ? '' : r.name}
                </span>
                {/* Баллы приоритета */}
                <div className="flex shrink-0 items-center gap-1" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        i < Math.round(r.balls / 20)
                          ? isYou
                            ? 'bg-amber-400'
                            : 'bg-zinc-500'
                          : 'bg-zinc-800'
                      )}
                    />
                  ))}
                </div>
                <span
                  className={cn(
                    'shrink-0 text-xs font-bold tabular-nums',
                    isYou ? 'text-amber-400' : 'text-zinc-500'
                  )}
                >
                  {r.balls}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Действие и последствия */}
      <div className="relative mt-4">
        <Button
          onClick={refuse}
          disabled={blocked}
          variant="outline"
          size="lg"
          className="h-12 w-full border-rose-500/40 bg-rose-500/10 text-base font-bold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 disabled:opacity-50"
        >
          <Hand className="mr-2 h-4 w-4" aria-hidden />
          Отказаться от невыгодного
        </Button>

        <div className="mt-3 space-y-1.5">
          <p className="flex items-center justify-between text-xs text-zinc-500">
            <span>Приоритет</span>
            <span className={cn('font-bold tabular-nums', priority < 60 ? 'text-rose-400' : 'text-amber-400')}>
              {priority} из 100
            </span>
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
              animate={{ width: `${priority}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className={cn('text-xs', blocked ? 'text-rose-400' : 'text-zinc-500')}>
            {blocked
              ? 'Лента заблокирована на 2 часа. Причина: «низкая активность». Поддержка ответит шаблоном.'
              : `Отказов подряд: ${refusals} из 4 → блокировка`}
          </p>
        </div>
      </div>
    </div>
  )
}

// ===== СЕКЦИЯ =====

export function AuctionSection() {
  return (
    <section id="fair" className="scroll-mt-20 bg-zinc-50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Gavel className="h-3.5 w-3.5" />
            Устройство ленты заказов
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            Аукцион против очереди:
            <br />
            почувствуйте разницу руками
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Слева — как распределяются заказы на ПРЯМО: открыто и мгновенно. Справа — как это
            устроено у монополиста: непрозрачные баллы, падение приоритета и блокировка за отказ.
          </p>
        </motion.div>

        <div className="mt-12 grid items-stretch gap-4 sm:gap-6 lg:grid-cols-2">
          <AuctionPanel />
          <QueuePanel />
        </div>

        {/* Итоговая полоса */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="mt-8 grid gap-3 sm:grid-cols-2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/70 bg-white px-5 py-4 shadow-sm">
            <span className="shrink-0 rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Check className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm font-semibold text-zinc-700">
              На ПРЯМО отказ не существует как понятие: 0 ₽ штрафа, 0 потерь приоритета, 0 блокировок
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200/70 bg-white px-5 py-4 shadow-sm">
            <span className="shrink-0 rounded-xl bg-rose-50 p-2.5 text-rose-500">
              <CircleAlert className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm font-semibold text-zinc-700">
              У монополиста 4 отказа подряд — блокировка ленты «за активность», баллы сгорают
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
