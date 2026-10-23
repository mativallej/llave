// The stock's vocabulary, shared by the server (the agent, the domain) and the admin's client components.

// The fields the agent may deduce. The price is not here on purpose: only a person types it.
export const CAMPOS_FICHA = ["marca", "modelo", "version", "anio", "km"] as const
export type CampoFicha = (typeof CAMPOS_FICHA)[number]

export const SEGMENTOS = ["sedan", "hatchback", "suv", "pickup", "utilitario", "coupe", "monovolumen"] as const
export type Segmento = (typeof SEGMENTOS)[number]

export const TIPOS_FOTO = ["frente", "lateral", "atras", "interior", "tablero", "otra"] as const
export type TipoFoto = (typeof TIPOS_FOTO)[number]
