'use client'

import { useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Trophy,
  Medal,
  Flame,
  Target,
  Gift,
  HeartHandshake,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Crown,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { plural } from '@/lib/pryamo/format'

/**
 * «Игра, а не клетка» — геймификация ПРЯМО: лиги, серии, квесты,
 * соревнования водителей и пассажиров. Центральный интерактив —
 * «Колесо фортуны»: размеры секторов = честные вероятности (Скиннер
 * с раскрытыми картами), один спин в смену, выключается кнопкой.
 */

/** Сектор колеса: вес = вероятность (сумма весов = 100) */
interface Sector {
  prize: string
  value: number // ₽ эквивалент для честной строки «сколько это стоит»
  weight: number
  color: string
  label: string
}

const SECTORS: Sector[] = [
  { prize: '50 ₽ на топливо', value: 50, weight: 40, color: '#065f46', label: '50' },
  { prize: '100 ₽ на топливо', value: 100, weight: 25, color: '#059669', label: '100' },
  { prize: '200 ₽ на мойку', value: 200, weight: 15, color: '#10b981', label: '200' },
  { prize: '500 ₽ бонусом', value: 500, weight: 10, color: '#d97706', label: '500' },
  { prize: '0% комиссии на день', value: 900, weight: 7, color: '#f59e0b', label: '0%' },
  { prize: 'Бак бензина · 2 000 ₽', value: 2000, weight: 3, color: '#fbbf24', label: '2 000' },
]

const TOTAL_WEIGHT = SECTORS.reduce((a, s) => a + s.weight, 0)

const RADIUS = 120
const CX = 130
const CY = 130

function polar(angleDeg: number, r: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
}

function sectorPath(startDeg: number, endDeg: number): string {
  const [x1, y1] = polar(startDeg, RADIUS)
  const [x2, y2] = polar(endDeg, RADIUS)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
}

/** Границы секторов в градусах (0 = верх, по часовой) */
function sectorBounds(): { s: number; e: number; center: number }[] {
  const out: { s: number; e: number; center: number }[] = []
  let acc = 0
  for (const sec of SECTORS) {
    const s = (acc / TOTAL_WEIGHT) * 360
    acc += sec.weight
    const e = (acc / TOTAL_WEIGHT) * 360
    out.push({ s, e, center: (s + e) / 2 })
  }
  return out
}

function pickWeighted(): number {
  let r = Math.random() * TOTAL_WEIGHT
  for (let i = 0; i < SECTORS.length; i++) {
    r -= SECTORS[i].weight
    if (r < 0) return i
  }
  return SECTORS.length - 1
}

const LEAGUES = [
  { name: 'Бронза', req: 'первые 50 поездок', perk: 'серии и квесты' },
  { name: 'Серебро', req: 'рейтинг 4,7+ и 200 поездок', perk: 'доступ к колесу ×2' },
  { name: 'Золото', req: 'рейтинг 4,85+ и 500 поездок', perk: 'приоритетная поддержка 15 минут' },
  { name: 'Платина', req: 'топ-5% города за сезон', perk: 'фонд призов сезона' },
  { name: 'Лига основателей', req: 'первые 1 000 водителей города', perk: 'фикс условий навсегда' },
]

const QUESTS = [
  {
    icon: Flame,
    title: 'Серии смен',
    body: '10 смен подряд без пропуска подачи — бонус-топливо 500 ₽. Сорвалась серия — ничего не теряете: заказы и приоритет не зависят от неё.',
  },
  {
    icon: Target,
    title: 'Квесты спроса',
    body: '«Закрыть утренний пик понедельника» — ×1,2 к выплате этих заказов. Мы честно платим за сложные часы, а не «разводим» коэффициентом.',
  },
  {
    icon: Crown,
    title: 'Лучший водитель города',
    body: 'Каждый месяц: 30 000 ₽, «золотая» шашечка на профиль и афиша города. Считаем по рейтингу, аккуратности и полноте смен.',
  },
  {
    icon: HeartHandshake,
    title: 'Лучший пассажир',
    body: 'Тоже геймифицируем: не опаздывает, честно оценивает, помогает водителю — кэшбэк 1 000 ₽ в квартал. Уважение — валюта с двух сторон.',
  },
]

export function Gamification() {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [spins, setSpins] = useState(0)
  const reduced = useReducedMotion()
  const busyRef = useRef(false)

  const bounds = useMemo(() => sectorBounds(), [])

  const spin = () => {
    if (busyRef.current) return
    busyRef.current = true
    setSpinning(true)
    setResult(null)
    const idx = pickWeighted()
    const b = bounds[idx]
    const sectorSpan = b.e - b.s
    const jitter = (Math.random() - 0.5) * sectorSpan * 0.6
    const targetCenter = b.center + jitter
    // сектор при вращении R попадает центром на указатель (верх), когда
    // center + R ≡ 0 (mod 360) → добираем полные обороты вперёд
    const current = rotation % 360
    const need = ((-targetCenter - current) % 360 + 360) % 360
    const fullTurns = reduced ? 0.3 : 5
    setRotation(rotation + fullTurns * 360 + need)
    setSpins((s) => s + 1)
  }

  return (
    <section id="game" className="scroll-mt-20 bg-background py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            Геймификация
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-balance text-zinc-900 sm:text-4xl">
            Игра, а не клетка: награды — деньгами, а не «приоритетом»
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Сезоны, серии и соревнования удерживают водителя лучше любого «балла качества». Но у
            наших механик одно правило: награда — деньги и топливо, а не доступ к заказам. Проиграл
            сезон — работаешь как работал.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Лиги */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-200/50 sm:p-7"
          >
            <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-zinc-900">
              <Medal className="h-5 w-5 text-amber-500" aria-hidden />
              Лиги · сезон 90 дней
            </h3>
            <ol className="mt-5 space-y-3">
              {LEAGUES.map((l, i) => (
                <li
                  key={l.name}
                  className="flex items-center gap-3.5 rounded-xl border border-zinc-100 bg-zinc-50/70 px-4 py-3 transition-colors hover:border-zinc-200"
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black',
                      i === LEAGUES.length - 1
                        ? 'bg-amber-400 text-zinc-900'
                        : i >= 3
                          ? 'bg-zinc-800 text-amber-300'
                          : 'bg-zinc-200 text-zinc-600'
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-900">{l.name}</p>
                    <p className="text-[11px] text-zinc-500">{l.req}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                    {l.perk}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
              Лига не влияет на очередь заказов и не «понижается» штрафами. Это статусная ачивка с
              фондом, а не вторая «карточка качества».
            </p>
          </motion.div>

          {/* Колесо фортуны */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl shadow-zinc-300/40 sm:p-7"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
                <Gift className="h-5 w-5 text-amber-400" aria-hidden />
                Колесо смены · раз в сутки
              </h3>
              <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                демо · крутите
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Классическое переменное вознаграждение — только с раскрытыми картами: размер сектора
              на колесе <strong className="text-zinc-200">равен вероятности выигрыша</strong>. Никаких
              «почти джекпотов» на полколеса.
            </p>

            <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">
              {/* Само колесо */}
              <div className="relative shrink-0" role="img" aria-label="Колесо призов смены">
                {/* Указатель */}
                <div
                  className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2"
                  aria-hidden="true"
                >
                  <div className="h-0 w-0 border-x-[9px] border-t-[16px] border-x-transparent border-t-amber-400 drop-shadow" />
                </div>
                <motion.svg
                  width={260}
                  height={260}
                  viewBox="0 0 260 260"
                  animate={{ rotate: rotation }}
                  transition={{ duration: reduced ? 0.8 : 4.4, ease: [0.16, 0.9, 0.26, 1] }}
                  onAnimationComplete={() => {
                    if (busyRef.current) {
                      busyRef.current = false
                      setSpinning(false)
                      // результат = сектор под указателем (верх)
                      const at = ((-rotation % 360) + 360) % 360
                      const found = bounds.findIndex((b) => at >= b.s && at < b.e)
                      setResult(found >= 0 ? found : 0)
                    }
                  }}
                  className="rounded-full shadow-2xl shadow-black/50 ring-4 ring-zinc-800"
                >
                  <circle cx={CX} cy={CY} r={RADIUS + 6} className="fill-zinc-900" />
                  {bounds.map((b, i) => {
                    const sec = SECTORS[i]
                    // координаты округляем: Math.cos/sin дают разные флоаты
                    // в JavaScriptCore (SSR, bun) и V8 (браузер) — иначе hydration mismatch
                    const [txr, tyr] = polar(b.center, RADIUS * 0.62)
                    const tx = +txr.toFixed(2)
                    const ty = +tyr.toFixed(2)
                    return (
                      <g key={sec.prize}>
                        <path
                          d={sectorPath(b.s, b.e)}
                          fill={sec.color}
                          stroke="#09090b"
                          strokeWidth="1.5"
                        />
                        {b.e - b.s >= 24 && (
                          <text
                            x={tx}
                            y={ty}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="12"
                            fontWeight="800"
                            fill="#09090b"
                            transform={`rotate(${b.center} ${tx} ${ty})`}
                          >
                            {sec.label}
                          </text>
                        )}
                      </g>
                    )
                  })}
                  <circle cx={CX} cy={CY} r="18" className="fill-zinc-950 stroke-zinc-700" strokeWidth="2" />
                </motion.svg>

                <button
                  onClick={spin}
                  disabled={spinning}
                  className={cn(
                    'mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold transition-all',
                    spinning
                      ? 'cursor-not-allowed bg-zinc-800 text-zinc-500'
                      : 'bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-300'
                  )}
                >
                  {spinning ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-pulse" aria-hidden />
                      Крутится…
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" aria-hidden />
                      {result !== null ? 'Ещё раз' : 'Крутить колесо'}
                    </>
                  )}
                </button>
              </div>

              {/* Легенда вероятностей + результат */}
              <div className="w-full">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Честные вероятности
                </p>
                <ul className="mt-2 space-y-1.5">
                  {SECTORS.map((s, i) => (
                    <li key={s.prize} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: s.color }}
                        aria-hidden
                      />
                      <span className="flex-1 text-zinc-400">{s.prize}</span>
                      <span className="font-bold tabular-nums text-zinc-300">{s.weight}%</span>
                      {result === i && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-black text-emerald-400">
                          выпало
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                {result !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4"
                    role="status"
                    aria-live="polite"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                      Ваш приз
                    </p>
                    <p className="mt-0.5 text-lg font-black text-emerald-300">
                      {SECTORS[result].prize}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                      В демо — просто цифра. В продукте за это отвечает призовой фонд города: 1%
                      комиссионного оборота, отчёт фонда — публичный.
                    </p>
                  </motion.div>
                )}

                {spins > 0 && result === null && (
                  <p className="mt-3 text-[11px] text-zinc-500">
                    Спинов в этой сессии: {spins} {plural(spins, 'раз', 'раза', 'раз')} — в продукте
                    колесо одно на смену.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Квесты и соревнования */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {QUESTS.map((q, i) => (
            <motion.div
              key={q.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg"
            >
              <span className="inline-flex w-fit rounded-xl bg-amber-50 p-2.5 text-amber-600 ring-1 ring-amber-200">
                <q.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 text-base font-bold text-zinc-900">{q.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{q.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Этика механик */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45 }}
          className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-6 sm:grid-cols-[auto_1fr] sm:p-7"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-amber-400">
            <ShieldAlert className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-black tracking-tight text-zinc-900">
              Про Скиннера — прямо
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
              Переменное вознаграждение, серии и уровни — это механики Б. Ф. Скиннера, и мы это
              знаем. Поэтому три правила: <strong className="text-zinc-900">награда — только
              деньгами</strong> (не «приоритетом в ленте», который у монополиста и есть клетка),{' '}
              <strong className="text-zinc-900">проигрыш ничего не отнимает</strong> (заказы не
              зависят от сезона) и <strong className="text-zinc-900">геймификация выключается</strong>{' '}
              одной кнопкой в настройках — лента заказов останется прежней. Вовлечение — услуга
              водителю, а не поводок.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {['клетка — у монополиста', 'у нас — призовой фонд', 'вероятности публичны', 'выключается кнопкой'].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-600"
                  >
                    {chip}
                  </span>
                )
              )}
            </div>
          </div>
        </motion.div>

        {/* Команды парков */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2.5 text-sm text-zinc-600">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <span>
              <strong className="text-zinc-900">Лига таксопарков</strong> — командный зачёт сезона:
              парки соревнуются рейтингом и аккуратностью, фонд делится на команду. Коллективная
              гордость вместо коллективной ответственности за чужой штраф.
            </span>
          </p>
          <a
            href="#fleets"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-emerald-700 underline-offset-4 hover:underline"
          >
            Паркам — подробнее
          </a>
        </motion.div>
      </div>
    </section>
  )
}
