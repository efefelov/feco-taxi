'use client'

import { Navbar } from '@/components/pryamo/navbar'
import { Hero } from '@/components/pryamo/hero'
import { MarketSection } from '@/components/pryamo/market'
import { PainPoints } from '@/components/pryamo/pain-points'
import { Comparison } from '@/components/pryamo/comparison'
import { Competitors } from '@/components/pryamo/competitors'
import { TariffsSection } from '@/components/pryamo/tariffs'
import { MoneyFlow } from '@/components/pryamo/money-flow'
import { Testimonials } from '@/components/pryamo/testimonials'
import { DemoSection } from '@/components/pryamo/demo'
import { AuctionSection } from '@/components/pryamo/auction'
import { ShiftEconomics } from '@/components/pryamo/shift-economics'
import { IncomeCalculator } from '@/components/pryamo/calculator'
import { Monetization } from '@/components/pryamo/monetization'
import { Fleets } from '@/components/pryamo/fleets'
import { Compliance } from '@/components/pryamo/compliance'
import { RatingSection } from '@/components/pryamo/rating'
import { Gamification } from '@/components/pryamo/gamification'
import { Engineering } from '@/components/pryamo/engineering'
import { TechSection } from '@/components/pryamo/tech'
import { Apps } from '@/components/pryamo/apps'
import { Investors } from '@/components/pryamo/investors'
import { Roadmap } from '@/components/pryamo/roadmap'
import { Faq } from '@/components/pryamo/faq'
import { Waitlist } from '@/components/pryamo/waitlist'
import { Footer } from '@/components/pryamo/footer'
import { OnboardingWizard } from '@/components/pryamo/onboarding'
import { ScrollProgress } from '@/components/pryamo/scroll-progress'
import { MvpApp } from '@/components/pryamo/mvp'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <MarketSection />
        <PainPoints />
        <Comparison />
        <Competitors />
        <TariffsSection />
        <MoneyFlow />
        <Testimonials />
        <DemoSection />
        <AuctionSection />
        <ShiftEconomics />
        <IncomeCalculator />
        <Monetization />
        <Fleets />
        <Compliance />
        <RatingSection />
        <Gamification />
        <Engineering />
        <TechSection />
        <Apps />
        <Investors />
        <Roadmap />
        <Waitlist />
        <Faq />
      </main>
      <Footer />
      <OnboardingWizard />
      <ScrollProgress />
      <MvpApp />
    </div>
  )
}
