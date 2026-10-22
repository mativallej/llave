import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WhatsAppStickyButton } from "@/components/whatsapp-sticky-button"
import { WhatsAppPreview } from "@/components/whatsapp-preview"
import { tenant } from "@/lib/mock-data"

export const metadata = {
  title: "Listo, recibimos tu pedido — Falkenberg Meyer Automotores",
  description:
    "Tu pedido ya está en manos del equipo. En 24-48hs te llega la propuesta por WhatsApp.",
}

type Intent = "comprar" | "vender" | "cambiar"

const subByIntent: Record<Intent, string> = {
  comprar: `En 24-48hs ${tenant.salesperson.name} te escribe por WhatsApp con propuestas que matchean tu pedido.`,
  vender: `En 24-48hs ${tenant.salesperson.name} te escribe por WhatsApp con tu cotización.`,
  cambiar: `En 24-48hs ${tenant.salesperson.name} te escribe con cotización + 2-3 opciones de upgrade.`,
}

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>
}) {
  const sp = await searchParams
  const raw = sp?.intent
  const intent: Intent =
    raw === "vender" || raw === "cambiar" ? raw : "comprar"

  return (
    <main className="min-h-dvh bg-background">
      <Header />

      <section className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-16">
        <div className="flex flex-col items-center text-center">
          <span
            className="grid h-16 w-16 place-items-center rounded-full bg-[color:var(--brand-whatsapp)]/10 text-[color:var(--brand-whatsapp)] md:h-20 md:w-20"
            aria-hidden="true"
          >
            <CheckCircle2 className="h-9 w-9 md:h-11 md:w-11" />
          </span>

          <h1 className="mt-5 text-2xl font-bold tracking-tight md:text-3xl">
            Listo, recibimos tu pedido.
          </h1>
          <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            {subByIntent[intent]}
          </p>
        </div>

        <div className="mt-10">
          <WhatsAppPreview />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Así te va a llegar tu propuesta. Tené el WhatsApp a mano.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al inicio
          </Link>
        </div>
      </section>

      <Footer />
      <WhatsAppStickyButton />
    </main>
  )
}
