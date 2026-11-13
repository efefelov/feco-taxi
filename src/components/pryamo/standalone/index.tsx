'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BadgePercent,
  Camera,
  Check,
  ChevronRight,
  Crown,
  HandCoins,
  Package,
  ShieldCheck,
  Star,
  Wallet,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PassengerApp } from '@/components/pryamo/mvp/passenger-app'
import { DriverApp } from '@/components/pryamo/mvp/driver-app'
import { localEngine, setRoleMode, useMvpLocalMode } from '@/lib/pryamo/mvp-local'
import { GENERATIONS, tariffDisplayName, useGeneration } from '@/lib/pryamo/generations'
import {
  useDriverProfile,
  usePassengerProfile,
  type DriverProfile,
  type PassengerProfile,
} from '@/lib/pryamo/app-profiles'

/**
 * Два самостоятельных приложения ПРЯМО со своими онбордингами.
 *
 * /passenger — приложение пассажира: онбординг (ценности → год рождения →
 * профиль) и главный экран заказа. /driver — приложение водителя: онбординг
 * (ценности → документы → авто → план и пакет «Готов») и смена.
 *
 * На статик-проде оба приложения живут на локальном мини-движке; когда
 * открыты одновременно (в соседних вкладках), заказ пассажира видит
 * водитель живьём через BroadcastChannel.
 */

function useRoleMode(mode: 'passenger-page' | 'driver-page') {
  useEffect(() => {
    setRoleMode(mode)
  }, [mode])
  return useMvpLocalMode()
}

function AppHeader({ backLabel, title, local }: { backLabel: string; title: string; local: boolean }) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800/70 bg-zinc-950 px-4 py-3">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-300"
        aria-label={backLabel}
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Лендинг
      </Link>
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950">
          <Zap className="h-4 w-4" strokeWidth={2.6} aria-hidden />
        </span>
        <p className="text-sm font-black tracking-tight text-white">{title}</p>
      </div>
      <span
        className={cn(
          'rounded-full border px-2.5 py-1 text-[10px] font-bold',
          local
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
        )}
      >
        {local ? 'движок онлайн' : 'подключение…'}
      </span>
    </header>
  )
}

function ProgressDots({ steps, current }: { steps: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={`Шаг ${current + 1} из ${steps}`}>
      {Array.from({ length: steps }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all',
            i < current ? 'w-4 bg-emerald-500' : i === current ? 'w-6 bg-amber-400' : 'w-4 bg-zinc-800'
          )}
          aria-hidden
        />
      ))}
    </div>
  )
}

function WizardButton({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="mt-5 h-12 w-full bg-emerald-500 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
    >
      {label}
      <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
    </Button>
  )
}

// ===================== ПАССАЖИР =====================

