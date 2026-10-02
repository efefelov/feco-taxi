'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Building2,
  CalendarClock,
  Database,
  GitBranch,
  Handshake,
  PiggyBank,
  Plug,
  Scale,
  Users,
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { rub, num, plural } from '@/lib/pryamo/format'

/**
 * Экономика парка: честная математика без «опций».
 * Монополист: 24% базовая комиссия + платные опции и подписки парка;
 * по судебной практике эффективные удержания достигают 37%+ — берём 30% как
 * консервативную оценку для парка (волатильность и «услуги» включены).
 */
const YANDEX_RATE = 0.3
const PRYAMO_RATE = 0.08

const BENEFITS = [
  {
    icon: Scale,
    title: 'Лента без «карточки качества»',
    desc: 'Аукцион вместо очереди с приоритетами: у всех водителей парка равный доступ к заказам. Отказ от невыгодного заказа не понижает позицию никого из ваших людей.',
  },
  {
    icon: Activity,
    title: 'Живая аналитика',
    desc: 'Спрос по зонам с цифрами и прогноз по часам — диспетчер видит то же, что видит водитель. Экспорт выгрузок, история заказов, ликвидность зон в одном окне.',
  },
  {
    icon: Database,
    title: 'Без обязательных «опций»',
    desc: 'Ноль платных подписок «для попадания в ленту», ноль штрафов за отказ, комиссия фикс — 8% и видна в каждом чеке. Счёт в конце месяца не содержит сюрпризов.',
  },
  {
    icon: GitBranch,
    title: 'API и bulk-онбординг',
    desc: 'Подключение парка за день: массовая регистрация водителей, выплаты на счёт парка или напрямую людям — как решите. Никакой привязки к чужому навигатору.',
  },
]

const STEPS = [
  {
    icon: Plug,
    title: 'День 1 — подключение',
    desc: 'Онбординг парка через API или CSV: водители, авто, документы.',
  },
  {
    icon: CalendarClock,
    title: 'Неделя 1 — перевод',
    desc: 'Часть машин выходит на ПРЯМО параллельно со старой площадкой — сравниваете сами.',
  },
  {
    icon: Handshake,
    title: 'Месяц 1 — решение',
    desc: 'Отчёты по сменам и экономика парка против комиссии монополиста. Дальше — ваш ход.',
  },
]

