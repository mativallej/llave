import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { ClavePeriodo, Conversion } from "@/lib/metricas/calcular"
import type { Tablero } from "@/lib/metricas/tablero"
import { pesos } from "@/lib/formato"

// Eight numbers and a list. No chart, and no colour that says good or bad: what number means it works
// isn't decided yet, and it isn't decided here. The only red is a renegotiation.

const SIN_DATOS = "sin datos"
const NOMBRE_MES = new Intl.DateTimeFormat("es-AR", { month: "long", timeZone: "UTC" })

export const nombreMes = (mes: string) => NOMBRE_MES.format(new Date(`${mes}T00:00:00Z`))
export const porcentaje = (valor: number | null) => (valor === null ? SIN_DATOS : `${Math.round(valor * 100)}%`)

function lista(nombres: string[]): string {
  return nombres.length <= 1 ? (nombres[0] ?? "") : `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`
}

const PERIODOS: [ClavePeriodo, string][] = [
  ["mes", "Este mes"],
  ["3meses", "Últimos 3 meses"],
]

export function VistaTablero({ tablero }: { tablero: Tablero }) {
  const { periodo, metricas: m, embudo, avisos } = tablero
  const meses = periodo.meses.map(nombreMes)
  const enElPeriodo = periodo.clave === "mes" ? `en ${meses[0]}` : `de ${meses[0]} a ${meses.at(-1)}`

  const tarjetas: { titulo: string; numero: string; detalle: string[] }[] = [
    {
      titulo: "Ventas cerradas",
      numero: String(m.ventas.total),
      detalle: [
        enElPeriodo,
        ...(m.ventas.meses > 1 ? [`${(m.ventas.total / m.ventas.meses).toLocaleString("es-AR", { maximumFractionDigits: 1 })} por mes`] : []),
      ],
    },
    {
      titulo: "Costo por venta",
      numero: m.costoPorVenta.valor === null ? SIN_DATOS : pesos(m.costoPorVenta.valor),
      detalle:
        m.costoPorVenta.mesesSinGasto.length > 0
          ? [`Falta cargar el gasto de ${lista(m.costoPorVenta.mesesSinGasto.map(nombreMes))}.`]
          : [`${pesos(m.costoPorVenta.gasto ?? 0)} en ads, ${m.costoPorVenta.ventas} ${m.costoPorVenta.ventas === 1 ? "venta" : "ventas"}`],
    },
    conversionTarjeta("Pedido → cita", m.pedidoACita, "pedidos con cita agendada"),
    {
      ...conversionTarjeta("Cita cumplida → propuesta", m.citaAPropuesta, "citas con propuesta"),
      detalle: [
        `${m.citaAPropuesta.a} de ${m.citaAPropuesta.de} citas con propuesta`,
        m.citaAPropuesta.medianaDias === null
          ? "Mediana de días: sin datos"
          : `Mediana: ${m.citaAPropuesta.medianaDias.toLocaleString("es-AR")} ${m.citaAPropuesta.medianaDias === 1 ? "día" : "días"}`,
      ],
    },
    conversionTarjeta("Propuesta → venta", m.propuestaAVenta, "propuestas con venta"),
    {
      titulo: "No hubiera ido sin esto",
      numero: porcentaje(m.ventaNueva.valor),
      detalle: [
        `${m.ventaNueva.si} de ${m.ventaNueva.respondidas} respuestas dijeron que no hubieran ido`,
        `${m.ventaNueva.respondidas} de ${m.ventaNueva.ventas} ventas con respuesta`,
        `${m.ventaNueva.sinPreguntar} sin preguntar`,
      ],
    },
    {
      titulo: "Citas cumplidas esta semana",
      numero: `${m.citasSemana.cumplidas} de ${m.citasSemana.capacidad}`,
      detalle: ["Desde el lunes"],
    },
    {
      titulo: "Perdidos por silencio propio",
      numero: String(m.perdidosPorSilencio.porSilencio),
      detalle: [
        `De ${m.perdidosPorSilencio.perdidos} ${m.perdidosPorSilencio.perdidos === 1 ? "caso perdido" : "casos perdidos"} ${enElPeriodo}.`,
        "Los que se cayeron porque no les contestamos a tiempo.",
      ],
    },
  ]

  return (
    <>
      {avisos.renegociaciones > 0 && (
        <div role="alert" data-aviso="renegociacion" className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <p className="text-lg font-semibold">
            {avisos.renegociaciones === 1 ? "Se renegoció un precio en una entrega." : `Se renegoció el precio en ${avisos.renegociaciones} entregas.`}
          </p>
          <p className="text-sm">
            Rompe la garantía más fuerte del producto: que el precio no se renegocia por lo que ya estaba informado.
          </p>
        </div>
      )}
      {avisos.ventasSinPreguntar > 0 && (
        <div role="status" data-aviso="sin-preguntar" className="rounded-lg border p-4 text-sm">
          <p className="font-medium">
            {avisos.ventasSinPreguntar === 1
              ? "A una venta le falta la pregunta: ¿hubiera venido a Falkenberg sin esto?"
              : `A ${avisos.ventasSinPreguntar} ventas les falta la pregunta: ¿hubiera venido a Falkenberg sin esto?`}
          </p>
          <p className="text-muted-foreground">Es la métrica que dice si hay producto, y la única que no sale sola.</p>
        </div>
      )}
      {avisos.semanaLlena && (
        <div role="status" data-aviso="semana-llena" className="rounded-lg border p-4 text-sm">
          <p className="font-medium">La semana se llenó: {avisos.citasSemana} citas cumplidas.</p>
          <p className="text-muted-foreground">Es momento de frenar el gasto en ads, antes de que se acumule cola.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold">Tablero</h1>
        <nav aria-label="Período" className="flex flex-wrap gap-2">
          {PERIODOS.map(([clave, etiqueta]) => (
            <Button key={clave} asChild size="sm" variant={periodo.clave === clave ? "default" : "outline"}>
              <Link href={`/admin/tablero?periodo=${clave}`} aria-current={periodo.clave === clave ? "page" : undefined}>
                {etiqueta}
              </Link>
            </Button>
          ))}
        </nav>
      </div>

      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tarjetas.map((t, i) => (
          <li key={t.titulo} className="flex flex-col gap-1 rounded-lg border bg-card p-4">
            <h2 className="text-sm text-muted-foreground">
              {i + 1}. {t.titulo}
            </h2>
            <p className="text-3xl font-semibold tabular-nums">{t.numero}</p>
            {t.detalle.map((linea) => (
              <p key={linea} className="text-sm text-muted-foreground">
                {linea}
              </p>
            ))}
          </li>
        ))}
      </ol>

      <section aria-labelledby="embudo" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="embudo" className="text-lg font-semibold">
            El embudo
          </h2>
          <p className="text-sm text-muted-foreground">
            Los pedidos que entraron {enElPeriodo}, y hasta dónde llegó cada uno.
          </p>
        </div>
        <ol className="flex flex-col divide-y rounded-lg border">
          {embudo.map((paso) => (
            <li key={paso.paso} className="flex items-baseline justify-between gap-3 p-3">
              <span>{paso.paso}</span>
              <span className="flex items-baseline gap-3 tabular-nums">
                {paso.desdeAnterior !== null && <span className="text-sm text-muted-foreground">{porcentaje(paso.desdeAnterior)}</span>}
                <span className="text-lg font-semibold">{paso.n}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}

function conversionTarjeta(titulo: string, c: Conversion, que: string) {
  return { titulo, numero: porcentaje(c.valor), detalle: [`${c.a} de ${c.de} ${que}`] }
}
