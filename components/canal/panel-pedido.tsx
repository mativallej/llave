"use client"

import { CONTENIDO } from "@/lib/contenido"
import { kilometros, pesos } from "@/lib/formato"
import type { AutoCanal, Pedido } from "@/lib/pedido/tipos"
import { cn } from "@/lib/utils"

// The request filling up while the client talks: what's known, and what's still missing.
export function PanelPedido({ pedido, stock }: { pedido: Pedido; stock: AutoCanal[] }) {
  const t = CONTENIDO.panel
  const elegidos = stock.filter((auto) => pedido.autos_elegidos.includes(auto.slug))
  const entrega = pedido.auto_entrega
  const nombreEntrega = entrega
    ? [entrega.marca, entrega.modelo, entrega.version, entrega.anio].filter(Boolean).join(" ")
    : ""

  const filas: { titulo: string; valor: string | null }[] = [
    {
      titulo: t.entrega,
      valor:
        pedido.entrega === false
          ? t.noEntrega
          : pedido.entrega
            ? [nombreEntrega || "Un auto", entrega?.km != null ? kilometros(entrega.km) : null].filter(Boolean).join(", ")
            : null,
    },
    {
      titulo: elegidos.length > 0 ? t.seLleva : t.busca,
      valor:
        elegidos.length > 0
          ? elegidos.map((auto) => `${auto.nombre}, ${pesos(auto.precio)}`).join("; ")
          : (pedido.busca ?? (pedido.salida === "0km" ? "Un 0km" : pedido.salida === "usado" ? "Un usado" : null)),
    },
    { titulo: t.zona, valor: pedido.zona },
    { titulo: t.fotos, valor: pedido.fotos.length > 0 ? CONTENIDO.fila.fotos(pedido.fotos.length) : null },
  ]

  return (
    <section aria-label={t.titulo} className="rounded-lg border bg-card p-3">
      <h2 className="mb-2 text-sm font-semibold">{t.titulo}</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {filas.map((fila) => (
          <div key={fila.titulo} className="contents">
            <dt className="text-muted-foreground">{fila.titulo}</dt>
            <dd className={cn(!fila.valor && "text-muted-foreground italic")}>{fila.valor ?? t.pendiente}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
