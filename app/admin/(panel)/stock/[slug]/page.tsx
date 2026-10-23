import Link from "next/link"
import { notFound } from "next/navigation"
import { BotonVendido } from "@/components/admin/boton-vendido"
import { ConfirmarCampo } from "@/components/admin/confirmar-campo"
import { FichaCompleta } from "@/components/admin/ficha-completa"
import { FormPrecio } from "@/components/admin/form-precio"
import { FotosAuto } from "@/components/admin/fotos-auto"
import { InterruptorPublicado } from "@/components/admin/interruptor-publicado"
import { haceDias, kilometros } from "@/lib/formato"
import { diasDesde, ErrorStock, faltantesDe, nombreAuto, urlsFirmadas, verAuto } from "@/lib/stock/stock"

export default async function PaginaAuto({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const auto = await verAuto(slug).catch((e) => {
    if (e instanceof ErrorStock) notFound()
    throw e
  })
  const urls = await urlsFirmadas(auto.fotos)
  const faltantes = faltantesDe(auto)

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link href="/admin/stock" className="text-sm text-muted-foreground">
          ← Stock
        </Link>
        <h1 className="text-xl font-semibold">{nombreAuto(auto)}</h1>
        <p className="text-sm text-muted-foreground">
          {[auto.km !== null ? kilometros(auto.km) : null, `actualizado ${haceDias(diasDesde(auto.actualizado_en))}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {auto.vendido_en ? (
        <p className="rounded-lg border p-4 text-sm">Este auto está marcado como vendido y no se muestra en la página.</p>
      ) : (
        <>
          {faltantes.length > 0 && <ConfirmarCampo slug={auto.slug} campo={faltantes[0]} quedan={faltantes.length} />}
          <FormPrecio slug={auto.slug} precio={auto.precio} />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <InterruptorPublicado slug={auto.slug} publicado={auto.publicado} />
            <BotonVendido slug={auto.slug} />
          </div>
        </>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Fotos</h2>
        <FotosAuto slug={auto.slug} fotos={auto.fotos.filter((ruta) => urls[ruta]).map((ruta) => ({ ruta, url: urls[ruta] }))} />
      </section>

      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer font-medium">Corregir los datos</summary>
        <div className="pt-4">
          <FichaCompleta slug={auto.slug} ficha={auto} />
        </div>
      </details>
    </>
  )
}
