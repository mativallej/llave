"use client"

import { X } from "lucide-react"
import { useState, useTransition } from "react"
import { sacarFoto, sumarFotos } from "@/app/admin/(panel)/stock/acciones"
import { Button } from "@/components/ui/button"
import { SelectorFotos } from "./selector-fotos"
import { subirArchivos } from "./subir"

export function FotosAuto({ slug, fotos }: { slug: string; fotos: { ruta: string; url: string }[] }) {
  const [archivos, setArchivos] = useState<File[]>([])
  const [estado, setEstado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()
  const ocupado = pendiente || estado !== null

  async function agregar() {
    setError(null)
    try {
      const rutas = await subirArchivos(archivos, (n) =>
        setEstado(n < archivos.length ? `Subiendo, ${n + 1} de ${archivos.length}…` : "Guardando…"),
      )
      const resultado = await sumarFotos(slug, rutas)
      if (!resultado.ok) throw new Error(resultado.error)
      setArchivos([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron agregar las fotos.")
    } finally {
      setEstado(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {fotos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este auto todavía no tiene fotos.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {fotos.map(({ ruta, url }, i) => (
            <li key={ruta} className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={i === 0 ? "Portada" : `Foto ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                disabled={ocupado}
                onClick={() =>
                  iniciar(async () => {
                    const resultado = await sacarFoto(slug, ruta)
                    if (!resultado.ok) setError(resultado.error)
                  })
                }
                className="absolute top-1 right-1 rounded-full bg-background/90 p-1"
                aria-label={`Quitar la foto ${i + 1}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <SelectorFotos archivos={archivos} onCambio={setArchivos} deshabilitado={ocupado} />
      {archivos.length > 0 && (
        <Button type="button" onClick={agregar} disabled={ocupado} className="self-start">
          {archivos.length === 1 ? "Agregar la foto" : `Agregar ${archivos.length} fotos`}
        </Button>
      )}
      {estado && (
        <p role="status" className="text-sm text-muted-foreground">
          {estado}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
