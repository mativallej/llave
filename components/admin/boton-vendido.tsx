"use client"

import { useState, useTransition } from "react"
import { venderAuto } from "@/app/admin/(panel)/stock/acciones"
import { Button } from "@/components/ui/button"

// Two taps: it's the one action that can't be undone from the admin, and the car leaves the page.
export function BotonVendido({ slug }: { slug: string }) {
  const [confirmando, setConfirmando] = useState(false)
  const [pendiente, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!confirmando) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirmando(true)}>
        Se vendió
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm">¿Lo marco como vendido? Sale de la página.</span>
      <Button
        type="button"
        size="sm"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const resultado = await venderAuto(slug)
            if (!resultado.ok) setError(resultado.error)
          })
        }
      >
        Sí, vendido
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={pendiente} onClick={() => setConfirmando(false)}>
        No
      </Button>
      {error && (
        <p role="alert" className="w-full text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