function PassengerOnboarding({ onDone }: { onDone: (p: PassengerProfile) => void }) {
  const [step, setStep] = useState(0)
  const { birthYear, setBirthYear, generation } = useGeneration()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const next = () => {
    if (step === 2) {
      onDone({
        onboarded: true,
        name: name.trim() || 'Пассажир ПРЯМО',
        phone: phone.trim(),
        birthYear,
      })
      return
    }
    setStep((s) => s + 1)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
      <ProgressDots steps={3} current={step} />
      <div key={`p-step-${step}`}>
        {step === 0 && (
          <motion.div key="p0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
            <h1 className="mt-6 text-2xl font-black leading-tight text-white">
              Цена не растёт по дороге
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              ПРЯМО — такси с фикс-ценой: что увидели при заказе — то и заплатили, даже если
              попадёте в пробку. Коэффициенты спроса заранее видны и идут водителю целиком.
            </p>
            <div className="mt-5 space-y-2.5">
              {[
                { icon: Wallet, title: 'Фикс-цена до конца поездки', desc: 'пересчётов «по факту» не существует' },
                { icon: HandCoins, title: 'Чаевые — 100% водителю', desc: 'никаких «сервисных сборов за чаевые»' },
                { icon: ShieldCheck, title: 'Живая поддержка ≤ 15 минут', desc: 'живой человек, а не бот с отписками' },
              ].map((r) => (
                <div key={r.title} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                  <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{r.title}</p>
                    <p className="text-[11px] text-zinc-500">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <WizardButton onClick={next} label="Начать" />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="p1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
            <h1 className="mt-6 text-2xl font-black leading-tight text-white">
              ПРЯМО знает, с кем разговаривает
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Укажите год рождения — названия тарифов подстроятся под вас. Цены и формула
              одни для всех: это слова, а не другой прайс.
            </p>
            <input
              type="number"
              inputMode="numeric"
              min={1930}
              max={new Date().getFullYear() - 15}
              value={birthYear ?? ''}
              onChange={(e) => {
                const v = Number(e.target.value)
                setBirthYear(Number.isInteger(v) && v >= 1930 && v <= new Date().getFullYear() - 15 ? v : null)
              }}
              placeholder="Год рождения, например 2007"
              aria-label="Год рождения"
              className="mt-4 h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 text-base text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {generation && (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                <p className="text-[11px] font-bold text-emerald-300">
                  {GENERATIONS.find((g) => g.id === generation)?.label} ·{' '}
                  {GENERATIONS.find((g) => g.id === generation)?.years}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                  {(
                    [
                      ['eco', 'эконом'],
                      ['comfort', 'комфорт'],
                      ['business', 'бизнес'],
                    ] as const
                  ).map(([id, kind]) => (
                    <div key={id} className="rounded-lg bg-zinc-950/50 px-2 py-2">
                      <p className="font-black text-zinc-100">
                        {tariffDisplayName(id, generation)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-zinc-500">{kind}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <WizardButton onClick={next} label="Дальше" />
            <button
              onClick={next}
              className="mt-2 w-full text-center text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
            >
              Пропустить — оставлю канонические названия
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="p2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
            <h1 className="mt-6 text-2xl font-black leading-tight text-white">Кто едет?</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Имя — как к вам обращаться. Телефон — для водителя и чеков. Всё хранится на
              этом устройстве: это прототип, регистрации на сервере нет.
            </p>
            <div className="mt-4 space-y-2.5">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                aria-label="Имя"
                className="h-12 border-zinc-700 bg-zinc-950/60 text-base text-white placeholder:text-zinc-600"
              />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Телефон +7 ___ ___-__-__"
                aria-label="Телефон"
                inputMode="tel"
                className="h-12 border-zinc-700 bg-zinc-950/60 text-base text-white placeholder:text-zinc-600"
              />
            </div>
            <WizardButton onClick={next} label="В приложение" />
          </motion.div>
        )}
      </div>
    </div>
  )
}

function PassengerAppPage() {
  const local = useRoleMode('passenger-page')
  const { profile, save } = usePassengerProfile()

  return (
    <div className="flex h-dvh flex-col bg-zinc-950">
      <AppHeader backLabel="На лендинг ПРЯМО" title="ПРЯМО · пассажир" local={local} />
      {profile.onboarded ? (
        <div className="mx-auto flex min-h-0 w-full flex-1 flex-col md:my-6 md:max-w-[420px] md:rounded-[2rem] md:border-8 md:border-zinc-800 md:shadow-2xl md:shadow-black/60">
          <div className="min-h-0 flex-1 overflow-hidden md:rounded-[1.6rem]">
            <PassengerApp />
          </div>
        </div>
      ) : (
        <PassengerOnboarding onDone={save} />
      )}
    </div>
  )
}

// ===================== ВОДИТЕЛЬ =====================

const DOC_ITEMS = [
  { icon: Camera, title: 'Селфи с правами', desc: 'проверка ~90 секунд, без визита в офис' },
  { icon: ShieldCheck, title: 'СТС автомобиля', desc: 'фото документа — регистрация авто в ленте' },
  { icon: BadgePercent, title: 'Статус самозанятого', desc: 'НПД считается от чистой выплаты, а не от чека' },
] as const

function DriverOnboarding({ onDone }: { onDone: (p: DriverProfile) => void }) {
  const [step, setStep] = useState(0)
  const [docs, setDocs] = useState<boolean[]>([false, false, false])
  const [name, setName] = useState('')
  const [car, setCar] = useState('')
  const [plate, setPlate] = useState('')
  const [plan, setPlan] = useState<'percent' | 'pro'>('percent')
  const [readyPack, setReadyPack] = useState(true)

  const docsDone = docs.every(Boolean)

  const finish = () => {
    onDone({
      onboarded: true,
      name: name.trim() || 'Алексей П.',
      car: car.trim() || 'Kia Rio, белый',
      plate: plate.trim() || 'А 123 ВС 78',
      plan,
      readyPack,
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
      <ProgressDots steps={4} current={step} />
      <div key={`d-step-${step}`}>
        {step === 0 && (
          <motion.div key="d0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
            <h1 className="mt-6 text-2xl font-black leading-tight text-white">
              88% поездки — ваше
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Комиссия 12% фикс или 0% по подписке Pro. Чаевые — целиком. Выплату видите до
              принятия заказа, вывод без комиссии платформы. Никаких обязательных тарифов и
              штрафов за отказ.
            </p>
            <div className="mt-5 space-y-2.5">
              {[
                { icon: Wallet, title: '88% с каждой поездки', desc: 'раскладка чека — в каждом заказе' },
                { icon: Star, title: 'Рейтинг по осям с обратной связью', desc: 'каждая низкая оценка — с причиной от пассажира' },
                { icon: HandCoins, title: 'Вывод два раза в день', desc: 'без комиссии платформы, баланс нельзя «обнулить»' },
              ].map((r) => (
                <div key={r.title} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                  <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{r.title}</p>
                    <p className="text-[11px] text-zinc-500">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <WizardButton onClick={() => setStep(1)} label="Начать регистрацию" />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="d1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
            <h1 className="mt-6 text-2xl font-black leading-tight text-white">Документы</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Отметьте, что готово — в прототипе это симуляция проверки. В реальном запуске
              здесь будут фото документов и проверка за ~90 секунд.
            </p>
            <div className="mt-4 space-y-2.5">
              {DOC_ITEMS.map((d, i) => (
                <button
                  key={d.title}
                  onClick={() => setDocs((prev) => prev.map((v, j) => (j === i ? !v : v)))}
                  aria-pressed={docs[i]}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all',
                    docs[i] ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900/60'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      docs[i] ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-500'
                    )}
                  >
                    {docs[i] ? <Check className="h-4 w-4" aria-hidden /> : <d.icon className="h-4 w-4" aria-hidden />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-zinc-100">{d.title}</span>
                    <span className="block text-[11px] text-zinc-500">{d.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <WizardButton onClick={() => setStep(2)} label="Дальше" disabled={!docsDone} />
            {!docsDone && (
              <p className="mt-2 text-center text-[11px] text-zinc-600">
                Отметьте все три пункта — по кнопке видно, что проверка «не пройдёт без документов»
              </p>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="d2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
            <h1 className="mt-6 text-2xl font-black leading-tight text-white">Автомобиль</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Любая марка, машина от 2010 года. Стехлицензия — сам или через парк-партнёра.
            </p>
            <div className="mt-4 space-y-2.5">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" aria-label="Имя водителя" className="h-12 border-zinc-700 bg-zinc-950/60 text-base text-white placeholder:text-zinc-600" />
              <Input value={car} onChange={(e) => setCar(e.target.value)} placeholder="Авто: Kia Rio, белый" aria-label="Автомобиль" className="h-12 border-zinc-700 bg-zinc-950/60 text-base text-white placeholder:text-zinc-600" />
              <Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Госномер: А 123 ВС 78" aria-label="Госномер" className="h-12 border-zinc-700 bg-zinc-950/60 text-base text-white placeholder:text-zinc-600" />
            </div>
            <WizardButton onClick={() => setStep(3)} label="Дальше" />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="d3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
            <h1 className="mt-6 text-2xl font-black leading-tight text-white">План и готовность</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              План можно сменить в любой день. Пакет «ПРЯМО Готов» — рассрочка из будущих
              выплат, без депозитов и «активационных» платежей.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'percent', icon: BadgePercent, title: '12% фикс', sub: 'без подписки' },
                  { id: 'pro', icon: Crown, title: 'Pro · 0%', sub: '2 490 ₽/мес' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  aria-pressed={plan === p.id}
                  className={cn(
                    'rounded-xl border p-3.5 text-left transition-all',
                    plan === p.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900/60'
                  )}
                >
                  <p.icon className={cn('h-4 w-4', plan === p.id ? 'text-emerald-400' : 'text-zinc-500')} aria-hidden />
                  <p className="mt-2 text-sm font-black text-zinc-100">{p.title}</p>
                  <p className="text-[10px] text-zinc-500">{p.sub}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setReadyPack((v) => !v)}
              aria-pressed={readyPack}
              className={cn(
                'mt-3 flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all',
                readyPack ? 'border-amber-400/40 bg-amber-400/10' : 'border-zinc-800 bg-zinc-900/60'
              )}
            >
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', readyPack ? 'bg-amber-400/20 text-amber-300' : 'bg-zinc-800 text-zinc-500')}>
                <Package className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-zinc-100">Пакет «ПРЯМО Готов»</span>
                <span className="block text-[11px] leading-snug text-zinc-500">
                  алкотестер, тонометр, термометр, видеорегистратор, держатель, наклейки —
                  медосмотр и путевой лист в приложении
                </span>
              </span>
            </button>
            <WizardButton onClick={finish} label="На линию" />
          </motion.div>
        )}
      </div>
    </div>
  )
}

function DriverAppPage() {
  const local = useRoleMode('driver-page')
  const { profile, save } = useDriverProfile()

  // Профиль онбординга → идентичность водителя в локальном движке
  useEffect(() => {
    if (!profile.onboarded) return
    localEngine.setIdentity({
      name: profile.name,
      car: profile.car,
      plate: profile.plate,
      initials:
        profile.name
          .split(/\s+/)
          .map((w) => w[0] ?? '')
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'ВД',
    })
  }, [profile.onboarded, profile.name, profile.car, profile.plate])

  return (
    <div className="flex h-dvh flex-col bg-zinc-950">
      <AppHeader backLabel="На лендинг ПРЯМО" title="ПРЯМО · водитель" local={local} />
      {profile.onboarded ? (
        <div className="mx-auto flex min-h-0 w-full flex-1 flex-col md:my-6 md:max-w-[420px] md:rounded-[2rem] md:border-8 md:border-zinc-800 md:shadow-2xl md:shadow-black/60">
          <div className="min-h-0 flex-1 overflow-hidden md:rounded-[1.6rem]">
            <DriverApp />
          </div>
        </div>
      ) : (
        <DriverOnboarding onDone={save} />
      )}
    </div>
  )
}

export { PassengerAppPage, DriverAppPage }
