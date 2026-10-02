'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scissors,
  Star,
  Layers,
  Radar,
  Navigation,
  Gavel,
  MessageSquareWarning,
  EyeOff,
  Zap,
  Percent,
  Gauge,
  CarFront,
  Wallet,
  Ban,
  ArrowRight,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface Pain {
  icon: React.ComponentType<{ className?: string }>
  title: string
  problem: string
  data: string
  solution: string
}

const DRIVER_PAINS: Pain[] = [
  {
    icon: Scissors,
    title: 'Комиссия 24% — фактически 40%',
    problem:
      'Номинальная комиссия ~24%, но волатильность доходит до 37%. Плюс «опции», платные услуги таксопарков и штрафы. Из судебной практики: из 520 575 ₽ дохода водителя удержано 104 336 ₽ комиссий.',
    data: 'РОСАКАДЕМТРАНС · судпрактика 2024',
    solution: 'Комиссия 8% фикс в оферте. Или 0% с подпиской Pro за 1 990 ₽/мес. Точка безразличия — 25 000 ₽ оборота.',
  },
  {
    icon: Star,
    title: 'Рейтинг, где 1★ весит как 10 пятёрок',
    problem:
      'Одна несправедливая единица обнуляет десять отличных поездок. Рейтинг «молчит»: непонятно, за что снизили. Старые оценки не затухают годами. Оценка может опуститься прямо во время вызова.',
    data: 'otzovik · vk · forum.taxi: тысячи жалоб',
    solution: 'Рейтинг 2.0: 4 оси, медиана вместо среднего, затухание 90 дней, защита от разовой 1★.',
  },
  {
    icon: Layers,
    title: 'Баллы приоритета и «карточка качества»',
    problem:
      'Непрозрачный алгоритм решает, кому отдать заказ. Отказался от невыгодного заказа — приоритет упал — заказов стало меньше — порочный круг. Водители называют это «кабалой».',
    data: 'forum.taxi: «Решает не приоритет, решает карточка качества»',
    solution: 'Никаких приоритетов: заказ достаётся тому, кто первым нажал «Взять». Отказ — без штрафа.',
  },
  {
    icon: Radar,
    title: 'Спрос-зоны без цифр',
    problem:
      '«Зона повышенного спроса» — картинка без данных. Водитель едет через полгорода и ждёт заказ 10 минут. Нет прогноза, нет статистики ликвидности зон по часам.',
    data: 'Жалобы водителей: ожидание в «горячей» зоне 10+ мин',
    solution: 'Живая карта спроса: заказы в очереди, водители рядом, среднее ожидание — по каждой зоне.',
  },
  {
    icon: Navigation,
    title: 'Привязка к Яндекс.Навигатору и GPS-срывы',
    problem:
      'Выбора навигатора нет. GPS пропадает в тоннелях и подземных паркингах — приложение считает, что водитель не едет, срывает заказ, списывает штраф.',
    data: 'Массовые кейсы срывов заказов в тоннелях',
    solution: '2GIS, Яндекс, OsmAnd — на выбор. Офлайн-буфер 15 минут: заказ живёт даже без сигнала.',
  },
  {
    icon: Gavel,
    title: 'Штрафы и блокировки без суда',
    problem:
      'Автоматические списания за «нарушения», которые алгоритм сам и нашёл. Поддержка отвечает шаблонами. Бонусы за поездки «не зачисляются по правилам», которые никто не показал.',
    data: 'irecommend · otzovik: «поддержка отписывается шаблоном»',
    solution: 'Списания — только через спор с человеком-арбитром. Все правила публичны в оферте.',
  },
  {
    icon: EyeOff,
    title: 'Водитель не видит цену пассажира',
    problem:
      'Агрегатор «оптимизирует» цены в реальном времени: два пассажира на одну и ту же поездку платят по-разному. Водителю показывают только свою «выплату» — проверить нечем.',
    data: 'A/B-ценообразование признано самим Яндексом',
    solution: 'Одна цена для всех. Водитель видит чек пассажира и свою долю ДО принятия заказа.',
  },
  {
    icon: Zap,
    title: 'Surge достаётся не водителю',
    problem:
      'В час пик пассажир платит ×2, но алгоритм «пересчитывает стоимость» так, что прибавка к выплате водителя — копейки по сравнению с переплатой пассажира.',
    data: 'Разборы драйверских чатов, 2024–2025',
    solution: 'Коэффициент ×1,5 максимум, виден всем заранее, и водитель получает свою долю С ним.',
  },
]

