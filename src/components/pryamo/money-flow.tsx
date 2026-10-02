'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Banknote, Coins, Split, UserRound, TrendingDown } from 'lucide-react'

/**
 * «Куда уходит чек» — анимированная визуализация потока денег
 * с одной и той же поездки: ПРЯМО (92% водителю) vs монополист (60%).
 * Частицы-рубли едут по SVG-путям через animateMotion (SMIL) —
 * ноль JS-нагрузки, работает даже при выключенном JS-таймере.
 */

const VIEW_W = 360
const VIEW_H = 340

interface FlowSpec {
  id: 'pryamo' | 'yandex'
  passenger: number
  driverCut: number
  platformCut: number
  driverLabel: string
  driverNote: string
  platformLabel: string
  platformNote: string
}

const FLOWS: FlowSpec[] = [
  {
    id: 'pryamo',
    passenger: 540,
    driverCut: 497,
    platformCut: 43,
    driverLabel: 'Водителю',
    driverNote: '92% чека',
    platformLabel: 'ПРЯМО',
    platformNote: '8% фикс',
  },
  {
    id: 'yandex',
    passenger: 540,
    driverCut: 324,
    platformCut: 216,
    driverLabel: 'Водителю',
    driverNote: '60% чека',
    platformLabel: 'Агрегатор + парк',
    platformNote: '~40% чека',
  },
]

/** Путь потока: из пассажира (верх) вниз к получателю */
const DRIVER_PATH = 'M 60 78 C 60 150, 30 190, 30 268'
const PLATFORM_PATH = 'M 120 78 C 120 150, 200 190, 200 268'

/** Контрольные точки кубических безье — для статичных частиц при reduced motion */
const DRIVER_CURVE: [number, number][] = [
  [60, 78], [60, 150], [30, 190], [30, 268],
]
const PLATFORM_CURVE: [number, number][] = [
  [120, 78], [120, 150], [200, 190], [200, 268],
]

/** Точка на кубическом безье в момент t (0..1) — чистая математика, SSR-безопасно */
function bezierAt(c: [number, number][], t: number): { x: number; y: number } {
  const mt = 1 - t
  const w0 = mt * mt * mt
  const w1 = 3 * mt * mt * t
  const w2 = 3 * mt * t * t
  const w3 = t * t * t
  return {
    x: w0 * c[0][0] + w1 * c[1][0] + w2 * c[2][0] + w3 * c[3][0],
    y: w0 * c[0][1] + w1 * c[1][1] + w2 * c[2][1] + w3 * c[3][1],
  }
}

/** Позиции статичных точек на кривой при reduced motion */
const STATIC_T = [0.18, 0.42, 0.66, 0.88]

