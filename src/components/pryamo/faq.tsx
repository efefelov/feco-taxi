'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle, Search, X, SearchX, MessageSquare, ArrowRight, Link2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { copyText } from '@/lib/pryamo/clipboard'

interface FaqItem {
  q: string
  a: string
  /** Ключевые слова для поиска (помимо слов вопроса и ответа) */
  keywords: string[]
}

const FAQS: FaqItem[] = [
  {
    q: 'Почему водители перейдут, если у Яндекса плотность машин?',
    a: 'Потому что мы не конкурируем плотностью — мы конкурируем экономикой. Водитель на ПРЯМО зарабатывает на 40–60% больше с той же выездки. Плотность — следствие количества водителей: сначала приезжают водители (им выгодно), за ними — пассажиры. Стартуем в одном городе с критической массой 1 000 водителей на 3 месяца без комиссии.',
    keywords: ['плотность', 'переход', 'переезд', 'водители'],
  },
  {
    q: '8% — на чём вы живёте, если Яндексу нужно 24%?',
    a: 'Яндексу 24% нужно кормить экосистему: маркетинг Go, субсидии, дивиденды холдинга, тысячи сотрудников. Наш движок заказов — это cloud-сервис с маржинальностью SaaS: себестоимость обработки заказа — копейки. Основные инвестиции — привлечение водителей и поддержка, и то и другое окупается подпиской Pro и экосистемными ребейтами (топливо, ТО, B2B).',
    keywords: ['комиссия', 'процент', '8%', '24%', 'экономика', 'saas', 'подписка'],
  },
  {
    q: 'Что мешает Яндексу просто снизить комиссию в ответ?',
    a: 'Ничего — и это победа. Если монополист снизит комиссию до 10%, мы уже изменили рынок: водители России получат десятки миллиардов рублей в год. Но структурно Яндекс не может: его комиссия финансирует экосистему и акционеров. Наша структура издержек втрое легче.',
    keywords: ['комиссия', 'ценовая война', 'конкуренция', 'монополия'],
  },
  {
    q: 'Как вы решите проблему «неадекватных» оценок водителей?',
    a: 'Рейтинг 2.0: четыре оси вместо одной цифры, медиана вместо среднего (одна 1★ не рушит рейтинг), затухание оценок за 90 дней и байесовское сглаживание по числу поездок. Плюс пассажир обязан указать ось, по которой снижает оценку — «просто 1★» технически невозможно.',
    keywords: ['рейтинг', 'оценки', 'звезды', '1★', 'звёзд', 'медиана'],
  },
  {
    q: 'Это законно — вообще делать такой агрегатор?',
    a: 'Да. В России нет лицензии на «агрегацию такси» как вида деятельности: есть правила перевозок (176-ФЗ), ОСГОП/ОСГОПП-страхование, требования к водителям и машинам — всё это выполняется так же, как у действующих игроков. Мы работаем с лицензированными таксопарками-партнёрами и самозанятыми водителями.',
    keywords: ['законно', 'лицензия', '176-фз', 'осгоп', 'самозанятые', 'юридически', 'право'],
  },
  {
    q: 'Почему в демо цены иногда с коэффициентом?',
    a: 'Спрос выше предложения — это честная экономика. Разница в том, что у нас коэффициент виден заранее обоим сторонам, ограничен капом ×1,5, и водитель получает свою долю С коэффициентом, а не «пересчитанную».',
    keywords: ['цены', 'коэффициент', 'surge', 'спрос', 'пиковый', 'дорого'],
  },
  {
    q: 'Что со штрафами за отказ от заказа?',
    a: 'Их нет. Заказ уходит тому, кто первый взял, — очередей с приоритетами и «карточек качества» не существует. Нажали «Мимо» — просто ждёте следующий, приоритет не падает, лента не наказывает. Единственное следствие отказа — заказ увидит другой водитель.',
    keywords: ['штраф', 'отказ', 'мимо', 'приоритет', 'баллы', 'карточка качества'],
  },
  {
    q: 'Нужно ли платить за вход или покупать «опции»?',
    a: 'Нет. Регистрация бесплатна, взносов нет, скрытых «опций» нет. Две модели: 8% с поездки или подписка Pro за 1 990 ₽ в месяц (0% комиссии, когда оборот больше ~25 000 ₽ в месяц — подписка окупается). Всё, что видит водитель в заказе, — финальная выплата, без «пересчётов после поездки».',
    keywords: ['взносы', 'опции', 'подписка', 'pro', '1990', 'бесплатно', 'платить'],
  },
]

