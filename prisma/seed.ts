import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const tariffs = [
  { id: 'eco', name: 'Прямой', description: 'Такси как есть: фикс-цена до конца поездки, честная машина без украшений.', multiplier: 1.0, baseFare: 79, perKm: 14, perMin: 6, carClass: 'Kia Rio, Hyundai Solaris, VW Polo, Lada Vesta', sortOrder: 1 },
  { id: 'comfort', name: 'Ладный', description: 'Всё работает и всё ладно: климат-контроль, свежие машины до 6 лет.', multiplier: 1.35, baseFare: 129, perKm: 18, perMin: 7, carClass: 'Toyota Corolla, Skoda Octavia, Kia Cerato', sortOrder: 2 },
  { id: 'comfort-plus', name: 'Привольный', description: 'Простор для ног и мыслей: вода, зарядки USB-C, мягкий ход.', multiplier: 1.7, baseFare: 169, perKm: 21, perMin: 8, carClass: 'Toyota Camry, Kia K5, Skoda Superb', sortOrder: 3 },
  { id: 'business', name: 'Барин', description: 'Едешь как хозяин: дресс-код водителя, встреча с табличкой, тишина.', multiplier: 2.4, baseFare: 299, perKm: 30, perMin: 12, carClass: 'Mercedes E, BMW 5, Audi A6', sortOrder: 4 },
  { id: 'van', name: 'Артель', description: 'Вся ватага в одной машине: до шести мест, кресла без доплаты.', multiplier: 1.5, baseFare: 149, perKm: 19, perMin: 8, carClass: 'VW Caravelle, Hyundai H-1, Lada Largus 7 мест', sortOrder: 5 },
  { id: 'intercity', name: 'Дальняк', description: 'Между городами: цена за всю машину целиком, фикс до конца маршрута.', multiplier: 1.0, baseFare: 0, perKm: 34, perMin: 0, carClass: 'Любой класс от Ладного', sortOrder: 6 },
  { id: 'cargo', name: 'Хомяк', description: 'Тащит больше, чем видно: грузы, переезды, доставка рассады.', multiplier: 1.2, baseFare: 299, perKm: 28, perMin: 0, carClass: 'Газель, Ford Transit, VW Transporter', sortOrder: 7 },
]

const drivers = [
  { id: 'drv-1', name: 'Алексей Смирнов', initials: 'АС', car: 'Toyota Camry, серебристый', plate: 'А 421 МК 77', rating: 4.94, rides: 8412, years: 6, isPro: true },
  { id: 'drv-2', name: 'Марат Хасанов', initials: 'МХ', car: 'Kia Rio, белый', plate: 'В 118 ОР 197', rating: 4.87, rides: 3120, years: 3, isPro: true },
  { id: 'drv-3', name: 'Ольга Ветрова', initials: 'ОВ', car: 'Skoda Octavia, синий', plate: 'Е 777 НВ 750', rating: 4.96, rides: 12840, years: 8, isPro: true },
  { id: 'drv-4', name: 'Сергей Пахомов', initials: 'СП', car: 'Hyundai Solaris, красный', plate: 'К 305 ТУ 152', rating: 4.71, rides: 987, years: 1, isPro: false },
  { id: 'drv-5', name: 'Дмитрий Ковалёв', initials: 'ДК', car: 'Toyota Camry 3.5, чёрный', plate: 'М 063 СС 99', rating: 4.89, rides: 5641, years: 5, isPro: true },
  { id: 'drv-6', name: 'Рустам Алиев', initials: 'РА', car: 'VW Polo, серый', plate: 'О 912 КХ 178', rating: 4.82, rides: 2210, years: 2, isPro: false },
]

