import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { IntentCards } from "@/components/intent-cards"
import { TrustSignals } from "@/components/trust-signals"
import { WhatWeDo } from "@/components/what-we-do"
import { HowItWorks } from "@/components/how-it-works"
import { DeliveriesPreview } from "@/components/deliveries-preview"
import { Footer } from "@/components/footer"
import { WhatsAppStickyButton } from "@/components/whatsapp-sticky-button"

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background">
      <Header />
      <Hero />
      <IntentCards />
      <TrustSignals />
      <WhatWeDo />
      <HowItWorks />
      <DeliveriesPreview />
      <Footer />
      <WhatsAppStickyButton />
    </main>
  )
}
