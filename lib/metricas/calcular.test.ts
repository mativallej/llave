import { describe, expect, it } from "vitest"
import {
  CAPACIDAD_SEMANAL,
  type CasoMetrica,
  calcularAvisos,
  calcularMetricas,
  embudo,
  type EventoMetrica,
  inicioDeSemana,
  periodo,
} from "./calcular"

// Friday 23 October 2026, noon in Argentina. The week started Monday the 19th.
const AHORA = new Date("2026-10-23T15:00:00Z")
const OCTUBRE = periodo("mes", AHORA)

// Dates as the database writes them.
const en = (dia: string, hora = "15:00:00") => `2026-${dia}T${hora}.000000+00:00`
const ev = (caso_id: string | null, tipo: string, dia: string, meta: object = {}, hora?: string): EventoMetrica => ({
  caso_id,
  tipo,
  en: en(dia, hora),
  meta,
})
const caso = (id: string, extra: Partial<CasoMetrica> = {}): CasoMetrica => ({
  id,
  creado_en: en("10-01"),
  cerro: null,
  venta_nueva: null,
  renegocio: false,
  ...extra,
})

// Seven cases, worked out by hand:
//   A  pedido 2/10 → cita → fue 5/10 → propuesta 7/10 (2 días) → venta 10/10, dijo que no hubiera venido
//   B  pedido 4/10 → cita → fue 20/10 → propuesta 21/10 (1 día)
//   C  pedido 6/10 → cita → perdido 15/10 porque no le contestamos
//   D  pedido 8/10 → perdido 12/10, el cliente dejó de contestar
//   E  pedido en septiembre → venta 2/10, no se le preguntó
//   F  pedido 21/10, nada más
//   G  pedido 19/10 → cita → fue 22/10 → propuesta 23/10 a las 0:00 (medio día)
const EVENTOS: EventoMetrica[] = [
  ...["10-01", "10-02", "10-04", "10-06", "10-08", "10-21"].map((dia) => ev(null, "chat_iniciado", dia)),
  ev(null, "chat_iniciado", "09-20"),
  ev("A", "pedido_enviado", "10-02"),
  ev("A", "cita_agendada", "10-03"),
  ev("A", "cita_cumplida", "10-05"),
  ev("A", "propuesta_publicada", "10-07"),
  ev("A", "venta_cerrada", "10-10"),
  ev("B", "pedido_enviado", "10-04"),
  ev("B", "cita_agendada", "10-05"),
  ev("B", "cita_cumplida", "10-20"),
  ev("B", "propuesta_publicada", "10-21"),
  ev("C", "pedido_enviado", "10-06"),
  ev("C", "cita_agendada", "10-07"),
  ev("C", "caso_perdido", "10-15", { por_silencio: true, motivo: "No le contestamos" }),
  ev("D", "pedido_enviado", "10-08"),
  ev("D", "caso_perdido", "10-12", { por_silencio: false, motivo: "Dejó de contestar" }),
  ev("E", "pedido_enviado", "09-20"),
  ev("E", "cita_agendada", "09-21"),
  ev("E", "cita_cumplida", "09-25"),
  ev("E", "propuesta_publicada", "09-26"),
  ev("E", "venta_cerrada", "10-02"),
  ev("F", "pedido_enviado", "10-21"),
  ev("G", "pedido_enviado", "10-19"),
  ev("G", "cita_agendada", "10-19"),
  ev("G", "cita_cumplida", "10-22"),
  ev("G", "propuesta_publicada", "10-23", {}, "03:00:00"),
]
const CASOS = [
  caso("A", { cerro: true, venta_nueva: true }),
  caso("B"),
  caso("C", { cerro: false }),
  caso("D", { cerro: false }),
  caso("E", { cerro: true }),
  caso("F"),
  caso("G"),
]

describe("las ocho métricas, sobre un set fijo", () => {
  const m = calcularMetricas({ eventos: EVENTOS, casos: CASOS, gastos: [{ mes: "2026-10-01", monto: 300000 }], periodo: OCTUBRE, ahora: AHORA })

  it("dan los ocho números calculados a mano", () => {
    expect(m.ventas).toEqual({ total: 2, meses: 1 })
    expect(m.costoPorVenta).toEqual({ gasto: 300000, ventas: 2, valor: 150000, mesesSinGasto: [] })
    expect(m.pedidoACita).toEqual({ de: 6, a: 4, valor: 4 / 6 })
    expect(m.citaAPropuesta).toEqual({ de: 3, a: 3, valor: 1, medianaDias: 1 })
    expect(m.propuestaAVenta).toEqual({ de: 3, a: 1, valor: 1 / 3 })
    expect(m.ventaNueva).toEqual({ si: 1, respondidas: 1, ventas: 2, sinPreguntar: 1, valor: 1 })
    expect(m.citasSemana).toEqual({ cumplidas: 2, capacidad: CAPACIDAD_SEMANAL })
    expect(m.perdidosPorSilencio).toEqual({ porSilencio: 1, perdidos: 2 })
  })

  it("el embudo es una lista de pasos con la conversión entre cada par, sobre los mismos pedidos", () => {
    expect(embudo(EVENTOS, OCTUBRE)).toEqual([
      { paso: "Conversaciones con Tuerca", n: 6, desdeAnterior: null },
      { paso: "Pedidos", n: 6, desdeAnterior: 1 },
      { paso: "Con cita agendada", n: 4, desdeAnterior: 4 / 6 },
      { paso: "Fueron a la cita", n: 3, desdeAnterior: 3 / 4 },
      { paso: "Con propuesta", n: 3, desdeAnterior: 1 },
      { paso: "Con venta", n: 1, desdeAnterior: 1 / 3 },
    ])
  })
})

