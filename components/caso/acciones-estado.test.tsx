import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { ACCIONES_POR_ESTADO, ESTADOS_ABIERTOS } from "@/lib/caso/estados"
import { AccionesEstado } from "./acciones-estado"

vi.mock("@/app/c/[token]/acciones", () => ({}))

describe("la vista del operador", () => {
  it("en cada estado, las acciones de los otros siete no están en el DOM", () => {
    for (const estado of ESTADOS_ABIERTOS) {
      const html = renderToStaticMarkup(<AccionesEstado token="t" estado={estado} />)
      const propias = new Set(ACCIONES_POR_ESTADO[estado])
      for (const accion of propias) expect(html, `${estado} debería tener ${accion}`).toContain(`data-accion="${accion}"`)
      const ajenas = ESTADOS_ABIERTOS.flatMap((otro) => ACCIONES_POR_ESTADO[otro]).filter((a) => !propias.has(a))
      for (const accion of ajenas) expect(html, `${estado} no debería tener ${accion}`).not.toContain(`data-accion="${accion}"`)
    }
  })

  it("en pendiente_cita están 'Agendé la cita' y 'No sirve', y nada más", () => {
    const html = renderToStaticMarkup(<AccionesEstado token="t" estado="pendiente_cita" />)
    expect(html).toContain("Agendé la cita")
    expect(html).toContain("No sirve")
    expect(html.match(/data-accion=/g)).toHaveLength(2)
  })
})
