"use client"

import { useState, useTransition } from "react"
import { guardarGasto } from "@/app/admin/(panel)/tablero/acciones"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// One month's ad spend, typed from Andrés's Meta account. Saving a month that already has one replaces it.
export function FormGasto({ mesActual }: { mesActual: string }) {
  const [mes, setMes] = useState(mesActual)
  const [monto, setMonto] = useState("")
  const [mensaje, setMensaje] = useState<{ error: boolean; texto: string } | null>(null)
  const [pendiente, iniciar] = useTransition()

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => {
          const resultado = await guardarGasto(mes, monto)
          setMensaje(resultado.ok ? { error: false, texto: "Guardado." } : { error: true, texto: resultado.error })
          if (resultado.ok) setMonto("")
        })
      }}
    >
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="gasto-mes">Mes</Label>
          <Input id="gasto-mes" type="month" value={mes} onChange={(e) => setMes(e.target.value)} required className="w-44" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="gasto-monto">Gasto en ads, en pesos</Label>
          <Input
            id="gasto-monto"
            inputMode="numeric"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
            className="w-44"
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={pendiente || !mes || !monto.trim()} className="self-start">
        Guardar el gasto
      </Button>
      {mensaje && (
        <p role={mensaje.error ? "alert" : "status"} className={mensaje.error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {mensaje.texto}
        </p>
      )}
    </form>
  )
}
