'use client'

import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { motion } from 'framer-motion'
import {
  Rocket,
  User,
  Building2,
  Phone,
  MapPin,
  BadgeCheck,
  Crown,
  Timer,
  Users,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { num, plural } from '@/lib/pryamo/format'
import { CountUp } from '@/components/pryamo/count-up'
import { OnboardingTrigger } from '@/components/pryamo/onboarding'

const BASE_TARGET = 1000
/** Порог запуска города — из обещания в тексте секции */
const CITY_TARGET = 200

interface CityStat {
  city: string
  count: number
}

/** Маска телефона: любые вводимые цифры -> +7 XXX XXX-XX-XX */
function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8')) digits = '7' + digits.slice(1)
  if (digits.length > 0 && !digits.startsWith('7')) digits = '7' + digits
  digits = digits.slice(0, 11)
  const p = digits.slice(1)
  let out = '+7'
  if (p.length > 0) out += ` ${p.slice(0, 3)}`
  if (p.length > 3) out += ` ${p.slice(3, 6)}`
  if (p.length > 6) out += `-${p.slice(6, 8)}`
  if (p.length > 8) out += `-${p.slice(8, 10)}`
  return out
}

/** Визуальный дубль поля на время SSR-гидрации: не <input> — расширениям (LastPass и др.) нечего помечать иконкой до гидрации React */
function FieldSkeleton({ icon: Icon, text }: { icon: ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="relative" aria-hidden="true">
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <div className="flex h-9 w-full items-center rounded-md border border-zinc-700 bg-zinc-950/60 pl-9 pr-3 text-sm text-zinc-400">
        {text}
      </div>
    </div>
  )
}

const PERKS = [
  {
    icon: BadgeCheck,
    title: '0% комиссии на 3 месяца',
    text: 'Полный цикл без комиссии с первого заказа. Дальше — 12% фикс или подписка Pro.',
  },
  {
    icon: Crown,
    title: 'Статус основателя',
    text: 'Постоянный значок в профиле, право голоса в развитии продукта и приоритет фич.',
  },
  {
    icon: Timer,
    title: 'Первый доступ в своём городе',
    text: 'Волна запускается при 200 водителях города — вы узнаете об этом первым.',
  },
]

