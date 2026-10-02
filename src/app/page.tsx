'use client'

import { Navbar } from '@/components/pryamo/navbar'
import { Hero } from '@/components/pryamo/hero'
import { MarketSection } from '@/components/pryamo/market'
import { PainPoints } from '@/components/pryamo/pain-points'
import { Comparison } from '@/components/pryamo/comparison'
import { TariffsSection } from '@/components/pryamo/tariffs'
import { MoneyFlow } from '@/components/pryamo/money-flow'
import { Testimonials } from '@/components/pryamo/testimonials'
import { DemoSection } from '@/components/pryamo/demo'
import { AuctionSection } from '@/components/pryamo/auction'
import { IncomeCalculator } from '@/components/pryamo/calculator'
import { Monetization } from '@/components/pryamo/monetization'
import { RatingSection } from '@/components/pryamo/rating'
import { Roadmap } from '@/components/pryamo/roadmap'
import { Faq } from '@/components/pryamo/faq'
import { Waitlist } from '@/components/pryamo/waitlist'
import { Footer } from '@/components/pryamo/footer'
import { OnboardingWizard } from '@/components/pryamo/onboarding'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <MarketSection />
        <PainPoints />
        <Comparison />
        <TariffsSection />
        <MoneyFlow />
        <Testimonials />
        <DemoSection />
        <AuctionSection />
        <IncomeCalculator />
        <Monetization />
        <RatingSection />
        <Roadmap />
        <Waitlist />
        <Faq />
      </main>
      <Footer />
      <OnboardingWizard />
    </div>
  )
}
