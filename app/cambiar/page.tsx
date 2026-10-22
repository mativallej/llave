import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WhatsAppStickyButton } from "@/components/whatsapp-sticky-button"
import { FormCambiar } from "@/components/forms/form-cambiar"
import { TrustSignals } from "@/components/trust-signals"

export const metadata = {
  title: "Quiero cambiar mi auto — Falkenberg Meyer Automotores",
  description:
    "Permuta + saldo. Recibí cotización de tu auto + 2-3 opciones de upgrade en 24-48hs.",
}

export default function CambiarPage() {
  return (
    <main className="min-h-dvh bg-background">
      <Header />

      <section className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>

        <header className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Cambiá tu auto.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
            Tu auto + saldo en cuotas. La opción más elegida en Rafaela.
          </p>
        </header>

        <div className="mt-6">
          <FormCambiar />
        </div>
      </section>

      <TrustSignals />
      <Footer />
      <WhatsAppStickyButton />
    </main>
  )
}