export function Waitlist() {
  const [role, setRole] = useState<'driver' | 'fleet'>('driver')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const [cities, setCities] = useState<CityStat[]>([])
  const [joined, setJoined] = useState<{ position: number; message: string } | null>(null)

  // Гидрация без инпутов: расширения браузера (LastPass) вклеивают свои узлы в DOM
  // до завершения гидрации React и ломают её. Поля появляются после монтирования —
  // при обновлениях React лишние DOM-узлы игнорируются, ошибки гидрации нет.
  const [formMounted, setFormMounted] = useState(false)
  useEffect(() => setFormMounted(true), [])

  useEffect(() => {
    fetch('/api/waitlist')
      .then((r) => r.json())
      .then((d) => {
        setCount(d.count ?? 0)
        setCities(Array.isArray(d.cities) ? d.cities : [])
      })
      .catch(() => setCount(0))
  }, [])

  // Из секции «Таксопаркам» пришли за формой — предвыбираем роль парка
  useEffect(() => {
    const onRolePick = () => setRole('fleet')
    window.addEventListener('pryamo:role-pick', onRolePick)
    return () => window.removeEventListener('pryamo:role-pick', onRolePick)
  }, [])

  const filled = useMemo(
    () => Math.min(100, Math.round(((count ?? 0) / BASE_TARGET) * 100)),
    [count]
  )

  const submit = async () => {
    if (loading) return
    if (name.trim().length < 2) {
      toast({ title: 'Укажите имя', description: 'Как к вам обращаться — обязательно.' })
      return
    }
    if (phone.replace(/\D/g, '').length < 10) {
      toast({ title: 'Проверьте телефон', description: 'Формат: +7 XXX XXX-XX-XX.' })
      return
    }
    if (city.trim().length < 2) {
      toast({ title: 'Укажите город', description: 'Стартуем с городов-миллионников.' })
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, name, phone, city }),
      })
      const d = await r.json()
      if (!r.ok || d.error) {
        const msg =
          d.error === 'bad_phone'
            ? 'Телефон не распознан. Формат: +7 XXX XXX-XX-XX.'
            : d.error === 'bad_name'
              ? 'Имя слишком короткое.'
              : 'Не удалось отправить заявку. Попробуйте ещё раз.'
        toast({ title: 'Ошибка', description: msg })
        return
      }
      setCount(d.count ?? count)
      if (Array.isArray(d.cities)) setCities(d.cities)
      setJoined({ position: d.position ?? 0, message: d.message })
      toast({ title: 'Заявка принята', description: d.message })
    } catch {
      // Статик-прод (GitHub Pages) без сервера: сохраняем заявку локально
      try {
        const raw = window.localStorage.getItem('pryamo-waitlist-local')
        const arr: unknown = raw ? JSON.parse(raw) : []
        arr.push({ role, name, phone, city, at: new Date().toISOString() })
        window.localStorage.setItem('pryamo-waitlist-local', JSON.stringify(arr))
        setJoined({
          position: (Array.isArray(arr) ? arr.length : 1) + 0,
          message: 'Заявка сохранена в этом браузере — это демо-прод без сервера.',
        })
        toast({
          title: 'Демо-режим',
          description: 'Заявка сохранена в этом браузере — прод работает без сервера.',
        })
      } catch {
        toast({ title: 'Сеть недоступна', description: 'Попробуйте ещё раз через минуту.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="join" className="relative scroll-mt-20 overflow-hidden bg-zinc-950 py-20 text-zinc-100 lg:py-24">
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -top-32 right-1/4 h-96 w-[600px] rounded-full bg-emerald-500/12 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
            <Rocket className="h-3.5 w-3.5" />
            Первая волна
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            1 000 водителей-основателей.
            <br />
            Монополия начнёт скучать
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Первая волна получает 3 месяца без комиссии, статус основателя и слово в развитии
            продукта. Запуск города — при 200 заявках из него.
          </p>
        </motion.div>

        {/* Прогресс первой волны */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl"
        >
          <div className="flex items-end justify-between text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <Users className="h-4 w-4 text-emerald-400" aria-hidden />
              {count !== null ? (
                <>
                  <CountUp
                    value={count}
                    className="font-bold text-emerald-400"
                    srLabel={`${num(count)} ${plural(count, 'заявка', 'заявки', 'заявок')}`}
                  />{' '}
                  {plural(count, 'заявка', 'заявки', 'заявок')}
                </>
              ) : (
                'загружаем…'
              )}
            </span>
            <span className="text-zinc-500">цель — {num(BASE_TARGET)}</span>
          </div>
          <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-zinc-800/80 ring-1 ring-zinc-700/60">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.max(filled, 2)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400"
            />
          </div>
          <p className="mt-1.5 text-right text-xs tabular-nums text-zinc-500">
            {BASE_TARGET - (count ?? 0) > 0 ? (
              <>
                осталось{' '}
                <CountUp
                  value={BASE_TARGET - (count ?? 0)}
                  className="font-semibold text-zinc-300"
                  srLabel={`осталось ${num(BASE_TARGET - (count ?? 0))} мест`}
                />{' '}
                мест
              </>
            ) : (
              'места первой волны заполнены'
            )}
          </p>
        </motion.div>

        {/* Города первой волны: живые заявки из базы демо */}
        {cities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <MapPin className="h-4 w-4 text-amber-400" aria-hidden />
                Города первой волны
              </h3>
              <span className="text-[11px] text-zinc-500">
                живые заявки из базы демо — без накруток
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
              Город запускается, когда из него набирается {CITY_TARGET} заявок. Пока скромно — но
              каждая заявка приближает запуск своего города.
            </p>
            <div className="mt-4 grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
              {cities.map((c) => {
                const pct = Math.max(1.5, Math.min(100, (c.count / CITY_TARGET) * 100))
                return (
                  <div key={c.city}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate font-semibold text-zinc-200">{c.city}</span>
                      <span className="shrink-0 tabular-nums text-zinc-500">
                        <span className="font-bold text-emerald-300">{num(c.count)}</span> из{' '}
                        {CITY_TARGET}
                      </span>
                    </div>
                    <div
                      className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800/80"
                      role="progressbar"
                      aria-label={`${c.city}: ${c.count} из ${CITY_TARGET} заявок`}
                      aria-valuemin={0}
                      aria-valuemax={CITY_TARGET}
                      aria-valuenow={c.count}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_minmax(0,460px)]">
          {/* Преимущества */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {PERKS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur transition-colors hover:border-emerald-500/30"
              >
                <span className="shrink-0 rounded-xl bg-emerald-500/12 p-2.5 text-emerald-400">
                  <p.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-white">{p.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">{p.text}</p>
                </div>
              </motion.div>
            ))}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm leading-relaxed text-zinc-400">
                <strong className="text-zinc-200">Без обязательств:</strong> заявка — не договор.
                Никаких платных «регистрационных взносов» и «обучающих курсов» — это марки
                монополии. Мы зарабатываем, когда зарабатываете вы.
              </p>
            </div>
          </motion.div>

          {/* Форма */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-6 shadow-2xl shadow-emerald-500/10 backdrop-blur"
          >
            {!joined ? (
              <>
                <h3 className="text-lg font-bold text-white">
                  {role === 'driver' ? 'Заявка водителя' : 'Заявка таксопарка'}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Ответим в мессенджере, спам — никогда.
                </p>

                {/* Выбор роли */}
                <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Кто вы">
                  {(
                    [
                      { v: 'driver', label: 'Водитель', icon: User },
                      { v: 'fleet', label: 'Таксопарк', icon: Building2 },
                    ] as const
                  ).map((r) => (
                    <button
                      key={r.v}
                      role="radio"
                      aria-checked={role === r.v}
                      onClick={() => setRole(r.v)}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition-all',
                        role === r.v
                          ? 'border-emerald-500 bg-emerald-500/12 text-emerald-300'
                          : 'border-zinc-700 bg-zinc-950/40 text-zinc-400 hover:border-zinc-500'
                      )}
                    >
                      <r.icon className="h-4 w-4" />
                      {r.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  {!formMounted ? (
                    <>
                      <FieldSkeleton icon={User} text={role === 'driver' ? 'Имя' : 'Название парка'} />
                      <FieldSkeleton icon={Phone} text="+7 XXX XXX-XX-XX" />
                      <FieldSkeleton icon={MapPin} text="Город" />
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={role === 'driver' ? 'Имя' : 'Название парка'}
                          aria-label="Имя или название"
                          data-lpignore="true"
                          className="border-zinc-700 bg-zinc-950/60 pl-9 text-white placeholder:text-zinc-400"
                          maxLength={80}
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(formatPhone(e.target.value))}
                          placeholder="+7 XXX XXX-XX-XX"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          aria-label="Телефон"
                          data-lpignore="true"
                          className="border-zinc-700 bg-zinc-950/60 pl-9 text-white placeholder:text-zinc-400"
                          maxLength={18}
                        />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <Input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Город"
                          aria-label="Город"
                          data-lpignore="true"
                          className="border-zinc-700 bg-zinc-950/60 pl-9 text-white placeholder:text-zinc-400"
                          maxLength={60}
                        />
                      </div>
                    </>
                  )}
                </div>

                <Button
                  onClick={submit}
                  disabled={loading}
                  className="mt-5 h-12 w-full bg-emerald-500 text-base font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  {loading ? 'Отправляем…' : 'Занять место в первой волне'}
                </Button>
                <div className="mt-3">
                  <OnboardingTrigger variant="form" />
                </div>
                <p className="mt-3 text-center text-[11px] leading-relaxed text-zinc-600">
                  Демо-версия: данные сохраняются локально в базе концепта, никуда не передаются.
                </p>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center"
              >
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <Check className="h-8 w-8" strokeWidth={3} />
                </span>
                <p className="mt-4 text-3xl font-black tabular-nums text-white">
                  №{num(joined.position)}
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-300">
                  в списке первой волны
                </p>
                <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-zinc-400">
                  {joined.message}
                </p>
                <div className="taxi-strip mx-auto mt-6 h-2 w-40 rounded-full opacity-70" aria-hidden="true" />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
