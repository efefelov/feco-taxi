'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Menu,
  X,
  ArrowRight,
  Radio,
  ChevronDown,
  Gavel,
  Star,
  Navigation,
  Building2,
  Banknote,
  Receipt,
  Swords,
  Smartphone,
  Trophy,
  Scale,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useEngineStatus } from '@/lib/pryamo/socket'

/** Прямые ссылки верхнего уровня */
const NAV = [
  { href: '#problem', label: 'Проблема' },
  { href: '#compare', label: 'Сравнение' },
  { href: '#demo', label: 'Живое демо' },
  { href: '#shift', label: 'Смена' },
  { href: '#calc', label: 'Калькулятор' },
  { href: '#money', label: 'Монетизация' },
  { href: '#roadmap', label: 'План' },
]

/** Выпадающее меню «Все разделы»: группы по смыслу */
const PRODUCT_GROUPS: {
  title: string
  links: { href: string; label: string; desc: string; icon: typeof Gavel }[]
}[] = [
  {
    title: 'Экономика',
    links: [
      { href: '#tariffs', label: 'Тарифы', desc: 'формула — в оферте', icon: Banknote },
      { href: '#flow', label: 'Чек', desc: 'куда уходит каждая копейка', icon: Receipt },
      { href: '#rivals', label: 'Конкуренты', desc: 'весь рынок на одной таблице', icon: Swords },
    ],
  },
  {
    title: 'Продукт',
    links: [
      { href: '#fair', label: 'Аукцион', desc: 'лента без приоритетов', icon: Gavel },
      { href: '#rating', label: 'Рейтинг 2.0', desc: 'медиана вместо среднего', icon: Star },
      { href: '#tech', label: 'Технологии', desc: 'навигатор и GPS без клетки', icon: Navigation },
      { href: '#apps', label: 'Приложения', desc: 'iOS, Android, RuStore, PWA', icon: Smartphone },
      { href: '#game', label: 'Игра', desc: 'лиги, квесты и колесо', icon: Trophy },
    ],
  },
  {
    title: 'Проект',
    links: [
      { href: '#fleets', label: 'Таксопаркам', desc: 'B2B-подключение', icon: Building2 },
      { href: '#law', label: 'Закон и отбор', desc: 'ФГИС, медосмотры, путёвки', icon: Scale },
      { href: '#founders', label: 'Инвесторам', desc: 'ТРИЗ, ТОС и unit-экономика', icon: TrendingUp },
    ],
  },
]

