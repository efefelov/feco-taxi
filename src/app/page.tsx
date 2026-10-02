'use client'

import { Navbar } from '@/components/pryamo/navbar'
import { Hero } from '@/components/pryamo/hero'
import { MarketSection } from '@/components/pryamo/market'
import { PainPoints } from '@/components/pryamo/pain-points'
import { Comparison } from '@/components/pryamo/comparison'
import { DemoSection } from '@/components/pryamo/demo'
import { IncomeCalculator } from '@/components/pryamo/calculator'
import { Monetization } from '@/components/pryamo/monetization'
import { RatingSection } from '@/components/pryamo/rating'
import { Roadmap } from '@/components/pryamo/roadmap'
import { Faq } from '@/components/pryamo/faq'
import { Footer } from '@/components/pryamo/footer'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <MarketSection />
        <PainPoints />
        <Comparison />
        <DemoSection />
        <IncomeCalculator />
        <Monetization />
        <RatingSection />
        <Roadmap />
        <Faq />
      </main>
      <Footer />
    </div>
  )
}
