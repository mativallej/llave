"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { useTransition } from "react"
import { moverEnLista } from "@/app/admin/(panel)/stock/acciones"
import { Button } from "@/components/ui/button"

export function BotonesOrden({ slug, primero, ultimo }: { slug: string; primero: boolean; ultimo: boolean }) {
  const [pendiente, iniciar] = useTransition()

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={pendiente || primero}
        onClick={() => iniciar(async () => void (await moverEnLista(slug, "subir")))}
        aria-label="Subir en el orden"
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={pendiente || ultimo}
        onClick={() => iniciar(async () => void (await moverEnLista(slug, "bajar")))}
        aria-label="Bajar en el orden"
      >
        <ArrowDown />
      </Button>
    </div>
  )
}