describe("la métrica de ventas nuevas", () => {
  it("con 12 ventas y 5 respuestas expone el numerador, el denominador y los 7 sin preguntar", () => {
    const ids = Array.from({ length: 12 }, (_, i) => `v${i}`)
    const respuestas = [true, true, true, false, false]
    const m = calcularMetricas({
      eventos: ids.map((id) => ev(id, "venta_cerrada", "10-10")),
      casos: ids.map((id, i) => caso(id, { cerro: true, venta_nueva: respuestas[i] ?? null })),
      gastos: [],
      periodo: OCTUBRE,
      ahora: AHORA,
    })
    expect(m.ventaNueva).toEqual({ si: 3, respondidas: 5, ventas: 12, sinPreguntar: 7, valor: 0.6 })
  })
})

describe("sin denominador no hay métrica", () => {
  it("todo lo que divide es null, nunca 0", () => {
    const m = calcularMetricas({ eventos: [], casos: [], gastos: [], periodo: OCTUBRE, ahora: AHORA })
    expect(m.costoPorVenta).toEqual({ gasto: null, ventas: 0, valor: null, mesesSinGasto: ["2026-10-01"] })
    expect(m.pedidoACita.valor).toBeNull()
    expect(m.citaAPropuesta).toEqual({ de: 0, a: 0, valor: null, medianaDias: null })
    expect(m.propuestaAVenta.valor).toBeNull()
    expect(m.ventaNueva.valor).toBeNull()
  })

  it("si falta el gasto de un mes del período, el costo por venta no se calcula y dice cuál falta", () => {
    const m = calcularMetricas({
      eventos: [ev("A", "venta_cerrada", "10-10")],
      casos: [caso("A", { cerro: true })],
      gastos: [{ mes: "2026-10-01", monto: 300000 }],
      periodo: periodo("3meses", AHORA),
      ahora: AHORA,
    })
    expect(m.costoPorVenta).toEqual({ gasto: 300000, ventas: 1, valor: null, mesesSinGasto: ["2026-08-01", "2026-09-01"] })
  })
})

describe("los períodos y la semana, en el calendario de Argentina", () => {
  it("el 30 de septiembre a las 23:00 en Argentina todavía es septiembre", () => {
    expect(periodo("mes", new Date("2026-10-01T02:00:00Z"))).toMatchObject({
      desde: "2026-09-01T03:00:00.000Z",
      meses: ["2026-09-01"],
    })
  })

  it("los últimos tres meses cruzan el año", () => {
    expect(periodo("3meses", new Date("2026-01-15T15:00:00Z"))).toMatchObject({
      desde: "2025-11-01T03:00:00.000Z",
      meses: ["2025-11-01", "2025-12-01", "2026-01-01"],
    })
  })

  it("la semana empieza el lunes a las 0:00 de Argentina", () => {
    expect(inicioDeSemana(AHORA)).toBe("2026-10-19T03:00:00.000Z")
    expect(inicioDeSemana(new Date("2026-10-26T02:00:00Z"))).toBe("2026-10-19T03:00:00.000Z")
    expect(inicioDeSemana(new Date("2026-10-26T03:00:00Z"))).toBe("2026-10-26T03:00:00.000Z")
  })
})

describe("los avisos", () => {
  it("cuentan renegociaciones y ventas sin preguntar de siempre, y la semana se llena en 15", () => {
    const catorce = Array.from({ length: CAPACIDAD_SEMANAL - 1 }, (_, i) => ev(`s${i}`, "cita_cumplida", "10-20"))
    const casos = [...CASOS, caso("R", { cerro: true, venta_nueva: false, renegocio: true })]
    expect(calcularAvisos({ eventos: catorce, casos, ahora: AHORA })).toEqual({
      renegociaciones: 1,
      ventasSinPreguntar: 1,
      semanaLlena: false,
      citasSemana: 14,
    })
    const quince = [...catorce, ev("s15", "cita_cumplida", "10-22")]
    expect(calcularAvisos({ eventos: quince, casos: [], ahora: AHORA })).toMatchObject({ semanaLlena: true, citasSemana: 15 })
  })
})
