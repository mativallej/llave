"use client"

import { Camera, ImagePlus } from "lucide-react"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { CONTENIDO } from "@/lib/contenido"

// Five views, not sixteen: the car is inspected in person, so the photos are for triage, not appraisal.
// "No las tengo ahora" never blocks the request.
export function PedidoFotos({
  onFotos,
  onNoLasTengo,
  estado,
  deshabilitado,
}: {
  onFotos: (archivos: File[]) => void
  onNoLasTengo: () => void
  estado?: string | null
  deshabilitado?: boolean
}) {
  const camara = useRef<HTMLInputElement>(null)
  const galeria = useRef<HTMLInputElement>(null)
  const elegidas = (lista: FileList | null) => {
    const archivos = Array.from(lista ?? []).filter((archivo) => archivo.type.startsWith("image/"))
    if (archivos.length > 0) onFotos(archivos)
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-1">
        <p className="font-medium">{CONTENIDO.fotos.titulo}</p>
        <p className="text-sm text-muted-foreground">{CONTENIDO.fotos.texto}</p>
      </div>
      <ol className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
        {CONTENIDO.fotos.vistas.map((vista, i) => (
          <li key={vista} className="flex gap-2">
            <span className="text-muted-foreground">{i + 1}.</span>
            {vista}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={deshabilitado} onClick={() => camara.current?.click()}>
          <Camera /> {CONTENIDO.fotos.sacar}
        </Button>
        <Button type="button" variant="secondary" disabled={deshabilitado} onClick={() => galeria.current?.click()}>
          <ImagePlus /> {CONTENIDO.fotos.elegir}
        </Button>
        <Button type="button" variant="ghost" disabled={deshabilitado} onClick={onNoLasTengo}>
          {CONTENIDO.fotos.noLasTengo}
        </Button>
      </div>
      <input
        ref={camara}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-label={CONTENIDO.fotos.sacar}
        onChange={(e) => {
          elegidas(e.target.files)
          e.target.value = ""
        }}
      />
      <input
        ref={galeria}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-label={CONTENIDO.fotos.elegir}
        onChange={(e) => {
          elegidas(e.target.files)
          e.target.value = ""
        }}
      />
      {estado && (
        <p role="status" className="text-sm text-muted-foreground">
          {estado}
        </p>
      )}
    </div>
  )
}
