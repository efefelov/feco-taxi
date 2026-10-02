'use client'

import { motion } from 'framer-motion'
import { Map, Rocket, Globe2, Swords, Flag } from 'lucide-react'

const PHASES = [
  {
    icon: Map,
    phase: 'Фаза 1',
    months: 'месяцы 0–6',
    title: 'Один город, один честный продукт',
    color: 'emerald',
    points: [
      'MVP: приложение водителя + пассажира, движок заказов',
      'Город-миллионник (не Москва): плотность важнее масштаба',
      '1 000 водителей-основателей: 0% комиссии на 3 месяца',
      'Живая карта спроса и прозрачный чек — с первого дня',
    ],
  },
  {
    icon: Rocket,
    phase: 'Фаза 2',
    months: 'месяцы 6–18',
    title: 'Экономика и экспансия',
    color: 'amber',
    points: [
      'Подписка Pro и 8% фикс — включение монетизации',
      '5–7 городов: транспортные сетевые эффекты',
      'Корпоративные счета, топливная карта',
      'Плотность ETA < 7 минут в зонах покрытия',
    ],
  },
  {
    icon: Globe2,
    phase: 'Фаза 3',
    months: 'годы 2–3',
    title: 'Экосистема водителя',
    color: 'zinc',
    points: [
      'ТО, лизинг, страховка — партнёрская сеть',
      'Межгород и грузовые перевозки',
      'Открытый API для таксопарков',
      '10%+ рынка: монополия впервые чувствует цену',
    ],
  },
  {
    icon: Swords,
    phase: 'Фаза 4',
    months: 'год 3+',
    title: 'Нормализация рынка',
    color: 'rose',
    points: [
      'Выход в топ-30 городов России',
      'Отраслевой стандарт прозрачной комиссии',
      'Рейтинг 2.0 как норма, а не фича',
      'Смерть модели «40% с водителя» как класса',
    ],
  },
]

export function Roadmap() {
  return (
    <section id="roadmap" className="scroll-mt-20 bg-background py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">
            <Flag className="h-3.5 w-3.5" />
            Дорожная карта
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            Как убивают монополии: медленно, потом внезапно
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Ситимобил погиб, потому что копировал Яндекс. Мы не копируем — мы меняем правила игры:
            экономика водителя против плотности сети.
          </p>
        </motion.div>

        <div className="relative mt-12">
          <div className="absolute left-6 top-0 hidden h-full w-0.5 bg-gradient-to-b from-emerald-500 via-amber-400 to-rose-400 lg:left-1/2 lg:block" aria-hidden="true" />
          <div className="space-y-8 lg:space-y-12">
            {PHASES.map((p, i) => (
              <motion.div
                key={p.phase}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className={i % 2 === 0 ? 'lg:pr-[calc(50%+3rem)]' : 'lg:pl-[calc(50%+3rem)]'}
              >
                <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-200/40 transition-shadow hover:shadow-xl">
                  <span className="absolute -left-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white lg:flex">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        p.color === 'emerald'
                          ? 'rounded-xl bg-emerald-500 p-2.5 text-white'
                          : p.color === 'amber'
                            ? 'rounded-xl bg-amber-400 p-2.5 text-zinc-900'
                            : p.color === 'rose'
                              ? 'rounded-xl bg-rose-500 p-2.5 text-white'
                              : 'rounded-xl bg-zinc-700 p-2.5 text-white'
                      }
                    >
                      <p.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        {p.phase} · {p.months}
                      </p>
                      <h3 className="text-lg font-black text-zinc-900">{p.title}</h3>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-sm text-zinc-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
