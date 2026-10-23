"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { cargarAuto } from "@/app/admin/(panel)/stock/acciones"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SelectorFotos } from "./selector-fotos"
import { subirArchivos } from "./subir"

// The alta is not a form: photos and one line. The agent fills in what it can and the next screen asks,
// one at a time, for whatever it couldn't.
export function AltaAuto() {
  const router = useRouter()
  const [archivos, setArchivos] = useState<File[]>([])
  const [linea, setLinea] = useState("")
  const [estado, setEstado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ocupado = estado !== null

  async function cargar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const rutas = await subirArchivos(archivos, (n) =>
        setEstado(n < archivos.length ? `Subiendo fotos, ${n + 1} de ${archivos.length}…` : "Fotos subidas."),
      )
      setEstado("Leyendo la línea y las fotos…")
      const resultado = await cargarAuto(linea, rutas)
      if (!resultado.ok) throw new Error(resultado.error)
      router.push(`/admin/stock/${resultado.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el auto.")
      setEstado(null)
    }
  }

  return (
    <form onSubmit={cargar} className="flex flex-col gap-3">
      <SelectorFotos archivos={archivos} onCambio={setArchivos} deshabilitado={ocupado} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="linea">¿Qué entró?</Label>
        <Textarea
          id="linea"
          value={linea}
          onChange={(e) => setLinea(e.target.value)}
          placeholder="Entró un Corolla XEI 2019 con 78 mil"
          rows={2}
          disabled={ocupado}
          required
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {estado && (
        <p role="status" className="text-sm text-muted-foreground">
          {estado}
        </p>
      )}
      <Button type="submit" size="lg" disabled={ocupado || !linea.trim()}>
        Cargar auto
      </Button>
    </form>
  )
}
