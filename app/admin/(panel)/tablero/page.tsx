import { FormGasto } from "@/components/admin/form-gasto"
import { nombreMes, VistaTablero } from "@/components/admin/tablero"
import { pesos } from "@/lib/formato"
import type { ClavePeriodo } from "@/lib/metricas/calcular"
import { leerTablero } from "@/lib/metricas/tablero"

export const metadata = { title: "Tablero — Llave" }
export const dynamic = "force-dynamic"

export default async function PaginaTablero({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const clave: ClavePeriodo = (await searchParams).periodo === "3meses" ? "3meses" : "mes"
  const tablero = await leerTablero(clave)
  const costo = tablero.metricas.costoPorVenta
  const meses = tablero.periodo.meses

  return (
    <>
      <VistaTablero tablero={tablero} />

      <section aria-labelledby="gasto" className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex flex-col gap-1">
          <h2 id="gasto" className="text-lg font-semibold">
            Gasto en ads
          </h2>
          <p className="text-sm text-muted-foreground">
            Se carga a mano desde la cuenta de Meta, un mes por vez. Sin el gasto de todos los meses del período, el costo por
            venta no se calcula.
          </p>
          <p className="text-sm">
            {costo.gasto === null
              ? "Este período todavía no tiene gasto cargado."
              : `Cargado: ${pesos(costo.gasto)}${
                  costo.mesesSinGasto.length > 0 ? `; falta ${costo.mesesSinGasto.map(nombreMes).join(", ")}` : ""
                }.`}
          </p>
        </div>
        <FormGasto mesActual={meses.at(-1)!.slice(0, 7)} />
      </section>
    </>
  )
}
