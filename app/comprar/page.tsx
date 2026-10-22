import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WhatsAppStickyButton } from "@/components/whatsapp-sticky-button"
import { FormComprar } from "@/components/forms/form-comprar"
import { TrustSignals } from "@/components/trust-signals"

export const metadata = {
  title: "Quiero comprar un auto — Falkenberg Meyer Automotores",
  description:
    "Contanos qué auto buscás. Te respondemos por WhatsApp en 24-48hs. Sin compromiso.",
}

export default function ComprarPage() {
  return (
    <main className="min-h-dvh bg-background">
      <Header />

      <section className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>

        <header className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            ¿Qué auto querés?
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
            Llenalo en 2 minutos. Te respondemos en 24-48hs por WhatsApp.
          </p>
        </header>

        <div className="mt-6">
          <FormComprar />
        </div>
      </section>

      <TrustSignals />
      <Footer />
      <WhatsAppStickyButton />
    </main>
  )
}
