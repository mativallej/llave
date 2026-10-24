"use client"

import { pedirSubidas } from "@/app/admin/(panel)/stock/acciones"
import { achicarFoto, subirFoto } from "@/lib/stock/subir-fotos"

// Uploads the photos one by one and returns their Storage paths, in the same order.
export async function subirArchivos(archivos: File[], alAvanzar: (subidas: number) => void): Promise<string[]> {
  if (archivos.length === 0) return []
  const pedido = await pedirSubidas(archivos.length)
  if (!pedido.ok) throw new Error(pedido.error)

  const rutas: string[] = []
  for (const [i, archivo] of archivos.entries()) {
    alAvanzar(i)
    const { ruta, token } = pedido.subidas[i]
    await subirFoto(ruta, token, await achicarFoto(archivo))
    rutas.push(ruta)
  }
  alAvanzar(archivos.length)
  return rutas
}
