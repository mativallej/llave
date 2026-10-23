import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { CONTENIDO } from "@/lib/contenido"
import { ComoFunciona } from "./como-funciona"
import { Garantias } from "./garantias"

describe("las garantías", () => {
  it("con garantias_falkenberg en false el HTML no contiene las cinco de Falkenberg", () => {
    const html = renderToStaticMarkup(<Garantias mostrarFalkenberg={false} />)
    for (const prohibido of ["taller", "7 días", "48 horas", "trámites", "renegociamos"]) {
      expect(html).not.toContain(prohibido)
    }
    for (const frase of CONTENIDO.garantias.producto) expect(html).toContain(frase)
  })

  it("con el flag en true aparecen las diez", () => {
    const html = renderToStaticMarkup(<Garantias mostrarFalkenberg />)
    for (const frase of [...CONTENIDO.garantias.producto, ...CONTENIDO.garantias.falkenberg]) {
      expect(html).toContain(frase)
    }
  })

  it("el resto del copy no promete lo que no se promete ni nombra terceros", () => {
    const html = renderToStaticMarkup(<ComoFunciona />)
    const copy = JSON.stringify({ ...CONTENIDO, garantias: { producto: CONTENIDO.garantias.producto } })
    for (const texto of [html, copy]) {
      expect(texto).not.toMatch(/taller|7 días|48 horas|domicilio|agencia|concesionarias|\bred\b|tercero/i)
    }
  })
})
