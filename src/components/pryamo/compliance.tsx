'use client'

import { motion } from 'framer-motion'
import {
  Landmark,
  Stethoscope,
  FileCheck2,
  ShieldCheck,
  UserCheck,
  Timer,
  Check,
  X,
} from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

/**
 * «Закон и отбор» — регуляторный стек ПРЯМО (ФГИС «Такси», медосмотры,
 * электронные путевые листы, ОСАГО для такси) и честный отбор водителей
 * с анти-спешкой: физика стимулов вместо лозунгов о безопасности.
 */

const TABS = [
  {
    id: 'fgis',
    icon: Landmark,
    label: 'ФГИС «Такси»',
    title: 'Каждая поездка — на учёте у государства. Автоматически',
    intro:
      'С 1 сентября 2023 года (69-ФЗ) каждый агрегатор обязан передавать сведения о заказах в федеральную ГИС «Такси»: статус заказа, машину, перевозчика, маршрут. Большинство «прикрутило» это отчётами постфактум. Мы вшили передачу в ядро движка — данные уходят в момент события.',
    bullets: [
      'Статусы заказа, данные машины и разрешение перевозчика — из ядра, в реальном времени',
      'Водитель видит значок «поездка в ФГИС» прямо в карточке заказа',
      'Расхождений «что в системе — что в отчёте» не существует по построению',
    ],
    contrast: {
      bad: 'у монополиста отчётность — чёрный ящик: строки удержаний не бьются даже сами с собой',
      good: 'у нас чек поездки, отчёт ФГИС и выплата водителя — одна и та же цифра',
    },
  },
  {
    id: 'medical',
    icon: Stethoscope,
    label: 'Медосмотры',
    title: 'Предрейсовый медосмотр — отметка в приложении, а не беготня по медцентрам',
    intro:
      'Предрейсовые и послерейсовые осмотры обязательны для перевозчиков. Мы подключаем аккредитованные медицинские организации: осмотр проходит дистанционно по алгоритму, отметка ставится электронно в приложении — до старта смены.',
    bullets: [
      'Предрейсовый — 2 минуты в приложении: давление, самочувствие, трезвость — по регламенту',
      'Послерейсовый — автоматом после длинных смен и ночных заказов',
      'Без отметки смена физически не стартует — и за саму отметку никто не платит',
    ],
    contrast: {
      bad: 'классика рынка: бумажные «осмотры» пачками задним числом — формальность, а не безопасность',
      good: 'у нас медосмотр — часть ядра смены: честно для водителя, проверяемо для государства',
    },
  },
  {
    id: 'waybill',
    icon: FileCheck2,
    label: 'Путевые листы',
    title: 'Электронный путевой лист формируется сам — водитель его не заполняет',
    intro:
      'Обязательные реквизиты путевого листа (данные водителя и машины, показания одометра, отметки медосмотра и технического контроля) мы собираем автоматически: из профиля, телеметрии и отметок смены. Остаётся только электронная подпись — по пути на первый заказ.',
    bullets: [
      'Номер, дата, маршрут — из данных заказа, без ручного ввода',
      'Подпись электронной подписью в приложении, хранение — у нас и у перевозчика',
      'Выгрузка для проверок — одним файлом за любой период',
    ],
    contrast: {
      bad: 'в классическом парке путёвки выписывает диспетчер, за них берут деньги, теряются они в бардачке',
      good: 'у нас путёвка существует раньше, чем водитель выехал — и не теряется никогда',
    },
  },
  {
    id: 'insurance',
    icon: ShieldCheck,
    label: 'ОСАГО для такси',
    title: 'Полис для легкового такси — оформление и продление в приложении',
    intro:
      'Перевозка пассажиров требует ОСАГО с тарифом «такси». Мы оформляем и продлеваем полис через страховых партнёров прямо в приложении: сравнение тарифов, оплата, документ — в профиле машины.',
    bullets: [
      'Напоминание о продлении за 30 дней — по каждому автомобилю в профиле',
      'Истёк полис — лента честно скрывает заказы заранее, а не «штраф после проверки»',
      'Партнёры-таксопарки страхуют парк пакетом — с нашей стороны контроль сроков',
    ],
    contrast: {
      bad: 'просроченный полис у классических агрегаторов всплывает после ДТП — когда поздно',
      good: 'у нас страхование — предусловие ленты, а не источник штрафов',
    },
  },
  {
    id: 'vetting',
    icon: UserCheck,
    label: 'Отбор водителей',
    title: 'Психика и адекватность — проверяемые вещи, а не «понравился / не понравился»',
    intro:
      'Документы дают нижнюю границу: права категории B со стажем от 3 лет, разрешение на перевозку, ОСАГО для такси, справка об отсутствии судимости, авто не старше 5 лет в базовом тарифе — выше классом моложе. Выше — проверка того, что не видно в документах.',
    bullets: [
      'Вводный психологический тест: стрессоустойчивость, реакция на сценарии «конфликт в салоне» и «отмена в последнюю секунду»',
      'Ретест раз в год и после серьёзных инцидентов — как медосмотр, только про голову',
      'Двусторонний рейтинг по фактам поездки: каждая низкая оценка — с причиной от пассажира, оценка без объяснения не существует',
      'Трёхступенчатый допуск: документы → психотест → вводный урок по оферте',
    ],
    contrast: {
      bad: 'у дешёвых агрегаторов «водитель» — это SIM-карта и любой автомобиль',
      good: 'у нас допуск — процесс с порогами, а не галочка в CRM',
    },
  },
  {
    id: 'rush',
    icon: Timer,
    label: 'Анти-спешка',
    title: '«Спешка за рублём» лечится не лозунгами, а устройством системы',
    intro:
      'Водитель гонится за следующим заказом, когда время не оплачивается, отказ наказывается, а доход зависит от числа поездок. Мы перестроили сами стимулы — четыре механики против спешки:',
    bullets: [
      'Оплата за время в пути: затор стоит денег пассажиру, а не убытка водителю',
      'Барабан-буфер-верёвка в диспетчеризации: один активный заказ, подача с запасом, темп задаёт спрос по зонам',
      'Отказ без штрафа: некуда «гнаться» — приоритет не падает, лента не наказывает',
      'Пауза после каждой поездки: спокойствие выгоднее спринта, и это видно в цифрах смены',
    ],
    contrast: {
      bad: 'у классики: быстрее выполнил — больше заказов получишь; аварийность — «побочный эффект»',
      good: 'у нас: аккуратный водитель зарабатывает больше лихача — по построению экономики',
    },
  },
]

