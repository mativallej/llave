import "server-only"
import { createHash } from "node:crypto"
import { db } from "@/lib/db/server"
import { ErrorDeRegla } from "@/lib/errores"

// How much one connection can use each public endpoint. Fixed windows counted in Postgres (contar_uso):
// no new service and no job queue. Technical protection, not a business value: constants, not config.

export const LIMITES = {
  chat: { segundos: 600, maximo: 60 },
  chatDia: { segundos: 86_400, maximo: 300 },
  // All connections together: what stops a distributed attack from becoming an OpenAI bill.
  chatTotal: { segundos: 3_600, maximo: 1_000 },
  pedido: { segundos: 3_600, maximo: 10 },
  subidas: { segundos: 3_600, maximo: 30 },
  caso: { segundos: 600, maximo: 120 },
  mcpSinToken: { segundos: 600, maximo: 20 },
  login: { segundos: 900, maximo: 10 },
} as const

export type Limite = keyof typeof LIMITES

export class ErrorLimite extends ErrorDeRegla {}

// The client's IP as the platform hands it over. On Vercel the first entry of x-forwarded-for is the client.
export function ipDe(encabezados: Headers): string | null {
  const reenviada = encabezados.get("x-forwarded-for")?.split(",")[0]?.trim()
  return reenviada || encabezados.get("x-real-ip")?.trim() || null
}

// The key never holds the IP, only a hash of it. Requests without an IP share one key.
export function claveDe(limite: Limite, ip: string | null): string {
  if (limite === "chatTotal") return limite
  return `${limite}:${createHash("sha256").update(ip ?? "sin-ip").digest("hex").slice(0, 32)}`
}

// True while within the limit. If counting fails, the request goes through and it's logged: a limiter that
// takes the channel down when the database coughs is worse than none.
export async function dentroDelLimite(limite: Limite, ip: string | null): Promise<boolean> {
  const { segundos, maximo } = LIMITES[limite]
  try {
    const { data, error } = await db().rpc("contar_uso", { p_clave: claveDe(limite, ip), p_segundos: segundos, p_maximo: maximo })
    if (error) throw new Error(error.message)
    return data !== false
  } catch (e) {
    console.error(`limite ${limite}:`, (e as Error).message)
    return true
  }
}