const marketStats = [
  { id: 'share', label: 'Доля Яндекс Такси в онлайн-заказе такси РФ', value: 75, unit: '%', hint: 'Монополия по определению ФАС-профиля рынка', source: 'Finam / отчётность Яндекса 2024', tone: 'danger' },
  { id: 'market', label: 'Поездок на такси в России за 2024 год', value: 3.4, unit: 'млрд', hint: 'Рынок стагнирует (-2% в Q1 2025) — конкуренция ценой исчерпана', source: 'Коммерсантъ / Платформа ОФД', tone: 'neutral' },
  { id: 'commission-volatility', label: 'Волатильность комиссии Яндекса', value: 37, unit: '%', hint: 'Комиссия меняется алгоритмом в реальном времени', source: 'РОСАКАДЕМТРАНС', tone: 'danger' },
  { id: 'citymobil', label: 'Падение доли Ситимобил в Москве', value: 97, unit: '%', hint: 'С 28,7% (2020) до 0,86% (2024): второго игрока больше нет', source: 'ecomhub.ru, 2024', tone: 'danger' },
  { id: 'driver-loss', label: 'Фактические потери водителя от агрегатора', value: 40, unit: '%', hint: 'Комиссия 24%+ + опции + платные услуги парков + штрафы', source: 'Судебная практика: 104 336 ₽ из 520 575 ₽', tone: 'danger' },
  { id: 'our-commission', label: 'Комиссия ПРЯМО — фикс', value: 12, unit: '%', hint: 'Или 0% с подпиской ПРЯМО Pro за 2 490 ₽/мес', source: 'Наша оферта', tone: 'success' },
]

// Генерация истории поездок за 14 дней для графиков
function seedRides() {
  const rides: Array<{
    driverName: string, fromLabel: string, toLabel: string, distanceKm: number,
    durationMin: number, tariffName: string, priceTotal: number, driverPayout: number,
    commission: number, surge: number, tip: number, platform: string, createdAt: Date
  }> = []
  const froms = ['ул. Тверская, 7', 'Ленинский пр-т, 45', 'Кутузовский пр-т, 32', 'ул. Арбат, 24', 'Садовое кольцо, 12', 'Речной вокзал, 3']
  const tos = ['Аэропорт Шереметьево, терминал C', 'Белорусский вокзал', 'ул. Профсоюзная, 128', 'ТТК, 42', 'Парк Горького, вход 1', 'Москва-Сити, башня Федерация']
  const tariffNames = ['Эконом', 'Комфорт', 'Комфорт+', 'Бизнес', 'Минивэн']
  const mults = [1.0, 1.35, 1.7, 2.4, 1.5]
  let rngState = 42
  const rnd = () => { rngState = (rngState * 1103515245 + 12345) % 2147483648; return rngState / 2147483648 }

  for (let day = 13; day >= 0; day--) {
    const perDay = 6 + Math.floor(rnd() * 8)
    for (let i = 0; i < perDay; i++) {
      const distKm = 2 + rnd() * 26
      const durMin = Math.round(distKm * 2.2 + 4)
      const ti = Math.floor(rnd() * tariffNames.length)
      const surge = rnd() > 0.8 ? 1.2 : 1.0
      const price = Math.round((79 + 14 * distKm + 6 * durMin) * mults[ti] * surge / 10) * 10
      const isPro = rnd() > 0.55
      const commission = isPro ? 0 : Math.round(price * 0.12)
      const payout = price - commission
      const tip = rnd() > 0.7 ? Math.round(30 + rnd() * 170) : 0
      const d = new Date()
      d.setDate(d.getDate() - day)
      d.setHours(7 + Math.floor(rnd() * 14), Math.floor(rnd() * 60))
      rides.push({
        driverName: drivers[Math.floor(rnd() * drivers.length)].name,
        fromLabel: froms[Math.floor(rnd() * froms.length)],
        toLabel: tos[Math.floor(rnd() * tos.length)],
        distanceKm: Math.round(distKm * 10) / 10,
        durationMin: durMin,
        tariffName: tariffNames[ti],
        priceTotal: price,
        driverPayout: payout,
        commission,
        surge,
        tip,
        platform: 'ПРЯМО',
        createdAt: d,
      })
    }
  }
  return rides
}

async function main() {
  await db.tariff.deleteMany()
  await db.driverProfile.deleteMany()
  await db.rideRecord.deleteMany()
  await db.marketStat.deleteMany()

  await db.tariff.createMany({ data: tariffs })
  await db.driverProfile.createMany({ data: drivers })
  await db.marketStat.createMany({ data: marketStats })
  const rides = seedRides()
  await db.rideRecord.createMany({ data: rides })

  console.log(`Seeded: ${tariffs.length} tariffs, ${drivers.length} drivers, ${marketStats.length} market stats, ${rides.length} ride records`)
}

main().catch(console.error).finally(() => db.$disconnect())
