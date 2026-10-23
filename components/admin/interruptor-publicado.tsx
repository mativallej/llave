"use client"

import { useOptimistic, useState, useTransition } from "react"
import { cambiarPublicado } from "@/app/admin/(panel)/stock/acciones"
import { Switch } from "@/components/ui/switch"

// One tap, no confirmation screen. If the car can't be published yet (no price, missing data),
// the switch goes back and says why.
export function InterruptorPublicado({ slug, publicado }: { slug: string; publicado: boolean }) {
  const [optimista, setOptimista] = useOptimistic(publicado)
  const [pendiente, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const id = `publicado-${slug}`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-center gap-2 text-sm">
        <Switch
          id={id}
          checked={optimista}
          disabled={pendiente}
          onCheckedChange={(valor) =>
            iniciar(async () => {
              setError(null)
              setOptimista(valor)
              const resultado = await cambiarPublicado(slug, valor)
              if (!resultado.ok) setError(resultado.error)
            })
          }
        />
        {optimista ? "Publicado" : "Sin publicar"}
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
