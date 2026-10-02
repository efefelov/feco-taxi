'use client'

import { motion } from 'framer-motion'
import {
  Crown,
  Percent,
  Building2,
  Fuel,
  Megaphone,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

const STREAMS = [
  {
    icon: Crown,
    title: 'Подписка ПРЯМО Pro',
    price: '1 990 ₽/мес',
    share: 35,
    color: 'emerald',
    desc: '0% комиссии, приоритет в ленте не нужен — он и так честный, но Pro даёт аналитику ликвидности зон и мгновенные выплаты.',
    example: '400 водителей × Pro в городе-миллионнике = 9,5 млн ₽/год',
  },
  {
    icon: Percent,
    title: 'Комиссия 8% фикс',
    price: 'без подписки',
    share: 30,
    color: 'emerald',
    desc: 'Половина водителей останется на pay-as-you-go. 8% с оборота без скрытых «опций» и волатильности. Прозрачно в чеке.',
    example: '60% поездок × 8% ≈ 47 млн ₽/год при 10% рынка',
  },
  {
    icon: Building2,
    title: 'Корпоративные счета',
    price: '+2% сервисных',
    share: 15,
    color: 'amber',
    desc: 'B2B — 15% рынка: отчётность, лимиты, SLA, закрытые корпоративные тарифы. Оплата по счёту, авансовые депозиты.',
    example: 'Один корпоративный клиент = 400–4 000 поездок/мес',
  },
  {
    icon: Fuel,
    title: 'Экосистема водителя',
    price: 'ребейты',
    share: 12,
    color: 'amber',
    desc: 'Топливная карта «ПРЯМО Топливо» (1–2% с оборота АЗС), ТО и мойки по партнёрским ценам, лизинг и страховка.',
    example: 'Водитель заправляется на 40 000 ₽/мес — наш ребейт 480 ₽',
  },
  {
    icon: Megaphone,
    title: 'Гео-промо',
    price: 'CPM/CPA',
    share: 5,
    color: 'zinc',
    desc: '«По пути»: ресторан рядом с маршрутом, отель у аэропорта. Максимум один блок в приложении, не как у экосистем.',
    example: 'Ресторан платит 25 ₽ за показ 1 000 пассажирам рядом',
  },
  {
    icon: Sparkles,
    title: 'Платный комфорт',
    price: 'микротарифы',
    share: 3,
    color: 'zinc',
    desc: 'Гарантия класса «Комфорт», бустер, тихий водитель, ожидание в аэропорту с табличкой — от 29 ₽ за фичу.',
    example: '5% пассажиров × 50 ₽ = 5,5 млн ₽/год на 10% рынка',
  },
]

export function Monetization() {
  return (
    <section id="money" className="scroll-mt-20 bg-background py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            Бизнес-модель
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-balance text-zinc-900 sm:text-4xl">
            Деньги — не на комиссии, а вокруг поездки
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Классический агрегатор зарабатывает на водителе. ПРЯМО зарабатывает на экосистеме:
            подписка, B2B, топливо и сервисы. Водитель — партнёр, а не дойная корова.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {STREAMS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={
                    s.color === 'emerald'
                      ? 'rounded-xl bg-emerald-50 p-2.5 text-emerald-600 ring-1 ring-emerald-200/60'
                      : s.color === 'amber'
                        ? 'rounded-xl bg-amber-50 p-2.5 text-amber-600 ring-1 ring-amber-200/60'
                        : 'rounded-xl bg-zinc-100 p-2.5 text-zinc-600 ring-1 ring-zinc-200/60'
                  }
                >
                  <s.icon className="h-5 w-5" />
                </span>
                <div className="text-right">
                  <p className="text-base font-black tabular-nums tracking-tight text-zinc-900">{s.price}</p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    ~{s.share}% выручки
                  </p>
                </div>
              </div>
              <h3 className="mt-3.5 text-lg font-bold text-zinc-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.desc}</p>
              <div className="mt-auto pt-5">
                <div className="flex items-start gap-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5 text-xs leading-relaxed text-zinc-600">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {s.example}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Unit-экономика */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-12 overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white shadow-xl shadow-zinc-200/40"
        >
          <div className="border-b border-zinc-200 bg-zinc-900 px-6 py-4">
            <h3 className="text-lg font-bold text-white">
              Unit-экономика: город-миллионник, год 1
            </h3>
            <p className="mt-0.5 text-sm text-zinc-400">
              Консервативный сценарий: 10% рынка города, средний чек 450 ₽
            </p>
          </div>
          <div className="grid divide-zinc-200 sm:grid-cols-4 sm:divide-x">
            {[
              { label: 'Поездок в сутки', value: '6 000', hint: '10% рынка города' },
              { label: 'Оборот за год', value: '985,5 млн ₽', hint: '6 000 × 450 ₽ × 365' },
              { label: 'Наш валовый доход', value: '~57 млн ₽', hint: '8% с 60% + подписки с 40%' },
              { label: 'Breakeven', value: 'год 2', hint: 'при 15% рынка' },
            ].map((c) => (
              <div key={c.label} className="p-6 text-center">
                <p className="text-2xl font-black tabular-nums tracking-tight text-zinc-900">
                  {c.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-700">{c.label}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{c.hint}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 border-t border-zinc-200 bg-zinc-50/60 p-6 sm:grid-cols-3">
            {[
              { k: 'CAC водителя', v: '< 2 000 ₽', d: 'сарафан: экономика говорит сама' },
              { k: 'LTV водителя', v: '> 80 000 ₽', d: '14 мес работы, маржа с Pro 1 200 ₽/мес' },
              { k: 'Конфликт интересов', v: '0', d: 'мы не конкурируем с водителем за его чек' },
            ].map((x) => (
              <div key={x.k} className="flex items-center gap-3 rounded-xl border border-zinc-200/70 bg-white p-4 shadow-sm">
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{x.k}</p>
                  <p className="text-lg font-black tabular-nums text-emerald-700">{x.v}</p>
                </div>
                <p className="text-xs leading-snug text-zinc-500">{x.d}</p>
              </div>
            ))}
          </div>
          <p className="border-t border-zinc-200 bg-zinc-50/60 px-6 py-3.5 text-center text-xs text-zinc-500">
            Все цифры — консервативные оценки концепта, а не обещания инвесторам. Прозрачность
            начинается с нас самих.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
