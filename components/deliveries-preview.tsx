import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { recentDeliveries } from "@/lib/mock-data"

export function DeliveriesPreview() {
  return (
    <section
      aria-labelledby="ultimas-entregas-title"
      className="mx-auto mt-12 max-w-6xl px-4 md:mt-20 md:px-6"
    >
      <div className="text-center">
        <h2
          id="ultimas-entregas-title"
          className="text-balance text-2xl font-bold tracking-tight md:text-3xl"
        >
          Algunas de nuestras últimas entregas
        </h2>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Estos autos ya tienen dueño. ¿Buscás el tuyo?
        </p>
      </div>

      <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:mt-10 md:grid-cols-3">
        {recentDeliveries.map((delivery) => (
          <li
            key={`${delivery.customerName}-${delivery.carModel}`}
            className="cursor-default"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-secondary">
              <Image
                src={`/placeholder.svg?height=600&width=600&query=${encodeURIComponent(delivery.imageQuery)}`}
                alt={`Entrega de ${delivery.carModel} a ${delivery.customerName} en ${delivery.city}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="px-1 pb-1 pt-4">
              <p className="text-base font-bold text-foreground">
                {delivery.customerName} · {delivery.city}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {delivery.carModel}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col items-center gap-4 text-center">
        <p className="text-base font-semibold text-foreground md:text-lg">
          ¿Querés ser el próximo?
        </p>
        <Button asChild size="lg">
          <Link href="/comprar">
            Decinos qué buscás
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
