"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, X, Plus } from "lucide-react"

type Slot = {
  id: string
  file: File
  url: string
}

export type PhotoUploadProps = {
  value?: File[]
  onChange?: (files: File[]) => void
  max?: number
  hint?: string
  ariaLabel?: string
}

export function PhotoUpload({
  value,
  onChange,
  max = 12,
  hint = "Frente, trasera, lateral izq, lateral der, interior, motor",
  ariaLabel = "Subir fotos del auto",
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [slots, setSlots] = useState<Slot[]>([])

  // Sync external value -> internal slots when it goes empty (e.g. form reset)
  useEffect(() => {
    if (!value || value.length === 0) {
      // Revoke any existing URLs and clear
      setSlots((prev) => {
        prev.forEach((s) => URL.revokeObjectURL(s.url))
        return []
      })
    }
  }, [value])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      slots.forEach((s) => URL.revokeObjectURL(s.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emit = (next: Slot[]) => {
    setSlots(next)
    onChange?.(next.map((s) => s.file))
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const incoming = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    )
    const remainingCapacity = Math.max(0, max - slots.length)
    const accepted = incoming.slice(0, remainingCapacity)
    const newSlots: Slot[] = accepted.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      url: URL.createObjectURL(file),
    }))
    emit([...slots, ...newSlots])
    if (inputRef.current) inputRef.current.value = ""
  }

  const remove = (id: string) => {
    const target = slots.find((s) => s.id === id)
    if (target) URL.revokeObjectURL(target.url)
    emit(slots.filter((s) => s.id !== id))
  }

  const isFull = slots.length >= max

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label={ariaLabel}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {slots.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/40 p-6 text-center transition-colors hover:border-primary/40 hover:bg-secondary md:p-8"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground">
            <Camera className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold text-foreground">
            Subí las fotos del auto
          </span>
          <span className="text-xs text-muted-foreground">{hint}</span>
          <span className="mt-1 text-[11px] text-muted-foreground">
            Hasta {max} fotos · JPG o PNG
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
          {slots.map((s, i) => (
            <div
              key={s.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.url}
                alt={`Foto ${i + 1} del auto`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(s.id)}
                aria-label={`Eliminar foto ${i + 1}`}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-90 transition-opacity hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {i + 1}
              </span>
            </div>
          ))}

          {!isFull && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-secondary/40 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground"
              aria-label="Agregar más fotos"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              <span className="text-[11px] font-medium">Agregar</span>
            </button>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        {slots.length}/{max} fotos · {hint}
      </p>
    </div>
  )
}
