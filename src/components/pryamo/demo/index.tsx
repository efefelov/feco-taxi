'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, User, CarFront, Smartphone, ArrowRight } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PassengerDemo } from './passenger-demo'
import { DriverDemo } from './driver-demo'
import Link from 'next/link'

export function DemoSection() {
  const [tab, setTab] = useState('passenger')

  // Из секции тарифов пришёл выбор класса — переключаемся на пассажира
  useEffect(() => {
    const onPick = () => setTab('passenger')
    window.addEventListener('pryamo:tariff-pick', onPick)
    return () => window.removeEventListener('pryamo:tariff-pick', onPick)
  }, [])

  return (
    <section id="demo" className="scroll-mt-20 bg-zinc-950 py-20 text-zinc-100 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <Play className="h-3.5 w-3.5" />
            Живая работа движка
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Потрогайте агрегатор изнутри
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Это не макеты: работает движок симуляции на WebSocket. Заказы появляются в реальном
            времени, цены считаются по правилам ПРЯМО, спрос в зонах колеблется как вживую.
          </p>
        </motion.div>

        <div className="mt-10 flex justify-center">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <div className="flex justify-center">
              <TabsList className="grid h-auto w-full max-w-sm grid-cols-1 gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5 sm:grid-cols-2">
                <TabsTrigger
                  value="passenger"
                  className="h-10 w-full gap-2 rounded-xl px-4 text-xs font-bold text-zinc-400 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-950 sm:px-8 sm:text-sm"
                >
                  <User className="h-4 w-4" />
                  Я пассажир
                </TabsTrigger>
                <TabsTrigger
                  value="driver"
                  className="h-10 w-full gap-2 rounded-xl px-4 text-xs font-bold text-zinc-400 data-[state=active]:bg-amber-400 data-[state=active]:text-zinc-950 sm:px-8 sm:text-sm"
                >
                  <CarFront className="h-4 w-4" />
                  Я водитель
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="passenger" className="mt-8">
              <PassengerDemo />
            </TabsContent>
            <TabsContent value="driver" className="mt-8">
              <DriverDemo />
            </TabsContent>
          </Tabs>
        </div>

        {/* Мостик к MVP-приложению */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-amber-400/25 bg-gradient-to-r from-amber-400/8 via-zinc-900/60 to-zinc-900/60 px-6 py-5 sm:flex-row"
        >
          <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
            <span className="font-bold text-white">Хотите глубже?</span> Два самостоятельных
            приложения со своим онбордингом: пассажир заказывает — водитель в соседней
            вкладке берёт заказ из живой ленты.
          </p>
          <div className="flex shrink-0 gap-2">
            <Link
              href="/passenger"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-400/20 transition-colors hover:bg-amber-300"
            >
              <Smartphone className="h-4.5 w-4.5" aria-hidden />
              Пассажир
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/driver"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 py-3 text-sm font-bold text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Водитель
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
