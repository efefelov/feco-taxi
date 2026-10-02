'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

/**
 * Тонкая полоса прогресса чтения (emerald -> amber) + кнопка «наверх»,
 * которая появляется после первых экранов. Оба элемента декоративно-навигационные,
 * уважают prefers-reduced-motion.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    let raf = 0
    const sync = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      setProgress(max > 0 ? Math.min(1, doc.scrollTop / max) : 0)
      setVisible(doc.scrollTop > 1600)
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(sync)
    }
    // Первичная синхронизация — асинхронно, на случай восстановления позиции скролла
    raf = requestAnimationFrame(sync)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
        <div
          className="h-full origin-left bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400"
          style={{
            transform: `scaleX(${progress})`,
            transition: reduce ? 'none' : 'transform 90ms linear',
          }}
        />
      </div>

      <AnimatePresence>
        {visible && (
          <motion.button
            key="back-to-top"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })}
            aria-label="Наверх, к началу страницы"
            className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-zinc-300 shadow-lg shadow-black/30 backdrop-blur transition-colors hover:border-emerald-500/50 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
          >
            <ArrowUp className="h-5 w-5" aria-hidden />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