export function Compliance() {
  return (
    <section id="law" className="scroll-mt-20 bg-background py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">
            <Landmark className="h-3.5 w-3.5" />
            Закон и отбор
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-balance text-zinc-900 sm:text-4xl">
            Регуляторика — не костыль, а каркас
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            ФГИС «Такси», медосмотры, электронные путевые листы, ОСАГО и отбор водителей — всё, что
            рынок считает «издержками комплаенса», у нас работает как продукт. Шесть вкладок —
            шесть ответов.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10"
        >
          <Tabs defaultValue="fgis">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl border border-zinc-200 bg-zinc-100 p-1.5 sm:grid-cols-6">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-bold leading-tight text-zinc-500 transition-colors data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm sm:flex-row sm:justify-center sm:gap-1.5 sm:text-xs"
                >
                  <t.icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="text-center">{t.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {TABS.map((t) => (
              <TabsContent key={t.id} value={t.id} className="mt-6">
                <div className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-200/40 sm:p-7 lg:grid-cols-[1.05fr_0.95fr]">
                  <div>
                    <span className="inline-flex rounded-xl bg-emerald-50 p-2.5 text-emerald-700 ring-1 ring-emerald-200">
                      <t.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="mt-3 text-lg font-black tracking-tight text-zinc-900">
                      {t.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">{t.intro}</p>
                    <div className="mt-5 space-y-3">
                      {t.contrast && (
                        <>
                          <div className="flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
                            <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" strokeWidth={3} aria-hidden />
                            <p className="text-xs leading-relaxed text-zinc-500">
                              {t.contrast.bad}
                            </p>
                          </div>
                          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                            <Check
                              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                              strokeWidth={3}
                              aria-hidden
                            />
                            <p className="text-xs leading-relaxed text-zinc-700">
                              {t.contrast.good}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2.5 self-start rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
                    {t.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                        <span className="text-xs font-semibold leading-relaxed text-zinc-700">
                          {b}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        <p className="mt-6 text-center text-xs leading-relaxed text-zinc-400">
          Мы — концепт на старте: нормативные формулировки здесь описывают архитектуру продукта, а
          не юридическую консультацию. Конкретные акты и регламенты фиксируются юристами при
          запуске города.
        </p>
      </div>
    </section>
  )
}
