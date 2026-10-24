import "server-only"
import { redirect } from "next/navigation"
import { cache } from "react"
import { db } from "@/lib/db/server"
import { clienteAuth } from "./supabase"

export type Rol = "falkenberg" | "vendedor"

export type Operador = { id: string; nombre: string; rol: Rol }

// A session is not access: access is a row in perfil, which only the service role creates.
export const rolActual = cache(async (): Promise<Operador | null> => {
  const auth = await clienteAuth()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) return null

  const { data } = await db().from("perfil").select("id, nombre, rol, suspendido_en").eq("id", user.id).maybeSingle()
  // Suspended: an open session loses access here, on its next request.
  if (!data || data.suspendido_en) return null
  return { id: data.id, nombre: data.nombre, rol: data.rol as Rol }
})

// For pages and server actions. Without access, back to the login; with the wrong role, to the stock.
export async function requerirRol(...roles: Rol[]): Promise<Operador> {
  const operador = await rolActual()
  if (!operador) redirect("/admin/login")
  if (roles.length > 0 && !roles.includes(operador.rol)) redirect("/admin/stock")
  return operador
}
