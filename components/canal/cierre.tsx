"use client"

import { MessageCircle } from "lucide-react"
import { useState, useTransition } from "react"
import { mandarPedido } from "@/app/acciones"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CONTENIDO } from "@/lib/contenido"
import type { PedidoEnviado } from "@/lib/pedido/canal"
import type { AutoCanal, Pedido } from "@/lib/pedido/tipos"
import { PanelPedido } from "./panel-pedido"

// The end of the conversation: name and WhatsApp, nothing else. No verification code in the MVP.
export function Cierre({
  pedido,
  stock,
  chat,
  onEnviado,
}: {
  pedido: Pedido
  stock: AutoCanal[]
  chat: string
  onEnviado: (enviado: PedidoEnviado) => void
}) {
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault()
        iniciar(async () => {
          setError(null)
          const resultado = await mandarPedido({ pedido, nombre, telefono, chat })
          if (resultado.ok) onEnviado(resultado.enviado)
          else setError(resultado.error)
        })
      }}
    >
      <p className="font-medium">{CONTENIDO.cierre.titulo}</p>
      <PanelPedido pedido={pedido} stock={stock} />
      <p className="text-sm text-muted-foreground">{CONTENIDO.cierre.texto}</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cierre-nombre">{CONTENIDO.cierre.nombre}</Label>
        <Input
          id="cierre-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoComplete="given-name"
          required
          disabled={pendiente}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cierre-telefono">{CONTENIDO.cierre.telefono}</Label>
        <Input
          id="cierre-telefono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          aria-describedby="cierre-telefono-ayuda"
          required
          disabled={pendiente}
        />
        <p id="cierre-telefono-ayuda" className="text-xs text-muted-foreground">
          {CONTENIDO.cierre.telefonoAyuda}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pendiente || !nombre.trim() || !telefono.trim()}>
        {pendiente ? CONTENIDO.cierre.enviando : CONTENIDO.cierre.enviar}
      </Button>
    </form>
  )
}

// After sending: the reference, the WhatsApp already written (when there's a number to send it to),
// what happens next, and the link that stays.
export function Enviado({
  enviado,
  plazoContacto,
  onOtro,
}: {
  enviado: PedidoEnviado
  plazoContacto: string
  onOtro: () => void
}) {
  const t = CONTENIDO.enviado
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
      <h2 className="text-xl font-semibold">{t.titulo(enviado.ref)}</h2>
      {enviado.whatsapp && (
        <div className="flex flex-col gap-2">
          <Button asChild size="lg">
            <a href={enviado.whatsapp} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> {t.whatsapp}
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">{t.whatsappTexto}</p>
        </div>
      )}
      <p>{plazoContacto ? `${t.sigue} ${plazoContacto}` : t.sigue}</p>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{t.link}</p>
        <a href={enviado.linkCliente} className="break-all font-medium text-primary underline underline-offset-4">
          {enviado.linkCliente}
        </a>
      </div>
      <Button type="button" variant="outline" className="self-start" onClick={onOtro}>
        {t.otro}
      </Button>
    </div>
  )
}
