"use client"

import { useState, useTransition } from "react"
import { guardarFicha } from "@/app/admin/(panel)/stock/acciones"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SEGMENTOS } from "@/lib/stock/campos"

type Ficha = {
  marca: string | null
  modelo: string | null
  version: string | null
  anio: number | null
  km: number | null
  segmento: string | null
}

// The full form exists only to correct. A car never comes in through here.
export function FichaCompleta({ slug, ficha }: { slug: string; ficha: Ficha }) {
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [pendiente, iniciar] = useTransition()

  return (
    <form
      action={(datos) =>
        iniciar(async () => {
          setError(null)
          setGuardado(false)
          const texto = (clave: string) => String(datos.get(clave) ?? "")
          const resultado = await guardarFicha(slug, {
            marca: texto("marca"),
            modelo: texto("modelo"),
            version: texto("version"),
            anio: texto("anio") ? Number(texto("anio")) : null,
            km: texto("km") ? Number(texto("km").replace(/\D/g, "")) : null,
            segmento: texto("segmento") || null,
          })
          if (!resultado.ok) setError(resultado.error)
          else setGuardado(true)
        })
      }
      className="grid gap-3 sm:grid-cols-2"
    >
      <Campo nombre="marca" etiqueta="Marca" valor={ficha.marca} />
      <Campo nombre="modelo" etiqueta="Modelo" valor={ficha.modelo} />
      <Campo nombre="version" etiqueta="Versión" valor={ficha.version} />
      <Campo nombre="anio" etiqueta="Año" valor={ficha.anio} numerico />
      <Campo nombre="km" etiqueta="Kilómetros" valor={ficha.km} numerico />
      <div className="flex flex-col gap-2">
        <Label htmlFor="segmento">Segmento</Label>
        <select
          id="segmento"
          name="segmento"
          defaultValue={ficha.segmento ?? ""}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Sin definir</option>
          {SEGMENTOS.map((segmento) => (
            <option key={segmento} value={segmento}>
              {segmento}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {error}
        </p>
      )}
      {guardado && (
        <p role="status" className="text-sm text-muted-foreground sm:col-span-2">
          Guardado.
        </p>
      )}
      <Button type="submit" disabled={pendiente} className="self-start sm:col-span-2">
        Guardar cambios
      </Button>
    </form>
  )
}

function Campo({
  nombre,
  etiqueta,
  valor,
  numerico,
}: {
  nombre: string
  etiqueta: string
  valor: string | number | null
  numerico?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={nombre}>{etiqueta}</Label>
      <Input id={nombre} name={nombre} defaultValue={valor ?? ""} inputMode={numerico ? "numeric" : "text"} />
    </div>
  )
}