const PRODUCT_LINKS = PRODUCT_GROUPS.flatMap((g) => g.links)
const PRODUCT_IDS = PRODUCT_LINKS.map((l) => l.href.slice(1))

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string>('')
  const activeRef = useRef('')
  const { connected, fresh } = useEngineStatus()
  // Три честных состояния: онлайн / сокет жив, но данных нет / переподключение
  const engineOnline = connected && fresh
  const engineLabel = engineOnline
    ? 'движок демо: онлайн'
    : connected
      ? 'движок: нет данных'
      : 'движок: переподключение…'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll-spy: подсветка активной секции (прямые + ссылки из «Все разделы»)
  useEffect(() => {
    const ids = [...NAV, ...PRODUCT_LINKS].map((n) => n.href.slice(1))
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (activeRef.current !== e.target.id) {
              activeRef.current = e.target.id
              setActive(e.target.id)
            }
          }
        }
      },
      // Полоса на 35–45% высоты экрана: активна секция, пересекающая её.
      // Работает для любых высот секций (демо — более 2000px).
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  const productActive = PRODUCT_IDS.includes(active)

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 shadow-lg shadow-black/20'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 group">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/30 transition-transform group-hover:scale-105">
              <Zap className="h-5 w-5" strokeWidth={2.6} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-lg font-black tracking-tight text-white">ПРЯМО</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-400">
                такси-агрегатор
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Основная навигация">
            {NAV.slice(0, 2).map((n) => {
              const isActive = active === n.href.slice(1)
              return (
                <a
                  key={n.href}
                  href={n.href}
                  className={cn(
                    'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-emerald-300'
                      : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                  )}
                >
                  {n.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-emerald-400"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </a>
              )
            })}

            {/* Выпадающее меню «Все разделы» */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/60',
                  productActive
                    ? 'text-emerald-300'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white',
                  'data-[state=open]:bg-zinc-800/60 data-[state=open]:text-white'
                )}
                aria-label="Все разделы сайта"
              >
                Все разделы
                <ChevronDown
                  className="h-3.5 w-3.5 transition-transform duration-200 data-[state=open]:rotate-180"
                  aria-hidden
                />
                {productActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-emerald-400"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={10}
                className="w-72 border-zinc-800 bg-zinc-900/95 p-1.5 shadow-xl shadow-black/40 backdrop-blur-xl"
              >
                {PRODUCT_GROUPS.map((group, gi) => (
                  <div key={group.title}>
                    {gi > 0 && <DropdownMenuSeparator className="my-1.5 bg-zinc-800" />}
                    <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      {group.title}
                    </DropdownMenuLabel>
                    {group.links.map((l) => {
                      const isActive = active === l.href.slice(1)
                      return (
                        <DropdownMenuItem
                          key={l.href}
                          asChild
                          className={cn(
                            'cursor-pointer gap-3 rounded-lg px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'text-zinc-300 focus-visible:bg-zinc-800 data-[highlighted]:bg-zinc-800'
                          )}
                        >
                          <a href={l.href}>
                            <span
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                isActive
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-zinc-800 text-zinc-400'
                              )}
                            >
                              <l.icon className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold leading-tight">
                                {l.label}
                              </span>
                              <span className="block text-[11px] leading-tight text-zinc-500">
                                {l.desc}
                              </span>
                            </span>
                          </a>
                        </DropdownMenuItem>
                      )
                    })}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {NAV.slice(2).map((n) => {
              const isActive = active === n.href.slice(1)
              return (
                <a
                  key={n.href}
                  href={n.href}
                  className={cn(
                    'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-emerald-300'
                      : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                  )}
                >
                  {n.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-emerald-400"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </a>
              )
            })}
          </nav>

          <div className="hidden items-center gap-3 xl:flex">
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                engineOnline
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
              )}
              role="status"
              aria-live="polite"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full rounded-full opacity-60',
                    engineOnline ? 'animate-ping bg-emerald-400' : 'animate-pulse bg-amber-400'
                  )}
                />
                <span
                  className={cn(
                    'relative inline-flex h-1.5 w-1.5 rounded-full',
                    engineOnline ? 'bg-emerald-400' : 'bg-amber-400'
                  )}
                />
              </span>
              {engineLabel}
            </span>
            <Button
              asChild
              className="bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-500/25"
            >
              <a href="#join">
                Стать основателем
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>

          <button
            className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800 xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl xl:hidden"
            aria-label="Мобильная навигация"
          >
            <div className="space-y-1 px-4 py-4">
              <span
                className={cn(
                  'mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
                  engineOnline ? 'text-emerald-300' : 'text-amber-300'
                )}
                role="status"
                aria-live="polite"
              >
                <Radio
                  className={cn('h-3.5 w-3.5', engineOnline ? 'animate-pulse text-emerald-400' : 'text-amber-400')}
                />
                {engineLabel}
              </span>
              {NAV.slice(0, 2).map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-zinc-200 hover:bg-zinc-800/60"
                >
                  {n.label}
                </a>
              ))}
              {PRODUCT_GROUPS.map((group) => (
                <div key={`m-${group.title}`}>
                  <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                    {group.title}
                  </p>
                  {group.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                    >
                      <l.icon className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                      <span className="shrink-0">{l.label}</span>
                      <span className="ml-auto max-w-[52%] truncate text-right text-[11px] text-zinc-600">
                        {l.desc}
                      </span>
                    </a>
                  ))}
                </div>
              ))}
              <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                Далее
              </p>
              {NAV.slice(2).map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-zinc-200 hover:bg-zinc-800/60"
                >
                  {n.label}
                </a>
              ))}
              <a
                href="#join"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-base font-bold text-zinc-950"
              >
                Стать основателем
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
