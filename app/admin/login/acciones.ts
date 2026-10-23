"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { clienteAuth } from "@/lib/auth/supabase"
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
  const { error } = await auth.auth.signInWithPassword({ email, password })
  if (error) return { error: "El email o la contraseña no coinciden." }

  redirect("/admin/stock")
}

export async function salir() {
  const auth = await clienteAuth()
  await auth.auth.signOut()
  redirect("/admin/login")
}
