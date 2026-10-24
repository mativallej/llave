"use server"

import { revalidatePath } from "next/cache"
import { requerirRol } from "@/lib/auth/rol"
import { ErrorDeRegla } from "@/lib/errores"
import { cambiarRol, crearUsuario, reactivar, resetearPassword, suspender } from "@/lib/usuarios"

// Every action is Falkenberg's: anyone else goes back to the stock before anything runs.

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string }

async function comoFalkenberg<T extends object>(fn: (actor: string) => Promise<T>): Promise<Resultado<T>> {
  const actor = await requerirRol("falkenberg")
  try {
    const valor = await fn(actor.id)
    revalidatePath("/admin/usuarios")
    return { ok: true, ...valor }
  } catch (e) {
    if (e instanceof ErrorDeRegla) return { ok: false, error: e.message }
    console.error(e)
    return { ok: false, error: "No se pudo. Probá de nuevo en un momento." }
  }
}

const nada = async () => ({})

export async function accionCrearUsuario(datos: { email: string; nombre: string; rol: string }) {
  return comoFalkenberg(async () => ({ password: (await crearUsuario(datos)).password }))
}
export async function accionCambiarRol(id: string, rol: string) {
  return comoFalkenberg((actor) => cambiarRol(actor, id, rol).then(nada))
}
export async function accionResetear(id: string) {
  return comoFalkenberg(async () => ({ password: await resetearPassword(id) }))
}
export async function accionSuspender(id: string) {
  return comoFalkenberg((actor) => suspender(actor, id).then(nada))
}
export async function accionReactivar(id: string) {
  return comoFalkenberg((actor) => reactivar(actor, id).then(nada))
}
