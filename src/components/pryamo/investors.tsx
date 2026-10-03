'use client'

import { motion } from 'framer-motion'
import {
  Briefcase,
  Handshake,
  Drum,
  Clock3,
  Link2,
  Lightbulb,
  Rocket,
  Users,
  Map,
  Building,
  TrendingUp,
  Wallet,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * «Основателям и инвесторам» — как устроена машина роста ПРЯМО:
 * мафия-оффер Голдратта, барабан-буфер-верёвка в диспетчеризации,
 * ТРИЗ-приёмы в продукте, growth hacks и unit-экономика на 12%.
 */

const MAFIA_OFFERS = [
  {
    to: 'Водителю',
    icon: Users,
    offer: '12% фикс. Без таксопарка. Налог — с чистой выплаты. Время в пробке — оплачивается. Отказ — без штрафа. Найдёте условия честнее — уходите, данные не держим.',
    why: 'Оффер не про скидку, а про структуру: монополист не может повторить его, не обнулив собственную P&L — его комиссия кормит экосистему и акционеров.',
  },
  {
    to: 'Пассажиру',
    icon: Map,
    offer: 'Цена — фикс до поездки. Без «персональных коэффициентов» и A/B-тестов цен. Чек ровно тот, что показало приложение. Машина на карте, водитель с рейтингом по фактам.',
    why: 'Предсказуемость — дефицитный товар на этом рынке: у конкурентов цена «живая» в обе стороны, и всегда не в пользу человека в салоне.',
  },
]

const DBR = [
  {
    icon: Drum,
    name: 'Барабан',
    sub: 'темп задаёт спрос',
    body: 'Прогноз спроса по зонам часа вперёд задаёт ритм: сколько машин держать в зоне, сколько заказов выпускать в ленту. Не «заливка цветом», а числа: заказы, водители, ожидание.',
  },
  {
    icon: Clock3,
    name: 'Буфер',
    sub: 'запас времени — оплачен',
    body: 'Подача и поездка планируются с запасом на пробки. Буфер стоит денег — и платит за него пассажир в честной цене минуты, а не водитель в потерянном часе. Спешить некуда: запас уже в цене.',
  },
  {
    icon: Link2,
    name: 'Верёвка',
    sub: 'выпуск по готовности',
    body: 'Новый заказ предлагается по завершении текущего, а не «в нагрузку». Спешка не ускоряет поток — поток ускоряет барабан. Система сама говорит, когда ехать, а когда выдохнуть.',
  },
]

const TRIZ = [
  { name: 'Сегментация', body: 'зоны вместо «города вообще»: у каждой — своя цена минуты и свой прогноз' },
  { name: 'Удаление посредника', body: 'таксопарк-цепочка исключена из потока денег — прямую связь водителя и платформы' },
  { name: 'Предварение', body: 'прогноз спроса и предпозиционирование машин до пика, а не после' },
  { name: 'Обратная связь', body: 'двусторонний рейтинг по фактам поездки с апелляцией — система учится на каждом заказе' },
  { name: 'Матрёшка', body: 'одно приложение: лента + навигатор + путёвка + медосмотр + налоги + карта спроса' },
  { name: 'Дешёвый объект', body: 'электронная путёвка и дистанционный медосмотр вместо бумаги и очередей' },
]

const GROWTH = [
  {
    icon: Users,
    title: 'Рефералка водителем',
    body: 'Привёл водителя — 5% с его комиссии платформы на 6 месяцев. Экономика говорит сама: сарафан дешевле рекламы в десятки раз, CAC < 2 000 ₽.',
  },
  {
    icon: Rocket,
    title: 'Первая тысяча — 0%',
    body: 'Первые 1 000 водителей города: 3 месяца без комиссии. Критическая масса плотности — до того, как пассажиры начнут ставить приложение.',
  },
  {
    icon: Map,
    title: 'Город-домино',
    body: 'Один город до самоокупаемости → соседние города тем же пакетом. Астрахань, миллионники-вторые, агломерации — не «вся Россия сразу».',
  },
  {
    icon: Building,
    title: 'Корпоративные якоря',
    body: 'B2B-аккаунты гарантируют утренний спрос будней: отели, заводы, больницы. Водителям — предсказуемая смена, пассажирам — SLA.',
  },
]

export function Investors() {
  return (
    <section id="founders" className="scroll-mt-20 bg-zinc-950 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <Briefcase className="h-3.5 w-3.5 text-amber-400" />
            Основателям и инвесторам
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-balance text-white sm:text-4xl">
            Инженерия оффера: ТРИЗ, ТОС и честная маржа
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            «Убийца монополии» — это не лозунг, а набор инструментов: мафия-оффер Голдратта,
            барабан-буфер-верёвка в диспетчеризации, ТРИЗ-приёмы в продукте и growth hacks,
            которые не жгут деньги на рекламе.
          </p>
        </motion.div>

        {/* Мафия-оффер */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {MAFIA_OFFERS.map((m, i) => (
            <motion.div
              key={m.to}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 sm:p-7"
            >
              <div
                className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                aria-hidden
              />
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                  <m.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Мафия-оффер · ТОС
                  </p>
                  <h3 className="text-lg font-black tracking-tight text-white">{m.to}</h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-zinc-200">{m.offer}</p>
              <p className="mt-3 border-t border-zinc-800 pt-3 text-xs leading-relaxed text-zinc-500">
                {m.why}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Барабан-буфер-верёвка */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-10"
        >
          <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
            <Handshake className="h-5 w-5 text-amber-400" aria-hidden />
            Барабан-буфер-верёвка — в диспетчеризации, а не на плакате
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
            Инструмент ТОС для производства перенесён на поток заказов: темп задаёт спрос, запас
            времени закладывается в цену, выпуск ограничен готовностью. Побочный эффект —
            инженерная анти-спешка: спешить в этой системе просто невыгодно.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {DBR.map((d, i) => (
              <motion.div
                key={d.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition-all hover:-translate-y-0.5 hover:border-zinc-700"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-amber-400 ring-1 ring-zinc-700">
                    <d.icon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-black text-white">{d.name}</p>
                    <p className="text-[11px] font-semibold text-zinc-500">{d.sub}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-zinc-400">{d.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ТРИЗ-приёмы */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-7"
        >
          <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
            <Lightbulb className="h-5 w-5 text-emerald-400" aria-hidden />
            ТРИЗ-приёмы, вшитые в продукт
          </h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TRIZ.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.25) }}
                className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 transition-colors hover:border-emerald-500/40"
              >
                <p className="text-xs font-black uppercase tracking-wide text-emerald-400">
                  {t.name}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{t.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Growth hacks */}
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {GROWTH.map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition-all hover:-translate-y-1 hover:border-amber-400/40"
            >
              <span className="inline-flex w-fit rounded-xl bg-amber-400/10 p-2.5 text-amber-400 ring-1 ring-amber-400/25">
                <g.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 text-base font-bold text-white">{g.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">{g.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Unit-экономика 12% + основатели */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-7"
          >
            <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
              <TrendingUp className="h-5 w-5 text-emerald-400" aria-hidden />
              Почему 12%, а не 8
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              12% — вдвое ниже официальной комиссии монополиста. Этого хватает, чтобы не жать
              водителя и не жать себя:
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { k: 'комиссия со среднего чека 825 ₽', v: '≈ 99 ₽' },
                { k: 'эквайринг и платежи', v: '−12 ₽' },
                { k: 'ФГИС, путевые, медосмотры — инфраструктура', v: '−20 ₽' },
                { k: 'поддержка и спорные случаи', v: '−13 ₽' },
              ].map((r) => (
                <li
                  key={r.k}
                  className="flex items-baseline justify-between gap-3 border-b border-zinc-800/60 pb-2.5"
                >
                  <span className="text-zinc-400">{r.k}</span>
                  <span className="font-bold tabular-nums text-zinc-200">{r.v}</span>
                </li>
              ))}
              <li className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-emerald-300">маржа платформы на заказ</span>
                <span className="font-black tabular-nums text-emerald-400">≈ 54 ₽</span>
              </li>
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              Подписка Pro 2 490 ₽/мес: водителю окупается от ~21 000 ₽ оборота, платформа получает
              предсказуемую выручку и удержание. Каждый 1% рынка такси РФ ≈ 15 млрд ₽ GMV ≈
              1,8 млрд ₽ нашей выручки в год.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 via-zinc-900 to-zinc-950 p-6 sm:p-7"
          >
            <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
              <Wallet className="h-5 w-5 text-amber-400" aria-hidden />
              Основатель должен кушать вкусно
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              Честная маржа вместо жадной комиссии — это стратегия, а не благотворительность.
              Структура издержек втрое легче монополиста, доля растущего рынка вместо дани с
              застывшего чека, дивиденды учредителей — с маржи платформы, а не со «штрафов за
              отказ».
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { v: '12%', l: 'комиссия — в оферте, навсегда' },
                { v: '~54 ₽', l: 'маржа со среднего заказа' },
                { v: '×1,8', l: 'рост цены этой доли рынка' },
              ].map((x) => (
                <div
                  key={x.l}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-center"
                >
                  <p className="text-lg font-black tabular-nums text-amber-400">{x.v}</p>
                  <p className="mt-1 text-[10px] font-semibold leading-snug text-zinc-500">{x.l}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500">
              Экономика, в которой едят все: водитель — 88% чека, пассажир — предсказуемую цену,
              команда — рынок, основатели — маржу роста. «Вкусно кушать» и «спокойно спать» —
              совместимые опции, если не строить доход на чужой спешке.
            </p>
            <a
              href="#join"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              Стать частью первой волны
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
