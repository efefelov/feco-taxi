'use client'

import { motion } from 'framer-motion'
import {
  Smartphone,
  CarFront,
  UserRound,
  Apple,
  Play,
  Download,
  Globe,
  Layers,
  ClipboardCheck,
  Car,
  Brain,
  GraduationCap,
  Rocket,
  Building2,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

/**
 * «Приложения и подключение» — как выглядит продукт снаружи:
 * платформы и способы установки (App Store / Google Play / RuStore / APK / PWA),
 * «матрёшка» водительского приложения (ТРИЗ: многофункциональность)
 * и шаги подключения водителя, пассажира и таксопарка.
 */

const PLATFORMS = [
  { icon: Apple, name: 'App Store', desc: 'iOS 15+, iPhone и iPad' },
  { icon: Play, name: 'Google Play', desc: 'Android 8+' },
  { icon: Smartphone, name: 'RuStore', desc: 'без Google-сервисов' },
  { icon: Download, name: 'APK с сайта', desc: 'прямая установка' },
  { icon: Globe, name: 'PWA + веб-кабинет', desc: 'в браузере, без установки' },
]

const MATRYOSHKA = [
  { t: 'Лента заказов', d: 'выплата видна до принятия' },
  { t: 'Навигатор', d: '2GIS / Яндекс / OsmAnd — на выбор' },
  { t: 'Путевой лист', d: 'электронный, формируется сам' },
  { t: 'Медосмотр', d: 'предрейсовый — отметка в приложении' },
  { t: 'Налоговый реестр', d: 'НПД и расходы для УСН' },
  { t: 'Карта спроса', d: 'живые цифры по зонам' },
]

const DRIVER_STEPS = [
  {
    icon: Smartphone,
    time: '2 минуты',
    title: 'Заявка в приложении',
    body: 'Телефон + подтверждение через Госуслуги. Ни офисов, ни «активационных взносов», ни платных собеседований.',
  },
  {
    icon: ClipboardCheck,
    time: 'день 1–2',
    title: 'Документы — фото в приложении',
    body: 'Права категории B со стажем от 3 лет, разрешение на перевозку (или подключаем к партнёру-парку), ОСАГО для такси, справка об отсутствии судимости.',
  },
  {
    icon: Car,
    time: 'день 2–3',
    title: 'Проверка авто и водителя',
    body: 'Возраст авто — не старше 5 лет в базовом тарифе (выше классом — моложе), 4 двери, действующий техосмотр. Вводный психологический тест — 15 минут, сценарии «конфликтный пассажир» и «отмена в последний момент».',
  },
  {
    icon: Brain,
    time: 'день 3',
    title: 'Вводный урок',
    body: 'Как читать ленту, как считается оплата времени в пробке, куда писать при споре. Короткий экзамен на знание оферты — чтобы потом не было «а мне не сказали».',
  },
  {
    icon: Rocket,
    time: 'день 3–4',
    title: 'Первый заказ',
    body: 'Первой тысяче водителей города — 3 месяца без комиссии. Дальше 12% фикс или подписка Pro за 2 490 ₽.',
  },
]

export function Apps() {
  return (
    <section id="apps" className="scroll-mt-20 bg-zinc-50 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">
            <Smartphone className="h-3.5 w-3.5" />
            Приложения и подключение
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-balance text-zinc-900 sm:text-4xl">
            Два приложения. Пять способов установки. Ноль бумаг
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            iOS и Android — во всех сторах и без них: RuStore для устройств без Google-сервисов,
            прямой APK с сайта и PWA, которая работает в браузере и не требует установки вообще.
          </p>
        </motion.div>

        {/* Платформы */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PLATFORMS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
            >
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200">
                <p.icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-2.5 text-sm font-bold text-zinc-900">{p.name}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Два приложения + матрёшка */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Водительское приложение */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl shadow-zinc-300/40 sm:p-7"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                <CarFront className="h-4 w-4 text-emerald-400" aria-hidden />
                Водительское приложение
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                матрёшка 6-в-1
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              У монополиста рабочий день водителя размазан по отдельным сервисам: лента — там,
              путевой лист — у парка, медосмотр — в медцентре, налоги — «как скажет отчёт». У нас
              это одно приложение (принцип ТРИЗ «матрёшка» — многофункциональность):
            </p>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {MATRYOSHKA.map((m) => (
                <li
                  key={m.t}
                  className="flex items-start gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-3.5 py-2.5 transition-colors hover:border-zinc-700"
                >
                  <Layers className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                  <span>
                    <span className="block text-xs font-bold text-zinc-100">{m.t}</span>
                    <span className="block text-[11px] leading-snug text-zinc-500">{m.d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
              Вес APK — меньше мобильного навигатора. Работает офлайн: маршрут и данные заказа
              кэшируются, буфер 15 минут спасает в тоннелях и подземных паркингах.
            </p>
          </motion.div>

          {/* Пассажирское приложение */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-200/50 sm:p-7"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <UserRound className="h-4 w-4 text-emerald-600" aria-hidden />
                Пассажирское приложение
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                можно без установки
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Три экрана, ноль обучений: откуда, куда и сколько. Цена — фикс до поездки, машина на
              карте, чек и оценка — после. Без «персональных коэффициентов» и рекламы других
              сервисов экосистемы.
            </p>
            <div className="mt-4 space-y-3">
              {[
                {
                  t: 'PWA — сайт как приложение',
                  d: 'Открыть pryamo.taxi в браузере, «Добавить на главный экран» — и это уже приложение: иконка, пуш-уведомления о машине, обновления без стора.',
                },
                {
                  t: 'Лёгкая установка',
                  d: 'App Store, Google Play и RuStore — что доступно на вашем устройстве, тем и ставим. Прямой APK — с нашего сайта.',
                },
                {
                  t: 'Корпоративный вход',
                  d: 'Счёт и лимиты для компаний — без личных карт водителей сотрудников. Отчётность закрывающим документом.',
                },
              ].map((x) => (
                <div
                  key={x.t}
                  className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5 transition-colors hover:border-zinc-300"
                >
                  <p className="text-xs font-bold text-zinc-900">{x.t}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{x.d}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Как подключиться водителю: 5 шагов */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-200/50 sm:p-7"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight text-zinc-900">
                Как подключиться водителю — 5 шагов
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                От заявки до первого заказа — 3–4 дня. Без офисов, взносов и «собеседований за
                деньги».
              </p>
            </div>
            <a
              href="#law"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 underline-offset-4 hover:underline"
            >
              Что проверяем и почему — подробнее
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>

          <ol className="relative mt-7 space-y-5 border-l-2 border-zinc-200 pl-6 sm:space-y-6 sm:pl-8">
            {DRIVER_STEPS.map((s, i) => (
              <motion.li
                key={s.title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="relative"
              >
                <span className="absolute -left-[calc(1.5rem+9px)] top-0 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ring-4 ring-white sm:-left-[calc(2rem+9px)]">
                  <s.icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <p className="text-sm font-black text-zinc-900">
                    {i + 1}. {s.title}
                  </p>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                    {s.time}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">{s.body}</p>
              </motion.li>
            ))}
          </ol>

          <div className="mt-7 flex flex-col items-start gap-3 rounded-xl border border-zinc-200 bg-gradient-to-r from-emerald-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2.5 text-sm text-zinc-600">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <span>
                <strong className="text-zinc-900">Таксопаркам</strong> — API и bulk-онбординг:
                весь парк за один день, зарплаты и отчётность водителей на нашей стороне.
              </span>
            </p>
            <a
              href="#fleets"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-emerald-700 underline-offset-4 hover:underline"
            >
              Секция для парков
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>

          {/* Живой мостик в MVP */}
          <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2.5 text-sm text-zinc-600">
              <Play className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              <span>
                <strong className="text-zinc-900">Не хотите ждать сторов?</strong> Два
                самостоятельных приложения уже работают в этом браузере — со своим
                онбордингом и живым движком заказов между вкладками.
              </span>
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/passenger"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-zinc-950 shadow-md shadow-amber-300/50 transition-colors hover:bg-amber-300"
              >
                Пассажир
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/driver"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900"
              >
                Водитель
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
