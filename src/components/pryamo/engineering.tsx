'use client'

import { motion } from 'framer-motion'
import {
  Wrench,
  Handshake,
  Drum,
  Clock3,
  Link2,
  Lightbulb,
  Users,
  CarFront,
  Sparkles,
  ArrowRight,
  Gift,
  Rocket,
  PiggyBank,
  Route,
  HeartHandshake,
  Landmark,
  BadgePercent,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * «Инженерия потока» — инструменты ТРИЗ и ТОС, вшитые в продукт:
 * мафия-оффер Голдратта, барабан-буфер-верёвка в диспетчеризации,
 * ТРИЗ-приёмы и growth hacks отдельно для водителей и пассажиров.
 */

const MAFIA_OFFERS = [
  {
    to: 'Водителю',
    icon: CarFront,
    accent: 'emerald' as const,
    offer:
      '12% фикс. Без таксопарка. Налог — с чистой выплаты. Время в пробке — оплачивается. Отказ — без штрафа. Найдёте условия честнее — уходите, данные не держим.',
    why: 'Оффер не про скидку, а про структуру: монополист не может повторить его, не обнулив собственную P&L — его комиссия кормит экосистему и акционеров.',
  },
  {
    to: 'Пассажиру',
    icon: Users,
    accent: 'amber' as const,
    offer:
      'Цена — фикс до поездки. Без «персональных коэффициентов» и A/B-тестов цен. Чек ровно тот, что показало приложение. Машина на карте, водитель с рейтингом по фактам.',
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
  {
    name: 'ИКР',
    full: 'Идеальный конечный результат',
    body: 'поиск машины стремится к нулевой стоимости: платите не за посредника, а за ценность — безопасность, прогноз, поддержку',
    star: true,
  },
  {
    name: 'Сегментация',
    full: '',
    body: 'зоны вместо «города вообще»: у каждой — своя цена минуты и свой прогноз',
  },
  {
    name: 'Удаление посредника',
    full: '',
    body: 'таксопарк-цепочка исключена из потока денег — прямая связь водителя и платформы',
  },
  {
    name: 'Предварение',
    full: '',
    body: 'прогноз спроса и предпозиционирование машин до пика, а не после',
  },
  {
    name: 'Обратная связь',
    full: '',
    body: 'двусторонний рейтинг по фактам поездки с апелляцией — система учится на каждом заказе',
  },
  {
    name: 'Матрёшка',
    full: '',
    body: 'одно приложение: лента + навигатор + путёвка + медосмотр + налоги + карта спроса',
  },
  {
    name: 'Дешёвый объект',
    full: '',
    body: 'электронная путёвка и дистанционный медосмотр вместо бумаги и очередей',
  },
]

const DRIVER_GROWTH = [
  {
    icon: Gift,
    title: 'Рефералка «водитель за водителя»',
    body: 'Привёл водителя — 5% с его комиссии платформы на 6 месяцев каждому. Привёл пятерых — фактически работа без комиссии. CAC ниже 2 000 ₽ вместо рекламы.',
  },
  {
    icon: Rocket,
    title: 'Первая тысяча — 0%',
    body: 'Первые 1 000 водителей города едут 3 месяца без комиссии. Критическая плотность — до пассажирской волны, а не после неё.',
  },
  {
    icon: BadgePercent,
    title: 'Pro за сарафан',
    body: '10 приведённых водителей = год подписки Pro бесплатно (2 490 ₽/мес → 0 ₽). Награда тем, кто строит плотность города.',
  },
  {
    icon: PiggyBank,
    title: 'Кэшбокс цели',
    body: 'Копилка в приложении: «ремонт», «отпуск», «новая машина». Процент с каждой выплаты — автоматически. Градиент к цели удерживает лучше любых штрафов.',
  },
]

const PASSENGER_GROWTH = [
  {
    icon: Users,
    title: 'Пригласи друга — по 300 ₽',
    body: 'Бонус обоим, но это кредит: гасится 10% каждой поездкой. Бонус живёт, пока живут поездки — защита от «скачал и спалил».',
  },
  {
    icon: Route,
    title: 'Фикс-маршрут «дом → работа»',
    body: '8+ поездок по одному маршруту в месяц — цена заморожена на следующий месяц. Предсказуемость как подписка, без подписки.',
  },
  {
    icon: HeartHandshake,
    title: 'Чаевые — 100% водителю',
    body: 'Платформа не берёт ни рубля с чаевых и не прячем чек. Прозрачность — фича продукта, а не страница FAQ.',
  },
  {
    icon: Landmark,
    title: 'Семейный счёт',
    body: 'Общая оплата, лимиты детям и родителям, история поездок в одном месте. Один платёжный профиль — вся семья в такси.',
  },
]

export function Engineering() {
  return (
    <section id="engineering" className="scroll-mt-20 bg-zinc-100 py-20 lg:py-24">
      {/* Верхняя шашечка — ритмичная полоса, отделяет от соседней секции */}
      <div className="taxi-strip h-1.5 w-full opacity-40" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700 shadow-sm">
            <Wrench className="h-3.5 w-3.5 text-emerald-600" />
            ТРИЗ · ТОС · Growth-инженерия
          </span>
          <h2 className="mt-4 text-balance text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            Инженерия потока: оффер, от которого невозможно отказаться
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Ров проекта — не лозунг, а инструментальный ящик: мафия-оффер Голдратта,
            барабан-буфер-верёвка в диспетчеризации, ТРИЗ-приёмы в продукте и growth hacks,
            которые не жгут деньги на рекламе. Сильнейший слой обороны — метаморфоза: путь
            от честного агрегатора к открытой инфраструктуре, которую монополия не повторит,
            не обрушив собственный P&L.
          </p>
        </motion.div>

        {/* ===== Мафия-оффер ===== */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {MAFIA_OFFERS.map((m, i) => (
            <motion.div
              key={m.to}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={cn(
                'relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md sm:p-7',
                m.accent === 'emerald'
                  ? 'border-emerald-300/70 bg-gradient-to-b from-emerald-50/80 to-white'
                  : 'border-amber-300/70 bg-gradient-to-b from-amber-50/80 to-white'
              )}
            >
              <div
                className={cn(
                  'absolute inset-x-0 top-0 h-0.5',
                  m.accent === 'emerald'
                    ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-amber-400 to-transparent'
                )}
                aria-hidden
              />
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl ring-1',
                    m.accent === 'emerald'
                      ? 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30'
                      : 'bg-amber-400/15 text-amber-700 ring-amber-400/30'
                  )}
                >
                  <m.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-widest',
                      m.accent === 'emerald' ? 'text-emerald-700/70' : 'text-amber-700/70'
                    )}
                  >
                    Мафия-оффер · ТОС
                  </p>
                  <h3 className="text-lg font-black tracking-tight text-zinc-900">{m.to}</h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-zinc-800">{m.offer}</p>
              <p className="mt-3 border-t border-zinc-200 pt-3 text-xs leading-relaxed text-zinc-500">
                {m.why}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ===== Барабан-буфер-верёвка ===== */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-10"
        >
          <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-zinc-900">
            <Handshake className="h-5 w-5 text-emerald-600" aria-hidden />
            Барабан-буфер-верёвка — в диспетчеризации, а не на плакате
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
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
                className="relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
              >
                {/* Стрелка-связь между карточками на десктопе */}
                {i < DBR.length - 1 && (
                  <span
                    className="absolute -right-3.5 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm md:flex"
                    aria-hidden
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-amber-400 ring-1 ring-zinc-300">
                    <d.icon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-black text-zinc-900">{d.name}</p>
                    <p className="text-[11px] font-semibold text-zinc-500">{d.sub}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-zinc-600">{d.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ===== ТРИЗ-приёмы ===== */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-10 rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-7"
        >
          <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-zinc-900">
            <Lightbulb className="h-5 w-5 text-emerald-600" aria-hidden />
            ТРИЗ-приёмы, вшитые в продукт
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Теория решения изобретательских задач — не курс лекций, а список решений, которые
            уже в архитектуре платформы. Первый в списке — главный.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TRIZ.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.25) }}
                className={cn(
                  'rounded-xl border p-4 transition-colors',
                  t.star
                    ? 'border-emerald-300 bg-emerald-50/60 hover:border-emerald-400'
                    : 'border-zinc-200 bg-zinc-50/60 hover:border-emerald-300/60'
                )}
              >
                <p
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-black uppercase tracking-wide',
                    t.star ? 'text-emerald-700' : 'text-emerald-700/80'
                  )}
                >
                  {t.star && <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden />}
                  {t.name}
                  {t.full && (
                    <span className="font-semibold normal-case tracking-normal text-zinc-400">
                      · {t.full}
                    </span>
                  )}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">{t.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ===== Growth hacks: водители и пассажиры ===== */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {[
            {
              who: 'Водителям',
              icon: CarFront,
              tone: 'emerald' as const,
              items: DRIVER_GROWTH,
            },
            {
              who: 'Пассажирам',
              icon: Users,
              tone: 'amber' as const,
              items: PASSENGER_GROWTH,
            },
          ].map((col) => (
            <motion.div
              key={col.who}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl ring-1',
                    col.tone === 'emerald'
                      ? 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30'
                      : 'bg-amber-400/15 text-amber-700 ring-amber-400/30'
                  )}
                >
                  <col.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Growth hacks
                  </p>
                  <h3 className="text-lg font-black tracking-tight text-zinc-900">{col.who}</h3>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {col.items.map((g) => (
                  <div
                    key={g.title}
                    className="group flex gap-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 transition-colors hover:border-zinc-300 hover:bg-white"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform group-hover:scale-105',
                        col.tone === 'emerald'
                          ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25'
                          : 'bg-amber-400/10 text-amber-700 ring-amber-400/25'
                      )}
                    >
                      <g.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-snug text-zinc-900">{g.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-600">{g.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Переход к первой волне */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-gradient-to-r from-zinc-900 to-zinc-800 px-6 py-6 text-white shadow-md sm:flex-row sm:px-8"
        >
          <p className="max-w-xl text-sm leading-relaxed text-zinc-300">
            Каждый инструмент здесь — не слайд для инвесторов, а строка кода движка демо:
            аукцион без приоритетов, прогноз спроса, фикс-цена и честный чек уже работают
            ниже по странице.
          </p>
          <a
            href="#join"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            Стать частью первой волны
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