/** Быстрые фильтры — то, что чаще всего ищут водители */
const QUICK_CHIPS = [
  { label: 'Комиссия', query: 'комиссия' },
  { label: 'Штрафы', query: 'штраф' },
  { label: 'Рейтинг', query: 'рейтинг' },
  { label: 'Законность', query: 'законно' },
  { label: 'Цены', query: 'цены' },
]

/** Нормализация: строчные, ё→е, снос пробелов и пунктуации */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9%€₽★+]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Совпадение слова запроса с текстом с учётом русской морфологии:
 * короткие слова (⩽3 симв.) ищем целиком, длинные — по «стемму»
 * (основа без последних 2 букв: «комиссия» → «комисс» находит
 * «комиссии», «штраф» → «штра» находит «штрафы»).
 */
function wordMatches(word: string, haystack: string): boolean {
  if (haystack.includes(word)) return true
  if (word.length < 4) return false
  const stem = word.slice(0, Math.max(4, word.length - 2))
  return haystack.split(' ').some((hw) => hw.startsWith(stem))
}

/** Фильтрация вопросов по нормализованному запросу */
function filterFaqs(nq: string): FaqItem[] {
  if (!nq) return FAQS
  return FAQS.filter((f) => {
    const haystack = normalize(`${f.q} ${f.a} ${f.keywords.join(' ')}`)
    // каждое слово запроса должно найтись
    return nq.split(' ').every((w) => w.length > 0 && wordMatches(w, haystack))
  })
}


