import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { armarMostrador, type DatosMostrador } from "@/lib/caso/mostrador"
import { VistaCliente } from "./vista-cliente"

const BASE: DatosMostrador = {
  estado: "pendiente_fotos",
  cerro: null,
  creado_en: "2026-10-20T15:00:00Z",
  entrega: true,
  se_lleva: "Toyota Corolla XEI 2019",
  fotos_en: null,
  cita_en: null,
  precio_salida: 24500000,
  precio_salida_en: "2026-10-20T15:00:00Z",
  valor_toma: null,
  valor_toma_en: null,
  vence_prop: null,
  buscando_desde: null,
  proximo_aviso: null,
  eventos: [{ tipo: "pedido_enviado", en: "2026-10-20T15:00:00Z" }],
}

const html = (datos: DatosMostrador) =>
  renderToStaticMarkup(<VistaCliente ref_="LL-4821" mostrador={armarMostrador(datos)} />)

describe("el mostrador del cliente", () => {
  it("con solo el precio de salida, lo muestra con su fecha y el valor de toma como pendiente", () => {
    const h = html(BASE)
    expect(h).toMatch(/\$\s24\.500\.000/)
    expect(h).toContain("fijado el 20 de octubre")
    expect(h).toContain("lo pone Falkenberg después de verlo en persona")
    expect(h).not.toContain("diferencia")
  })

  it("el turno se dice con el día y la hora de Argentina, en 24 horas", () => {
    const h = html({
      ...BASE,
      estado: "pendiente_inspeccion",
      fotos_en: "2026-10-21T15:00:00Z",
      cita_en: "2026-10-29T13:00:00Z",
      eventos: [...BASE.eventos, { tipo: "cita_agendada", en: "2026-10-22T15:00:00Z" }],
    })
    expect(h).toContain("Tu turno es el jueves 29 de octubre a las 10:00.")
    expect(h).not.toMatch(/a\. m\.|p\. m\./)
  })

  it("con la propuesta publicada, muestra los dos números, la diferencia y hasta cuándo vale", () => {
    const h = html({
      ...BASE,
      estado: "propuesta_publicada",
      valor_toma: 9000000,
      valor_toma_en: "2026-10-22T15:00:00Z",
      vence_prop: "2026-10-29T15:00:00Z",
      eventos: [...BASE.eventos, { tipo: "propuesta_publicada", en: "2026-10-22T15:00:00Z" }],
    })
    expect(h).toMatch(/\$\s24\.500\.000/)
    expect(h).toMatch(/\$\s9\.000\.000/)
    expect(h).toContain("La diferencia que ponés")
    expect(h).toMatch(/\$\s15\.500\.000/)
    expect(h).toContain("La propuesta vale hasta el 29 de octubre.")
  })

  it("en pendiente_conseguir dice qué se busca, desde cuándo y cuándo se vuelve a avisar, sin nombrar a terceros", () => {
    const h = html({
      ...BASE,
      estado: "pendiente_conseguir",
      entrega: false,
      precio_salida: null,
      precio_salida_en: null,
      se_lleva: "una Hilux 2020 o más nueva",
      buscando_desde: "2026-10-21T15:00:00Z",
      proximo_aviso: "2026-10-27",
    })
    expect(h).toContain("una Hilux 2020 o más nueva")
    expect(h).toContain("Desde el 21 de octubre.")
    expect(h).toContain("Te volvemos a avisar el 27 de octubre")
    expect(h).not.toMatch(/agencia|\bred\b|consultamos|tercero|concesionarias|otros comercios/i)
  })

  it("en ningún estado aparecen terceros ni el margen", () => {
    for (const estado of [
      "pendiente_fotos",
      "pendiente_cita",
      "pendiente_inspeccion",
      "pendiente_tasacion",
      "pendiente_conseguir",
      "pendiente_propuesta",
      "propuesta_publicada",
      "pendiente_entrega",
      "cerrado",
    ] as const) {
      const h = html({ ...BASE, estado, cerro: estado === "cerrado" ? true : null })
      expect(h).not.toMatch(/agencia|\bred\b|consultamos|tercero|margen|ganancia|comisi/i)
    }
  })
})
