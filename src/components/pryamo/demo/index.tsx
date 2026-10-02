'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, User, CarFront } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PassengerDemo } from './passenger-demo'
import { DriverDemo } from './driver-demo'

export function DemoSection() {
  const [tab, setTab] = useState('passenger')

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
              <TabsList className="h-13 rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5">
                <TabsTrigger
                  value="passenger"
                  className="h-10 gap-2 rounded-xl px-5 text-sm font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-950 sm:px-8"
                >
                  <User className="h-4 w-4" />
                  Я пассажир
                </TabsTrigger>
                <TabsTrigger
                  value="driver"
                  className="h-10 gap-2 rounded-xl px-5 text-sm font-bold data-[state=active]:bg-amber-400 data-[state=active]:text-zinc-950 sm:px-8"
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
      </div>
    </section>
  )
}
