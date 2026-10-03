'use client'

import { motion } from 'framer-motion'
import { Swords, ShieldCheck, AlertTriangle, MoveHorizontal, Crosshair } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * «Поле боя» — честная раскладка всего рынка: Яндекс, inDrive, Максим,
 * Таксовичкoфф, местечковые сети (Таксолет и др.) и ПРЯМО.
 * Мы честно указываем и своё слабое место — плотность машин на старте.
 */

type Tone = 'pryamo' | 'yandex' | 'neutral'

interface Col {
  id: string
  name: string
  tag: string
  tone: Tone
}

const COLS: Col[] = [
  { id: 'pryamo', name: 'ПРЯМО', tag: 'мы', tone: 'pryamo' },
  { id: 'yandex', name: 'Яндекс', tag: 'монополист', tone: 'yandex' },
  { id: 'indrive', name: 'inDrive', tag: 'торг', tone: 'neutral' },
  { id: 'maxim', name: 'Максим', tag: 'дешёвый', tone: 'neutral' },
  { id: 'taksovichkoff', name: 'Таксовичкoфф', tag: 'сеть', tone: 'neutral' },
  { id: 'local', name: 'Местные сети', tag: 'Таксолет и др.', tone: 'neutral' },
]

interface Row {
  feature: string
  cells: Record<string, { text: string; ok?: boolean; bad?: boolean }>
}

const ROWS: Row[] = [
  {
    feature: 'Комиссия с водителя',
    cells: {
      pryamo: { text: '12% фикс или 0% с Pro', ok: true },
      yandex: { text: '24%+ и таксопарк сверху — вместе ~55%', bad: true },
      indrive: { text: '5–15%, зависит от торга' },
      maxim: { text: 'сервисный сбор 10–20%, растёт' },
      taksovichkoff: { text: '10–25% + парковые взносы' },
      local: { text: 'у каждого своя — 10–20%' },
    },
  },
  {
    feature: 'Кто называет цену',
    cells: {
      pryamo: { text: 'фикс до поездки, видят оба', ok: true },
      yandex: { text: 'алгоритм + A/B-тесты цен', bad: true },
      indrive: { text: 'пассажир, водители сбивают' },
      maxim: { text: 'агрегатор' },
      taksovichkoff: { text: 'диспетчер' },
      local: { text: 'диспетчер' },
    },
  },
  {
    feature: 'Таксопарк-посредник',
    cells: {
      pryamo: { text: 'не нужен — напрямую', ok: true },
      yandex: { text: 'обязателен', bad: true },
      indrive: { text: 'не нужен' },
      maxim: { text: 'частично' },
      taksovichkoff: { text: 'сам таксопарк' },
      local: { text: 'сам таксопарк' },
    },
  },
  {
    feature: 'Налог',
    cells: {
      pryamo: { text: 'НПД/УСН с чистого дохода + реестр расходов', ok: true },
      yandex: { text: 'СЗН от полной стоимости поездки', bad: true },
      indrive: { text: 'как повезёт с оформлением' },
      maxim: { text: 'часто серые схемы' },
      taksovichkoff: { text: 'через парк' },
      local: { text: 'через парк' },
    },
  },
  {
    feature: 'Медосмотры, путевые, ФГИС',
    cells: {
      pryamo: { text: 'в одном приложении', ok: true },
      yandex: { text: 'есть, но через парк' },
      indrive: { text: 'частично, контроль слабый' },
      maxim: { text: 'слабо', bad: true },
      taksovichkoff: { text: 'вручную' },
      local: { text: 'вручную' },
    },
  },
  {
    feature: 'Спешка за рублём',
    cells: {
      pryamo: { text: 'оплата времени + буферы в расписании', ok: true },
      yandex: { text: 'нет: чем быстрее — тем больше заказов', bad: true },
      indrive: { text: 'нет: нужен оборот' },
      maxim: { text: 'нет' },
      taksovichkoff: { text: 'нет' },
      local: { text: 'нет' },
    },
  },
  {
    feature: 'Слабое место — честно',
    cells: {
      pryamo: { text: 'плотность машин: стартуем с одного города' },
      yandex: { text: 'экономика водителя и доверие' },
      indrive: { text: 'демпинг режет доход и качество' },
      maxim: { text: 'качество и легальность' },
      taksovichkoff: { text: 'масштаб и технологии' },
      local: { text: 'масштаб и технологии' },
    },
  },
]

