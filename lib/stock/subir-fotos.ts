"use client"

import { createClient } from "@supabase/supabase-js"

// Browser side of the photo upload: shrink, then PUT straight to the private bucket with a signed upload
// token the server issued. The anon key never gets any Storage policy; the token is the permission.

const LADO_MAXIMO = 1600

export async function achicarFoto(archivo: File): Promise<Blob> {
  let imagen: ImageBitmap
  try {
    imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" })
  } catch {
    throw new Error(`No pude leer la foto "${archivo.name}". Probá sacarla de nuevo o elegir otra.`)
  }
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height))
  const lienzo = document.createElement("canvas")
  lienzo.width = Math.round(imagen.width * escala)
  lienzo.height = Math.round(imagen.height * escala)
  lienzo.getContext("2d")!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
  imagen.close()
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob(
      (blob) => (blob ? resolver(blob) : rechazar(new Error("No pude preparar una de las fotos."))),
      "image/jpeg",
      0.85,
    ),
  )
}

let storage: ReturnType<typeof createClient>["storage"] | undefined

export async function subirFoto(ruta: string, token: string, foto: Blob): Promise<void> {
  storage ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  }).storage
  const { error } = await storage.from("fotos").uploadToSignedUrl(ruta, token, foto, { contentType: "image/jpeg" })
  if (error) throw new Error("Se cortó la subida de una foto. Probá de nuevo.")
}
