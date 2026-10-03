'use client'

import { motion } from 'framer-motion'
import { Quote, Star, ArrowRight } from 'lucide-react'

const QUOTES = [
  {
    name: 'Сергей В.',
    city: 'Екатеринбург',
    years: '6 лет за рулём',
    text: 'Отдал Яндексу за год 412 тысяч комиссии. Пересчитал по калькулятору ПРЯМО — на эти деньги я бы поменял подвеску и съездил к морю. Жду запуск.',
    platform: 'был: Яндекс Про',
  },
  {
    name: 'Марат С.',
    city: 'Уфа',
    years: '3 года за рулём',
    text: 'Мой рейтинг упал с 4,91 до 4,54 за две несправедливых единицы. Обе — за то, что не поехал за 40 минут в другую точку за 300 рублей. Система сломана.',
    platform: 'был: Яндекс Про',
  },
  {
    name: 'Ольга В.',
    city: 'Москва',
    years: '8 лет за рулём',
    text: 'Пассажиры часто не понимают, почему я отказываюсь от заказа. Я объясняю: комиссия 40%, поездка за 280 рублей мне не окупает бензин. Они удивляются.',
    platform: 'была: таксопарк Яндекса',
  },
  {
    name: 'Дмитрий К.',
    city: 'Пермь',
    years: '5 лет за рулём',
    text: '«Карточка качества» — это чёрный ящик. Отказался от трёх невыгодных заказов подряд — неделя без нормального спроса. Как кабала, только без кредитов.',
    platform: 'был: Яндекс Про',
  },
  {
    name: 'Рустам А.',
    city: 'Казань',
    years: '2 года за рулём',
    text: 'GPS пропал в тоннеле — приложение списало штраф за «срыв заказа», хотя пассажир доехал. Поддержка ответила шаблоном через двое суток.',
    platform: 'был: Яндекс Про',
  },
  {
    name: 'ИП «Автолайн»',
    city: 'Красноярск',
    years: 'парк 34 машины',
    text: 'Как парк мы платим и комиссию агрегатора, и «опции», и платную подписку драйверов. На выходе водитель получает половину чека. ПРЯМО считает иначе — подписка вместо поборов.',
    platform: 'парк-партнёр Яндекса',
  },
]

export function Testimonials() {
  const doubled = [...QUOTES, ...QUOTES]
  return (
    <section className="relative overflow-hidden border-y border-zinc-200 bg-white py-14">
      <div className="mx-auto mb-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">
              Голоса тех, кто крутит баранку
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Водители и парки, которые ждут альтернативу. Цитаты типичных историй из драйверских
              чатов и отзывов.
            </p>
          </div>
          <a
            href="#join"
            className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 transition-colors hover:text-emerald-600"
          >
            Присоединиться к первой волне
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>

      <div
        className="marquee-mask relative"
        role="region"
        aria-label="Отзывы водителей (прокручиваемая лента)"
      >
        <div className="marquee-track flex w-max gap-4 px-4 py-1">
          {doubled.map((q, i) => (
            <article
              key={`${q.name}-${i}`}
              className="w-80 shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 shadow-sm"
              aria-hidden={i >= QUOTES.length}
            >
              <div className="flex items-start gap-2">
                <Quote className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-sm leading-relaxed text-zinc-700">{q.text}</p>
              </div>
              <footer className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3">
                <div>
                  <p className="text-sm font-bold text-zinc-900">{q.name}</p>
                  <p className="text-xs text-zinc-500">
                    {q.city} · {q.years}
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-zinc-500 shadow-sm">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {q.platform}
                </span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
