"use server"

import { revalidatePath } from "next/cache"
import { requerirRol } from "@/lib/auth/rol"
import { type ClaveConfig, ErrorConfig, escribirConfig } from "@/lib/config"

export async function guardarConfig(
  clave: ClaveConfig,
  valor: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requerirRol("falkenberg")
  try {
    await escribirConfig(clave, valor)
    revalidatePath("/", "layout")
    return { ok: true }
  } catch (e) {
    if (e instanceof ErrorConfig) return { ok: false, error: e.message }
    console.error(e)
    return { ok: false, error: "No se pudo guardar. Probá de nuevo en un momento." }
  }
}
