"use client"

import { ArrowUp, Camera, Images, MapPin } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { pedirSubidasCliente } from "@/app/acciones"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { EventoTurno, MensajeHistorial } from "@/lib/agente/tuerca"
import { CONTENIDO } from "@/lib/contenido"
import type { PedidoEnviado } from "@/lib/pedido/canal"
import { type AutoCanal, PEDIDO_VACIO, type Pedido } from "@/lib/pedido/tipos"
import { achicarFoto, subirFoto } from "@/lib/stock/subir-fotos"
import { cn } from "@/lib/utils"
import { Cierre, Enviado } from "./cierre"
import { MapaZona } from "./mapa-zona"
import { PanelPedido } from "./panel-pedido"
import { PedidoFotos } from "./pedido-fotos"
import { borrarRecibo, guardarRecibo, leerRecibo, type Recibo } from "./recibo"
import { TarjetaAuto, TarjetaPrecio } from "./tarjeta-auto"

type Tarjeta =
  | { tipo: "autos"; autos: AutoCanal[] }
  | { tipo: "precio"; autos: AutoCanal[] }
  | { tipo: "pedir_fotos" }
  | { tipo: "pedir_zona" }
  | { tipo: "resumen" }

type Mensaje = {
  id: string
  rol: "cliente" | "tuerca"
  texto: string
  fotos?: string[]
  vistas?: string[]
  tarjetas: Tarjeta[]
}

const MAX_FOTOS = 10

