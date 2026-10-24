"use client"

import { Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CONTENIDO } from "@/lib/contenido"
import { kilometros, pesos } from "@/lib/formato"
import type { AutoCanal } from "@/lib/pedido/tipos"

// A stock car with its public price, the same for everyone. "Lo quiero" and "Algo parecido" seed the conversation.
export function TarjetaAuto({
  auto,
  onMensaje,
  deshabilitado,
}: {
  auto: AutoCanal
  onMensaje?: (texto: string) => void
  deshabilitado?: boolean
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <div className="flex aspect-[4/3] items-center justify-center bg-muted">
        {auto.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={auto.foto} alt={auto.nombre} className="size-full object-cover" loading="lazy" />
        ) : (
          <Car aria-hidden className="size-10 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-medium leading-snug">{auto.nombre}</h3>
        {auto.km !== null && <p className="text-sm text-muted-foreground">{kilometros(auto.km)}</p>}
        <p className="text-lg font-semibold">{pesos(auto.precio)}</p>
        {onMensaje && (
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              disabled={deshabilitado}
              onClick={() => onMensaje(CONTENIDO.tarjeta.mensajeLoQuiero(auto.nombre))}
            >
              {CONTENIDO.tarjeta.loQuiero}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={deshabilitado}
              onClick={() => onMensaje(CONTENIDO.tarjeta.mensajeParecido(auto.nombre))}
            >
              {CONTENIDO.tarjeta.parecido}
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}

export function TarjetaPrecio({ autos }: { autos: AutoCanal[] }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
      {autos.map((auto) => (
        <div key={auto.slug} className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span>{auto.nombre}</span>
          <span className="text-lg font-semibold">{pesos(auto.precio)}</span>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">{CONTENIDO.tarjeta.precioAclaracion}</p>
    </div>
  )
}
