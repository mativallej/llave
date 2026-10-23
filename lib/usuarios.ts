import "server-only"
import { randomBytes } from "node:crypto"
import type { Rol } from "@/lib/auth/rol"
import { db } from "@/lib/db/server"
import { ErrorDeRegla } from "@/lib/errores"

// The admin's users: a Supabase Auth account for the password and the session, and a row in perfil for the
// access and the role. Only Falkenberg manages them, from /admin/usuarios. Passwords are made here, shown
// once and never stored or logged by Llave.

export class ErrorUsuario extends ErrorDeRegla {}

export const ROLES: Rol[] = ["falkenberg", "vendedor"]

export type Usuario = {
  id: string
  nombre: string
  email: string | null
  rol: Rol
  suspendido: boolean
  creadoEn: string
  ultimoIngreso: string | null
}

// Supabase Auth has no "forever": a ban long enough to be one.
const PARA_SIEMPRE = "876000h"
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PAGINA = 1000

// 16 characters from 12 random bytes: short enough to dictate, long enough not to guess.
export function generarPassword(): string {
  return randomBytes(12).toString("base64url")
}

async function cuentas(): Promise<Map<string, { email: string | null; ultimoIngreso: string | null }>> {
  const porId = new Map<string, { email: string | null; ultimoIngreso: string | null }>()
  for (let pagina = 1; ; pagina++) {
    const { data, error } = await db().auth.admin.listUsers({ page: pagina, perPage: PAGINA })
    if (error) throw new Error(`cuentas: ${error.message}`)
    for (const cuenta of data.users) {
      porId.set(cuenta.id, { email: cuenta.email ?? null, ultimoIngreso: cuenta.last_sign_in_at ?? null })
    }
    if (data.users.length < PAGINA) return porId
  }
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const [{ data: perfiles, error }, porId] = await Promise.all([
    db().from("perfil").select("id, nombre, rol, suspendido_en, creado_en").order("nombre"),
    cuentas(),
  ])
  if (error) throw new Error(`listarUsuarios: ${error.message}`)
  return perfiles.map((perfil) => ({
    id: perfil.id,
    nombre: perfil.nombre,
    email: porId.get(perfil.id)?.email ?? null,
    rol: perfil.rol as Rol,
    suspendido: perfil.suspendido_en !== null,
    creadoEn: perfil.creado_en,
    ultimoIngreso: porId.get(perfil.id)?.ultimoIngreso ?? null,
  }))
}

function validarRol(rol: string): asserts rol is Rol {
  if (!ROLES.includes(rol as Rol)) throw new ErrorUsuario("El rol es falkenberg o vendedor.")
}

// Nobody locks themselves out: whoever acts is a falkenberg and can't touch their own access or role, so at
// least one active falkenberg always remains.
function noASiMismo(actor: string, id: string, que: string) {
  if (actor === id) throw new ErrorUsuario(`No te podés ${que} a vos mismo: lo tiene que hacer otro usuario de Falkenberg.`)
}

async function existe(id: string) {
  const { data, error } = await db().from("perfil").select("id").eq("id", id).maybeSingle()
  if (error) throw new Error(`existe: ${error.message}`)
  if (!data) throw new ErrorUsuario("No existe ese usuario.")
}

export async function crearUsuario(datos: { email: string; nombre: string; rol: string }): Promise<{ id: string; password: string }> {
  const email = datos.email.trim().toLowerCase()
  const nombre = datos.nombre.trim()
  if (!FORMATO_EMAIL.test(email)) throw new ErrorUsuario("Ese email no parece completo.")
  if (nombre.length < 2 || nombre.length > 60) throw new ErrorUsuario("Escribí el nombre, como se lo va a ver en las notas.")
  validarRol(datos.rol)

  const password = generarPassword()
  const { data, error } = await db().auth.admin.createUser({ email, password, email_confirm: true })
  if (error) {
    if (error.code === "email_exists" || /already/i.test(error.message)) throw new ErrorUsuario("Ya hay una cuenta con ese email.")
    throw new Error(`crearUsuario: ${error.message}`)
  }
  const { error: errorPerfil } = await db().from("perfil").insert({ id: data.user.id, nombre, rol: datos.rol })
  if (errorPerfil) {
    // Without its perfil the account would exist without access: it's undone.
    await db().auth.admin.deleteUser(data.user.id)
    throw new Error(`crearUsuario (perfil): ${errorPerfil.message}`)
  }
  return { id: data.user.id, password }
}

export async function cambiarRol(actor: string, id: string, rol: string): Promise<void> {
  noASiMismo(actor, id, "cambiar el rol")
  validarRol(rol)
  await existe(id)
  const { error } = await db().from("perfil").update({ rol }).eq("id", id)
  if (error) throw new Error(`cambiarRol: ${error.message}`)
}

// The old password stops working at once. One's own can be reset too.
export async function resetearPassword(id: string): Promise<string> {
  await existe(id)
  const password = generarPassword()
  const { error } = await db().auth.admin.updateUserById(id, { password })
  if (error) throw new Error(`resetearPassword: ${error.message}`)
  return password
}

// Marked first, so an open session loses access on its next request; then banned, so it can't sign in again.
export async function suspender(actor: string, id: string): Promise<void> {
  noASiMismo(actor, id, "suspender")
  await existe(id)
  const { error } = await db().from("perfil").update({ suspendido_en: new Date().toISOString() }).eq("id", id)
  if (error) throw new Error(`suspender: ${error.message}`)
  const { error: errorBan } = await db().auth.admin.updateUserById(id, { ban_duration: PARA_SIEMPRE })
  if (errorBan) throw new Error(`suspender (ban): ${errorBan.message}`)
}

export async function reactivar(actor: string, id: string): Promise<void> {
  noASiMismo(actor, id, "reactivar")
  await existe(id)
  const { error: errorBan } = await db().auth.admin.updateUserById(id, { ban_duration: "none" })
  if (errorBan) throw new Error(`reactivar (ban): ${errorBan.message}`)
  const { error } = await db().from("perfil").update({ suspendido_en: null }).eq("id", id)
  if (error) throw new Error(`reactivar: ${error.message}`)
}