// The door. The box becomes the conversation without navigating; the request panel fills up while the
// client talks; at the end, the case and the WhatsApp handoff. The receipt stays at the top.
export function Canal({
  stock,
  destacados,
  plazoContacto,
}: {
  stock: AutoCanal[]
  destacados: AutoCanal[]
  plazoContacto: string
}) {
  const [chat, setChat] = useState("")
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [pedido, setPedido] = useState<Pedido>(PEDIDO_VACIO)
  const pedidoRef = useRef<Pedido>(PEDIDO_VACIO)
  const [escribiendo, setEscribiendo] = useState(false)
  const [texto, setTexto] = useState("")
  const [abierto, setAbierto] = useState<"fotos" | "zona" | null>(null)
  const [estadoFotos, setEstadoFotos] = useState<string | null>(null)
  const [enviado, setEnviado] = useState<PedidoEnviado | null>(null)
  const [recibo, setRecibo] = useState<Recibo | null>(null)
  const final = useRef<HTMLDivElement>(null)
  const seccion = useRef<HTMLElement>(null)
  const camara = useRef<HTMLInputElement>(null)
  const abortar = useRef<AbortController | null>(null)

  useEffect(() => {
    setChat(crypto.randomUUID())
    setRecibo(leerRecibo())
  }, [])

  useEffect(() => {
    if (mensajes.length === 0) return
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    final.current?.scrollIntoView({ block: "end", behavior: quieto ? "auto" : "smooth" })
  }, [mensajes])

  function fijarPedido(nuevo: Pedido) {
    pedidoRef.current = nuevo
    setPedido(nuevo)
  }

  function actualizarTuerca(id: string, cambio: (m: Mensaje) => Mensaje) {
    setMensajes((lista) => lista.map((m) => (m.id === id ? cambio(m) : m)))
  }

  async function enviar(contenido: string, extra: { fotos?: string[]; vistas?: string[] } = {}) {
    const limpio = contenido.trim()
    if ((!limpio && !extra.fotos?.length) || escribiendo) return
    setAbierto(null)
    setTexto("")

    const historial: MensajeHistorial[] = mensajes
      .filter((m) => m.texto.trim() || m.fotos?.length)
      .map((m) => ({ rol: m.rol, texto: m.texto, ...(m.fotos?.length ? { fotos: m.fotos } : {}) }))
    const mensaje: MensajeHistorial = { rol: "cliente", texto: limpio, ...(extra.fotos?.length ? { fotos: extra.fotos } : {}) }
    const idTuerca = crypto.randomUUID()
    setMensajes((lista) => [
      ...lista,
      { id: crypto.randomUUID(), rol: "cliente", texto: limpio, fotos: extra.fotos, vistas: extra.vistas, tarjetas: [] },
      { id: idTuerca, rol: "tuerca", texto: "", tarjetas: [] },
    ])
    setEscribiendo(true)

    const control = new AbortController()
    abortar.current = control
    try {
      const respuesta = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat, historial, mensaje, pedido: pedidoRef.current }),
        signal: control.signal,
      })
      if (!respuesta.ok || !respuesta.body) throw new Error(`chat ${respuesta.status}`)

      const lector = respuesta.body.getReader()
      const decodificador = new TextDecoder()
      let pendiente = ""
      for (;;) {
        const { value, done } = await lector.read()
        if (done) break
        pendiente += decodificador.decode(value, { stream: true })
        const lineas = pendiente.split("\n")
        pendiente = lineas.pop() ?? ""
        for (const linea of lineas) {
          if (linea.trim()) recibir(idTuerca, JSON.parse(linea) as EventoTurno)
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return
      actualizarTuerca(idTuerca, (m) => ({ ...m, texto: m.texto || CONTENIDO.asistente.error }))
    } finally {
      setEscribiendo(false)
    }
  }

  function recibir(idTuerca: string, evento: EventoTurno) {
    switch (evento.tipo) {
      case "texto":
        actualizarTuerca(idTuerca, (m) => ({ ...m, texto: m.texto + evento.delta }))
        break
      case "pedido":
        fijarPedido({ ...evento.pedido, zona: evento.pedido.zona ?? pedidoRef.current.zona })
        break
      case "fin":
        fijarPedido({ ...evento.pedido, zona: evento.pedido.zona ?? pedidoRef.current.zona })
        actualizarTuerca(idTuerca, (m) => ({ ...m, texto: evento.texto || m.texto }))
        break
      case "autos":
      case "precio":
        actualizarTuerca(idTuerca, (m) => ({ ...m, tarjetas: [...m.tarjetas, { tipo: evento.tipo, autos: evento.autos }] }))
        break
      case "pedir_fotos":
      case "pedir_zona":
      case "resumen":
        actualizarTuerca(idTuerca, (m) => ({ ...m, tarjetas: [...m.tarjetas, { tipo: evento.tipo }] }))
        break
    }
  }

  async function subirFotos(archivos: File[]) {
    const lugar = MAX_FOTOS - pedidoRef.current.fotos.length
    const lista = archivos.slice(0, Math.max(lugar, 0))
    if (lista.length === 0) return
    try {
      const rutas: string[] = []
      for (let i = 0; i < lista.length; i += 5) {
        const tanda = lista.slice(i, i + 5)
        const pedidas = await pedirSubidasCliente(tanda.length)
        if (!pedidas.ok) throw new Error(pedidas.error)
        for (const [j, archivo] of tanda.entries()) {
          setEstadoFotos(CONTENIDO.fotos.subiendo(i + j + 1, lista.length))
          const { ruta, token } = pedidas.subidas[j]
          await subirFoto(ruta, token, await achicarFoto(archivo))
          rutas.push(ruta)
        }
      }
      setEstadoFotos(null)
      fijarPedido({ ...pedidoRef.current, fotos: [...pedidoRef.current.fotos, ...rutas] })
      await enviar(CONTENIDO.fotos.mensajeEnvio(rutas.length), {
        fotos: rutas,
        vistas: lista.map((archivo) => URL.createObjectURL(archivo)),
      })
    } catch (e) {
      setEstadoFotos((e as Error).message || CONTENIDO.asistente.error)
    }
  }

  function elegirZona(zona: string) {
    fijarPedido({ ...pedidoRef.current, zona })
    void enviar(CONTENIDO.zona.mensaje(zona))
  }

  function alEnviar(resultado: PedidoEnviado) {
    abortar.current?.abort()
    const nuevo = { ref: resultado.ref, link: resultado.linkCliente, fecha: resultado.creadoEn }
    guardarRecibo(nuevo)
    setRecibo(nuevo)
    setEnviado(resultado)
    setEscribiendo(false)
  }

  function otroPedido() {
    abortar.current?.abort()
    setChat(crypto.randomUUID())
    setMensajes([])
    fijarPedido(PEDIDO_VACIO)
    setEnviado(null)
    setAbierto(null)
    setEstadoFotos(null)
  }

  function sembrar(contenido: string) {
    seccion.current?.scrollIntoView({ block: "start" })
    void enviar(contenido)
  }

  const conversando = mensajes.length > 0
  const ultimaTuerca = [...mensajes].reverse().find((m) => m.rol === "tuerca")?.id

  return (
    <>
      {recibo && (
        <div className="border-b bg-card">
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <p>
              <span className="font-medium">{CONTENIDO.recibo.titulo(recibo.ref)}</span>
              <span className="text-muted-foreground">
                {" · "}
                {new Date(recibo.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <Button asChild size="sm">
                <a href={recibo.link}>{CONTENIDO.recibo.ver}</a>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  borrarRecibo()
                  setRecibo(null)
                }}
              >
                {CONTENIDO.recibo.borrar}
              </Button>
            </div>
          </div>
        </div>
      )}

      <section ref={seccion} className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-8 pb-6">
        <p className="text-sm font-medium text-muted-foreground">
          {CONTENIDO.marca} · {CONTENIDO.lugar}
        </p>

        {enviado ? (
          <Enviado enviado={enviado} plazoContacto={plazoContacto} onOtro={otroPedido} />
        ) : (
          <>
            {!conversando ? (
              <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-semibold sm:text-4xl">{CONTENIDO.titular}</h1>
                <p className="text-muted-foreground">{CONTENIDO.bajada}</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">{CONTENIDO.asistente.aclaracion}</p>
                <PanelPedido pedido={pedido} stock={stock} />
                <ol className="flex flex-col gap-4" aria-live="polite">
                  {mensajes.map((m) => (
                    <li key={m.id} className={cn("flex flex-col gap-2", m.rol === "cliente" ? "items-end" : "items-start")}>
                      {m.rol === "tuerca" && (
                        <span className="text-xs font-medium text-muted-foreground">{CONTENIDO.asistente.nombre}</span>
                      )}
                      {m.vistas && m.vistas.length > 0 && (
                        <div className="flex max-w-[85%] flex-wrap justify-end gap-1">
                          {m.vistas.map((url) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={url} src={url} alt="" className="size-16 rounded-md object-cover" />
                          ))}
                        </div>
                      )}
                      {(m.texto || (m.rol === "tuerca" && escribiendo && m.id === ultimaTuerca)) && (
                        <p
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-2 whitespace-pre-wrap",
                            m.rol === "cliente" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                          )}
                        >
                          {m.texto || <span className="text-muted-foreground">{CONTENIDO.asistente.escribiendo}</span>}
                        </p>
                      )}
                      {m.tarjetas.map((tarjeta, i) => (
                        <div key={i} className="w-full">
                          {tarjeta.tipo === "autos" && (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {tarjeta.autos.map((auto) => (
                                <TarjetaAuto key={auto.slug} auto={auto} onMensaje={enviar} deshabilitado={escribiendo} />
                              ))}
                            </div>
                          )}
                          {tarjeta.tipo === "precio" && <TarjetaPrecio autos={tarjeta.autos} />}
                          {tarjeta.tipo === "pedir_fotos" && (
                            <PedidoFotos
                              onFotos={subirFotos}
                              onNoLasTengo={() => void enviar(CONTENIDO.fotos.mensajeNoLasTengo)}
                              estado={estadoFotos}
                              deshabilitado={escribiendo}
                            />
                          )}
                          {tarjeta.tipo === "pedir_zona" && <MapaZona elegida={pedido.zona} onElegir={elegirZona} />}
                          {tarjeta.tipo === "resumen" && (
                            <Cierre pedido={pedido} stock={stock} chat={chat} onEnviado={alEnviar} />
                          )}
                        </div>
                      ))}
                    </li>
                  ))}
                </ol>
                <div ref={final} />
              </>
            )}

            <div className={cn("flex flex-col gap-3", conversando && "sticky bottom-0 -mx-4 border-t bg-background px-4 pt-3 pb-4")}>
              {conversando && abierto === "fotos" && (
                <PedidoFotos
                  onFotos={subirFotos}
                  onNoLasTengo={() => void enviar(CONTENIDO.fotos.mensajeNoLasTengo)}
                  estado={estadoFotos}
                  deshabilitado={escribiendo}
                />
              )}
              {conversando && abierto === "zona" && <MapaZona elegida={pedido.zona} onElegir={elegirZona} />}
              {conversando && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={abierto === "fotos" ? "default" : "secondary"}
                    aria-expanded={abierto === "fotos"}
                    onClick={() => setAbierto(abierto === "fotos" ? null : "fotos")}
                  >
                    <Images />
                    {pedido.fotos.length > 0 ? CONTENIDO.fila.fotos(pedido.fotos.length) : CONTENIDO.fila.agregarFotos}
                  </Button>
                  <Button
                    type="button"
                    variant={abierto === "zona" ? "default" : "secondary"}
                    aria-expanded={abierto === "zona"}
                    onClick={() => setAbierto(abierto === "zona" ? null : "zona")}
                    className="min-w-0"
                  >
                    <MapPin />
                    <span className="truncate">{pedido.zona ?? CONTENIDO.fila.elegirZona}</span>
                  </Button>
                </div>
              )}

              <form
                className="flex items-end gap-2 rounded-2xl border bg-card p-2 focus-within:ring-2 focus-within:ring-ring/50"
                onSubmit={(e) => {
                  e.preventDefault()
                  void enviar(texto)
                }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={CONTENIDO.sacarFoto}
                  disabled={escribiendo}
                  onClick={() => camara.current?.click()}
                >
                  <Camera />
                </Button>
                <input
                  ref={camara}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  tabIndex={-1}
                  aria-label={CONTENIDO.sacarFoto}
                  onChange={(e) => {
                    const archivos = Array.from(e.target.files ?? [])
                    e.target.value = ""
                    if (archivos.length > 0) void subirFotos(archivos)
                  }}
                />
                <Textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      void enviar(texto)
                    }
                  }}
                  placeholder={CONTENIDO.placeholder}
                  aria-label={CONTENIDO.placeholder}
                  rows={conversando ? 1 : 3}
                  maxLength={2000}
                  className="min-h-0 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <Button type="submit" size="icon" aria-label={CONTENIDO.enviar} disabled={escribiendo || !texto.trim()}>
                  <ArrowUp />
                </Button>
              </form>
              {!conversando && estadoFotos && (
                <p role="status" className="text-sm text-muted-foreground">
                  {estadoFotos}
                </p>
              )}

              {!conversando && (
                <div className="flex flex-wrap gap-2">
                  {CONTENIDO.chips.map((chip) => (
                    <Button key={chip} type="button" variant="outline" size="sm" onClick={() => void enviar(chip)}>
                      {chip}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="grilla" className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10">
        <div className="flex flex-col gap-1">
          <h2 id="grilla" className="text-2xl font-semibold">
            {CONTENIDO.grilla.titulo}
          </h2>
          <p className="text-sm text-muted-foreground">{CONTENIDO.grilla.texto}</p>
        </div>
        {destacados.length === 0 ? (
          <p className="text-muted-foreground">{CONTENIDO.grilla.vacia}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {destacados.map((auto) => (
              <TarjetaAuto key={auto.slug} auto={auto} onMensaje={sembrar} deshabilitado={escribiendo || Boolean(enviado)} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
