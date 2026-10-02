'use client'

import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle } from 'lucide-react'

const FAQS = [
  {
    q: 'Почему водители перейдут, если у Яндекса плотность машин?',
    a: 'Потому что мы не конкурируем плотностью — мы конкурируем экономикой. Водитель на ПРЯМО зарабатывает на 40–60% больше с той же выездки. Плотность — следствие количества водителей: сначала приезжают водители (им выгодно), за ними — пассажиры. Стартуем в одном городе с критической массой 1 000 водителей на 3 месяца без комиссии.',
  },
  {
    q: '8% — на чём вы живёте, если Яндексу нужно 24%?',
    a: 'Яндексу 24% нужно кормить экосистему: маркетинг Go, субсидии, дивиденды холдинга, тысячи сотрудников. Наш движок заказов — это cloud-сервис с маржинальностью SaaS: себестоимость обработки заказа — копейки. Основные инвестиции — привлечение водителей и поддержка, и то и другое окупается подпиской Pro и экосистемными ребейтами (топливо, ТО, B2B).',
  },
  {
    q: 'Что мешает Яндексу просто снизить комиссию в ответ?',
    a: 'Ничего — и это победа. Если монополист снизит комиссию до 10%, мы уже изменили рынок: водители России получат десятки миллиардов рублей в год. Но структурно Яндекс не может: его комиссия финансирует экосистему и акционеров. Наша структура издержек втрое легче.',
  },
  {
    q: 'Как вы решите проблему «неадекватных» оценок водителей?',
    a: 'Рейтинг 2.0: четыре оси вместо одной цифры, медиана вместо среднего (одна 1★ не рушит рейтинг), затухание оценок за 90 дней и байесовское сглаживание по числу поездок. Плюс пассажир обязан указать ось, по которой снижает оценку — «просто 1★» технически невозможно.',
  },
  {
    q: 'Это законно — вообще делать такой агрегатор?',
    a: 'Да. В России нет лицензии на «агрегацию такси» как вида деятельности: есть правила перевозок (176-ФЗ), ОСГОП/ОСГОПП-страхование, требования к водителям и машинам — всё это выполняется так же, как у действующих игроков. Мы работаем с лицензированными таксопарками-партнёрами и самозанятыми водителями.',
  },
  {
    q: 'Почему в демо цены иногда с коэффициентом?',
    a: 'Спрос выше предложения — это честная экономика. Разница в том, что у нас коэффициент виден заранее обоим сторонам, ограничен капом ×1,5, и водитель получает свою долю С коэффициентом, а не «пересчитанную».',
  },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-zinc-50 py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">
            <HelpCircle className="h-3.5 w-3.5" />
            Частые вопросы
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            Скептики спрашивают — мы отвечаем
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-zinc-200 bg-white px-5 shadow-sm data-[state=open]:shadow-md"
              >
                <AccordionTrigger className="py-4 text-left text-base font-bold text-zinc-900 hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-zinc-600">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
