'use client'

import { motion } from 'framer-motion'
import {
  Activity,
  BellRing,
  Brain,
  Building2,
  CarFront,
  Gauge,
  Handshake,
  HeartPulse,
  MapPinOff,
  MoonStar,
  Navigation,
  Package,
  ParkingSquare,
  Plane,
  Receipt,
  Route as RouteIcon,
  Satellite,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Thermometer,
  Train,
  Users,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * «Пакет водителя и город» — как ПРЯМО снижает плотность личных автомобилей,
 * закрывает легальность (медосмотр, путевой лист, ОСАГО) пакетом оборудования,
 * живёт с GPS-глушителями и следит за состоянием водителя (Neiry).
 */

const FLEX_CARD = 'rounded-2xl border border-zinc-200 bg-white p-6'
const SECTION_DARK_HEAD = 'text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600'

function Block({
  icon: Icon,
  kicker,
  title,
  children,
  index,
}: {
  icon: typeof Package
  kicker: string
  title: string
  children: React.ReactNode
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.25) }}
      className={FLEX_CARD}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-emerald-400">
          <Icon className="h-5.5 w-5.5" aria-hidden />
        </span>
        <div>
          <p className={SECTION_DARK_HEAD}>{kicker}</p>
          <h3 className="text-lg font-black leading-tight text-zinc-900">{title}</h3>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </motion.div>
  )
}

function LineRow({ icon: Icon, title, desc }: { icon: typeof Wallet; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 ring-1 ring-zinc-200">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-bold text-zinc-900">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-600">{desc}</p>
      </div>
    </div>
  )
}