export function Faq() {
  const [query, setQuery] = useState('')
  const [openItems, setOpenItems] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const normQuery = normalize(query)

  const filtered = useMemo(() => filterFaqs(normQuery), [normQuery])

  const hasQuery = normQuery.length > 0

  /** Смена запроса: обновляем фильтр и раскрываем все найденные вопросы */
  const applyQuery = (next: string) => {
    setQuery(next)
    const matched = filterFaqs(normalize(next))
    setOpenItems(matched.map((f) => `item-${FAQS.indexOf(f)}`))
  }

  // Deep links: ?q=комиссия — поиск из URL; #faq-q-N — конкретный вопрос.
  // URL — внешняя система: читаем асинхронно после гидратации, чтобы не
  // каскадить рендеры и не создать hydration mismatch.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q && q.trim()) {
      const next = q.trim().slice(0, 60)
      const t = window.setTimeout(() => applyQuery(next), 0)
      return () => clearTimeout(t)
    }
    const m = window.location.hash.match(/^#faq-q-(\d+)$/)
    if (m) {
      const idx = Number(m[1])
      if (Number.isInteger(idx) && idx >= 0 && idx < FAQS.length) {
        const t = window.setTimeout(() => setOpenItems([`item-${idx}`]), 0)
        return () => clearTimeout(t)
      }
    }
  }, [])

  // Ссылка на текущий поиск — для шаринга набора ответов
  const shareSearch = async () => {
    const url = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(query)}#faq`
    const ok = await copyText(url)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    }
  }

  // Ссылка на конкретный вопрос — для шаринга одного ответа
  const shareQuestion = async (idx: number) => {
    const url = `${window.location.origin}${window.location.pathname}#faq-q-${idx}`
    const ok = await copyText(url)
    if (ok) {
      setCopiedIdx(idx)
      window.setTimeout(() => setCopiedIdx((cur) => (cur === idx ? null : cur)), 2500)
    }
  }

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

        {/* Поиск по вопросам */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="mt-8"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => applyQuery(e.target.value)}
              placeholder="Найти ответ: «комиссия», «штраф», «законно»…"
              aria-label="Поиск по частым вопросам"
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-10 text-sm font-medium text-zinc-900 shadow-sm outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                onClick={() => applyQuery('')}
                aria-label="Очистить поиск"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-zinc-400">Быстрый поиск:</span>
            {QUICK_CHIPS.map((c) => {
              const isActive = normQuery === normalize(c.query)
              return (
                <button
                  key={c.label}
                  onClick={() => applyQuery(isActive ? '' : c.query)}
                  aria-pressed={isActive}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
                    isActive
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-emerald-400 hover:text-emerald-700'
                  )}
                >
                  {c.label}
                </button>
              )
            })}
            {hasQuery && (
              <span className="ml-auto flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400" aria-live="polite">
                  {filtered.length > 0
                    ? `Найдено: ${filtered.length} ${pluralQuestions(filtered.length)}`
                    : 'Ничего не нашлось'}
                </span>
                {filtered.length > 0 && (
                  <button
                    onClick={shareSearch}
                    aria-label="Скопировать ссылку на этот поиск"
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
                      copied
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-zinc-200 bg-white text-zinc-500 hover:border-emerald-400 hover:text-emerald-700'
                    )}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                    {copied ? 'Скопировано' : 'Ссылка'}
                  </button>
                )}
              </span>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6"
        >
          <AnimatePresence mode="wait" initial={false}>
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center"
              >
                <SearchX className="mx-auto h-8 w-8 text-zinc-300" />
                <p className="mt-3 text-base font-bold text-zinc-700">
                  По запросу «{query.trim()}» вопросов нет
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Попробуйте другое слово — например, «комиссия» или «рейтинг».
                </p>
                <button
                  onClick={() => applyQuery('')}
                  className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
                >
                  Показать все вопросы
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={`list-${normQuery}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Accordion
                  type="multiple"
                  value={openItems}
                  onValueChange={setOpenItems}
                  className="space-y-3"
                >
                  {filtered.map((f) => {
                    const idx = FAQS.indexOf(f)
                    return (
                      <AccordionItem
                        key={idx}
                        value={`item-${idx}`}
                        id={`faq-q-${idx}`}
                        className="scroll-mt-28 rounded-2xl border border-zinc-200 bg-white px-5 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md data-[state=open]:border-emerald-300/70 data-[state=open]:shadow-md"
                      >
                        <AccordionTrigger className="py-4 text-left text-base font-bold text-zinc-900 hover:no-underline">
                          <span className="flex items-start gap-2.5">
                            <span
                              className={cn(
                                'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black',
                                hasQuery
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-zinc-100 text-zinc-400'
                              )}
                            >
                              {idx + 1}
                            </span>
                            <span>{f.q}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-5 pl-8 text-sm leading-relaxed text-zinc-600">
                          {f.a}
                          <div className="mt-3 border-t border-zinc-100 pt-2.5">
                            <button
                              onClick={() => shareQuestion(idx)}
                              aria-label={`Скопировать ссылку на вопрос: ${f.q}`}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
                                copiedIdx === idx
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
                              )}
                            >
                              {copiedIdx === idx ? (
                                <Check className="h-3 w-3" aria-hidden="true" />
                              ) : (
                                <Link2 className="h-3 w-3" aria-hidden="true" />
                              )}
                              {copiedIdx === idx ? 'Ссылка скопирована' : 'Ссылка на этот вопрос'}
                            </button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Конверсионный хвост секции */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="mt-8"
        >
          <a
            href="#join"
            className="group flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-gradient-to-r from-emerald-50 to-white p-5 transition-all hover:border-emerald-300 hover:shadow-md sm:flex-row"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-200">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-zinc-900">
                  Не нашли свой вопрос?
                </p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Вступайте в первую волну и спросите напрямую — отвечаем лично каждому.
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-emerald-700 transition-transform group-hover:translate-x-0.5">
              Спросить основателей
              <ArrowRight className="h-4 w-4" />
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  )
}

function pluralQuestions(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'вопрос'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'вопроса'
  return 'вопросов'
}
