// The eight Stage 1 metrics, as pure functions over events and cases. Nothing here touches the database,
// and nothing says which value means it works: the dashboard shows numbers, not verdicts.
//
// A conversion is always its two counts, never a bare percentage: 80% of 5 isn't 80% of 50. And with
// nothing to divide by, it's null — "no data" — never 0%.

export type EventoMetrica = { caso_id: string | null; tipo: string; en: string; meta: unknown }
export type CasoMetrica = { id: string; creado_en: string; cerro: boolean | null; venta_nueva: boolean | null; renegocio: boolean }
export type GastoMes = { mes: string; monto: number }

export type ClavePeriodo = "mes" | "3meses"
export type Periodo = { clave: ClavePeriodo; desde: string; hasta: string; meses: string[] }

export type Conversion = { de: number; a: number; valor: number | null }

export type Metricas = {
  ventas: { total: number; meses: number }
  costoPorVenta: { gasto: number | null; ventas: number; valor: number | null; mesesSinGasto: string[] }
  pedidoACita: Conversion
  citaAPropuesta: Conversion & { medianaDias: number | null }
  propuestaAVenta: Conversion
  ventaNueva: { si: number; respondidas: number; ventas: number; sinPreguntar: number; valor: number | null }
  citasSemana: { cumplidas: number; capacidad: number }
  perdidosPorSilencio: { porSilencio: number; perdidos: number }
}

export type PasoEmbudo = { paso: string; n: number; desdeAnterior: number | null }

export type Avisos = {
  renegociaciones: number
  ventasSinPreguntar: number
  semanaLlena: boolean
  citasSemana: number
}

// Argentina has no daylight saving: always UTC-3.
const HORAS_ARGENTINA = 3
const DIA_MS = 86_400_000

function enArgentina(fecha: Date): Date {
  return new Date(fecha.getTime() - HORAS_ARGENTINA * 3_600_000)
}

function medianoche(anio: number, mes: number, dia: number): Date {
  return new Date(Date.UTC(anio, mes, dia, HORAS_ARGENTINA))
}

// The current month, or the current one and the two before it, in Argentina's calendar.
export function periodo(clave: ClavePeriodo, ahora = new Date()): Periodo {
  const local = enArgentina(ahora)
  const atras = clave === "mes" ? 0 : 2
  const meses = Array.from({ length: atras + 1 }, (_, i) => {
    const inicio = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - atras + i, 1))
    return inicio.toISOString().slice(0, 10)
  })
  const desde = medianoche(local.getUTCFullYear(), local.getUTCMonth() - atras, 1)
  return { clave, desde: desde.toISOString(), hasta: ahora.toISOString(), meses }
}

// Monday 00:00 in Argentina.
export function inicioDeSemana(ahora = new Date()): string {
  const local = enArgentina(ahora)
  const desdeLunes = (local.getUTCDay() + 6) % 7
  return medianoche(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - desdeLunes).toISOString()
}

// By instant, not by text: the database writes "+00:00" and microseconds, JavaScript writes "Z".
const ms = (fecha: string) => Date.parse(fecha)
const dentro = (en: string, desde: string, hasta: string) => ms(en) >= ms(desde) && ms(en) <= ms(hasta)

export function conversion(de: number, a: number): Conversion {
  return { de, a, valor: de > 0 ? a / de : null }
}

function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null
  const orden = [...valores].sort((x, y) => x - y)
  const medio = Math.floor(orden.length / 2)
  const valor = orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2
  return Math.round(valor * 10) / 10
}

// The first time each case reached each step.
function primeraVez(eventos: EventoMetrica[]): Map<string, Map<string, string>> {
  const porCaso = new Map<string, Map<string, string>>()
  for (const evento of eventos) {
    if (!evento.caso_id) continue
    const pasos = porCaso.get(evento.caso_id) ?? new Map<string, string>()
    const antes = pasos.get(evento.tipo)
    if (!antes || ms(evento.en) < ms(antes)) pasos.set(evento.tipo, evento.en)
    porCaso.set(evento.caso_id, pasos)
  }
  return porCaso
}

// The cohort: the requests that came in during the period, and how far each one got. The funnel and
// metrics 3 to 5 read the same cohort, so the screen never shows two versions of one conversion.
function cohorte(eventos: EventoMetrica[], p: Periodo) {
  const pasos = primeraVez(eventos)
  const casos = [...pasos.entries()]
    .filter(([, vez]) => {
      const pedido = vez.get("pedido_enviado")
      return pedido !== undefined && dentro(pedido, p.desde, p.hasta)
    })
    .map(([, vez]) => vez)
  const con = (tipo: string) => casos.filter((vez) => vez.has(tipo))
  return { casos, con }
}

