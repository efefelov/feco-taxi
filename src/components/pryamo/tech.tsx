'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Car,
  Lock,
  Map as MapIcon,
  Navigation,
  RotateCcw,
  Route,
  Satellite,
  ShieldCheck,
  Signal,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Секция «Технологии без клетки»: боль №5 — привязка монополиста к одному
 * навигатору и штрафы за GPS-срывы в тоннелях и подземных паркингах.
 * Интерактив «Тоннель»: одна и та же потеря сигнала — два разных исхода.
 */

const NAVIGATORS = [
  { id: '2gis', name: '2GIS', note: 'офлайн-карты' },
  { id: 'organic', name: 'Organic Maps', note: 'OpenStreetMap' },
  { id: 'yandex', name: 'Яндекс.Навигатор', note: 'если привычнее' },
] as const

type NavId = (typeof NAVIGATORS)[number]['id']
type Platform = 'pryamo' | 'monopoly'
type Phase = 'idle' | 'run' | 'done'

// Геометрия заезда: 10 секунд от старта до финиша, тоннель на 35–65%
const TUNNEL_START = 35
const TUNNEL_END = 65
/** Монополист отменяет заказ через 2 секунды в тоннеле (прогресс 55%) */
const CANCEL_AT = 55

function TunnelPanel() {
  const [platform, setPlatform] = useState<Platform>('pryamo')
  const [navigator_, setNavigator] = useState<NavId>('2gis')
  /** Единое состояние заезда: переходы фаз — внутри апдейтера интервала */
  const [run, setRun] = useState<{ progress: number; phase: Phase; cancelled: boolean }>({
    progress: 0,
    phase: 'idle',
    cancelled: false,
  })
  const statusRef = useRef<HTMLDivElement>(null)
  const prevPhaseRef = useRef<Phase>('idle')
  const reducedMotion = useReducedMotion()

  const { progress, phase, cancelled } = run

  // Итог заезда на узких экранах может быть ниже сгиба: подводим статусную карточку
  useEffect(() => {
    const wasRunning = prevPhaseRef.current !== 'done'
    prevPhaseRef.current = phase
    if (phase !== 'done' || !wasRunning) return
    const node = statusRef.current
    if (!node || window.innerWidth >= 1024) return
    const rect = node.getBoundingClientRect()
    if (rect.top >= 0 && rect.bottom <= window.innerHeight) return
    node.scrollIntoView({
      block: 'nearest',
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }, [phase, reducedMotion])

  // Прогресс заезда: тик 100 мс = +1% пути (весь заезд ~10 с)
  useEffect(() => {
    if (phase !== 'run') return
    const iv = window.setInterval(() => {
      setRun((r) => {
        if (r.phase !== 'run') return r
        // монополист останавливается на 55% — отмена заказа в тоннеле
        const limit = platform === 'monopoly' ? CANCEL_AT : 100
        const next = Math.min(r.progress + 1, limit)
        const done = next >= limit
        return {
          progress: next,
          phase: done ? 'done' : 'run',
          cancelled: done && platform === 'monopoly',
        }
      })
    }, 100)
    return () => window.clearInterval(iv)
  }, [phase, platform])

  /** Сброс при переключении платформы: сценарий проживается заново */
  const switchPlatform = (next: Platform) => {
    if (next === platform) return
    setPlatform(next)
    setRun({ progress: 0, phase: 'idle', cancelled: false })
  }

  const start = () => setRun({ progress: 0, phase: 'run', cancelled: false })

  const reset = () => setRun({ progress: 0, phase: 'idle', cancelled: false })

  const inTunnel = progress >= TUNNEL_START && progress < TUNNEL_END
  const finished = phase === 'done' && !cancelled
  const signal = cancelled || inTunnel ? 0 : 4
  /** Секунды без сигнала: в тоннеле прогресс идёт по 10%/с */
  const lostSecs =
    progress <= TUNNEL_START ? 0 : (Math.min(progress, TUNNEL_END) - TUNNEL_START) / 10

  // Статусная строка: платформа × фаза
  const status =
    phase === 'idle'
      ? {
          tone: 'neutral' as const,
          title: 'Готовы к заезду',
          text:
            platform === 'pryamo'
              ? 'Нажмите «Проехать тоннель» — и смотрите, что произойдёт с заказом при потере GPS.'
              : 'Тот же тоннель, но заказ ведёт навигатор монополиста. Нажмите и посмотрите исход.',
        }
      : cancelled
        ? {
            tone: 'rose' as const,
            title: 'Заказ отменён системой',
            text: '«Водитель не выполнил заказ». Штраф 300 ₽, приоритет −12 баллов, разбор в поддержке — шаблонным ответом. Сигнал так и не вернулся — машина стоит в тоннеле.',
          }
        : inTunnel
          ? {
              tone: platform === 'pryamo' ? ('amber' as const) : ('amber' as const),
              title: platform === 'pryamo' ? 'Сигнал потерян — заказ жив' : 'Сигнал потерян…',
              text:
                platform === 'pryamo'
                  ? `Без сигнала ${lostSecs.toFixed(1).replace('.', ',')} с — маршрут держится по офлайн-кэшу, заказ не отменяется, штраф 0 ₽.`
                  : `Без сигнала ${lostSecs.toFixed(1).replace('.', ',')} с — система следит за маршрутом. Ещё немного — и заказ будет отменён.`,
            }
          : finished
            ? {
                tone: 'emerald' as const,
                title: 'Заезд завершён: 0 ₽ штрафа',
                text: 'GPS-потеря — технический факт, а не вина водителя. Приоритет не тронут, заказ выполнен, чек — как договаривались.',
              }
            : {
                tone: 'neutral' as const,
                title: 'Едем по маршруту',
                text: 'Сигнал отличный. Впереди — тоннель: там геолокация пропадает у всех.',
              }

  const statusCls =
    status.tone === 'rose'
      ? 'border-rose-500/40 bg-rose-500/10'
      : status.tone === 'amber'
        ? 'border-amber-400/40 bg-amber-400/10'
        : status.tone === 'emerald'
          ? 'border-emerald-500/40 bg-emerald-500/10'
          : 'border-zinc-700/70 bg-zinc-900/60'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4 }}
      className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur sm:p-6"
    >
      {/* Переключатель платформ */}
      <div
        className="grid grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-950/70 p-1"
        role="group"
        aria-label="Чья платформа ведёт заказ"
      >
        <button
          onClick={() => switchPlatform('pryamo')}
          aria-pressed={platform === 'pryamo'}
          className={cn(
            'rounded-lg px-3 py-2.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
            platform === 'pryamo'
              ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white'
          )}
        >
          ПРЯМО
        </button>
        <button
          onClick={() => switchPlatform('monopoly')}
          aria-pressed={platform === 'monopoly'}
          className={cn(
            'rounded-lg px-3 py-2.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50',
            platform === 'monopoly'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'text-zinc-400 hover:text-white'
          )}
        >
          Монополист
        </button>
      </div>

      {/* Выбор навигатора */}
      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          <Navigation className="h-3.5 w-3.5" aria-hidden />
          Маршрут строит
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {NAVIGATORS.map((n) => {
            const locked = platform === 'monopoly' && n.id !== 'yandex'
            const selected = platform === 'monopoly' ? n.id === 'yandex' : navigator_ === n.id
            return (
              <button
                key={n.id}
                disabled={locked || phase === 'run'}
                onClick={() => setNavigator(n.id)}
                aria-pressed={selected}
                className={cn(
                  'rounded-xl border px-2 py-2 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:cursor-not-allowed',
                  selected
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700',
                  locked && 'opacity-40'
                )}
              >
                <span className="flex items-center justify-center gap-1 text-xs font-bold text-zinc-200">
                  {locked && <Lock className="h-3 w-3 text-zinc-500" aria-hidden />}
                  {n.name}
                </span>
                <span className="mt-1 block text-[10px] leading-relaxed text-zinc-500">
                  {locked ? 'только у ПРЯМО' : n.note}
                </span>
              </button>
            )
          })}
        </div>
        {platform === 'monopoly' && (
          <p className="mt-1.5 text-[11px] leading-snug text-zinc-600">
            У монополиста маршрут строит только их навигатор — выбора нет.
          </p>
        )}
      </div>

      {/* Трасса с тоннелем */}
      <div className="relative mt-5 h-32 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70">
        <div className="absolute inset-x-5 bottom-0 top-0">
          {/* тоннель */}
          <div
            className="absolute bottom-5 top-5 border border-zinc-700/70 bg-[repeating-linear-gradient(90deg,rgba(113,113,122,0.22)_0px_9px,transparent_9px_18px)]"
            style={{ left: `${TUNNEL_START}%`, right: `${100 - TUNNEL_END}%` }}
            aria-hidden="true"
          />
          <span
            className="absolute top-1.5 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600"
            style={{ left: `${(TUNNEL_START + TUNNEL_END) / 2}%` }}
          >
            тоннель
          </span>
          {/* дорога */}
          <div className="absolute inset-x-0 bottom-9 h-1.5 rounded-full bg-zinc-800" aria-hidden="true" />
          {/* машина */}
          <div
            className="absolute bottom-10 -translate-x-1/2 transition-all duration-100 ease-linear"
            style={{ left: `${Math.max(2, Math.min(98, progress))}%` }}
          >
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl border shadow-lg transition-colors',
                cancelled
                  ? 'border-rose-500/60 bg-rose-500/15 text-rose-400'
                  : inTunnel
                    ? 'border-amber-400/60 bg-amber-400/15 text-amber-300'
                    : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
              )}
            >
              <Car className="h-5 w-5" aria-hidden />
            </span>
          </div>
          {/* метки старта/финиша */}
          <span className="absolute bottom-2 left-0 text-[9px] font-bold uppercase tracking-widest text-zinc-700">
            старт
          </span>
          <span className="absolute bottom-2 right-0 text-[9px] font-bold uppercase tracking-widest text-zinc-700">
            финиш
          </span>
        </div>
      </div>

      {/* Индикатор GPS */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-end gap-[3px]" aria-hidden="true">
            {[5, 8, 11, 14].map((h, i) => (
              <span
                key={h}
                style={{ height: `${h}px` }}
                className={cn(
                  'w-[4px] rounded-sm transition-colors duration-300',
                  signal > i ? 'bg-emerald-400' : 'bg-zinc-700'
                )}
              />
            ))}
          </span>
          <span
            className={cn(
              'flex items-center gap-1.5 text-xs font-semibold',
              signal === 0 ? 'text-amber-300' : 'text-zinc-300'
            )}
          >
            <Satellite className={cn('h-3.5 w-3.5', signal === 0 && 'animate-pulse')} aria-hidden />
            {signal === 0 ? 'нет сигнала' : 'сигнал GPS'}
          </span>
        </div>
        {inTunnel && !cancelled && (
          <span className="rounded-lg bg-amber-400/10 px-2.5 py-1 text-xs font-bold tabular-nums text-amber-300">
            без сигнала: {lostSecs.toFixed(1).replace('.', ',')} с
          </span>
        )}
        {cancelled && (
          <span className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-300">
            заказ мёртв
          </span>
        )}
        {finished && (
          <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300">
            заказ выполнен
          </span>
        )}
      </div>

      {/* Статус */}
      <div
        ref={statusRef}
        className={cn(
          'mt-3 flex-1 scroll-mt-24 rounded-xl border p-3.5 transition-colors duration-300',
          statusCls
        )}
        role="status"
        aria-live="polite"
      >
        <p
          className={cn(
            'flex items-center gap-1.5 text-sm font-bold',
            status.tone === 'rose'
              ? 'text-rose-300'
              : status.tone === 'amber'
                ? 'text-amber-300'
                : status.tone === 'emerald'
                  ? 'text-emerald-300'
                  : 'text-zinc-200'
          )}
        >
          {status.tone === 'rose' ? (
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
          ) : status.tone === 'emerald' ? (
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Signal className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {status.title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">{status.text}</p>
      </div>

      {/* Управление */}
      <div className="mt-4">
        {phase === 'idle' && (
          <Button
            onClick={start}
            className={cn(
              'h-11 w-full text-base font-bold',
              platform === 'pryamo'
                ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
                : 'bg-rose-500 text-white hover:bg-rose-400'
            )}
          >
            <Car className="mr-2 h-4 w-4" aria-hidden />
            Проехать тоннель
          </Button>
        )}
        {phase === 'run' && (
          <Button disabled className="h-11 w-full text-base font-bold">
            Едем{inTunnel ? ' — в тоннеле' : ''}…
          </Button>
        )}
        {phase === 'done' && (
          <div className="flex gap-2">
            <Button
              onClick={reset}
              variant="outline"
              className="h-11 flex-1 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden />
              Сбросить
            </Button>
            <Button
              onClick={() => switchPlatform(platform === 'pryamo' ? 'monopoly' : 'pryamo')}
              className="h-11 flex-1 bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
            >
              {platform === 'pryamo' ? 'Как у монополиста?' : 'Как на ПРЯМО?'}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const BENEFITS = [
  {
    icon: MapIcon,
    title: 'Любой навигатор — ваш выбор',
    text: '2GIS, Organic Maps, Яндекс.Навигатор: маршрут строит тот, кому вы доверяете. У монополиста — только их приложение, без вариантов.',
  },
  {
    icon: Route,
    title: 'Офлайн-кэш маршрута',
    text: 'Заказ и маршрут живут на устройстве: потеря сети или геолокации не отменяет поездку и не «зависает» ленту.',
  },
  {
    icon: Satellite,
    title: 'GPS-срыв — не вина водителя',
    text: 'Тоннель, подземный паркинг, плотная застройка — платформа отличает потерю сигнала от отказа. Штраф — 0 ₽, всегда.',
  },
]

export function TechSection() {
  return (
    <section id="tech" className="scroll-mt-20 bg-zinc-950 py-20 text-zinc-100 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
            <Navigation className="h-3.5 w-3.5 text-emerald-400" />
            Технологии
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Навигатор и GPS — без клетки
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Монополист привязывает водителя к своему навигатору и штрафует за GPS-срывы,
            которые водитель не контролирует. Мы делаем наоборот: свобода выбора и защита
            от ложных «срывов заказа».
          </p>
        </motion.div>

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Принципы */}
          <div className="flex flex-col gap-4">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
              >
                <span className="shrink-0 rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                  <b.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-bold text-white">{b.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">{b.text}</p>
                </div>
              </motion.div>
            ))}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-auto text-[11px] leading-relaxed text-zinc-600"
            >
              Сценарий справа — по мотивам реальных жалоб водителей: штрафы за «срыв заказа»
              при потере GPS в тоннелях и подземных паркингах. У монополиста срыв GPS
              считается виной водителя. У нас — техническим событием.
            </motion.p>
          </div>

          {/* Интерактив «Тоннель» */}
          <TunnelPanel />
        </div>
      </div>
    </section>
  )
}
