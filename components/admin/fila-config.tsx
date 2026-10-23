"use client"

import { useState, useTransition } from "react"
import { guardarConfig } from "@/app/admin/(panel)/config/acciones"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { ClaveConfig } from "@/lib/config"

const TITULO: Record<ClaveConfig, string> = {
  whatsapp_abelardo: "WhatsApp de Abelardo",
  garantias_falkenberg: "Garantías de Falkenberg",
  plazo_contacto: "Plazo de contacto",
  citas_por_semana: "Citas por semana",
}

export function FilaConfig({ clave, valor, nota }: { clave: ClaveConfig; valor: string; nota: string }) {
  return (
    <li className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">{TITULO[clave]}</h2>
        <p className="text-sm text-muted-foreground">{nota}</p>
      </div>
      {clave === "garantias_falkenberg" ? <Garantias prendidas={valor === "true"} /> : <Texto clave={clave} valor={valor} />}
    </li>
  )
}

function Texto({ clave, valor }: { clave: ClaveConfig; valor: string }) {
  const [texto, setTexto] = useState(valor)
  const [mensaje, setMensaje] = useState<{ error: boolean; texto: string } | null>(null)
  const [pendiente, iniciar] = useTransition()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => {
          const resultado = await guardarConfig(clave, texto)
          setMensaje(resultado.ok ? { error: false, texto: "Guardado." } : { error: true, texto: resultado.error })
        })
      }}
      className="flex flex-col gap-2"
    >
      <Label htmlFor={clave} className="sr-only">
        {TITULO[clave]}
      </Label>
      <Input
        id={clave}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        inputMode={clave === "whatsapp_abelardo" ? "tel" : clave === "citas_por_semana" ? "numeric" : "text"}
        placeholder="Vacío"
        disabled={pendiente}
      />
      {mensaje && (
        <p role={mensaje.error ? "alert" : "status"} className={mensaje.error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {mensaje.texto}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pendiente || texto === valor} className="self-start">
        Guardar
      </Button>
    </form>
  )
}

// Five promises Falkenberg pays for. Switching them on asks for Andrés's written acceptance first;
// switching them off is one tap.
function Garantias({ prendidas }: { prendidas: boolean }) {
  const [pidiendo, setPidiendo] = useState(false)
  const [aceptadas, setAceptadas] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  function guardar(valor: boolean) {
    iniciar(async () => {
      setError(null)
      const resultado = await guardarConfig("garantias_falkenberg", String(valor))
      if (!resultado.ok) setError(resultado.error)
      setPidiendo(false)
      setAceptadas(false)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        <Switch
          checked={prendidas}
          disabled={pendiente}
          onCheckedChange={(valor) => (valor ? setPidiendo(true) : guardar(false))}
        />
        {prendidas ? "Prendidas: se muestran en la home" : "Apagadas: no se muestran"}
      </label>

      {pidiendo && !prendidas && (
        <div role="alert" className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium">Son cinco promesas que paga Andrés.</p>
          <p>
            No renegociar lo informado, el taller y la cobertura, los 7 días de la propuesta, la cita en 48 horas
            hábiles y los trámites. Se prenden solo si Andrés las aceptó por escrito.
          </p>
          <label className="flex items-center gap-2">
            <Checkbox checked={aceptadas} onCheckedChange={(valor) => setAceptadas(valor === true)} />
            Andrés las aceptó por escrito
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={!aceptadas || pendiente} onClick={() => guardar(true)}>
              Prender las garantías
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPidiendo(false)}>
              Dejarlas apagadas
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
