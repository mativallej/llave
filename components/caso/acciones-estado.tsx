"use client"

import { useState, useTransition } from "react"
import {
  accionAcepto,
  accionAgendarCita,
  accionCerrarVenta,
  accionConseguido,
  accionInspeccionado,
  accionLlegaronFotos,
  accionNoVino,
  accionPerder,
  accionProximoAviso,
  accionPublicar,
  accionTasacion,
} from "@/app/c/[token]/acciones"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Accion, ACCIONES_POR_ESTADO, ETIQUETA_ACCION, type EstadoAbierto } from "@/lib/caso/estados"

type Respuesta = Promise<{ ok: true } | { ok: false; error: string }>

// Only this state's actions are rendered: the others aren't hidden, they aren't in the DOM.
export function AccionesEstado({ token, estado }: { token: string; estado: EstadoAbierto }) {
  const [abierta, setAbierta] = useState<Accion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  function correr(fn: () => Respuesta) {
    iniciar(async () => {
      setError(null)
      const resultado = await fn()
      if (!resultado.ok) setError(resultado.error)
      else setAbierta(null)
    })
  }

  const directas: Partial<Record<Accion, () => Respuesta>> = {
    llegaron_fotos: () => accionLlegaronFotos(token),
    marcar_inspeccionado: () => accionInspeccionado(token),
    no_vino: () => accionNoVino(token),
    publicar_propuesta: () => accionPublicar(token),
    acepto_propuesta: () => accionAcepto(token),
    cerrar_venta: () => accionCerrarVenta(token),
  }

  return (
    <section aria-labelledby="acciones" className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <h2 id="acciones" className="font-medium">
        Qué hacer ahora
      </h2>
      <div className="flex flex-wrap gap-2">
        {ACCIONES_POR_ESTADO[estado].map((accion) => {
          const directa = directas[accion]
          return (
            <Button
              key={accion}
              type="button"
              data-accion={accion}
              variant={accion === "perder" ? "outline" : "default"}
              disabled={pendiente}
              aria-expanded={directa ? undefined : abierta === accion}
              onClick={() => (directa ? correr(directa) : setAbierta(abierta === accion ? null : accion))}
            >
              {ETIQUETA_ACCION[accion]}
            </Button>
          )
        })}
      </div>

      {abierta === "agendar_cita" && (
        <FormularioUnCampo
          etiqueta="¿Qué día y a qué hora?"
          tipo="datetime-local"
          boton="Agendar"
          pendiente={pendiente}
          onEnviar={(valor) => correr(() => accionAgendarCita(token, valor))}
        />
      )}
      {abierta === "cargar_tasacion" && (
        <FormularioUnCampo
          etiqueta="El valor del auto que entrega, en pesos. Lo pone quien lo vio."
          tipo="text"
          modo="numeric"
          boton="Cargar"
          pendiente={pendiente}
          onEnviar={(valor) => correr(() => accionTasacion(token, valor))}
        />
      )}
      {abierta === "proximo_aviso" && (
        <FormularioUnCampo
          etiqueta="¿Qué día le volvemos a avisar, haya novedades o no?"
          tipo="date"
          boton="Fijar"
          pendiente={pendiente}
          onEnviar={(valor) => correr(() => accionProximoAviso(token, valor))}
        />
      )}
      {abierta === "conseguido" && <Conseguido pendiente={pendiente} onEnviar={(d, p) => correr(() => accionConseguido(token, d, p))} />}
      {abierta === "perder" && <Perder pendiente={pendiente} onEnviar={(m, s) => correr(() => accionPerder(token, m, s))} />}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}

function FormularioUnCampo({
  etiqueta,
  tipo,
  modo,
  boton,
  pendiente,
  onEnviar,
}: {
  etiqueta: string
  tipo: "text" | "date" | "datetime-local"
  modo?: "numeric"
  boton: string
  pendiente: boolean
  onEnviar: (valor: string) => void
}) {
  const [valor, setValor] = useState("")
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (valor) onEnviar(valor)
      }}
    >
      <Label htmlFor="accion-campo">{etiqueta}</Label>
      <div className="flex gap-2">
        <Input id="accion-campo" type={tipo} inputMode={modo} value={valor} onChange={(e) => setValor(e.target.value)} required />
        <Button type="submit" disabled={pendiente || !valor}>
          {boton}
        </Button>
      </div>
    </form>
  )
}

function Conseguido({ pendiente, onEnviar }: { pendiente: boolean; onEnviar: (descripcion: string, precio: string) => void }) {
  const [descripcion, setDescripcion] = useState("")
  const [precio, setPrecio] = useState("")
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onEnviar(descripcion, precio)
      }}
    >
      <Label htmlFor="conseguido-auto">¿Qué auto se consiguió?</Label>
      <Input id="conseguido-auto" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
      <Label htmlFor="conseguido-precio">Su precio, en pesos</Label>
      <Input id="conseguido-precio" inputMode="numeric" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
      <Button type="submit" disabled={pendiente || !descripcion.trim() || !precio.trim()} className="self-start">
        Guardar
      </Button>
    </form>
  )
}

// Lost always asks why, and whether it was our own silence: that one is measured apart.
function Perder({ pendiente, onEnviar }: { pendiente: boolean; onEnviar: (motivo: string, porSilencio: boolean) => void }) {
  const [motivo, setMotivo] = useState("")
  const [silencio, setSilencio] = useState(false)
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onEnviar(motivo, silencio)
      }}
    >
      <Label htmlFor="perder-motivo">¿Por qué se cae?</Label>
      <Input id="perder-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={silencio} onCheckedChange={(valor) => setSilencio(valor === true)} />
        Se cayó porque no le contestamos a tiempo
      </label>
      <Button type="submit" variant="destructive" disabled={pendiente || !motivo.trim()} className="self-start">
        Cerrar el caso como perdido
      </Button>
    </form>
  )
}
