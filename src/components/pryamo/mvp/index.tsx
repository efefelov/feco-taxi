'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Smartphone, User, CarFront, X, Zap, ArrowRight, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEngineStatus } from '@/lib/pryamo/socket'
import { useMvpLocalMode } from '@/lib/pryamo/mvp-local'
import { PassengerApp } from './passenger-app'
import { DriverApp } from './driver-app'

/**
 * «ПРЯМО MVP» — полноэкранный прототип приложений пассажира и водителя.
 *
 * Открывается событием window 'pryamo:open-app' (detail.role: 'passenger' | 'driver')
 * из навигации, hero и секции демо. Обе роли живут одновременно: заказ из
 * пассажирского приложения реально попадает в ленту водительского (mvp:book),
 * принятие связывает поездки обоих через общий ride:state движка.
 */

type Role = 'passenger' | 'driver'

export function MvpApp() {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<Role>('passenger')
  const { connected, fresh } = useEngineStatus()
  const engineOnline = connected && fresh
  const localMode = useMvpLocalMode()
  // На статик-проде движка нет — работает локальный мини-движок в браузере
  const liveLabel = engineOnline ? 'прототип · движок live' : 'прототип · демо в браузере'
  const statusLabel = engineOnline
    ? 'движок демо: онлайн, заказы и спрос живые'
    : localMode
      ? 'локальный движок — демо прямо в браузере, поездка пройдёт целиком'
      : 'движок переподключается…'

  const openApp = useCallback((r: Role) => {
    setRole(r)
    setOpen(true)
  }, [])

  useEffect(() => {
    const onOpen = (e: Event) => {
      const r = (e as CustomEvent<{ role?: Role }>).detail?.role
      openApp(r === 'driver' ? 'driver' : 'passenger')
    }
    window.addEventListener('pryamo:open-app', onOpen)
    return () => window.removeEventListener('pryamo:open-app', onOpen)
  }, [openApp])

  // Блокировка прокрутки страницы под оверлеем + закрытие по Esc
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mvp-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70] bg-zinc-950/98 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label="ПРЯМО MVP — прототип приложений пассажира и водителя"
        >
          {/* Фоновая подсветка */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-500/8 to-transparent"
            aria-hidden
          />

          <div className="relative flex h-full items-center justify-center gap-10 p-0 lg:p-8">
            {/* ===== Боковая панель (только десктоп) ===== */}
            <aside className="hidden max-w-xs flex-col lg:flex">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/25">
                  <Zap className="h-5.5 w-5.5" strokeWidth={2.6} />
                </span>
                <div className="leading-none">
                  <p className="text-xl font-black tracking-tight text-white">ПРЯМО MVP</p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-400">
                    {liveLabel}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-zinc-400">
                Оба приложения подключены к одному движку. Закажите поездку пассажиром — и
                примите свой же заказ в ленте водителя: смена ролей живая, без перезагрузки.
              </p>

              {/* Роли */}
              <div className="mt-6 space-y-2.5">
                <RoleButton
                  active={role === 'passenger'}
                  onClick={() => setRole('passenger')}
                  icon={User}
                  tone="emerald"
                  title="Приложение пассажира"
                  desc="заказ за фикс-цену, live-статус, чек и рейтинг по осям"
                />
                <RoleButton
                  active={role === 'driver'}
                  onClick={() => setRole('driver')}
                  icon={CarFront}
                  tone="amber"
                  title="Приложение водителя"
                  desc="смена, аукционная лента, заработок и Pro"
                />
              </div>

              {/* Состояние движка */}
              <div
                className={cn(
                  'mt-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold',
                  engineOnline
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                )}
                role="status"
              >
                <Radio
                  className={cn(
                    'h-4 w-4 shrink-0',
                    engineOnline ? 'animate-pulse text-emerald-400' : 'text-amber-400'
                  )}
                  aria-hidden
                />
                {statusLabel}
              </div>

              <div className="mt-6 space-y-2 text-[11px] leading-relaxed text-zinc-600">
                <p className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/70" aria-hidden />
                  Пассажир заказывает — заказ появляется в ленте водителя через WebSocket
                </p>
                <p className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/70" aria-hidden />
                  Водитель берёт заказ — статусы едут синхронно в оба приложения
                </p>
                <p className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/70" aria-hidden />
                  Водитель жмёт «Пассажир сел» и «Завершить» — пассажир видит это мгновенно
                </p>
              </div>
            </aside>

            {/* ===== Телефон ===== */}
            <div className="relative flex h-full w-full flex-col lg:h-auto lg:w-[420px] lg:shrink-0">
              {/* Кнопка закрытия */}
              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-zinc-300 backdrop-blur transition-colors hover:border-zinc-500 hover:text-white lg:-right-5 lg:-top-5 lg:border-zinc-700 lg:bg-zinc-900"
                aria-label="Закрыть приложение и вернуться на страницу"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Переключатель ролей — мобильный верх / десктоп скрывает (роль в сайдбаре) */}
              <div className="flex items-center justify-center gap-1.5 border-b border-zinc-800/70 bg-zinc-950 px-4 py-2.5 lg:hidden">
                <RoleChip active={role === 'passenger'} onClick={() => setRole('passenger')} icon={User} tone="emerald" label="Пассажир" />
                <RoleChip active={role === 'driver'} onClick={() => setRole('driver')} icon={CarFront} tone="amber" label="Водитель" />
              </div>

              {/* Рамка телефона на десктопе */}
              <div className="min-h-0 flex-1 overflow-hidden bg-zinc-950 lg:flex lg:h-[min(880px,88vh)] lg:items-center lg:justify-center lg:rounded-[2.2rem] lg:border-[10px] lg:border-zinc-800 lg:shadow-2xl lg:shadow-black/60 lg:ring-1 lg:ring-zinc-700">
                <div className="relative h-full min-h-0 w-full lg:h-full lg:w-[400px]">
                  {/* Оба приложения живут одновременно: сокеты не рвутся при смене роли */}
                  <div className={cn('h-full min-h-0', role !== 'passenger' && 'hidden')}>
                    <PassengerApp onOpenDriver={() => setRole('driver')} />
                  </div>
                  <div className={cn('h-full min-h-0', role !== 'driver' && 'hidden')}>
                    <DriverApp onOpenPassenger={() => setRole('passenger')} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Открыть MVP-приложение из любого места страницы */
