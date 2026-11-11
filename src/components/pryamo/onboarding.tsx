'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck,
  Banknote,
  CarFront,
  Check,
  ChevronRight,
  Coins,
  CreditCard,
  Crown,
  MapPin,
  Navigation,
  Percent,
  Route,
  Sparkles,
  Timer,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useOnboarding } from '@/lib/pryamo/onboarding-store'
import { rub } from '@/lib/pryamo/format'

/**
 * Онбординг-визард «Первый день с ПРЯМО».
 * Три шага: регистрация (выбор плана) -> первый заказ (интерактив)
 * -> выплата (чек + сравнение с монополистом).
 * Полностью клиентская симуляция, без сети.
 */

type Plan = 'percent' | 'pro'
type Step = 0 | 1 | 2

// Математика поездки (совпадает с цифрами hero: 540 ₽ чек)
const RIDE_PRICE = 540
const TIP = 50
const PRYAMO_COMMISSION = 65 // 12% фикс
const YANDEX_PAYOUT = 324 // 60% от чека
const YANDEX_TOTAL_TAKE = 216

const STEPS_META = [
  { n: 1, title: 'Регистрация', hint: '2 минуты, 0 ₽' },
  { n: 2, title: 'Первый заказ', hint: '30 секунд' },
  { n: 3, title: 'Выплата', hint: 'мгновенно' },
] as const

export function OnboardingWizard() {
  const { open, sessionId, closeWizard } = useOnboarding()

  const finishAndJoin = useCallback(() => {
    closeWizard()
    // Прокручиваем к форме первой волны
    setTimeout(() => {
      document.getElementById('join')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
  }, [closeWizard])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) closeWizard() }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto feed-scroll border-zinc-800 bg-zinc-950/95 p-0 text-zinc-100 backdrop-blur-xl sm:max-w-xl">
        <DialogHeader className="border-b border-zinc-800/80 px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
            <Sparkles className="h-5 w-5 text-amber-400" aria-hidden />
            Первый день с ПРЯМО
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-400">
            Симулятор запуска: от регистрации до первой выплаты — за минуту.
          </DialogDescription>
        </DialogHeader>
        {/* Ключ по sessionId: каждое открытие пересоздаёт тело визарда со свежим состоянием */}
        <WizardBody key={sessionId} onJoin={finishAndJoin} />
      </DialogContent>
    </Dialog>
  )
}

