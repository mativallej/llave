import { describe, expect, it, vi } from "vitest"
import { PEDIDO_VACIO } from "@/lib/pedido/tipos"
import { SE_CORTO, turno } from "./tuerca"

// The model's stream, faked: each test says how it ends.
const { finales } = vi.hoisted(() => ({ finales: [] as unknown[][] }))
vi.mock("./cliente", () => ({
  CONFIG_BASE: {},
  openai: () => ({
    responses: {
      create: async () =>
        (async function* () {
          for (const evento of finales.shift() ?? []) yield evento
        })(),
    },
  }),
}))


async function texto() {
  let fin = ""
  for await (const evento of turno({
    historial: [],
    mensaje: { rol: "cliente", texto: "¿Cuánto vale mi Corolla 2017?" },
    pedido: PEDIDO_VACIO,
    stock: [],
    urlDeFoto: () => undefined,
  })) {
    if (evento.tipo === "fin") fin = evento.texto
  }
  return fin
}

describe("un turno nunca termina vacío", () => {
  it("si el modelo deja la respuesta incompleta, el cliente lee que se cortó", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    finales.push([{ type: "response.incomplete", response: { output: [], incomplete_details: { reason: "max_output_tokens" } } }])
    expect(await texto()).toBe(SE_CORTO)
    expect(console.error).toHaveBeenCalledWith("turno:", expect.objectContaining({ message: expect.stringMatching(/response\.incomplete/) }))
  })

  it("si el stream se termina sin decir que completó, también", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    finales.push([{ type: "response.output_text.delta", delta: "" }])
    expect(await texto()).toBe(SE_CORTO)
  })

  it("si el modelo completa sin escribir nada, el cliente no se queda mirando una burbuja vacía", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    finales.push([{ type: "response.completed", response: { output: [{ type: "message", content: [] }] } }])
    expect(await texto()).toBe(SE_CORTO)
    expect(console.error).toHaveBeenCalledWith("turno: terminó sin texto para el cliente")
  })
})
