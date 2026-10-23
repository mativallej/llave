import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { VistaCliente } from "@/components/caso/vista-cliente"
import { VistaOperador } from "@/components/caso/vista-operador"
import {
  autosDelCaso,
  casoPorId,
  esVistaPrevia,
  eventosDelCaso,
  fotosDelCaso,
  historialTelefono,
  notasDelCaso,
  resolverAcceso,
} from "@/lib/caso/caso"
import { esEstado } from "@/lib/caso/estados"
import { armarMostrador } from "@/lib/caso/mostrador"

// The token is the authentication: no login. It resolves the role and renders one of the two views.
export const dynamic = "force-dynamic"

// Nothing about the case in the metadata: WhatsApp shows it in the link preview.
export const metadata: Metadata = {
  title: "Tu pedido — Falkenberg Meyer Automotores",
  robots: { index: false, follow: false },
}

export default async function PaginaCaso({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const agente = (await headers()).get("user-agent")
  const acceso = await resolverAcceso(token, { registrarApertura: !esVistaPrevia(agente) })
  if (!acceso) notFound()

  const caso = await casoPorId(acceso.casoId)
  const [autos, eventos] = await Promise.all([autosDelCaso(caso), eventosDelCaso(caso.id)])

  if (acceso.rol === "cliente") {
    const seLleva =
      autos.length > 0 ? autos.map((a) => a.nombre).join("; ") : (caso.auto_busca ?? (caso.salida === "0km" ? "un 0km" : null))
    const mostrador = armarMostrador({
      estado: esEstado(caso.estado) ? caso.estado : "cerrado",
      cerro: caso.cerro,
      creado_en: caso.creado_en,
      entrega: caso.auto_entrega !== null,
      se_lleva: seLleva,
      fotos_en: caso.fotos_en,
      cita_en: caso.cita_en,
      precio_salida: caso.precio_salida,
      precio_salida_en: caso.precio_salida_en,
      valor_toma: caso.valor_toma,
      valor_toma_en: caso.valor_toma_en,
      vence_prop: caso.vence_prop,
      buscando_desde: caso.buscando_desde,
      proximo_aviso: caso.proximo_aviso,
      eventos,
    })
    return <VistaCliente ref_={caso.ref} mostrador={mostrador} />
  }

  const [fotos, notas, historial] = await Promise.all([
    fotosDelCaso(caso.id),
    notasDelCaso(caso.id),
    historialTelefono(caso.telefono, caso.id),
  ])
  return (
    <VistaOperador
      token={token}
      caso={caso}
      autos={autos}
      fotos={fotos}
      eventos={eventos}
      notas={notas}
      historial={historial}
    />
  )
}
