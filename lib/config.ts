import "server-only"
import { cache } from "react"
import { db } from "./db/server"
import { ErrorDeRegla } from "./errores"

// Operational data from the config table. It changes for business reasons, so it lives in a row and not in
// an env var: switching on Falkenberg's guarantees is editing a row, not a redeploy.
type Valores = {
  whatsapp_abelardo: string
  garantias_falkenberg: boolean
  plazo_contacto: string
  citas_por_semana: number
}

// What the week's capacity was before it moved to config. Used only if the row can't be read as a number:
// a warning that never shows because of a typo is worse than one at the usual number.
const CITAS_POR_SEMANA_SI_FALLA = 15

export type ClaveConfig = keyof Valores

const filas = cache(async (): Promise<Map<string, string>> => {
  const { data, error } = await db().from("config").select("clave, valor")
  if (error) throw new Error(`config: ${error.message}`)
  return new Map(data.map((fila) => [fila.clave, fila.valor]))
})

export async function leerConfig<K extends ClaveConfig>(clave: K): Promise<Valores[K]> {
  const valor = (await filas()).get(clave) ?? ""
  // Fails closed: anything but the literal "true" keeps the guarantees off.
  if (clave === "garantias_falkenberg") return (valor === "true") as Valores[K]
  if (clave === "citas_por_semana") {
    const numero = Number(valor)
    if (Number.isInteger(numero) && numero > 0) return numero as Valores[K]
    console.error(`config: citas_por_semana no es un entero positivo ("${valor}"); se usa ${CITAS_POR_SEMANA_SI_FALLA}.`)
    return CITAS_POR_SEMANA_SI_FALLA as Valores[K]
  }
  return valor as Valores[K]
}

// The contact window is one of Falkenberg's five guarantees (the 48 hours): it goes out only with them on.
export function plazoParaMostrar(garantiasFalkenberg: boolean, plazoContacto: string): string {
  return garantiasFalkenberg ? plazoContacto : ""
}

export type FilaConfig = { clave: ClaveConfig; valor: string; nota: string; actualizado_en: string }

// For /admin/config: every key with its note, so nobody has to read code to know what it does.
export async function listarConfig(): Promise<FilaConfig[]> {
  const { data, error } = await db().from("config").select("clave, valor, nota, actualizado_en").order("clave")
  if (error) throw new Error(`config: ${error.message}`)
  return data as FilaConfig[]
}

export class ErrorConfig extends ErrorDeRegla {}

export async function escribirConfig(clave: ClaveConfig, valor: string): Promise<void> {
  const limpio = normalizar(clave, valor)
  const { error } = await db().from("config").update({ valor: limpio }).eq("clave", clave)
  if (error) throw new Error(`config: ${error.message}`)
}

function normalizar(clave: ClaveConfig, valor: string): string {
  const texto = valor.trim()
  if (clave === "garantias_falkenberg") {
    if (texto !== "true" && texto !== "false") throw new ErrorConfig("Las garantías van prendidas o apagadas.")
    return texto
  }
  if (clave === "whatsapp_abelardo") {
    const digitos = texto.replace(/\D/g, "")
    if (digitos && (digitos.length < 10 || digitos.length > 15)) {
      throw new ErrorConfig("El WhatsApp va con código de país y de área, sin el 15: por ejemplo 5493492000000.")
    }
    return digitos
  }
  if (clave === "citas_por_semana") {
    if (!/^[1-9]\d{0,2}$/.test(texto)) throw new ErrorConfig("Las citas por semana van como un número entero, por ejemplo 15.")
    return texto
  }
  return texto
}
