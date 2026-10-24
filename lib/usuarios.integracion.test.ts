import { createClient } from "@supabase/supabase-js"
import { afterAll, describe, expect, it } from "vitest"
import { db } from "@/lib/db/server"
import { cambiarRol, crearUsuario, ErrorUsuario, listarUsuarios, reactivar, resetearPassword, suspender } from "./usuarios"

const conBase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)
const MARCA = Date.now()
const email = (quien: string) => `prueba-usuarios-${MARCA}-${quien}@llave.test`

// Signing in the way the login does: with the public key, as a person would.
const entrar = (correo: string, password: string) =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  }).auth.signInWithPassword({ email: correo, password })

describe.skipIf(!conBase)("los usuarios del admin, contra Supabase", () => {
  const ids: string[] = []

  afterAll(async () => {
    for (const id of ids) {
      await db().from("perfil").delete().eq("id", id)
      await db().auth.admin.deleteUser(id)
    }
  })

  it("de punta a punta: alta, rol, reseteo, suspensión y vuelta", async () => {
    const andres = await crearUsuario({ email: email("andres"), nombre: "Prueba Andrés", rol: "falkenberg" })
    const abelardo = await crearUsuario({ email: email("abelardo"), nombre: "Prueba Abelardo", rol: "vendedor" })
    ids.push(andres.id, abelardo.id)
    expect(abelardo.password).toMatch(/^[A-Za-z0-9_-]{16}$/)

    const lista = await listarUsuarios()
    expect(lista.find((u) => u.id === abelardo.id)).toMatchObject({
      nombre: "Prueba Abelardo",
      email: email("abelardo"),
      rol: "vendedor",
      suspendido: false,
      ultimoIngreso: null,
    })

    // The password shown once works.
    const sesion = await entrar(email("abelardo"), abelardo.password)
    expect(sesion.error).toBeNull()
    expect((await listarUsuarios()).find((u) => u.id === abelardo.id)?.ultimoIngreso).not.toBeNull()

    await cambiarRol(andres.id, abelardo.id, "falkenberg")
    expect((await listarUsuarios()).find((u) => u.id === abelardo.id)?.rol).toBe("falkenberg")
    await cambiarRol(andres.id, abelardo.id, "vendedor")

    // After a reset the old one is dead and the new one works.
    const nueva = await resetearPassword(abelardo.id)
    expect(nueva).not.toBe(abelardo.password)
    expect((await entrar(email("abelardo"), abelardo.password)).error).not.toBeNull()
    expect((await entrar(email("abelardo"), nueva)).error).toBeNull()

    // Suspended: can't sign in, and the session that was open loses access.
    await suspender(andres.id, abelardo.id)
    expect((await entrar(email("abelardo"), nueva)).error?.code).toBe("user_banned")
    const { data: abierta } = await db().auth.getUser(sesion.data.session!.access_token)
    expect(abierta.user).toBeNull()
    const { data: perfil } = await db().from("perfil").select("suspendido_en").eq("id", abelardo.id).single()
    expect(perfil!.suspendido_en).not.toBeNull()
    expect((await listarUsuarios()).find((u) => u.id === abelardo.id)?.suspendido).toBe(true)

    await reactivar(andres.id, abelardo.id)
    expect((await entrar(email("abelardo"), nueva)).error).toBeNull()
    expect((await listarUsuarios()).find((u) => u.id === abelardo.id)?.suspendido).toBe(false)
  }, 60_000)

  it("nadie se suspende ni se cambia el rol a sí mismo", async () => {
    const yo = await crearUsuario({ email: email("yo"), nombre: "Prueba Yo", rol: "falkenberg" })
    ids.push(yo.id)
    await expect(suspender(yo.id, yo.id)).rejects.toThrow(/No te podés suspender a vos mismo/)
    await expect(cambiarRol(yo.id, yo.id, "vendedor")).rejects.toThrow(/No te podés cambiar el rol a vos mismo/)
    const { data } = await db().from("perfil").select("rol, suspendido_en").eq("id", yo.id).single()
    expect(data).toEqual({ rol: "falkenberg", suspendido_en: null })
    // One's own password can be reset.
    await expect(resetearPassword(yo.id)).resolves.toMatch(/^[A-Za-z0-9_-]{16}$/)
  }, 30_000)

  it("un email repetido, uno mal escrito o un rol que no existe no crean nada", async () => {
    await expect(crearUsuario({ email: email("yo"), nombre: "Otra vez", rol: "vendedor" })).rejects.toThrow(/Ya hay una cuenta/)
    await expect(crearUsuario({ email: "no-es-un-email", nombre: "Nadie", rol: "vendedor" })).rejects.toBeInstanceOf(ErrorUsuario)
    await expect(crearUsuario({ email: email("rol"), nombre: "Nadie", rol: "admin" })).rejects.toThrow(/falkenberg o vendedor/)
    expect((await listarUsuarios()).some((u) => u.email === email("rol"))).toBe(false)
  }, 30_000)
})