function WizardBody({ onJoin }: { onJoin: () => void }) {
  const [step, setStep] = useState<Step>(0)
  const [plan, setPlan] = useState<Plan>('percent')

  const payoutTotal = plan === 'pro' ? RIDE_PRICE + TIP : RIDE_PRICE - PRYAMO_COMMISSION + TIP
  const planLabel = plan === 'pro' ? 'Pro · 0% комиссии' : '12% фикс'
  const diffVsYandex = payoutTotal - YANDEX_PAYOUT

  return (
    <div className="px-6 py-6">
          {/* Прогресс шагов */}
          <ol className="mb-5 flex items-center gap-1.5" aria-label="Прогресс визарда">
            {STEPS_META.map((s, i) => {
              const active = i === step
              const done = i < step
              return (
                <li key={s.n} className="flex flex-1 items-center gap-1.5">
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-colors',
                      done
                        ? 'bg-emerald-500 text-zinc-950'
                        : active
                          ? 'bg-amber-400 text-zinc-950'
                          : 'border border-zinc-700 bg-zinc-900 text-zinc-500'
                    )}
                    aria-current={active ? 'step' : undefined}
                  >
                    {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : s.n}
                  </span>
                  <span
                    className={cn(
                      'truncate text-[11px] font-semibold',
                      active ? 'text-zinc-100' : done ? 'text-emerald-400/80' : 'text-zinc-500'
                    )}
                  >
                    {s.title}
                  </span>
                  {i < STEPS_META.length - 1 && (
                    <span
                      className={cn('h-px flex-1', done ? 'bg-emerald-500/60' : 'bg-zinc-800')}
                      aria-hidden
                    />
                  )}
                </li>
              )
            })}
          </ol>

          <AnimatePresence mode="wait" initial={false}>
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25 }}
              >
                <h3 className="text-base font-bold text-zinc-100">
                  Вход без взносов и «активационных» платежей
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  У монополиста подключение идёт через таксопарк: договор, платная подписка драйверов,
                  депозит за «брендирование». У нас — оферта в приложении.
                </p>

                <ul className="mt-4 space-y-2.5">
                  {[
                    { icon: UserRound, text: 'Селфи и права — проверка ~90 секунд, без визита в офис' },
                    { icon: CarFront, text: 'Машина от 2010 года, любой бренд. Стехлицензия — сам/через парк' },
                    { icon: Navigation, text: 'Навигатор на выбор: 2GIS, Яндекс, OsmAnd' },
                    { icon: CreditCard, text: 'Карта для выплат: деньги приходят после каждой поездки' },
                  ].map((r) => (
                    <li
                      key={r.text}
                      className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3"
                    >
                      <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                      <span className="text-sm leading-snug text-zinc-300">{r.text}</span>
                    </li>
                  ))}
                </ul>

                <fieldset className="mt-5">
                  <legend className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Тарифный план (можно сменить в любой день)
                  </legend>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <PlanCard
                      selected={plan === 'percent'}
                      onSelect={() => setPlan('percent')}
                      icon={Percent}
                      title="12% фикс"
                      sub="без подписки"
                      detail={`С поездки ${rub(RIDE_PRICE)}: комиссия ${rub(PRYAMO_COMMISSION)}`}
                    />
                    <PlanCard
                      selected={plan === 'pro'}
                      onSelect={() => setPlan('pro')}
                      icon={Crown}
                      title="ПРЯМО Pro"
                      sub="2 490 ₽/мес"
                      detail={`С поездки ${rub(RIDE_PRICE)}: комиссия 0 ₽ — всё ваше`}
                    />
                  </div>
                </fieldset>

                <Button
                  onClick={() => setStep(1)}
                  size="lg"
                  className="mt-5 h-11 w-full bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
                >
                  Готово — жду заказы
                  <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25 }}
              >
                <FirstOrderStep
                  plan={plan}
                  onDone={() => setStep(2)}
                  planLabel={planLabel}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.25 }}
              >
                <h3 className="text-base font-bold text-zinc-100">
                  Деньги за поездку — уже на карте
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Выплата приходит сразу после завершения, а не «по правилам платформы» раз в неделю.
                </p>

                {/* Чек */}
                <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-zinc-900/80 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      Чек · поездка завершена
                    </span>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {planLabel}
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <ReceiptRow label="Пассажир заплатил" value={rub(RIDE_PRICE)} />
                    <ReceiptRow
                      label="Комиссия ПРЯМО"
                      value={plan === 'pro' ? '0 ₽' : `−${rub(PRYAMO_COMMISSION)}`}
                      note={plan === 'pro' ? 'подписка' : '12% фикс'}
                      tone={plan === 'pro' ? 'good' : 'muted'}
                    />
                    <ReceiptRow
                      label="Чаевые (100% водителю)"
                      value={`+${rub(TIP)}`}
                      note="мгновенно"
                      tone="good"
                    />
                    <li className="mt-2 border-t border-zinc-800 pt-2.5">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-zinc-200">Вам на карту</span>
                        <span className="text-lg font-black text-emerald-400">
                          {rub(payoutTotal)}
                        </span>
                      </span>
                    </li>
                  </ul>
                  <div className="taxi-strip mt-4 h-2 w-full rounded-full opacity-60" aria-hidden />
                </div>

                {/* Сравнение с монополистом */}
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Та же поездка у монополиста
                  </p>
                  <div className="mt-3 space-y-3">
                    <CompareBar
                      label="ПРЯМО"
                      value={payoutTotal}
                      max={payoutTotal}
                      tone="emerald"
                      note={`${planLabel} + чаевые`}
                    />
                    <CompareBar
                      label="Монополист"
                      value={YANDEX_PAYOUT}
                      max={payoutTotal}
                      tone="rose"
                      note={`−${rub(YANDEX_TOTAL_TAKE)} комиссий и «опций»`}
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3">
                    <Coins className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
                    <p className="text-sm font-semibold text-emerald-300">
                      На одной поездке вы забрали бы{' '}
                      <span className="font-black text-emerald-400">{rub(diffVsYandex, { sign: true })}</span>{' '}
                      к выплате монополиста.
                    </p>
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
                    Расчёт по публичным данным: комиссия агрегатора ~24% + опции и подписка парка,
                    волатильность удержаний до 37%.
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={onJoin}
                    size="lg"
                    className="h-11 flex-1 bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
                  >
                    Занять место в первой волне
                  </Button>
                  <Button
                    onClick={() => setStep(0)}
                    size="lg"
                    variant="outline"
                    className="h-11 border-zinc-700 bg-zinc-900/60 font-semibold text-zinc-300 hover:bg-zinc-800"
                  >
                    Пройти ещё раз
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
    </div>
  )
}

