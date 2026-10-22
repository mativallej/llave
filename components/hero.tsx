import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { tenant } from "@/lib/mock-data"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2 md:items-center md:gap-12 md:px-6 md:py-20">
        {/* Left: copy + CTAs */}
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            {tenant.shortName} · {tenant.city}
          </span>

          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Decinos qué necesitás y te lo conseguimos.
          </h1>

          <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Comprá, vendé o cambiá tu auto. Por WhatsApp. Gratis.{" "}
            <span className="font-semibold text-foreground">
              Falkenberg Meyer, Rafaela.
            </span>
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/cambiar">
                Empezar
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="#intenciones">Ver opciones</Link>
            </Button>
          </div>
        </div>

        {/* Right: photo */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-secondary md:aspect-[5/4]">
          <Image
            src="/placeholder.svg?height=720&width=900&query=car%20dealership%20argentina%20showroom%20interior%20cars%20parked"
            alt="Galpón de Falkenberg Meyer Automotores en Rafaela"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
