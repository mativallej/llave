"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { clienteAuth } from "@/lib/auth/supabase"
import { db } from "@/lib/db/server"
import { dentroDelLimite, ipDe } from "@/lib/limites"

export type EstadoLogin = { error: string } | null

export async function entrar(_previo: EstadoLogin, datos: FormData): Promise<EstadoLogin> {
  const email = String(datos.get("email") ?? "").trim()
  const password = String(datos.get("password") ?? "")
  if (!email || !password) return { error: "Escribí tu email y tu contraseña." }
  // Supabase sees the server's IP, not the person's: this is the limit that tells them apart.
  if (!(await dentroDelLimite("login", ipDe(await headers())))) {
    return { error: "Demasiados intentos desde esta conexión. Probá de nuevo dentro de 15 minutos." }
  }

  const auth = await clienteAuth()
  const { data, error } = await auth.auth.signInWithPassword({ email, password })
  // A banned account gets the same answer with any password, so it can't say "suspended" here without
  // telling anyone which emails have one. One message for both, with the way out for whoever is suspended.
  if (error) return { error: "El email o la contraseña no coinciden. Si tu usuario está suspendido, hablá con Andrés." }

  // The password was right: now it can say why there's no access.
  const { data: perfil } = await db().from("perfil").select("suspendido_en").eq("id", data.user.id).maybeSingle()
  if (!perfil || perfil.suspendido_en) {
    await auth.auth.signOut()
    return {
      error: perfil
        ? "Tu usuario está suspendido. Si es un error, hablá con Andrés."
        : "Tu usuario no tiene acceso al admin. Pedíselo a Andrés.",
    }
  }

  redirect("/admin/stock")
}

export async function salir() {
  const auth = await clienteAuth()
  await auth.auth.signOut()
  redirect("/admin/login")
}