/* ---------- Шаг 2: интерактивный первый заказ ---------- */

type RidePhase = 'idle' | 'going' | 'onboard' | 'done'

function FirstOrderStep({
  plan,
  planLabel,
  onDone,
}: {
  plan: Plan
  planLabel: string
  onDone: () => void
}) {
  const [phase, setPhase] = useState<RidePhase>('idle')
  const [progress, setProgress] = useState(0)
  const [left, setLeft] = useState(30)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const intervals = useRef<ReturnType<typeof setInterval>[]>([])
  const progressRef = useRef(0)

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout)
      intervals.current.forEach(clearInterval)
    }
  }, [])

  // Обратный отсчёт доступности заказа до принятия
  useEffect(() => {
    if (phase !== 'idle') return
    const t = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000)
    intervals.current.push(t)
    return () => clearInterval(t)
  }, [phase])

  const payout = plan === 'pro' ? RIDE_PRICE : RIDE_PRICE - PRYAMO_COMMISSION

  const accept = () => {
    if (phase !== 'idle') return
    setPhase('going')
    // Едем к пассажиру: 0 -> 30% за ~3.5 с
    animateProgress(30, 3500, () => {
      setPhase('onboard')
      // Поездка: 30 -> 100% за ~5 с
      animateProgress(100, 5000, () => {
        setPhase('done')
        timers.current.push(setTimeout(onDone, 900))
      })
    })
  }

  const animateProgress = (target: number, durationMs: number, done: () => void) => {
    const start = progressRef.current
    const t0 = performance.now()
    const t = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / durationMs)
      const v = Math.round(start + (target - start) * k)
      progressRef.current = v
      setProgress(v)
      if (k >= 1) {
        clearInterval(t)
        done()
      }
    }, 60)
    intervals.current.push(t)
  }

  const phaseText: Record<RidePhase, string> = {
    idle: 'Заказ в ленте — он ваш, если нажмёте первым',
    going: 'Едете к пассажиру · без спешки, без штрафа за «медленно»',
    onboard: 'Пассажир в машине · маршрут виден и вам, и ему',
    done: 'Поездка завершена · выплата уже считается',
  }

  return (
    <div>
      <h3 className="text-base font-bold text-zinc-100">
        Заказ сам нашёл вас — очередь и приоритеты не нужны
      </h3>
      <p className="mt-1 text-sm text-zinc-400">
        Никакой «карточки качества»: кто первый нажал — тот и поехал. Отказ от заказа ничего не
        списывает и не понижает.
      </p>

      {/* Карточка заказа */}
      <div
        className={cn(
          'mt-4 rounded-2xl border p-5 transition-colors',
          phase === 'idle'
            ? 'border-zinc-700 bg-zinc-900/70'
            : 'border-emerald-500/40 bg-zinc-900/80 shadow-lg shadow-emerald-500/10'
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Прямой · 10,1 км · 26 мин
          </span>
          {phase === 'idle' && (
            <span
              className={cn(
                'flex items-center gap-1 text-xs font-bold tabular-nums',
                left <= 10 ? 'text-amber-400' : 'text-zinc-500'
              )}
            >
              <Timer className="h-3.5 w-3.5" aria-hidden />
              {left} с
            </span>
          )}
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">Подача</p>
              <p className="text-sm font-semibold text-zinc-200">Кутузовский пр-т, 32</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Route className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">Куда</p>
              <p className="text-sm font-semibold text-zinc-200">Аэропорт Шереметьево, терминал C</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800 pt-4">
          <div>
            <p className="text-[11px] text-zinc-500">Чек пассажира</p>
            <p className="text-sm font-bold text-zinc-300">{rub(RIDE_PRICE)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-zinc-500">Ваша выплата · {planLabel}</p>
            <p className="text-sm font-black text-emerald-400">{rub(payout)}</p>
          </div>
          {phase === 'idle' ? (
            <Button
              onClick={accept}
              className="h-10 bg-emerald-500 px-6 font-bold text-zinc-950 hover:bg-emerald-400"
            >
              Взять за {rub(payout)}
            </Button>
          ) : (
            <span className="flex h-10 items-center gap-1.5 rounded-full bg-emerald-500/15 px-4 text-xs font-bold text-emerald-400">
              <BadgeCheck className="h-4 w-4" aria-hidden />
              Заказ у вас
            </span>
          )}
        </div>

        {/* Прогресс поездки */}
        {phase !== 'idle' && (
          <div className="mt-4" aria-live="polite">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
                {phase === 'going' && <CarFront className="h-3.5 w-3.5 text-amber-400" aria-hidden />}
                {phase === 'onboard' && <Banknote className="h-3.5 w-3.5 text-emerald-400" aria-hidden />}
                {phase === 'done' && <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={3} aria-hidden />}
                {phaseText[phase]}
              </span>
              <span className="font-bold tabular-nums text-zinc-500">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-100',
                  phase === 'done'
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-amber-400 to-emerald-400'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        Это симуляция: в живом демо ниже заказы приходят по WebSocket из настоящего движка — с
        конкурентами за заказ, живым спросом и графиком дохода за неделю.
      </p>
    </div>
  )
}

/* ---------- Мелкие блоки ---------- */

function PlanCard({
  selected,
  onSelect,
  icon: Icon,
  title,
  sub,
  detail,
}: {
  selected: boolean
  onSelect: () => void
  icon: typeof Percent
  title: string
  sub: string
  detail: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5',
        selected
          ? 'border-emerald-500/60 bg-emerald-500/10 shadow-md shadow-emerald-500/10'
          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', selected ? 'text-emerald-400' : 'text-zinc-500')} aria-hidden />
        <span className="text-sm font-black text-zinc-100">{title}</span>
        <span className="ml-auto text-[10px] font-semibold text-zinc-500">{sub}</span>
      </span>
      <span className="mt-1.5 block text-xs leading-snug text-zinc-400">{detail}</span>
    </button>
  )
}

function ReceiptRow({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note?: string
  tone?: 'good' | 'muted'
}) {
  return (
    <li className="flex items-baseline justify-between gap-2">
      <span className="text-zinc-400">{label}</span>
      <span className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span
          className={cn(
            'font-semibold',
            tone === 'good' ? 'text-emerald-400' : 'text-zinc-200'
          )}
        >
          {value}
        </span>
        {note && (
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-semibold',
              tone === 'good'
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'bg-zinc-700/50 text-zinc-400'
            )}
          >
            {note}
          </span>
        )}
      </span>
    </li>
  )
}

function CompareBar({
  label,
  value,
  max,
  tone,
  note,
}: {
  label: string
  value: number
  max: number
  tone: 'emerald' | 'rose'
  note: string
}) {
  const w = Math.max(4, Math.round((value / max) * 100))
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-bold text-zinc-300">{label}</span>
        <span className="text-zinc-500">{note}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="h-6 flex-1 overflow-hidden rounded-lg bg-zinc-800/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${w}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn(
              'flex h-full items-center justify-end rounded-lg pr-2',
              tone === 'emerald'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                : 'bg-gradient-to-r from-rose-700 to-rose-500'
            )}
          >
            <span className="text-[10px] font-black text-zinc-950">{rub(value)}</span>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Триггер (общий для hero и waitlist) ---------- */

export function OnboardingTrigger({ variant }: { variant: 'hero' | 'form' }) {
  const openWizard = useOnboarding((s) => s.openWizard)
  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={openWizard}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300/90 underline decoration-amber-400/40 underline-offset-4 transition-colors hover:text-amber-200 hover:decoration-amber-300"
      >
        <Sparkles className="h-4 w-4" aria-hidden />
        Как выглядит первый день? 60-секундный тур
      </button>
    )
  }
  return (
    <Button
      type="button"
      onClick={openWizard}
      variant="outline"
      className="h-10 w-full border-zinc-700 bg-zinc-900/60 font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
    >
      <Sparkles className="mr-2 h-4 w-4 text-amber-400" aria-hidden />
      Сначала посмотреть первый день
    </Button>
  )
}