function FlowPanel({ spec, index }: { spec: FlowSpec; index: number }) {
  const isPryamo = spec.id === 'pryamo'
  const reduced = useReducedMotion()
  const accentDriver = isPryamo ? '#34d399' : '#fb7185'
  const accentPlatform = isPryamo ? '#34d399' : '#f43f5e'
  // Толщина линии пропорциональна доле денег
  const driverW = Math.max(3, Math.round((spec.driverCut / spec.passenger) * 26))
  const platformW = Math.max(3, Math.round((spec.platformCut / spec.passenger) * 26))
  // Число частиц пропорционально деньгам
  const driverDots = Math.max(3, Math.round(spec.driverCut / 55))
  const platformDots = Math.max(2, Math.round(spec.platformCut / 55))

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className={
        isPryamo
          ? 'rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-5 shadow-xl shadow-emerald-500/5 sm:p-6'
          : 'rounded-2xl border border-rose-500/25 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-5 sm:p-6'
      }
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className={isPryamo ? 'text-base font-black text-emerald-400' : 'text-base font-black text-rose-400'}>
          {isPryamo ? 'ПРЯМО' : 'Монополист'}
        </h3>
        <span
          className={
            isPryamo
              ? 'rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400'
              : 'rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-400'
          }
        >
          {isPryamo ? 'комиссия 8%' : 'комиссия 24%+ и «опции»'}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="mx-auto mt-2 h-auto w-full max-w-[320px]"
        role="img"
        aria-label={
          isPryamo
            ? `Схема: пассажир платит 540 рублей, водителю уходит 497, платформе 43`
            : `Схема: пассажир платит 540 рублей, водителю уходит 324, агрегатору и парку 216`
        }
      >
        {/* Узел пассажира */}
        <g>
          <rect x="18" y="18" width="144" height="58" rx="14"
            className="fill-zinc-900 stroke-zinc-700" strokeWidth="1.5" />
          <circle cx="44" cy="47" r="15" className="fill-zinc-800" />
          <UserRound x="32" y="35" width="24" height="24" className="text-zinc-400" />
          <text x="68" y="42" className="fill-zinc-400" fontSize="11" fontWeight="600">
            Пассажир платит
          </text>
          <text x="68" y="60" className="fill-zinc-100" fontSize="16" fontWeight="800">
            {spec.passenger} ₽
          </text>
        </g>

        {/* Пути */}
        <path d={DRIVER_PATH} fill="none" stroke={accentDriver} strokeWidth={driverW}
          strokeLinecap="round" opacity="0.28" />
        <path d={PLATFORM_PATH} fill="none" stroke={accentPlatform} strokeWidth={platformW}
          strokeLinecap="round" opacity="0.28" />

        {/* Частицы к водителю: живые (SMIL) или статичные точки при reduced motion */}
        {reduced
          ? STATIC_T.map((t) => {
              const p = bezierAt(DRIVER_CURVE, t)
              return (
                <circle key={`ds${t}`} cx={p.x} cy={p.y} r={Math.max(2.5, driverW / 2.6)} fill={accentDriver} opacity={0.9} />
              )
            })
          : Array.from({ length: driverDots }).map((_, i) => (
              <circle key={`d${i}`} r={Math.max(2.5, driverW / 2.6)} fill={accentDriver}>
                <animateMotion dur="2.6s" begin={`${(i / driverDots) * 2.6}s`} repeatCount="indefinite" path={DRIVER_PATH} />
              </circle>
            ))}
        {/* Частицы к платформе */}
        {reduced
          ? STATIC_T.map((t) => {
              const p = bezierAt(PLATFORM_CURVE, t)
              return (
                <circle key={`ps${t}`} cx={p.x} cy={p.y} r={Math.max(2.5, platformW / 2.6)} fill={accentPlatform} opacity={0.9} />
              )
            })
          : Array.from({ length: platformDots }).map((_, i) => (
              <circle key={`p${i}`} r={Math.max(2.5, platformW / 2.6)} fill={accentPlatform}>
                <animateMotion dur="2.2s" begin={`${(i / platformDots) * 2.2 + 0.4}s`} repeatCount="indefinite" path={PLATFORM_PATH} />
              </circle>
            ))}

        {/* Узел водителя */}
        <g>
          <rect x="4" y="270" width="146" height="58" rx="14"
            className={isPryamo ? 'fill-emerald-500/10 stroke-emerald-500/60' : 'fill-rose-500/10 stroke-rose-500/50'}
            strokeWidth="1.5" />
          <Banknote x="12" y="286" width="22" height="22" style={{ color: accentDriver }} />
          <text x="42" y="294" className="fill-zinc-400" fontSize="11" fontWeight="600">
            {spec.driverLabel}
          </text>
          <text x="42" y="313" className={isPryamo ? 'fill-emerald-400' : 'fill-rose-400'} fontSize="17" fontWeight="800">
            {spec.driverCut} ₽
          </text>
          <text x="104" y="313" className="fill-zinc-500" fontSize="11" fontWeight="600">
            {spec.driverNote}
          </text>
        </g>

        {/* Узел платформы */}
        <g>
          <rect x="160" y="270" width="188" height="58" rx="14"
            className="fill-zinc-900 stroke-zinc-700" strokeWidth="1.5" />
          {isPryamo ? (
            <Coins x="170" y="286" width="22" height="22" style={{ color: '#34d399' }} />
          ) : (
            <TrendingDown x="170" y="286" width="22" height="22" style={{ color: '#f43f5e' }} />
          )}
          <text x="200" y="294" className="fill-zinc-400" fontSize="11" fontWeight="600">
            {spec.platformLabel}
          </text>
          <text x="200" y="313" className={isPryamo ? 'fill-emerald-300' : 'fill-rose-400'} fontSize="17" fontWeight="800">
            {spec.platformCut} ₽
          </text>
          <text x="262" y="313" className="fill-zinc-500" fontSize="11" fontWeight="600">
            {spec.platformNote}
          </text>
        </g>
      </svg>

      <p className="mt-1 text-center text-xs leading-relaxed text-zinc-500">
        {isPryamo ? (
          <>
            Пассажир и водитель видят <span className="font-semibold text-zinc-300">одну и ту же
            цену</span>. Платформа живёт на 8% и подписке Pro — и этого хватает.
          </>
        ) : (
          <>
            Комиссия агрегатора, опции, подписка парка, штрафы: до{' '}
            <span className="font-semibold text-rose-300">40% чека исчезает</span> между
            пассажиром и водителем.
          </>
        )}
      </p>
    </motion.div>
  )
}

export function MoneyFlow() {
  return (
    <section id="flow" className="relative scroll-mt-20 overflow-hidden bg-zinc-950 py-20 lg:py-24">
      <div
        className="absolute -top-32 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-emerald-500/8 blur-[130px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <Split className="h-3.5 w-3.5 text-amber-400" />
            Анатомия чека
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Куда уходит каждая копейка с поездки
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Одна и та же поездка за 540 ₽. Слева — путь денег с ПРЯМО: рубли едут к водителю.
            Справа — путь через монополиста: почти половина оседает по дороге.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {FLOWS.map((spec, i) => (
            <FlowPanel key={spec.id} spec={spec} index={i} />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-zinc-500"
        >
          Толщина «потока» и число монет пропорциональны реальным долям. Оценка для монополиста —
          консервативная: с волатильностью комиссии до 37% водители на форумах сообщают и о
          половине чека.
        </motion.p>
      </div>
    </section>
  )
}