/** Стратегия против каждого класса игроков */
const STRATEGY = [
  {
    vs: 'против Яндекса',
    how: 'экономика водителя: 12% вместо ~55% совокупных удержаний. Монополист структурно не может повторить — его комиссия кормит экосистему и акционеров.',
  },
  {
    vs: 'против inDrive',
    how: 'предсказуемость вместо торга: демпинг выгоден пассажиру до поездки, но режет доход водителя и безопасность. У нас фикс-чек и контроль допуска.',
  },
  {
    vs: 'против Максима',
    how: 'комплаенс и качество: медосмотры, путевые листы, ФГИС и отбор водителей — в ядре, а не «как-нибудь потом».',
  },
  {
    vs: 'против местечковых сетей',
    how: 'технология при локальной гибкости: экспансия «город-домино», город за городом, а не «вся Россия сразу» — уважение к местным игрокам, которые станут партнёрами.',
  },
]

export function Competitors() {
  return (
    <section id="rivals" className="scroll-mt-20 bg-zinc-950 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <Swords className="h-3.5 w-3.5 text-amber-400" />
            Поле боя
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-balance text-white sm:text-4xl">
            На рынке есть все — кроме честной инфраструктуры
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Яндекс, inDrive, Максим, Таксовичкoфф, Таксолет и местечковые сети — каждый занял свою
            нишу. ПРЯМО не «ещё один дешёвый агрегатор»: мы — единственные, кто объединил фикс-чек,
            оплату времени, налог с чистого дохода и полный комплаенс-стек.
          </p>
        </motion.div>

        {/* Матрица рынка */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="table-scroll mt-12 overflow-x-auto rounded-2xl border border-zinc-800 shadow-2xl shadow-black/40"
        >
          <div className="min-w-[880px]">
            {/* Заголовок */}
            <div className="grid grid-cols-[140px_repeat(6,1fr)] border-b border-zinc-800 bg-zinc-900/80">
              <div className="px-3 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Игрок
              </div>
              {COLS.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    'border-l border-zinc-800 px-3 py-3',
                    c.tone === 'pryamo' && 'bg-emerald-500/10',
                    c.tone === 'yandex' && 'bg-rose-500/5'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'text-sm font-black tracking-tight',
                        c.tone === 'pryamo'
                          ? 'text-emerald-400'
                          : c.tone === 'yandex'
                            ? 'text-rose-300'
                            : 'text-zinc-200'
                      )}
                    >
                      {c.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-semibold',
                      c.tone === 'pryamo'
                        ? 'text-emerald-500/80'
                        : c.tone === 'yandex'
                          ? 'text-rose-400/70'
                          : 'text-zinc-500'
                    )}
                  >
                    {c.tag}
                  </span>
                </div>
              ))}
            </div>

            {/* Строки */}
            <div className="divide-y divide-zinc-800/70 bg-zinc-950">
              {ROWS.map((row, i) => (
                <motion.div
                  key={row.feature}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: '-10px' }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.28) }}
                  className="grid grid-cols-[140px_repeat(6,1fr)] text-xs transition-colors hover:bg-zinc-900/40"
                >
                  <div className="px-3 py-3 font-bold text-zinc-300">{row.feature}</div>
                  {COLS.map((c) => {
                    const cell = row.cells[c.id]
                    return (
                      <div
                        key={c.id}
                        className={cn(
                          'border-l border-zinc-800/70 px-3 py-3 leading-snug',
                          c.tone === 'pryamo' && 'bg-emerald-500/5'
                        )}
                      >
                        <span
                          className={cn(
                            cell.ok
                              ? 'font-semibold text-emerald-300'
                              : cell.bad
                                ? 'text-rose-300'
                                : 'text-zinc-400'
                          )}
                        >
                          {cell.text}
                        </span>
                      </div>
                    )
                  })}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500 sm:hidden">
          <MoveHorizontal className="h-3.5 w-3.5" aria-hidden />
          Матрицу можно прокрутить в сторону
        </p>
        <p className="mt-3 text-center text-xs text-zinc-600">
          Оценки по публичным данным, офертам и отзывам сообществ, 2024–2026. Мы не идеализируем и
          себя: плотность машин — реальная слабость любого новичка.
        </p>

        {/* Стратегия против каждого */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {STRATEGY.map((s, i) => (
            <motion.div
              key={s.vs}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition-all hover:-translate-y-0.5 hover:border-zinc-700"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-amber-400 ring-1 ring-zinc-700">
                <Crosshair className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-amber-400">{s.vs}</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{s.how}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Честная плашка о нашей слабости */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45 }}
          className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-400/10 to-transparent p-5 sm:flex-row sm:items-center"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/30">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-zinc-300">
            <strong className="text-amber-300">Наше слабое место — плотность машин.</strong> Пока
            ПРЯМО не набрал критическую массу, машина приезжает не за 5 минут. Поэтому стартуем с
            одного города, честно это говорим — и закрываем слабость экономикой водителя, а не
            рекламой.
          </p>
          <a
            href="#join"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Быть в первой волне
          </a>
        </motion.div>
      </div>
    </section>
  )
}