const PASSENGER_PAINS: Pain[] = [
  {
    icon: Percent,
    title: 'Плавающий коэффициент ×2–3',
    problem:
      'Дождь или пятничный вечер — цена вырастает в разы без внятной формулы. «Погода за окном» — не объяснение, почему поездка стоит как ужин в ресторане.',
    data: 'Жалобы в соцсетях каждую дождливую пятницу',
    solution: 'Surge-кап ×1,5, коэффициент показан до заказа и не меняется в пути.',
  },
  {
    icon: Ban,
    title: 'Водитель не приехал',
    problem:
      'Заказ приняли и отменили: водителю невыгодно ехать за 300 ₽ при комиссии 40% — он перебирает заказы. Пассажир ждёт дважды.',
    data: 'Прямое следствие экономики водителя',
    solution: 'Заказ видят только водители, готовые ехать. Отмена после принятия — штраф водителю, а не пассажиру.',
  },
  {
    icon: CarFront,
    title: 'Плавающая цена в поездке',
    problem:
      '«Оптимизированный» маршрут, минута ожидания, «пересчёт по трафику» — приехала сумма больше той, что показали на экране.',
    data: 'Топ-жалоба в отзывах на магазины приложений',
    solution: 'Фикс цены до конца поездки. Простой водителя — прозрачный тариф за минуту, а не «по обстоятельствам».',
  },
  {
    icon: Gauge,
    title: 'Качество «Эконома» падает',
    problem:
      'Водители, отдающие 40% чека, экономят на обслуживании машин. Убитые салоны и мёртвый климат-контроль — не вина водителя, это арифметика комиссии.',
    data: 'Следствие: меньше денег у водителя = меньше вложений в авто',
    solution: 'Водитель с деньгами = ухоженная машина. Плюс классы с жёсткими требованиями к возрасту авто.',
  },
  {
    icon: Wallet,
    title: 'Чаевые доезжают «как-то»',
    problem:
      'Кнопка «оставить чаевые» есть, а как и когда деньги попадают водителю — тайна. Часть уходит «на обработку».',
    data: 'Непрозрачность признана драйверскими сообществами',
    solution: 'Чаевые 100% водителю, зачисление мгновенно, комиссия — 0 ₽. Всегда.',
  },
  {
    icon: MessageSquareWarning,
    title: 'Экосистема вместо сервиса',
    problem:
      'Чтобы вызвать машину, предлагают подписку Плюс, Go-маркет, доставку. Основная функция — такси — обрастает навязанным маркетом.',
    data: 'Продуктовая стратегия Яндекса Go',
    solution: 'Приложение делает ровно одно: возит людей. Всё.',
  },
]

function PainCard({ pain, index }: { pain: Pain; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 rounded-xl bg-rose-50 p-2.5 text-rose-500 transition-colors group-hover:bg-rose-100">
          <pain.icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-snug text-zinc-900">{pain.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{pain.problem}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {pain.data}
      </p>
      <div className="mt-auto pt-4">
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p>
            <strong className="font-bold text-emerald-700">Решение ПРЯМО: </strong>
            {pain.solution}
          </p>
        </div>
      </div>
    </motion.article>
  )
}

export function PainPoints() {
  const [tab, setTab] = useState('driver')

  return (
    <section id="pains" className="scroll-mt-20 bg-zinc-50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-600">
            Анатомия недоверия
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            Две стороны одной комиссии
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Всё, за что пассажиры ругают такси, начинается там, где у водителя забирают 40% чека.
            Разберём по кнопке.
          </p>
        </motion.div>

        <Tabs value={tab} onValueChange={setTab} className="mt-10">
          <div className="flex justify-center">
            <TabsList className="h-12 rounded-2xl bg-white p-1.5 shadow-md ring-1 ring-zinc-200">
              <TabsTrigger
                value="driver"
                className="h-9 rounded-xl px-6 text-sm font-bold data-[state=active]:bg-rose-500 data-[state=active]:text-white"
              >
                Боли водителей ({DRIVER_PAINS.length})
              </TabsTrigger>
              <TabsTrigger
                value="passenger"
                className="h-9 rounded-xl px-6 text-sm font-bold data-[state=active]:bg-zinc-900 data-[state=active]:text-white"
              >
                Боли пассажиров ({PASSENGER_PAINS.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <TabsContent key={tab} value={tab} forceMount className="mt-8">
              <motion.div
                key={tab + '-grid'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className={cn(
                  'grid gap-4',
                  tab === 'driver' ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-2 xl:grid-cols-3'
                )}
              >
                {tab === 'driver'
                  ? DRIVER_PAINS.map((p, i) => <PainCard key={p.title} pain={p} index={i} />)
                  : PASSENGER_PAINS.map((p, i) => <PainCard key={p.title} pain={p} index={i} />)}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </section>
  )
}
