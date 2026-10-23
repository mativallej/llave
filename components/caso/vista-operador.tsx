import { Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AutoDelCaso, Caso } from "@/lib/caso/caso"
import { ESTADOS_EDITABLES, type EstadoAbierto, esEstado, NOMBRE_ESTADO } from "@/lib/caso/estados"
import { fechaConHora, fechaCorta } from "@/lib/caso/mostrador"
import { kilometros, pesos } from "@/lib/formato"
import type { AutoEntrega } from "@/lib/pedido/tipos"
import { AccionesEstado } from "./acciones-estado"
import { Corregir, Marcas, NuevaNota, PedirAlCliente } from "./operador-extras"

const NOMBRE_EVENTO: Record<string, string> = {
  pedido_enviado: "Pedido recibido",
  caso_abierto_operador: "Primera vez que se abrió este link",
  cita_agendada: "Cita agendada",
  cita_cumplida: "Vino a la cita",
  propuesta_publicada: "Propuesta publicada",
  venta_cerrada: "Venta cerrada",
  caso_perdido: "Caso perdido",
  renegociacion: "Se renegoció en la entrega",
}

export function VistaOperador({
  token,
  caso,
  autos,
  fotos,
  eventos,
  notas,
  historial,
}: {
  token: string
  caso: Caso
  autos: AutoDelCaso[]
  fotos: string[]
  eventos: { tipo: string; en: string }[]
  notas: { texto: string; autor: string | null; creada_en: string }[]
  historial: { ref: string; estado: string; cerro: boolean | null; creado_en: string }[]
}) {
  const estado = esEstado(caso.estado) ? caso.estado : "cerrado"
  const entrega = caso.auto_entrega as AutoEntrega | null
  const descripcionEntrega = entrega
    ? [[entrega.marca, entrega.modelo, entrega.version, entrega.anio].filter(Boolean).join(" "), entrega.km !== null ? kilometros(entrega.km) : null]
        .filter(Boolean)
        .join(", ")
    : null
  const seLleva =
    autos.length > 0
      ? autos.map((a) => `${a.nombre}${a.precio !== null ? `, ${pesos(a.precio)}` : ""}`).join("; ")
      : (caso.auto_busca ?? (caso.salida === "0km" ? "Un 0km" : "Un usado"))
  const abierto = estado !== "cerrado"
  const ventaCerrada = estado === "cerrado" && caso.cerro === true

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{caso.ref}</h1>
          <Badge variant={abierto ? "default" : "outline"}>
            {estado === "cerrado" ? (caso.cerro ? "Venta cerrada" : "Perdido") : NOMBRE_ESTADO[estado]}
          </Badge>
        </div>
        <p>
          {caso.nombre ?? "Sin nombre"} · {caso.telefono}
        </p>
        <Button asChild variant="secondary" size="sm" className="self-start">
          <a href={`tel:${caso.telefono}`}>
            <Phone /> Llamar
          </a>
        </Button>
      </header>

      {abierto && <AccionesEstado token={token} estado={estado as EstadoAbierto} />}

      <section aria-labelledby="datos" className="flex flex-col gap-2 rounded-lg border bg-card p-4">
        <h2 id="datos" className="font-medium">
          El pedido
        </h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Entrega</dt>
          <dd>{descripcionEntrega ?? "No entrega auto"}</dd>
          <dt className="text-muted-foreground">Se lleva</dt>
          <dd>{seLleva}</dd>
          <dt className="text-muted-foreground">Zona</dt>
          <dd>{caso.zona ?? "Sin decir"}</dd>
          {caso.cita_en && (
            <>
              <dt className="text-muted-foreground">Cita</dt>
              <dd>{fechaConHora(caso.cita_en)}</dd>
            </>
          )}
          {caso.proximo_aviso && (
            <>
              <dt className="text-muted-foreground">Próximo aviso</dt>
              <dd>{caso.proximo_aviso.split("-").reverse().join("/")}</dd>
            </>
          )}
          {caso.motivo_perdida && (
            <>
              <dt className="text-muted-foreground">Por qué se cayó</dt>
              <dd>{caso.motivo_perdida}</dd>
            </>
          )}
        </dl>
        {fotos.length > 0 ? (
          <ul className="mt-2 grid grid-cols-3 gap-2">
            {fotos.map((url, i) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${i + 1}`} className="aspect-[4/3] w-full rounded-md object-cover" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sin fotos todavía.</p>
        )}
      </section>

      <section aria-labelledby="numeros" className="flex flex-col gap-2 rounded-lg border bg-card p-4">
        <h2 id="numeros" className="font-medium">
          Los números
        </h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Lo que se lleva</dt>
          <dd>
            {caso.precio_salida !== null ? pesos(caso.precio_salida) : "Sin precio"}
            {caso.precio_salida_en && <span className="text-muted-foreground"> · {fechaCorta(caso.precio_salida_en)}</span>}
          </dd>
          {entrega && (
            <>
              <dt className="text-muted-foreground">El que entrega</dt>
              <dd>
                {caso.valor_toma !== null ? pesos(caso.valor_toma) : "Sin tasar"}
                {caso.valor_toma_en && <span className="text-muted-foreground"> · {fechaCorta(caso.valor_toma_en)}</span>}
              </dd>
            </>
          )}
          {caso.vence_prop && (
            <>
              <dt className="text-muted-foreground">La propuesta vence</dt>
              <dd>{fechaCorta(caso.vence_prop)}</dd>
            </>
          )}
        </dl>
      </section>

      {(estado === "pendiente_entrega" || ventaCerrada) && (
        <Marcas token={token} renegocio={caso.renegocio} ventaCerrada={ventaCerrada} ventaNueva={caso.venta_nueva} />
      )}
      {abierto && (ESTADOS_EDITABLES as string[]).includes(estado) && (
        <Corregir token={token} datos={{ nombre: caso.nombre, auto_busca: caso.auto_busca, zona: caso.zona }} />
      )}
      {abierto && <PedirAlCliente token={token} />}

      <section aria-labelledby="notas" className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        <h2 id="notas" className="font-medium">
          Notas
        </h2>
        {notas.length > 0 && (
          <ul className="flex flex-col gap-2 text-sm">
            {notas.map((nota) => (
              <li key={nota.creada_en + nota.texto}>
                <p className="whitespace-pre-wrap">{nota.texto}</p>
                <p className="text-xs text-muted-foreground">
                  {nota.autor ?? "Sin autor"} · {fechaConHora(nota.creada_en)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <NuevaNota token={token} />
      </section>

      <section aria-labelledby="historial" className="flex flex-col gap-2 rounded-lg border bg-card p-4">
        <h2 id="historial" className="font-medium">
          Otros pedidos de este teléfono
        </h2>
        {historial.length === 0 ? (
          <p className="text-sm text-muted-foreground">Es el primero.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {historial.map((h) => (
              <li key={h.ref}>
                {h.ref} · {esEstado(h.estado) ? (h.estado === "cerrado" ? (h.cerro ? "Venta cerrada" : "Perdido") : NOMBRE_ESTADO[h.estado]) : h.estado} ·{" "}
                {fechaCorta(h.creado_en)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="eventos" className="flex flex-col gap-2">
        <h2 id="eventos" className="font-medium">
          Lo que pasó
        </h2>
        <ol className="flex flex-col gap-1 text-sm">
          {eventos.map((e, i) => (
            <li key={i}>
              {NOMBRE_EVENTO[e.tipo] ?? e.tipo} <span className="text-muted-foreground">· {fechaConHora(e.en)}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
