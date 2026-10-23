// The case's state machine, shared by the operator's view, the server and the MCP.
// Each state shows only its own actions: this table is the only place that says which ones.

export const ESTADOS_ABIERTOS = [
  "pendiente_fotos",
  "pendiente_cita",
  "pendiente_inspeccion",
  "pendiente_tasacion",
  "pendiente_conseguir",
  "pendiente_propuesta",
  "propuesta_publicada",
  "pendiente_entrega",
] as const

export type EstadoAbierto = (typeof ESTADOS_ABIERTOS)[number]
export type Estado = EstadoAbierto | "cerrado"

// Until the proposal is published the case's data can still be corrected; after, it's frozen.
export const ESTADOS_EDITABLES: EstadoAbierto[] = [
  "pendiente_fotos",
  "pendiente_cita",
  "pendiente_inspeccion",
  "pendiente_tasacion",
  "pendiente_conseguir",
  "pendiente_propuesta",
]

export const NOMBRE_ESTADO: Record<Estado, string> = {
  pendiente_fotos: "Faltan las fotos",
  pendiente_cita: "Falta la cita",
  pendiente_inspeccion: "Cita agendada",
  pendiente_tasacion: "Falta la tasación",
  pendiente_conseguir: "Buscando el auto",
  pendiente_propuesta: "Falta la propuesta",
  propuesta_publicada: "Propuesta publicada",
  pendiente_entrega: "Falta la entrega",
  cerrado: "Cerrado",
}

export type Accion =
  | "llegaron_fotos"
  | "agendar_cita"
  | "marcar_inspeccionado"
  | "no_vino"
  | "cargar_tasacion"
  | "conseguido"
  | "proximo_aviso"
  | "publicar_propuesta"
  | "acepto_propuesta"
  | "cerrar_venta"
  | "perder"

export const ETIQUETA_ACCION: Record<Accion, string> = {
  llegaron_fotos: "Llegaron las fotos",
  agendar_cita: "Agendé la cita",
  marcar_inspeccionado: "Vino y lo revisamos",
  no_vino: "No vino",
  cargar_tasacion: "Cargar la tasación",
  conseguido: "Lo conseguí",
  proximo_aviso: "Fijar el próximo aviso",
  publicar_propuesta: "Publicar la propuesta",
  acepto_propuesta: "Aceptó la propuesta",
  cerrar_venta: "Se entregó: venta cerrada",
  perder: "No sirve",
}

export const ACCIONES_POR_ESTADO: Record<EstadoAbierto, Accion[]> = {
  pendiente_fotos: ["llegaron_fotos", "perder"],
  pendiente_cita: ["agendar_cita", "perder"],
  pendiente_inspeccion: ["marcar_inspeccionado", "no_vino", "perder"],
  pendiente_tasacion: ["cargar_tasacion", "perder"],
  pendiente_conseguir: ["conseguido", "proximo_aviso", "perder"],
  pendiente_propuesta: ["publicar_propuesta", "perder"],
  propuesta_publicada: ["acepto_propuesta", "perder"],
  pendiente_entrega: ["cerrar_venta", "perder"],
}

export function esEstado(valor: string): valor is Estado {
  return valor === "cerrado" || (ESTADOS_ABIERTOS as readonly string[]).includes(valor)
}

export function estadosDonde(accion: Accion): EstadoAbierto[] {
  return ESTADOS_ABIERTOS.filter((estado) => ACCIONES_POR_ESTADO[estado].includes(accion))
}

export const DIAS_VIGENCIA_PROPUESTA = 7
