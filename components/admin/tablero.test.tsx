import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import {
  calcularAvisos,
  calcularMetricas,
  type CasoMetrica,
  embudo,
  type EventoMetrica,
  periodo,
} from "@/lib/metricas/calcular"
import type { Tablero } from "@/lib/metricas/tablero"
import { VistaTablero } from "./tablero"

const AHORA = new Date("2026-10-23T15:00:00Z")
const OCTUBRE = periodo("mes", AHORA)

function tablero(eventos: EventoMetrica[], casos: CasoMetrica[]): Tablero {
  return {
    periodo: OCTUBRE,
    metricas: calcularMetricas({ eventos, casos, gastos: [], periodo: OCTUBRE, capacidadSemanal: 15, ahora: AHORA }),
    embudo: embudo(eventos, OCTUBRE),
    avisos: calcularAvisos({ eventos, casos, capacidadSemanal: 15, ahora: AHORA }),
  }
}

const caso = (id: string, extra: Partial<CasoMetrica> = {}): CasoMetrica => ({
  id,
  creado_en: "2026-10-01T15:00:00Z",
  cerro: true,
  venta_nueva: null,
  renegocio: false,
  ...extra,
})

const html = (t: Tablero) => renderToStaticMarkup(<main>{<VistaTablero tablero={t} />}</main>)

describe("el tablero", () => {
  it("con un caso renegociado, el aviso es el primer elemento del main, en rojo", () => {
    const h = html(tablero([], [caso("A", { renegocio: true })]))
    expect(h).toMatch(/^<main><div role="alert" data-aviso="renegociacion" class="[^"]*text-destructive/)
    expect(h).toContain("Se renegoció un precio en una entrega.")
  })

  it("sin renegociaciones el aviso no está, y ningún número está pintado de bueno o malo", () => {
    const h = html(tablero([], [caso("A", { venta_nueva: true })]))
    expect(h).not.toContain('data-aviso="renegociacion"')
    // A colour that paints text, background or border as a verdict. Variant classes (aria-invalid:…) aren't one.
    expect(h).not.toMatch(/[\s"](?:text|bg|border)-(?:destructive|green|emerald|lime|red|amber|yellow)/)
  })

  it("la métrica de ventas nuevas dice el porcentaje junto a '5 de 12' y '7 sin preguntar'", () => {
    const ids = Array.from({ length: 12 }, (_, i) => `v${i}`)
    const respuestas = [true, true, true, false, false]
    const h = html(
      tablero(
        ids.map((id) => ({ caso_id: id, tipo: "venta_cerrada", en: "2026-10-10T15:00:00Z", meta: {} })),
        ids.map((id, i) => caso(id, { venta_nueva: respuestas[i] ?? null })),
      ),
    )
    expect(h).toContain("60%")
    expect(h).toContain("3 de 5 respuestas")
    expect(h).toContain("5 de 12 ventas con respuesta")
    expect(h).toContain("7 sin preguntar")
    expect(h).toContain("A 7 ventas les falta la pregunta")
  })

  it("sin ninguna respuesta la métrica dice 'sin datos', nunca 0%", () => {
    const h = html(tablero([], []))
    expect(h).toContain("sin datos")
    expect(h).not.toContain("0%")
  })

  it("con 15 citas cumplidas en la semana avisa que hay que frenar los ads", () => {
    const quince = Array.from({ length: 15 }, (_, i) => ({ caso_id: `c${i}`, tipo: "cita_cumplida", en: "2026-10-21T15:00:00Z", meta: {} }))
    expect(html(tablero(quince, []))).toContain('data-aviso="semana-llena"')
    expect(html(tablero(quince.slice(1), []))).not.toContain('data-aviso="semana-llena"')
  })
})
