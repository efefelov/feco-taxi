'use client'

import { useEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

const defaultFmt = (v: number) => Math.round(v).toLocaleString('ru-RU')

interface CountUpProps {
  /** Целевое значение */
  value: number
  /**
   * Форматирование. Передавайте стабильную ссылку (модульную константу),
   * чтобы перерисовки родителя не перезапускали анимацию.
   */
  format?: (v: number) => string
  /** Длительность анимации, сек */
  duration?: number
  className?: string
  /** Подпись для скринридеров: итоговое значение без анимации */
  srLabel?: string
}

/**
 * Число, «накручивающееся» от предыдущего значения к новому при появлении
 * в вьюпорте (once) и при каждом изменении value — например, после отправки
 * заявки в листе ожидания. Уважает prefers-reduced-motion.
 */
export function CountUp({
  value,
  format,
  duration = 1.1,
  className,
  srLabel,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })
  const reduced = useReducedMotion()
  const prevRef = useRef(0)
  const fmt = format ?? defaultFmt

  useEffect(() => {
    const node = ref.current
    if (!node || !inView) return
    if (reduced) {
      node.textContent = fmt(value)
      prevRef.current = value
      return
    }
    const from = prevRef.current
    if (from === value) {
      node.textContent = fmt(value)
      return
    }
    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = fmt(v)
      },
      onComplete: () => {
        node.textContent = fmt(value)
      },
    })
    prevRef.current = value
    return () => controls.stop()
  }, [inView, value, duration, reduced, fmt])

  return (
    <span className={cn('tabular-nums', className)}>
      <span ref={ref} aria-hidden="true">
        {fmt(0)}
      </span>
      <span className="sr-only">{srLabel ?? fmt(value)}</span>
    </span>
  )
}
