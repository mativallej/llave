"use client"

import { useState, useTransition } from "react"
import { guardarPrecio } from "@/app/admin/(panel)/stock/acciones"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pesos } from "@/lib/formato"

// The only field the agent never touches: it is public and the same for everyone.
export function FormPrecio({ slug, precio }: { slug: string; precio: number | null }) {
  const [valor, setValor] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => {
          setError(null)
          const resultado = await guardarPrecio(slug, valor)
          if (!resultado.ok) setError(resultado.error)
          else setValor("")
        })
      }}
      className="flex flex-col gap-3 rounded-lg border p-4"
    >
      <Label htmlFor="precio" className="text-base">
        {precio === null ? "¿A cuánto se publica?" : `Precio publicado: ${pesos(precio)}`}
      </Label>
      <p className="text-sm text-muted-foreground">
        Lo escribís vos. Es público, es el mismo para todos y el cliente lo sabe antes de sentarse.
      </p>
      <Input
        id="precio"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        inputMode="numeric"
        placeholder="24500000"
        required
        disabled={pendiente}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pendiente || !valor.trim()} className="self-start">
        {precio === null ? "Poner precio" : "Cambiar precio"}
      </Button>
    </form>
  )
}
