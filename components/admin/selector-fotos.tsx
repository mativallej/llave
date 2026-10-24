"use client"

import { Camera, ImagePlus, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Two inputs because a phone needs both: "Sacar foto" opens the camera (capture), "Elegir fotos" opens the
// gallery with multiple selection. On a desktop, dropping files on the box works too.
export function SelectorFotos({
  archivos,
  onCambio,
  deshabilitado,
}: {
  archivos: File[]
  onCambio: (archivos: File[]) => void
  deshabilitado?: boolean
}) {
  const camara = useRef<HTMLInputElement>(null)
  const galeria = useRef<HTMLInputElement>(null)
  const [arrastrando, setArrastrando] = useState(false)

  const vistas = useMemo(() => archivos.map((archivo) => URL.createObjectURL(archivo)), [archivos])
  useEffect(() => () => vistas.forEach((url) => URL.revokeObjectURL(url)), [vistas])

  function sumar(lista: FileList | null) {
    const imagenes = Array.from(lista ?? []).filter((archivo) => archivo.type.startsWith("image/"))
    if (imagenes.length > 0) onCambio([...archivos, ...imagenes])
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setArrastrando(true)
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault()
        setArrastrando(false)
        if (!deshabilitado) sumar(e.dataTransfer.files)
      }}
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-dashed p-3 transition-colors",
        arrastrando && "border-foreground bg-muted",
      )}
    >
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={deshabilitado} onClick={() => camara.current?.click()}>
          <Camera /> Sacar foto
        </Button>
        <Button type="button" variant="secondary" disabled={deshabilitado} onClick={() => galeria.current?.click()}>
          <ImagePlus /> Elegir fotos
        </Button>
        <input
          ref={camara}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-label="Sacar foto"
          onChange={(e) => {
            sumar(e.target.files)
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
          aria-label="Elegir fotos"
          onChange={(e) => {
            sumar(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {archivos.length === 0 ? (
        <p className="text-sm text-muted-foreground">O arrastrá las fotos acá.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {vistas.map((url, i) => (
            <li key={url} className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                disabled={deshabilitado}
                onClick={() => onCambio(archivos.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 rounded-full bg-background/90 p-1"
                aria-label={`Sacar la foto ${i + 1}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
