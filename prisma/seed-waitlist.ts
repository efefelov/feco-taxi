import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const names = [
  ['Сергей Волков', 'Екатеринбург'], ['Алексей Гусев', 'Казань'], ['Марат Сабиров', 'Уфа'],
  ['Дмитрий Ершов', 'Челябинск'], ['Иван Прохоров', 'Самара'], ['Роман Белов', 'Пермь'],
  ['Тимур Ахметов', 'Оренбург'], ['Павел Смирнов', 'Воронеж'], ['Николай Данилов', 'Тюмень'],
  ['Аркадий Ким', 'Новосибирск'], ['Виктор Осипов', 'Краснодар'], ['Олег Тарасов', 'Ростов-на-Дону'],
  ['Андрей Шилов', 'Саратов'], ['Максим Фомин', 'Кемерово'], ['Егор Лапин', 'Иркутск'],
  ['Виталий Рогов', 'Барнаул'], ['Константин Юдин', 'Тольятти'], ['Борис Куликов', 'Рязань'],
  ['Степан Гаврилов', 'Астрахань'], ['Владимир Зуев', 'Курган'],
]
const fleets = [
  ['ИП Ковалёв А. В.', 'Нижний Новгород'], ['ООО «Автолайн»', 'Красноярск'], ['ИП Хасанов Р. Т.', 'Уфа'],
  ['ООО «ГородТранс»', 'Волгоград'], ['ИП Петренко С. Н.', 'Ставрополь'],
]

async function main() {
  await db.waitlistEntry.deleteMany()
  let i = 0
  for (const [name, city] of names) {
    await db.waitlistEntry.create({
      data: {
        role: 'driver',
        name,
        phone: `+7900${String(1000000 + i * 137).slice(0, 7)}`,
        city,
      },
    })
    i++
  }
  for (const [name, city] of fleets) {
    await db.waitlistEntry.create({
      data: {
        role: 'fleet',
        name,
        phone: `+7901${String(2000000 + i * 173).slice(0, 7)}`,
        city,
      },
    })
    i++
  }
  console.log(`Seeded waitlist: ${i} entries`)
}

main().catch(console.error).finally(() => db.$disconnect())