export function openMvpApp(role: Role = 'passenger') {
  window.dispatchEvent(new CustomEvent('pryamo:open-app', { detail: { role } }))
}

function RoleChip({
  active,
  onClick,
  icon: Icon,
  tone,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof User
  tone: 'emerald' | 'amber'
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-bold transition-all',
        active
          ? tone === 'emerald'
            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
            : 'border-amber-400 bg-amber-400/15 text-amber-300'
          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
      )}
      aria-pressed={active}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </button>
  )
}

function RoleButton({
  active,
  onClick,
  icon: Icon,
  tone,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: typeof User
  tone: 'emerald' | 'amber'
  title: string
  desc: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all',
        active
          ? tone === 'emerald'
            ? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
            : 'border-amber-400/60 bg-amber-400/10 shadow-lg shadow-amber-400/10'
          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
      )}
      aria-pressed={active}
    >
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1',
          active
            ? tone === 'emerald'
              ? 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/40'
              : 'bg-amber-400/20 text-amber-400 ring-amber-400/40'
            : 'bg-zinc-800 text-zinc-400 ring-zinc-700'
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-black text-white">
          {title}
          {active && (
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                tone === 'emerald' ? 'animate-pulse bg-emerald-400' : 'animate-pulse bg-amber-400'
              )}
              aria-hidden
            />
          )}
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">{desc}</span>
      </span>
    </button>
  )
}

/** Кнопка-триггер для секций лендинга: «Открыть приложение» */
export function MvpTriggerButton({
  role = 'passenger',
  className,
  label = 'Открыть MVP-приложение',
  icon: Icon = Smartphone,
}: {
  role?: Role
  className?: string
  label?: string
  icon?: typeof Smartphone
}) {
  return (
    <button
      onClick={() => openMvpApp(role)}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40',
        className
      )}
    >
      <Icon className="h-4.5 w-4.5" aria-hidden />
      {label}
    </button>
  )
}
