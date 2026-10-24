import "server-only"
import type { Rol } from "@/lib/auth/rol"
import { db } from "@/lib/db/server"

// Who operates the channel through the MCP. The token is the authentication, like the case links.
export type OperadorMcp = { token: string; nombre: string; rol: Rol }

const FORMATO_TOKEN = /^[A-Za-z0-9_-]{32,}$/

// The Authorization header, or ?token= for clients that can't set headers (a claude.ai connector).
export function tokenDe(pedido: Request): string | null {
  const encabezado = pedido.headers.get("authorization")
  const portador = encabezado?.match(/^Bearer\s+(\S+)$/i)?.[1]
  return portador ?? new URL(pedido.url).searchParams.get("token")
}

export function tokenBienFormado(token: string | null): token is string {
  return Boolean(token && FORMATO_TOKEN.test(token))
}

// Null for a missing, malformed or unknown token. A malformed one never reaches the database.
export async function resolverOperador(token: string | null): Promise<OperadorMcp | null> {
  if (!tokenBienFormado(token)) return null
  const { data, error } = await db().from("operador").select("token, nombre, rol").eq("token", token).maybeSingle()
  if (error) throw new Error(`resolverOperador: ${error.message}`)
  return data ? { token: data.token, nombre: data.nombre, rol: data.rol as Rol } : null
}

// On every tool call: it is what later says whether the MCP gets used or is decoration.
export async function registrarUso(token: string): Promise<void> {
  const { error } = await db().from("operador").update({ ultimo_uso: new Date().toISOString() }).eq("token", token)
  if (error) throw new Error(`registrarUso: ${error.message}`)
}
