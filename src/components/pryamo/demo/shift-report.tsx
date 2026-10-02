'use client'

import { useMemo, useState } from 'react'
import {
  Banknote,
  Check,
  Clock,
  Copy,
  Package,
  ReceiptText,
  Route,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { EarningsToday, RideDTO } from '@/lib/pryamo/types'
import type { FeedHistoryEntry } from '@/lib/pryamo/socket'
import { rub, plural } from '@/lib/pryamo/format'
import { shareText } from '@/lib/pryamo/clipboard'

interface ShiftReportProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  earnings: EarningsToday
  lastRides: RideDTO[]
  history: FeedHistoryEntry[]
  /** Закрыть отчёт и увести в лист ожидания */
  onJoin: () => void
}

/** Мини-карточка метрики отчёта */
function Metric({
  icon: Icon,
  label,
  value,
  valueCls = 'text-white',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  valueCls?: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
      <Icon className="h-4 w-4 text-emerald-400" aria-hidden />
      <p className={`mt-1.5 text-lg font-black tabular-nums leading-tight ${valueCls}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
    </div>
  )
}

/**
 * Отчёт по смене водителя: сводка демо-смены с честной математикой —
 * выплата, комиссия 8%, сравнение с монополистом и судьба заказов из журнала.
 */
export function ShiftReport({ open, onOpenChange, earnings, lastRides, history, onJoin }: ShiftReportProps) {
  const [shareState, setShareState] = useState<'idle' | 'ok' | 'fail'>('idle')

  const reportTime = useMemo(
    () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    // время формирования фиксируется в момент открытия отчёта
    [open]
  )

  const stats = useMemo(() => {
    const rides = Math.max(0, earnings.rides)
    const hours = Math.max(0.1, earnings.hoursOnline)
    const yandexTake = Math.round(earnings.gross * 0.4)
    const bestRide = lastRides.reduce<RideDTO | null>(
      (best, r) => (best === null || r.driverPayout > best.driverPayout ? r : best),
      null
    )
    return {
      avgPayout: rides > 0 ? earnings.payout / rides : 0,
      hourly: earnings.payout / hours,
      yandexTake,
      diff: yandexTake - earnings.commission,
      bestRide,
      journal: {
        mine: history.filter((h) => h.status === 'mine').length,
        skipped: history.filter((h) => h.status === 'skipped').length,
        lost: history.filter((h) => h.status === 'lost').length,
        expired: history.filter((h) => h.status === 'expired').length,
      },
    }
  }, [earnings, lastRides, history])

  /** Текстовый отчёт для шаринга: без эмодзи, читается в любом мессенджере */
  const shareReport = async () => {
    const lines = [
      'Отчёт по смене — ПРЯМО (живое демо)',
      `Выплата на руки: ${rub(earnings.payout)}`,
      `Оборот ${rub(earnings.gross)} · комиссия 8%: ${rub(earnings.commission)}`,
      `Поездок: ${earnings.rides} · часов онлайн: ${earnings.hoursOnline.toFixed(1).replace('.', ',')} · в час: ${rub(stats.hourly)}`,
      `Та же смена у монополиста: комиссия ~40% = ${rub(stats.yandexTake)}`,
      `Разница в вашу пользу: +${rub(stats.diff)}`,
      'Штрафов за смену: 0 ₽. Отказы не влияли на приоритет.',
      'ПРЯМО — комиссия 8% вместо 24–37%. pryamo.taxi',
    ]
    const res = await shareText(lines.join('\n'))
    setShareState(res === 'failed' ? 'fail' : 'ok')
    window.setTimeout(() => setShareState('idle'), 2500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto border-zinc-800 bg-zinc-900 text-zinc-100 sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
            <ReceiptText className="h-5 w-5 text-emerald-400" />
            Отчёт по смене
            <span className="ml-auto text-xs font-medium tabular-nums text-zinc-500">
              в {reportTime}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Сводка демо-смены. Цифры в реальном времени считает движок симуляции — по правилам
            ПРЯМО, без пересчётов задним числом.
          </DialogDescription>
        </DialogHeader>

        {/* Главная цифра */}
        <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/12 via-zinc-900 to-zinc-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Выплата на руки
          </p>
          <p className="mt-1 text-4xl font-black tabular-nums text-emerald-400">
            {rub(earnings.payout)}
          </p>
          <p className="mt-1.5 text-xs text-zinc-500">
            из оборота {rub(earnings.gross)} · комиссия платформы {rub(earnings.commission)} (8%){' '}
            — и больше ни одной строчки удержаний
          </p>
        </div>

        {/* Метрики */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Metric icon={Package} label="поездок" value={String(earnings.rides)} />
          <Metric icon={Clock} label="часов онлайн" value={earnings.hoursOnline.toFixed(1).replace('.', ',')} />
          <Metric
            icon={Banknote}
            label="средняя выплата"
            value={rub(stats.avgPayout)}
          />
          <Metric
            icon={TrendingUp}
            label="в час"
            value={rub(stats.hourly)}
          />
        </div>

        {/* Сравнение с монополистом */}
        <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-300">
            Та же смена у монополиста
          </p>
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-400">забрал бы агрегатор (эффективно ~40%)</span>
              <span className="font-black tabular-nums text-rose-300">{rub(stats.yandexTake)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-400">забрали мы (8%, в чеке)</span>
              <span className="font-black tabular-nums text-emerald-300">
                {rub(earnings.commission)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-rose-500/15 pt-2 text-sm">
              <span className="font-semibold text-zinc-300">разница — в вашу пользу</span>
              <span className="text-base font-black tabular-nums text-emerald-300">
                +{rub(stats.diff)}
              </span>
            </div>
          </div>
        </div>

        {/* Журнал судьбы заказов */}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Судьба заказов смены
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
              <p className="text-base font-black tabular-nums text-emerald-300">
                {stats.journal.mine}
              </p>
              <p className="text-[10px] uppercase text-zinc-500">взяли вы</p>
            </div>
            <div className="rounded-lg bg-amber-400/10 p-2 text-center">
              <p className="text-base font-black tabular-nums text-amber-300">
                {stats.journal.skipped}
              </p>
              <p className="text-[10px] uppercase text-zinc-500">мимо</p>
            </div>
            <div className="rounded-lg bg-zinc-800/60 p-2 text-center">
              <p className="text-base font-black tabular-nums text-zinc-300">
                {stats.journal.lost}
              </p>
              <p className="text-[10px] uppercase text-zinc-500">у других</p>
            </div>
            <div className="rounded-lg bg-zinc-800/60 p-2 text-center">
              <p className="text-base font-black tabular-nums text-zinc-500">
                {stats.journal.expired}
              </p>
              <p className="text-[10px] uppercase text-zinc-500">истекли</p>
            </div>
          </div>
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
            Отказы и «мимо» не влияли на приоритет. Штрафов за смену: 0 ₽.
          </p>
        </div>

        {/* Лучшая поездка */}
        {stats.bestRide && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                <Route className="h-3 w-3" aria-hidden /> лучшая поездка смены
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-400">
                {stats.bestRide.from?.label} → {stats.bestRide.to?.label}
              </p>
            </div>
            <p className="shrink-0 text-base font-black tabular-nums text-amber-300">
              +{rub(stats.bestRide.driverPayout)}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-5 flex flex-col gap-2.5 border-t border-zinc-800 pt-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-xs leading-relaxed text-zinc-500">
            Такой отчёт — в приложении после каждой смены: без «опций», волатильности комиссии
            и сюрпризов. {earnings.rides > 0 ? `${earnings.rides} ${plural(earnings.rides, 'поездка', 'поездки', 'поездок')} уже посчитаны честно.` : ''}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button
              onClick={shareReport}
              variant="outline"
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              {shareState === 'ok' ? (
                <>
                  <Check className="mr-1 h-4 w-4 text-emerald-400" aria-hidden />
                  Скопировано
                </>
              ) : shareState === 'fail' ? (
                'Не вышло'
              ) : (
                <>
                  <Copy className="mr-1 h-4 w-4" aria-hidden />
                  Скопировать отчёт
                </>
              )}
            </Button>
            <Button
              onClick={onJoin}
              className="bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
            >
              Занять место в первой волне
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
