import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Caso } from "@/lib/caso/caso"
import { VistaOperador } from "./vista-operador"

vi.mock("@/app/c/[token]/acciones", () => ({}))

const CASO: Caso = {
  id: "c1",
  ref: "LL-4821",
  estado: "pendiente_cita",
  creado_en: "2026-10-20T15:00:00Z",
  nombre: "Juan",
  telefono: "+5493492123456",
  auto_entrega: { marca: "Fiat", modelo: "Palio", version: null, anio: 2012, km: 150000 },
  salida: null,
  auto_busca: null,
  auto_ids: [],
  zona: "Rafaela",
  precio_salida: 24500000,
  precio_salida_en: "2026-10-20T15:00:00Z",
  valor_toma: null,
  valor_toma_en: null,
  vence_prop: null,
  fotos_en: "2026-10-21T15:00:00Z",
  cita_en: null,
  buscando_desde: null,
  proximo_aviso: null,
  cerro: null,
  motivo_perdida: null,
  renegocio: false,
  venta_nueva: null,
  ultimo_evento: "2026-10-21T15:00:00Z",
}

const html = (caso: Partial<Caso>) =>
  renderToStaticMarkup(
    <VistaOperador token="t" caso={{ ...CASO, ...caso }} autos={[]} fotos={[]} eventos={[]} notas={[]} historial={[]} />,
  )

describe("la vista del operador, alrededor de las acciones", () => {
  it("tiene el tel: para llamar y, hasta publicar la propuesta, se puede corregir un dato", () => {
    const h = html({})
    expect(h).toContain('href="tel:+5493492123456"')
    expect(h).toContain("Corregir un dato")
    expect(h).toContain("Pedirle algo al cliente")
  })

  it("con la propuesta publicada ya no se puede corregir nada", () => {
    const h = html({ estado: "propuesta_publicada", valor_toma: 9000000, vence_prop: "2026-10-29T15:00:00Z" })
    expect(h).not.toContain("Corregir un dato")
    expect(h).toContain('data-accion="acepto_propuesta"')
  })

  it("las dos marcas aparecen en la entrega, y la pregunta post-venta solo con la venta cerrada", () => {
    expect(html({}).match(/Para medir/)).toBeNull()
    const entrega = html({ estado: "pendiente_entrega" })
    expect(entrega).toContain("Se renegoció un precio en la entrega")
    expect(entrega).not.toContain("¿Hubiera venido a Falkenberg sin esto?")
    const vendido = html({ estado: "cerrado", cerro: true })
    expect(vendido).toContain("¿Hubiera venido a Falkenberg sin esto?")
    expect(vendido).not.toContain("data-accion=")
    expect(vendido).not.toContain("Pedirle algo al cliente")
  })
})