export function embudo(eventos: EventoMetrica[], p: Periodo): PasoEmbudo[] {
  const { casos, con } = cohorte(eventos, p)
  const chats = eventos.filter((e) => e.tipo === "chat_iniciado" && dentro(e.en, p.desde, p.hasta)).length
  const pasos: [string, number][] = [
    ["Conversaciones con Tuerca", chats],
    ["Pedidos", casos.length],
    ["Con cita agendada", con("cita_agendada").length],
    ["Fueron a la cita", con("cita_cumplida").length],
    ["Con propuesta", con("propuesta_publicada").length],
    ["Con venta", con("venta_cerrada").length],
  ]
  return pasos.map(([paso, n], i) => ({ paso, n, desdeAnterior: i === 0 ? null : conversion(pasos[i - 1][1], n).valor }))
}

export function calcularMetricas(datos: {
  eventos: EventoMetrica[]
  casos: CasoMetrica[]
  gastos: GastoMes[]
  periodo: Periodo
  // Completed visits a week before the queue builds up. It lives in config (citas_por_semana).
  capacidadSemanal: number
  ahora?: Date
}): Metricas {
  const { eventos, casos, gastos, periodo: p } = datos
  const enPeriodo = (tipo: string) => eventos.filter((e) => e.tipo === tipo && dentro(e.en, p.desde, p.hasta))

  // 1. Sales closed in the period, whenever their request came in.
  const ventasDelPeriodo = enPeriodo("venta_cerrada")
  const ventas = ventasDelPeriodo.length

  // 2. Ad spend over sales. A month without its spend loaded makes the number wrong, so there's none.
  const mesesSinGasto = p.meses.filter((mes) => !gastos.some((g) => g.mes === mes))
  const gasto = mesesSinGasto.length === p.meses.length ? null : gastos.filter((g) => p.meses.includes(g.mes)).reduce((s, g) => s + g.monto, 0)
  const costo = gasto !== null && mesesSinGasto.length === 0 && ventas > 0 ? gasto / ventas : null

  // 3 to 5, on the period's cohort.
  const { casos: cohorteCasos, con } = cohorte(eventos, p)
  const cumplidas = con("cita_cumplida")
  const dias = cumplidas
    .filter((vez) => vez.has("propuesta_publicada"))
    .map((vez) => (ms(vez.get("propuesta_publicada")!) - ms(vez.get("cita_cumplida")!)) / DIA_MS)

  // 6. Of the sales closed in the period: how many were asked, and how many said they wouldn't have come.
  const idsVendidos = new Set(ventasDelPeriodo.map((e) => e.caso_id))
  const vendidos = casos.filter((c) => idsVendidos.has(c.id))
  const respondidas = vendidos.filter((c) => c.venta_nueva !== null).length
  const si = vendidos.filter((c) => c.venta_nueva === true).length

  // 8. Lost because we didn't answer in time, apart from the rest.
  const perdidos = enPeriodo("caso_perdido")
  const porSilencio = perdidos.filter((e) => (e.meta as { por_silencio?: unknown } | null)?.por_silencio === true).length

  return {
    ventas: { total: ventas, meses: p.meses.length },
    costoPorVenta: { gasto, ventas, valor: costo, mesesSinGasto },
    pedidoACita: conversion(cohorteCasos.length, con("cita_agendada").length),
    citaAPropuesta: { ...conversion(cumplidas.length, con("propuesta_publicada").length), medianaDias: mediana(dias) },
    propuestaAVenta: conversion(con("propuesta_publicada").length, con("venta_cerrada").length),
    ventaNueva: { si, respondidas, ventas: vendidos.length, sinPreguntar: vendidos.length - respondidas, valor: respondidas > 0 ? si / respondidas : null },
    citasSemana: { cumplidas: citasDeLaSemana(eventos, datos.ahora), capacidad: datos.capacidadSemanal },
    perdidosPorSilencio: { porSilencio, perdidos: perdidos.length },
  }
}

function citasDeLaSemana(eventos: EventoMetrica[], ahora = new Date()): number {
  const desde = inicioDeSemana(ahora)
  return eventos.filter((e) => e.tipo === "cita_cumplida" && dentro(e.en, desde, ahora.toISOString())).length
}

// The three warnings. They don't depend on the period: a renegotiation or an unasked sale doesn't go away
// because the month changed.
export function calcularAvisos(datos: {
  eventos: EventoMetrica[]
  casos: CasoMetrica[]
  capacidadSemanal: number
  ahora?: Date
}): Avisos {
  const citasSemana = citasDeLaSemana(datos.eventos, datos.ahora)
  return {
    renegociaciones: datos.casos.filter((c) => c.renegocio).length,
    ventasSinPreguntar: datos.casos.filter((c) => c.cerro === true && c.venta_nueva === null).length,
    semanaLlena: citasSemana >= datos.capacidadSemanal,
    citasSemana,
  }
}
