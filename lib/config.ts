import "server-only"
import { cache } from "react"
import { db } from "./db/server"

// Operational data from the config table. It changes for business reasons, so it lives in a row and not in
// an env var: switching on Falkenberg's guarantees is editing a row, not a redeploy.
type Valores = {
  whatsapp_abelardo: string
  garantias_falkenberg: boolean
  plazo_contacto: string
}

export type ClaveConfig = keyof Valores

const filas = cache(async (): Promise<Map<string, string>> => {
  const { data, error } = await db().from("config").select("clave, valor")
  if (error) throw new Error(`config: ${error.message}`)
  return new Map(data.map((fila) => [fila.clave, fila.valor]))
})

export async function leerConfig<K extends ClaveConfig>(clave: K): Promise<Valores[K]> {
  const valor = (await filas()).get(clave) ?? ""
  // Fails closed: anything but the literal "true" keeps the guarantees off.
  const leido = clave === "garantias_falkenberg" ? valor === "true" : valor
  return leido as Valores[K]
}
