import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ESTADOS_ABIERTOS, type Estado, esEstado, NOMBRE_ESTADO } from "@/lib/caso/estados"
import { casosParaTabla, type FiltroTabla } from "@/lib/caso/tabla"
import { haceDias } from "@/lib/formato"

export const metadata = { title: "Casos — Llave" }
export const dynamic = "force-dynamic"

// This screen only reads. To move a case, its link: that's where the actions are.
export default async function PaginaCasos({ searchParams }: { searchParams: Promise<{ estado?: string; antiguedad?: string }> }) {
  const parametros = await searchParams
  const antiguedad = Number.parseInt(parametros.antiguedad ?? "", 10)
  const filtro: FiltroTabla = {
    estado: parametros.estado && esEstado(parametros.estado) ? (parametros.estado as Estado) : "abiertos",
    antiguedad: Number.isFinite(antiguedad) && antiguedad >= 0 ? antiguedad : null,
  }
  const casos = await casosParaTabla(filtro)

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Casos</h1>
        <p className="text-sm text-muted-foreground">Para mover un caso, abrí su link: ahí están las acciones de su estado.</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="estado">Estado</Label>
          <select
            id="estado"
            name="estado"
            defaultValue={filtro.estado}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
          >
            <option value="abiertos">Todos los abiertos</option>
            {ESTADOS_ABIERTOS.map((estado) => (
              <option key={estado} value={estado}>
                {NOMBRE_ESTADO[estado]}
              </option>
            ))}
            <option value="cerrado">Cerrados</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="antiguedad">Días sin movimiento, al menos</Label>
          <Input id="antiguedad" name="antiguedad" type="number" min={0} defaultValue={filtro.antiguedad ?? ""} className="w-28" />
        </div>
        <Button type="submit" size="sm" variant="secondary">
          Filtrar
        </Button>
      </form>

      {casos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay casos con ese filtro.</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {casos.map((caso) => (
            <li key={caso.ref} className="flex flex-col gap-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{caso.ref}</span>
                <Badge variant="outline">{caso.estado}</Badge>
                {caso.quien !== "Nadie" && <span className="text-sm text-muted-foreground">Lo tiene: {caso.quien}</span>}
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Teléfono</dt>
                <dd>
                  {caso.telefono}
                  {caso.nombre && <span className="text-muted-foreground"> · {caso.nombre}</span>}
                </dd>
                <dt className="text-muted-foreground">Entrega</dt>
                <dd>{caso.entrega ?? "No entrega auto"}</dd>
                <dt className="text-muted-foreground">Busca</dt>
                <dd>{caso.busca ?? "Sin decir"}</dd>
                <dt className="text-muted-foreground">Zona</dt>
                <dd>{caso.zona ?? "Sin decir"}</dd>
                <dt className="text-muted-foreground">Sin movimiento</dt>
                <dd>{caso.diasSinMovimiento === 0 ? "Se movió hoy" : `Desde ${haceDias(caso.diasSinMovimiento)}`}</dd>
              </dl>
              {caso.link && (
                <Button asChild size="sm" variant="secondary" className="self-start">
                  <Link href={caso.link}>Abrir el caso</Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
