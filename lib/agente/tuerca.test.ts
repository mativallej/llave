import { describe, expect, it } from "vitest"
import { type AutoCanal, PEDIDO_VACIO, type Pedido } from "@/lib/pedido/tipos"
import { type EventoTurno, herramientas, SE_CORTO, turno } from "./tuerca"

const conOpenAI = Boolean(process.env.OPENAI_API_KEY)

// A stock made for the tests: the agent receives it as an argument, so nothing gets published on the real page.
const STOCK: AutoCanal[] = [
  { slug: "toyota-hilux-srx-2021", nombre: "Toyota Hilux SRX 2021", anio: 2021, km: 68000, precio: 38000000, foto: null },
  { slug: "toyota-corolla-xei-2019", nombre: "Toyota Corolla XEI 2019", anio: 2019, km: 95000, precio: 24500000, foto: null },
]

async function conversar(texto: string, pedido: Pedido = PEDIDO_VACIO) {
  const eventos: EventoTurno[] = []
  for await (const evento of turno({
    historial: [],
    mensaje: { rol: "cliente", texto },
    pedido,
    stock: STOCK,
    urlDeFoto: () => undefined,
  })) {
    eventos.push(evento)
  }
  const fin = eventos.find((e) => e.tipo === "fin") as Extract<EventoTurno, { tipo: "fin" }>
  // A cut turn tests no rule: it fails saying so, and the "turno:" log says why.
  expect(fin.texto, "el turno se cortó; mirá el log de turno").not.toBe(SE_CORTO)
  return { eventos, texto: fin.texto }
}

describe("las herramientas de Tuerca", () => {
  it("el enum de mostrar_autos sale del stock: agregar un auto lo cambia sin tocar código", () => {
    const enumDe = (stock: AutoCanal[]) =>
      (herramientas(stock).definiciones.find((d) => d.name === "mostrar_autos")!.parameters as {
        properties: { slugs: { items: { enum: string[] } } }
      }).properties.slugs.items.enum

    expect(enumDe(STOCK)).toEqual(["toyota-hilux-srx-2021", "toyota-corolla-xei-2019"])
    const conUnoMas = [...STOCK, { ...STOCK[0], slug: "fiat-cronos-drive-2021", nombre: "Fiat Cronos Drive 2021" }]
    expect(enumDe(conUnoMas)).toContain("fiat-cronos-drive-2021")
  })

  it("todas van en modo strict", () => {
    for (const definicion of herramientas(STOCK).definiciones) expect(definicion.strict).toBe(true)
  })
})

describe.skipIf(!conOpenAI)("las reglas duras, contra el modelo", () => {
  it("ante '¿cuánto vale mi Corolla?' no da ningún número de precio del auto del cliente", async () => {
    const { texto } = await conversar("¿Cuánto vale mi Corolla 2017?")
    expect(texto.length).toBeGreaterThan(0)
    expect(texto).not.toMatch(/\$|\d{1,3}(\.\d{3})+|\d+\s*(mil|millones|palos|lucas|usd|dólares)|u\$s/i)
  }, 90_000)

  it("ante '¿cómo lo tasan?' no menciona otras agencias, ni red, ni consultar a terceros", async () => {
    const { texto } = await conversar("¿Y cómo lo tasan a mi auto?")
    expect(texto.length).toBeGreaterThan(0)
    expect(texto).not.toMatch(/agencia|otras concesionarias|\bred\b|tercero|consult|otros comercios|otros vendedores/i)
  }, 90_000)

  it("sí dice el precio de un auto del stock cuando se lo piden", async () => {
    const { texto, eventos } = await conversar("¿Cuánto sale el Corolla XEI que tienen?")
    const mostroPrecio = eventos.some(
      (e) => e.tipo === "precio" && e.autos.some((a) => a.slug === "toyota-corolla-xei-2019"),
    )
    expect(mostroPrecio || /24\.500\.000|24,5 millones/.test(texto)).toBe(true)
  }, 90_000)

  it("la trampa: ante 'quiero ver la Hilux' emite el function_call y la herramienta corre", async () => {
    const { eventos } = await conversar("quiero ver la Hilux")
    expect(eventos).toContainEqual({ tipo: "herramienta", nombre: "mostrar_autos" })
    const autos = eventos.find((e) => e.tipo === "autos") as Extract<EventoTurno, { tipo: "autos" }> | undefined
    expect(autos?.autos.map((a) => a.slug)).toContain("toyota-hilux-srx-2021")
  }, 90_000)
})
