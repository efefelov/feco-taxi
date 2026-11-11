'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AppWindow,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock3,
  MessageSquareQuote,
  Quote,
  Star,
  ThumbsDown,
  ThumbsUp,
  Users,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DRIVER_NEGATIVE,
  PASSENGER_NEGATIVE,
  PASSENGER_POSITIVE,
  REVIEW_META,
  REVIEW_SOURCES,
  type ReviewCategory,
} from '@/lib/pryamo/yandex-reviews'

/**
 * «Отзывы Яндекса → ДНК ПРЯМО» — секция по результатам разбора реальных
 * отзывов Яндекс Go (пассажиры) и Яндекс Про (водители) из App Store и
 * Google Play. Позитив — повторяем; негатив — устраняем архитектурой.
 */

type Audience = 'passenger' | 'driver'

const MAX_COUNT = 60

function CategoryCard({ item, index }: { item: ReviewCategory; index: number }) {
  const positive = item.kind === 'positive'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3) }}
      className={cn(
        'rounded-2xl border p-6',
        positive
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-rose-500/25 bg-rose-500/5'
      )}
    >
      {/* Шапка: тип + счётчик упоминаний */}
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold',
            positive
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-700'
          )}
        >
          {positive ? (
            <ThumbsUp className="h-3 w-3" aria-hidden />
          ) : (
            <ThumbsDown className="h-3 w-3" aria-hidden />
          )}
          {positive ? 'повторяем' : 'устраняем'}
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-xl font-black tabular-nums text-zinc-900">≈{item.count}</span>
          <span className="block text-[10px] uppercase tracking-wider text-zinc-500">отзывов</span>
        </span>
      </div>

      <h3 className="mt-3 text-base font-black leading-snug text-zinc-900">{item.title}</h3>

      {/* Полоса частоты */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div
          className={cn(
            'h-full rounded-full',
            positive ? 'bg-emerald-500' : 'bg-rose-500'
          )}
          style={{ width: `${Math.min(100, Math.round((item.count / MAX_COUNT) * 100))}%` }}
          aria-hidden
        />
      </div>

      {/* Реальная цитата */}
      <figure className="mt-4 rounded-xl border border-zinc-200 bg-zinc-950/[0.03] p-4">
        <Quote className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
        <blockquote className="mt-1.5 text-sm leading-relaxed text-zinc-700">
          «{item.quote}»
        </blockquote>
        <figcaption className="mt-2 text-[11px] font-semibold text-zinc-500">
          — {item.who}, {new Date(item.quoteDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
        </figcaption>
      </figure>

      {/* Ответ ПРЯМО */}
      <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-50 p-4">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          <ArrowRight className="h-3 w-3" aria-hidden />
          ПРЯМО отвечает
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-800">{item.pryamo}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold">
          {item.status === 'done' ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
              <span className="text-emerald-700">уже в продукте</span>
            </>
          ) : (
            <>
              <Clock3 className="h-3.5 w-3.5 text-amber-600" aria-hidden />
              <span className="text-amber-700">в дорожной карте</span>
            </>
          )}
        </p>
      </div>
    </motion.div>
  )
}

export function YandexLessons() {
  const [audience, setAudience] = useState<Audience>('passenger')

  const negatives = audience === 'passenger' ? PASSENGER_NEGATIVE : DRIVER_NEGATIVE
  const positives = audience === 'passenger' ? PASSENGER_POSITIVE : []

  return (
    <section id="reviews" className="scroll-mt-20 bg-zinc-50 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">
            <MessageSquareQuote className="h-3.5 w-3.5" aria-hidden />
            250 реальных отзывов из App Store и Google Play
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">
            Отзывы Яндекса — это спецификация ПРЯМО
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Мы разобрали {REVIEW_META.totalPassenger} свежих отзывов пассажиров «Яндекс Go» и{' '}
            {REVIEW_META.totalDriver} отзывов водителей «Яндекс Про» за {REVIEW_META.period}.
            Всё, что пассажиры хвалят — повторяем. Всё, о чём жалуются обе стороны —{' '}
            <span className="font-semibold text-zinc-900">
              устраняем не обещаниями, а устройством продукта
            </span>
            .
          </p>
        </motion.div>

        {/* Главная находка */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-10 max-w-4xl rounded-2xl border border-zinc-900/10 bg-zinc-950 p-6 sm:p-8"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
            Главная находка анализа
          </p>
          <p className="mt-3 text-xl font-black leading-snug text-white sm:text-2xl">
            «{REVIEW_META.headline}»
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{REVIEW_META.headlineNote}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <Users className="h-4 w-4 text-emerald-400" aria-hidden />
                Пассажиры (Яндекс Go)
              </p>
              <div className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-zinc-800">
                <div className="bg-emerald-500" style={{ width: `${REVIEW_META.passengerPositivePct}%` }} aria-hidden />
                <div className="bg-rose-500" style={{ width: `${REVIEW_META.passengerNegativePct}%` }} aria-hidden />
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">
                <span className="font-bold text-emerald-400">{REVIEW_META.passengerPositivePct}%</span> хвалят водителя ·{' '}
                <span className="font-bold text-rose-400">{REVIEW_META.passengerNegativePct}%</span> жалуются на платформу
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <Wallet className="h-4 w-4 text-amber-400" aria-hidden />
                Водители (Яндекс Про)
              </p>
              <div className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-zinc-800">
                <div className="bg-emerald-500" style={{ width: `${REVIEW_META.driverPositivePct}%` }} aria-hidden />
                <div className="bg-rose-500" style={{ width: `${REVIEW_META.driverNegativePct}%` }} aria-hidden />
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">
                <span className="font-bold text-rose-400">{REVIEW_META.driverNegativePct}%</span> — негатив про платформу: выплаты, комиссия, поддержка-бот
              </p>
            </div>
          </div>
        </motion.div>

        {/* Переключатель аудитории */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex rounded-xl border border-zinc-300 bg-white p-1" role="tablist" aria-label="Аудитория отзывов">
            {(
              [
                { id: 'passenger', label: 'Пассажиры · Яндекс Go', icon: Star },
                { id: 'driver', label: 'Водители · Яндекс Про', icon: AppWindow },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={audience === t.id}
                onClick={() => setAudience(t.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors',
                  audience === t.id
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:text-zinc-900'
                )}
              >
                <t.icon className="h-4 w-4" aria-hidden />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Позитив (только у пассажиров есть отдельная группа) */}
        {positives.length > 0 && (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {positives.map((item, i) => (
              <CategoryCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}

        {/* Негатив с ответами ПРЯМО */}
        <div className={cn('grid gap-5 md:grid-cols-2', positives.length > 0 ? 'mt-5' : 'mt-10')}>
          {negatives.map((item, i) => (
            <CategoryCard key={item.id} item={item} index={i} />
          ))}
        </div>

        {/* Источники */}
        <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Источники разбора</p>
          <ul className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
            {REVIEW_SOURCES.map((s) => (
              <li key={s.platform + s.packageId} className="flex items-center gap-2">
                <Ban className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden />
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-zinc-300 underline-offset-2 hover:text-emerald-700"
                >
                  {s.app} · {s.platform}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
            Выгрузка за {REVIEW_META.period}. Цитаты обезличены, смысл сохранён. Google Play не
            отдаёт отзывы в открытый API — для него использованы публичные разборы страниц отзывов;
            остальное — официальный фид App Store.
          </p>
        </div>
      </div>
    </section>
  )
}
