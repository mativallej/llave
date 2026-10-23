import "server-only"
import { db } from "@/lib/db/server"
import { ErrorDeRegla } from "@/lib/errores"
import {
  calcularAvisos,
  calcularMetricas,
  type CasoMetrica,
  type ClavePeriodo,
  embudo,
  type EventoMetrica,
  type GastoMes,
  inicioDeSemana,
  periodo,
} from "./calcular"

// Reading what the metrics need, once, for the dashboard and for the MCP: both show the same numbers
// because both call this.

export class ErrorGasto extends ErrorDeRegla {}

// PostgREST returns at most 1000 rows per request: anything longer is read in pages.
const PAGINA = 1000

async function todas<T>(pedir: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const filas: T[] = []
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await pedir(desde, desde + PAGINA - 1)
    if (error) throw new Error(`tablero: ${error.message}`)
    filas.push(...(data ?? []))
    if (!data || data.length < PAGINA) return filas
  }
}

export async function leerTablero(clave: ClavePeriodo, ahora = new Date()) {
  const p = periodo(clave, ahora)
  // The cohort's events all come after its requests; the week's may start before the month.
  const desde = [p.desde, inicioDeSemana(ahora)].sort()[0]
  const [eventos, casos, gastos] = await Promise.all([
    todas<EventoMetrica>((a, b) => db().from("evento").select("caso_id, tipo, en, meta").gte("en", desde).order("id").range(a, b)),
    todas<CasoMetrica>((a, b) => db().from("caso").select("id, creado_en, cerro, venta_nueva, renegocio").order("creado_en").range(a, b)),
    leerGastos(p.meses),
  ])
  return {
    periodo: p,
    metricas: calcularMetricas({ eventos, casos, gastos, periodo: p, ahora }),
    embudo: embudo(eventos, p),
    avisos: calcularAvisos({ eventos, casos, ahora }),
  }
}

export type Tablero = Awaited<ReturnType<typeof leerTablero>>

export async function leerGastos(meses: string[]): Promise<GastoMes[]> {
  const { data, error } = await db().from("gasto_mes").select("mes, monto").in("mes", meses).order("mes")
  if (error) throw new Error(`leerGastos: ${error.message}`)
  return (data ?? []).map((g) => ({ mes: g.mes, monto: Number(g.monto) }))
}

// Ad spend lives in Andrés's Meta account: it's typed by hand, one month at a time.
export async function escribirGasto(mes: string, monto: number): Promise<void> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new ErrorGasto("Elegí un mes.")
  if (!Number.isFinite(monto) || monto < 0) throw new ErrorGasto("El gasto tiene que ser un número, cero o más.")
  const { error } = await db().from("gasto_mes").upsert({ mes: `${mes}-01`, monto: Math.round(monto * 100) / 100 })
  if (error) throw new Error(`escribirGasto: ${error.message}`)
}
