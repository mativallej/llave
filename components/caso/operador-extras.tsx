"use client"

import { MessageCircle } from "lucide-react"
import { useState, useTransition } from "react"
import {
  accionCorregir,
  accionNota,
  accionPedir,
  accionRenegocio,
  accionVentaNueva,
} from "@/app/c/[token]/acciones"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PedidoAlCliente, RespuestaVentaNueva } from "@/lib/caso/caso"

function useAccion() {
  const [error, setError] = useState<string | null>(null)
  const [hecho, setHecho] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()
  function correr(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, mensaje = "Guardado.") {
    iniciar(async () => {
      setError(null)
      setHecho(null)
      const resultado = await fn()
      if (resultado.ok) setHecho(mensaje)
      else setError(resultado.error)
    })
  }
  const aviso = (
    <>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {hecho && (
        <p role="status" className="text-sm text-muted-foreground">
          {hecho}
        </p>
      )}
    </>
  )
  return { correr, pendiente, aviso }
}

// The two marks that are metrics, not operation. Renegotiation is Stage 1's binary gate; the post-sale
// question is the one metric no system produces.
export function Marcas({
  token,
  renegocio,
  ventaCerrada,
  ventaNueva,
}: {
  token: string
  renegocio: boolean
  ventaCerrada: boolean
  ventaNueva: boolean | null
}) {
  const { correr, pendiente, aviso } = useAccion()
  const actual: RespuestaVentaNueva = ventaNueva === true ? "si" : ventaNueva === false ? "no" : "no_preguntado"

  return (
    <section aria-labelledby="marcas" className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <h2 id="marcas" className="font-medium">
        Para medir
      </h2>
      <div className="flex flex-col gap-2">
        {renegocio ? (
          <p className="text-sm font-medium text-destructive">Se renegoció un precio en la entrega.</p>
        ) : (
          <Button type="button" variant="outline" disabled={pendiente} className="self-start" onClick={() => correr(() => accionRenegocio(token))}>
            Se renegoció un precio en la entrega
          </Button>
        )}
      </div>
      {ventaCerrada && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm">¿Hubiera venido a Falkenberg sin esto?</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["si", "Sí: no hubiera venido"],
                ["no", "No: igual venía"],
                ["no_preguntado", "No se preguntó"],
              ] as [RespuestaVentaNueva, string][]
            ).map(([valor, etiqueta]) => (
              <Button
                key={valor}
                type="button"
                size="sm"
                variant={actual === valor ? "default" : "outline"}
                aria-pressed={actual === valor}
                disabled={pendiente}
                onClick={() => correr(() => accionVentaNueva(token, valor))}
              >
                {etiqueta}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Sí quiere decir venta nueva: sin el canal, esta venta no pasaba.</p>
        </fieldset>
      )}
      {aviso}
    </section>
  )
}

export function Corregir({
  token,
  datos,
}: {
  token: string
  datos: { nombre: string | null; auto_busca: string | null; zona: string | null }
}) {
  const { correr, pendiente, aviso } = useAccion()
  return (
    <details className="rounded-lg border bg-card p-4">
      <summary className="cursor-pointer font-medium">Corregir un dato</summary>
      <form
        className="mt-3 flex flex-col gap-3"
        action={(f) =>
          correr(() =>
            accionCorregir(token, {
              nombre: String(f.get("nombre") ?? "").trim() || undefined,
              auto_busca: String(f.get("auto_busca") ?? "").trim() || null,
              zona: String(f.get("zona") ?? "").trim() || null,
            }),
          )
        }
      >
        <p className="text-xs text-muted-foreground">Se puede hasta publicar la propuesta. Después, los datos quedan fijos.</p>
        {(
          [
            ["nombre", "Nombre", datos.nombre],
            ["auto_busca", "Qué busca", datos.auto_busca],
            ["zona", "Zona", datos.zona],
          ] as const
        ).map(([nombre, etiqueta, valor]) => (
          <div key={nombre} className="flex flex-col gap-1">
            <Label htmlFor={`corregir-${nombre}`}>{etiqueta}</Label>
            <Input id={`corregir-${nombre}`} name={nombre} defaultValue={valor ?? ""} />
          </div>
        ))}
        <Button type="submit" disabled={pendiente} className="self-start">
          Guardar
        </Button>
        {aviso}
      </form>
    </details>
  )
}

// One tap: WhatsApp to the client already written, and a note saying what was asked.
export function PedirAlCliente({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()
  const opciones: [PedidoAlCliente, string][] = [
    ["fotos", "Las fotos"],
    ["horario", "Día y horario"],
    ["documentacion", "La documentación"],
  ]
  return (
    <section aria-labelledby="pedir" className="flex flex-col gap-2 rounded-lg border bg-card p-4">
      <h2 id="pedir" className="font-medium">
        Pedirle algo al cliente
      </h2>
      <div className="flex flex-wrap gap-2">
        {opciones.map(([que, etiqueta]) => (
          <Button
            key={que}
            type="button"
            variant="secondary"
            size="sm"
            disabled={pendiente}
            onClick={() =>
              iniciar(async () => {
                setError(null)
                const resultado = await accionPedir(token, que)
                if (resultado.ok) window.open(resultado.link, "_blank", "noopener")
                else setError(resultado.error)
              })
            }
          >
            <MessageCircle /> {etiqueta}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}

export function NuevaNota({ token }: { token: string }) {
  const [texto, setTexto] = useState("")
  const { correr, pendiente, aviso } = useAccion()
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        correr(() => accionNota(token, texto))
        setTexto("")
      }}
    >
      <Label htmlFor="nota">Nota</Label>
      <Textarea id="nota" value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} />
      <Button type="submit" size="sm" disabled={pendiente || !texto.trim()} className="self-start">
        Agregar nota
      </Button>
      {aviso}
    </form>
  )
}
