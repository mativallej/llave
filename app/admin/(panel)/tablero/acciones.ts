"use server"

import { revalidatePath } from "next/cache"
import { requerirRol } from "@/lib/auth/rol"
import { ErrorGasto, escribirGasto } from "@/lib/metricas/tablero"

export async function guardarGasto(mes: string, monto: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requerirRol()
  // Whole pesos: "1.500.000" and "1500000" are the same amount.
  const digitos = monto.replace(/\D/g, "")
  if (!digitos) return { ok: false, error: "Escribí el gasto en pesos." }
  try {
    await escribirGasto(mes, Number(digitos))
    revalidatePath("/admin/tablero")
    return { ok: true }
  } catch (e) {
    if (e instanceof ErrorGasto) return { ok: false, error: e.message }
    console.error(e)
    return { ok: false, error: "No se pudo guardar. Probá de nuevo en un momento." }
  }
}
