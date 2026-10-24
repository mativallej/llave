import { pesos } from "@/lib/formato"
import type { Estado } from "./estados"

// The counter: what the client sees of their case. What happened with its date, what's missing and what's
// next, and each number as it exists with the date it was set. Never the margin, and never anyone but
// Falkenberg: not even while searching for a car that isn't in stock.

const ZONA = "America/Argentina/Buenos_Aires"
const DIA = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: ZONA })
const DIA_Y_HORA = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: ZONA,
})

export const fechaCorta = (iso: string) => DIA.format(new Date(iso))
// "jueves 29 de octubre a las 10:00": the 24-hour clock, as it's written here.
export function fechaConHora(iso: string): string {
  const parte = Object.fromEntries(DIA_Y_HORA.formatToParts(new Date(iso)).map((p) => [p.type, p.value]))
  return `${parte.weekday} ${parte.day} de ${parte.month} a las ${parte.hour}:${parte.minute}`
}
// A plain date (no time) is a calendar day: it's read as such, not shifted by the time zone.
const diaCalendario = (dia: string) => DIA.format(new Date(`${dia}T12:00:00-03:00`))

export type DatosMostrador = {
  estado: Estado
  cerro: boolean | null
  creado_en: string
  entrega: boolean
  se_lleva: string | null
  fotos_en: string | null
  cita_en: string | null
  precio_salida: number | null
  precio_salida_en: string | null
  valor_toma: number | null
  valor_toma_en: string | null
  vence_prop: string | null
  buscando_desde: string | null
  proximo_aviso: string | null
  eventos: { tipo: string; en: string }[]
}

export type Numero = { titulo: string; valor: string | null; fijado: string | null; pendiente: string }

export type Mostrador = {
  linea: { que: string; fecha: string }[]
  falta: string | null
  sigue: string
  numeros: Numero[]
  vigencia: string | null
  busqueda: { que: string; desde: string | null; aviso: string } | null
}

const PROPUESTA_A_LA_VISTA: Estado[] = ["propuesta_publicada", "pendiente_entrega", "cerrado"]

export function armarMostrador(d: DatosMostrador): Mostrador {
  const cuando = (tipo: string) => d.eventos.find((e) => e.tipo === tipo)?.en ?? null

  const linea: Mostrador["linea"] = [{ que: "Recibimos tu pedido", fecha: fechaCorta(d.creado_en) }]
  if (d.fotos_en) linea.push({ que: "Recibimos las fotos", fecha: fechaCorta(d.fotos_en) })
  const agendada = cuando("cita_agendada")
  if (agendada && d.cita_en) linea.push({ que: `Te dimos turno para el ${fechaConHora(d.cita_en)}`, fecha: fechaCorta(agendada) })
  const revisado = cuando("cita_cumplida")
  if (revisado) linea.push({ que: d.entrega ? "Revisamos tu auto" : "Viniste a la visita", fecha: fechaCorta(revisado) })
  const publicada = cuando("propuesta_publicada")
  if (publicada) linea.push({ que: "Publicamos tu propuesta", fecha: fechaCorta(publicada) })
  const venta = cuando("venta_cerrada")
  if (venta) linea.push({ que: "Cerramos la operación", fecha: fechaCorta(venta) })

  const { falta, sigue } = faltaYSigue(d)

  const numeros: Numero[] = [
    {
      titulo: "El auto que te llevás",
      valor: d.precio_salida !== null ? pesos(d.precio_salida) : null,
      fijado: d.precio_salida_en ? fechaCorta(d.precio_salida_en) : null,
      pendiente: "Todavía no: Falkenberg lo está consiguiendo.",
    },
  ]
  if (d.entrega) {
    numeros.push({
      titulo: "El tuyo",
      valor: d.valor_toma !== null ? pesos(d.valor_toma) : null,
      fijado: d.valor_toma_en ? fechaCorta(d.valor_toma_en) : null,
      pendiente: "Todavía no: lo pone Falkenberg después de verlo en persona.",
    })
  }
  if (d.precio_salida !== null && (!d.entrega || d.valor_toma !== null)) {
    const diferencia = d.precio_salida - (d.entrega ? (d.valor_toma ?? 0) : 0)
    const ultimo = [d.precio_salida_en, d.valor_toma_en].filter(Boolean).sort().at(-1) ?? null
    numeros.push({
      titulo: diferencia >= 0 ? "La diferencia que ponés" : "La diferencia a tu favor",
      valor: pesos(Math.abs(diferencia)),
      fijado: ultimo ? fechaCorta(ultimo) : null,
      pendiente: "",
    })
  }

  const vigencia =
    PROPUESTA_A_LA_VISTA.includes(d.estado) && d.vence_prop && !(d.estado === "cerrado" && !d.cerro)
      ? `La propuesta vale hasta el ${fechaCorta(d.vence_prop)}.`
      : null

  const busqueda =
    d.estado === "pendiente_conseguir"
      ? {
          que: d.se_lleva ?? "el auto que pediste",
          desde: d.buscando_desde ? fechaCorta(d.buscando_desde) : null,
          aviso: d.proximo_aviso
            ? `Te volvemos a avisar el ${diaCalendario(d.proximo_aviso)}, haya novedades o no.`
            : "Apenas tengamos fecha para el próximo aviso, aparece acá.",
        }
      : null

  return { linea, falta, sigue, numeros, vigencia, busqueda }
}

function faltaYSigue(d: DatosMostrador): { falta: string | null; sigue: string } {
  switch (d.estado) {
    case "pendiente_fotos":
      return {
        falta: "Las fotos del auto que entregás.",
        sigue: "Con las fotos, Falkenberg te escribe para darte turno.",
      }
    case "pendiente_cita":
      return { falta: null, sigue: "Falkenberg te escribe por WhatsApp para darte turno." }
    case "pendiente_inspeccion":
      return {
        falta: null,
        sigue: d.cita_en ? `Tu turno es el ${fechaConHora(d.cita_en)}.` : "Tu turno ya está agendado.",
      }
    case "pendiente_tasacion":
      return { falta: "El valor del tuyo.", sigue: "Falkenberg lo pone ahora que lo vio, y aparece acá con su fecha." }
    case "pendiente_conseguir":
      return { falta: "El auto que te llevás.", sigue: "Falkenberg lo está buscando." }
    case "pendiente_propuesta":
      return { falta: "La propuesta.", sigue: "Falkenberg la arma con los dos números y la publica acá." }
    case "propuesta_publicada":
      return { falta: "Tu respuesta.", sigue: "Si te sirve, se coordina la entrega." }
    case "pendiente_entrega":
      return { falta: null, sigue: "Aceptaste la propuesta. Sigue la entrega." }
    case "cerrado":
      return d.cerro
        ? { falta: null, sigue: "La operación está cerrada." }
        : { falta: null, sigue: "Este pedido quedó cerrado. Si querés retomarlo, hacé uno nuevo." }
  }
}
