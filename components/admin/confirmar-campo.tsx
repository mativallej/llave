"use client"

import { useState, useTransition } from "react"
import { confirmarCampo } from "@/app/admin/(panel)/stock/acciones"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CampoFicha } from "@/lib/stock/campos"

const PREGUNTA: Record<CampoFicha, string> = {
  marca: "¿Qué marca es?",
  modelo: "¿Qué modelo es?",
  version: "¿Qué versión es? Por ejemplo XEI, Highline, Privilege.",
  anio: "¿De qué año es?",
  km: "¿Cuántos kilómetros tiene?",
}

// One field at a time: the one the agent couldn't deduce. The version is the only one that can be skipped.
export function ConfirmarCampo({ slug, campo, quedan }: { slug: string; campo: CampoFicha; quedan: number }) {
  const [valor, setValor] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()
  const numerico = campo === "anio" || campo === "km"

  function guardar(texto: string) {
    iniciar(async () => {
      setError(null)
      const resultado = await confirmarCampo(slug, campo, texto)
      if (!resultado.ok) setError(resultado.error)
      else setValor("")
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        guardar(valor)
      }}
      className="flex flex-col gap-3 rounded-lg border p-4"
    >
      <p className="text-xs text-muted-foreground">
        {quedan === 1 ? "Queda 1 dato por confirmar" : `Quedan ${quedan} datos por confirmar`}
      </p>
      <Label htmlFor={`campo-${campo}`} className="text-base">
        {PREGUNTA[campo]}
      </Label>
      <Input
        id={`campo-${campo}`}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        inputMode={numerico ? "numeric" : "text"}
        autoFocus
        required
        disabled={pendiente}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pendiente || !valor.trim()}>
          Confirmar
        </Button>
        {campo === "version" && (
          <Button type="button" variant="ghost" disabled={pendiente} onClick={() => guardar("")}>
            No tiene versión
          </Button>
        )}
      </div>
    </form>
  )
}