export function Fleets() {
  // Параметры парка
  const [cars, setCars] = useState(40)
  const [ridesPerCar, setRidesPerCar] = useState(12)
  const [avgCheck, setAvgCheck] = useState(480)

  const calc = useMemo(() => {
    const ridesPerMonth = cars * ridesPerCar * 30
    const gross = ridesPerMonth * avgCheck
    const pryamo = gross * PRYAMO_RATE
    const yandex = gross * YANDEX_RATE
    const saveMonth = yandex - pryamo
    const saveYear = saveMonth * 12
    // «На эти деньги»: экономика парка в понятных эквивалентах
    const newCars = Math.floor(saveYear / 1_500_000)
    const salaries = Math.floor(saveYear / 80_000)
    return { ridesPerMonth, gross, pryamo, yandex, saveMonth, saveYear, newCars, salaries }
  }, [cars, ridesPerCar, avgCheck])

  /** CTA: предвыбрать роль «Таксопарк» в форме первой волны */
  const goToJoin = () => {
    window.dispatchEvent(new CustomEvent('pryamo:role-pick'))
    document.querySelector('#join')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="fleets" className="scroll-mt-20 bg-zinc-950 py-20 text-zinc-100 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
            <Building2 className="h-3.5 w-3.5" />
            Таксопаркам
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-balance text-white sm:text-4xl">
            Парк работает — агрегатор не должен забирать треть
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Подключайте парк целиком: водители видят честную ленту, диспетчер — живую
            аналитику, а счёт в конце месяца не содержит сюрпризов. Посчитайте разницу.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          {/* Калькулятор парка */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur sm:p-8"
          >
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <PiggyBank className="h-5 w-5 text-amber-400" />
              Экономика парка на ПРЯМО
            </h3>
            <p className="mt-1.5 text-xs text-zinc-500">
              Двигайте ползунки — экономия пересчитывается мгновенно. Без «опций», волатильности
              и скрытых строк в счёте.
            </p>

            {/* Слайдеры */}
            <div className="mt-6 space-y-5">
              <div>
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-semibold text-zinc-300">Машин в парке</label>
                  <span className="text-sm font-black tabular-nums text-amber-300">
                    {cars}
                  </span>
                </div>
                <Slider
                  value={[cars]}
                  min={5}
                  max={500}
                  step={5}
                  onValueChange={(v) => setCars(v[0])}
                  className="mt-2"
                  aria-label="Количество машин в парке"
                />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-semibold text-zinc-300">
                    Поездок на машину в день
                  </label>
                  <span className="text-sm font-black tabular-nums text-amber-300">
                    {ridesPerCar}
                  </span>
                </div>
                <Slider
                  value={[ridesPerCar]}
                  min={5}
                  max={25}
                  step={1}
                  onValueChange={(v) => setRidesPerCar(v[0])}
                  className="mt-2"
                  aria-label="Поездок на машину в день"
                />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-semibold text-zinc-300">Средний чек</label>
                  <span className="text-sm font-black tabular-nums text-amber-300">
                    {rub(avgCheck)}
                  </span>
                </div>
                <Slider
                  value={[avgCheck]}
                  min={300}
                  max={800}
                  step={10}
                  onValueChange={(v) => setAvgCheck(v[0])}
                  className="mt-2"
                  aria-label="Средний чек поездки"
                />
              </div>
            </div>

            {/* Результат */}
            <div className="mt-7 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    оборот парка в месяц
                  </p>
                  <p className="mt-1 text-xl font-black tabular-nums text-white">
                    {rub(calc.gross, { compact: true })}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {num(calc.ridesPerMonth)} {plural(calc.ridesPerMonth, 'поездка', 'поездки', 'поездок')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    комиссия ПРЯМО · 8%
                  </p>
                  <p className="mt-1 text-xl font-black tabular-nums text-emerald-400">
                    {rub(calc.pryamo, { compact: true })}
                  </p>
                  <p className="mt-0.5 text-[11px] text-emerald-500/80">фикс, в каждом чеке</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    у монополиста · ~30%
                  </p>
                  <p className="mt-1 text-xl font-black tabular-nums text-rose-400">
                    {rub(calc.yandex, { compact: true })}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">с опциями и подписками</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 to-transparent p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-emerald-200">
                    Экономия парка — {rub(calc.saveMonth, { compact: true })} в месяц
                  </p>
                  <p className="text-2xl font-black tabular-nums text-emerald-300">
                    +{rub(calc.saveYear, { compact: true })}
                    <span className="ml-1 text-xs font-bold text-emerald-500/80">в год</span>
                  </p>
                </div>
                {calc.newCars >= 1 && (
                  <p className="mt-1.5 text-xs text-zinc-400">
                    Это {calc.newCars}{' '}
                    {plural(calc.newCars, 'новая машина', 'новые машины', 'новых машин')} для
                    расширения парка (по 1,5 млн ₽) — или {calc.salaries}{' '}
                    {plural(calc.salaries, 'средняя зарплата', 'средние зарплаты', 'средних зарплат')}{' '}
                    водителей за год.
                  </p>
                )}
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
                30% — консервативная оценка: официальная комиссия 24%, но платные «опции»,
                подписки парка и волатильность комиссии (до 37%) съедают и её. У ПРЯМО комиссия
                8% фикс для парков любого размера.
              </p>
            </div>

            <Button
              onClick={goToJoin}
              className="mt-6 w-full bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300 sm:w-auto"
            >
              <Users className="mr-2 h-4 w-4" />
              Обсудить подключение парка
            </Button>
          </motion.div>

          {/* Правая колонка: преимущества + шаги */}
          <div className="flex flex-col gap-4">
            <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-emerald-500/30"
                >
                  <span className="inline-flex rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 ring-1 ring-emerald-500/20">
                    <b.icon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <h4 className="mt-3 text-sm font-bold text-white">{b.title}</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{b.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Модель работы */}
            <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/8 via-zinc-900 to-zinc-900 p-5 sm:p-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                Как подключиться
              </h4>
              <ol className="mt-4 space-y-4">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-3.5">
                    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-zinc-950 text-amber-300">
                      <s.icon className="h-4 w-4" aria-hidden />
                      <span className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-zinc-950">
                        {i + 1}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">{s.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-t border-zinc-800 pt-3 text-[11px] leading-relaxed text-zinc-500">
                Первый месяц для парков из первой волны — комиссия 0%. Дальше стандартные 8% фикс,
                без «опций» и волатильности.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
