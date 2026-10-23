import Link from "next/link"
import { AltaAuto } from "@/components/admin/alta-auto"
import { BotonVendido } from "@/components/admin/boton-vendido"
import { BotonesOrden } from "@/components/admin/botones-orden"
import { InterruptorPublicado } from "@/components/admin/interruptor-publicado"
import { Badge } from "@/components/ui/badge"
import { haceDias, kilometros, pesos } from "@/lib/formato"
import {
  DESTACADOS,
  DIAS_DESACTUALIZADO,
  diasDesde,
  faltantesDe,
  listarStock,
  nombreAuto,
  stockDesactualizado,
  urlsFirmadas,
} from "@/lib/stock/stock"

export const metadata = { title: "Stock — Llave" }

export default async function PaginaStock() {
  const [autos, desactualizados] = await Promise.all([listarStock(), stockDesactualizado()])
  const portadas = await urlsFirmadas(autos.flatMap((auto) => auto.fotos.slice(0, 1)))
  const publicados = autos.filter((auto) => auto.publicado)

  return (
    <>
      {desactualizados.length > 0 && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium">
            {desactualizados.length === 1
              ? `Un auto publicado lleva más de ${DIAS_DESACTUALIZADO} días sin actualizar.`
              : `${desactualizados.length} autos publicados llevan más de ${DIAS_DESACTUALIZADO} días sin actualizar.`}
          </p>
          <p className="text-muted-foreground">
            Fijate si siguen en el galpón y si el precio está bien:{" "}
            {desactualizados.map((auto) => nombreAuto(auto)).join(", ")}.
          </p>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold">Cargar un auto</h1>
        <AltaAuto />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Stock</h2>
          <p className="text-sm text-muted-foreground">
            {`Los primeros ${DESTACADOS} publicados son los de "Autos de esta semana". Ordenalos con las flechas.`}
          </p>
        </div>

        {autos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay autos cargados.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {autos.map((auto) => {
              const portada = auto.fotos[0] ? portadas[auto.fotos[0]] : undefined
              const posicion = publicados.findIndex((p) => p.id === auto.id)
              const faltan = faltantesDe(auto).length
              return (
                <li key={auto.id} className="flex flex-col gap-3 p-3">
                  <div className="flex gap-3">
                    <div className="aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                      {portada && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={portada} alt="" className="size-full object-cover" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Link href={`/admin/stock/${auto.slug}`} className="font-medium underline-offset-4 hover:underline">
                        {nombreAuto(auto)}
                      </Link>
                      <p className="text-sm">
                        {auto.precio !== null ? pesos(auto.precio) : <span className="text-destructive">Sin precio</span>}
                        {auto.km !== null && <span className="text-muted-foreground"> · {kilometros(auto.km)}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Actualizado {haceDias(diasDesde(auto.actualizado_en))}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {posicion >= 0 && posicion < DESTACADOS && <Badge>Destacado</Badge>}
                        {faltan > 0 && (
                          <Badge variant="outline">
                            {faltan === 1 ? "Falta confirmar 1 dato" : `Falta confirmar ${faltan} datos`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <InterruptorPublicado slug={auto.slug} publicado={auto.publicado} />
                    <div className="flex items-center gap-2">
                      {posicion >= 0 && (
                        <BotonesOrden
                          slug={auto.slug}
                          primero={posicion === 0}
                          ultimo={posicion === publicados.length - 1}
                        />
                      )}
                      <BotonVendido slug={auto.slug} />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