export function DriverReady() {
  return (
    <section id="ready" className="scroll-mt-20 bg-zinc-50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Package className="h-3.5 w-3.5" aria-hidden />
            Быт водителя и город
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            Меньше личных машин, больше такси — и водитель готов к выезду за 3 минуты
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Такси побеждает владение автомобилем только когда поездка дешевле владения, а
            водитель выходит на линию без бюрократии. ПРЯМО закрывает обе задачи одним
            пакетом: медосмотр, путевой лист и ОСАГО — в приложении; приборы — в комплекте.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {/* ===== 1. Плотность города ===== */}
          <Block index={0} icon={Building2} kicker="Стратегия города" title="Личная машина простаивает 23 часа в сутки">
            <div className="space-y-3">
              <LineRow
                icon={Wallet}
                title="Владение стоит 25–40 тыс. ₽/мес, ездит 1–2 ч/день"
                desc="Кредит, ОСАГО, парковка, ТО — при пробеге до 10 тыс. км/мес такси выходит дешевле владения. Считаем это прямо в калькуляторе для пассажира: «ваша машина vs ПРЯМО»."
              />
              <LineRow
                icon={Train}
                title="Подписка «Проездной ПРЯМО» вместо второй машины в семье"
                desc="Фикс-цена маршрута «дом—работа» по подписке: 20 поездок в месяц дешевле владения. Не промокоды (за них ругают Яндекс) — прозрачная цена по оферте."
              />
              <LineRow
                icon={ParkingSquare}
                title="«Свой авто в ПРЯМО» — машина окупает простой"
                desc="Владелец включает личную машину в аукцион в часы простоя (утро/вечер, выходные). Часть семей отказывается от второй машины — плотность такси растёт без закупки парков."
              />
              <LineRow
                icon={Handshake}
                title="Работодатели платят за поездки, а не за парковки"
                desc="Корпоративный счёт: фирма снимает проблему парковки и даёт сотруднику поездки. B2B-партнёрства — второй вход пассажиров (вместе с QR от водителей)."
              />
            </div>
          </Block>

          {/* ===== 2. Легальность ===== */}
          <Block index={1} icon={Stethoscope} kicker="Легальность без бюрократии" title="Медосмотр, путевой лист, ОСАГО — в приложении">
            <div className="space-y-3">
              <LineRow
                icon={HeartPulse}
                title="Предрейсовый медосмотр — дистанционно"
                desc="Тонометр и термометр из пакета передают давление и пульс в приложение; заключение формируется в электронном медкабинете партнёра. Формат дистанционного осмотра закон уже допускает — точные требования Минздрава сверяем перед запуском первой волны."
              />
              <LineRow
                icon={Receipt}
                title="Электронный путевой лист — автогенерация"
                desc="Приложение собирает путёвку само: дата, маршрут, показания, отметки медосмотра. Файл с печатью партнёра-парка готов к проверке ГИБДД, история хранится в профиле."
              />
              <LineRow
                icon={ShieldCheck}
                title="ОСАГО для такси — маркетплейс партнёра"
                desc="Такси-ОСАГО дороже личного — это факт, который прячет доход. Даём калькулятор сразу при регистрации, телематика ПРЯМО (аккуратная езда) даёт скидку при пролонгации."
              />
              <LineRow
                icon={Smartphone}
                title="Никаких визитов в офис"
                desc="Регистрация, медосмотр, путёвка, страховка — онлайн. Пакет приборов приходит почтой, готовность к выезду — в день получения."
              />
            </div>
          </Block>

          {/* ===== 3. Пакет оборудования ===== */}
          <Block index={2} icon={Package} kicker="Пакет «ПРЯМО Готов»" title="Комплект приборов, который делает требования закона простыми">
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-200">
                  <tr>
                    <th className="px-3 py-2 font-bold">Прибор</th>
                    <th className="px-3 py-2 font-bold">Зачем</th>
                    <th className="px-3 py-2 font-bold">Куда попадает</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white text-zinc-700">
                  {[
                    { icon: Gauge, name: 'Алкотестер Bluetooth', why: 'предрейсовый контроль', into: 'результат — в путевой лист, тест за 60 секунд' },
                    { icon: HeartPulse, name: 'Тонометр Bluetooth', why: 'давление и пульс', into: 'медчек дистанционного осмотра' },
                    { icon: Thermometer, name: 'Термометр', why: 'температура', into: 'медчек, повторный контроль' },
                    { icon: Plane, name: 'Видеорегистратор + кабина', why: 'споры и безопасность', into: 'обоснование апелляций по рейтингу и ДТП' },
                    { icon: Navigation, name: 'Держатель + зарядка 65 Вт', why: 'телефон всегда жив', into: 'GPS-стабильность всей смены' },
                    { icon: CarFront, name: 'Наклейки и мини-QR', why: 'каждый пассажир — вход в ПРЯМО', into: 'атрибуция: поездка по QR — бонус водителю' },
                  ].map((row) => (
                    <tr key={row.name}>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1.5 font-bold text-zinc-900">
                          <row.icon className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                          {row.name}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">{row.why}</td>
                      <td className="px-3 py-2.5 text-zinc-500">{row.into}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-600">
              Стоимость пакета — в рассрочку из будущих выплат (не депозит, не «активационный
              платёж»: за такие взносы ругают монополиста в отзывах). Для парков — корпоративная
              закупка со скидкой.
            </p>
          </Block>

          {/* ===== 4. GPS-глушилки ===== */}
          <Block index={3} icon={Satellite} kicker="Геолокация без клетки" title="GPS теряется не в тоннелях — из-за глушителей">
            <div className="space-y-3">
              <LineRow
                icon={MapPinOff}
                title="Диагноз честно: джамминг и спуфинг"
                desc="Охраняемые предприятия и объекты глушат сигнал в радиусе своей территории: координаты пропадают или «телепортируются» — от чужого района до другого континента. Это не вина водителя и не «плохой телефон»."
              />
              <LineRow
                icon={Satellite}
                title="Детекция глушения — автоматически"
                desc="Все спутники пропали разом или координаты физически невозможны (500 км/сек) — приложение распознаёт помехи, переключается на счисление пути (инерциалка + сотовые сети) и помечает поездку как «зона глушения»."
              />
              <LineRow
                icon={ShieldCheck}
                title="Политика: глушение ≠ штраф водителю"
                desc="Простой из-за помех не понижает доход и не бьёт по рейтингу — в отзывах Яндекс Про водители пишут, что за «пропавший GPS» штрафуют. Мы разделяем ответственность: техника платформы — на платформе."
              />
              <LineRow
                icon={Activity}
                title="Тепловая карта помех"
                desc="Случаи глушения агрегируются в карту зон по городам: диспетчер и водитель видят, где сигнал не ловит, — и приложение заранее перестраивает логику заказа."
              />
            </div>
          </Block>

          {/* ===== 5. Neiry ===== */}
          <Block index={4} icon={Brain} kicker="Партнёрство с Neiry" title="«ПРЯМО Внимание»: свежий водитель — качество сервиса">
            <div className="space-y-3">
              <LineRow
                icon={Brain}
                title="ЭЭГ-браслет opt-in: состояние водителя"
                desc="Нейроинтерфейс Neiry отслеживает внимание и сонливость за рулём: первые признаки дремоты — вибро-сигнал и предложение остановиться на 15 минут. Всё только с согласия водителя, данные принадлежат ему."
              />
              <LineRow
                icon={MoonStar}
                title="Восстановление после смены — 5 минут"
                desc="Нейро-сессия расслабления и сна в приложении: короткая практика по ЭЭГ-профилю. Уставший и злой водитель не сделает сервис — уставший и отдохнувший может."
              />
              <LineRow
                icon={Users}
                title="Метрика «свежесть» — водителю, не платформе"
                desc="Платформа видит только агрегат без личных данных: «готов к линии / нужен отдых». Бейдж свежести — в профиль, бонусы за законный отдых вместо наказаний за усталость."
              />
              <LineRow
                icon={Gauge}
                title="Экономика пакета"
                desc="Свежесть и телематика снижают ДТП и аварийность → дешевле ОСАГО и страховые расходы. Пилот: браслеты Neiry первой волне водителей — 10–20 устройств, замер эффекта за месяц."
              />
            </div>
          </Block>

          {/* ===== 6. Онбординг и привлечение ===== */}
          <Block index={5} icon={Users} kicker="Рост: водители, пассажиры, парки" title="Первая волна — плотно в одном городе, не распыляясь">
            <div className="space-y-3">
              <LineRow
                icon={CarFront}
                title="Водители: якорная волна 10–20 машин"
                desc="Прямой набор через Telegram-бот и водителей-знакомых: честная математика (88% + чаевые) и пакет «Готов» в рассрочку. Реферка «приведи водителя» — 3 000 ₽ после 100 поездок новичка."
              />
              <LineRow
                icon={Smartphone}
                title="Пассажиры: QR от водителя, а не промокоды"
                desc="Наклейка с QR в каждой машине: пассажир сканирует — получает фикс-цену первой поездки со скидкой, водителю — бонус. Атрибуция как в СтейкБокс: видно, какой водитель привёл сколько людей."
              />
              <LineRow
                icon={Building2}
                title="Таксопарки: белый формат B2B"
                desc="Подключение за день через API, комиссия 12% без «опций», выплаты напрямую людям. Парк получает аналитику и аукцион вместо очереди с приоритетами."
              />
              <LineRow
                icon={BellRing}
                title="Окно возможностей"
                desc="Пока Яндекс теряет водителей (см. разбор отзывов) и до входа WB Такси в РФ — месяцы, а не годы. Скорость набора якорной волны важнее идеального продукта."
              />
            </div>
          </Block>
        </div>

        {/* Итоговая строка */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto mt-10 max-w-4xl rounded-2xl border border-zinc-900/10 bg-zinc-950 p-6 text-center sm:p-8"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
            Формула плотности
          </p>
          <p className="mt-3 text-lg font-black leading-snug text-white sm:text-xl">
            Поездка дешевле владения + выезд на линию за один день + водитель отдохнувший и
            честно защищённый = личная машина остаётся для удовольствия, город едет ПРЯМО.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
