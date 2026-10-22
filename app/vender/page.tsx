import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WhatsAppStickyButton } from "@/components/whatsapp-sticky-button"
import { FormVender } from "@/components/forms/form-vender"
import { TrustSignals } from "@/components/trust-signals"

export const metadata = {
  title: "Quiero vender mi auto — Falkenberg Meyer Automotores",
  description:
    "Te cotizamos tu auto en 24-48hs. Cotización sujeta a inspección física.",
}

export default function VenderPage() {
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
            Vendé tu auto.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
            Te cotizamos en 24-48hs. Cotización sujeta a inspección física.
          </p>
        </header>

        <div className="mt-6">
          <FormVender />
        </div>
      </section>

      <TrustSignals />
      <Footer />
      <WhatsAppStickyButton />
    </main>
  )
}
