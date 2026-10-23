import "server-only"
import { zodTextFormat } from "openai/helpers/zod"
import { z } from "zod"
import { CAMPOS_FICHA, type CampoFicha, SEGMENTOS, type Segmento, TIPOS_FOTO, type TipoFoto } from "@/lib/stock/campos"
import { CONFIG_BASE, openai } from "./cliente"

const Respuesta = z.object({
  marca: z.string().nullable(),
  modelo: z.string().nullable(),
  version: z.string().nullable(),
  anio: z.number().int().nullable(),
  km: z.number().int().nullable(),
  segmento: z.enum(SEGMENTOS).nullable(),
  fotos: z.array(z.object({ indice: z.number().int(), tipo: z.enum(TIPOS_FOTO) })),
})

const INSTRUCCIONES = `Armás la ficha de un auto usado que entró al stock de una concesionaria, a partir de una línea que escribió el vendedor y de las fotos.

Completás un campo solo si está en la evidencia. Si no está, va null. Nunca lo deducís de lo que suele tener un auto así.
- marca, modelo y version: de la línea, o de lo que se lee en una insignia de las fotos. La versión es la denominación comercial (XEI, Highline, Privilege), no el motor.
- anio y km: solo de la línea, nunca de las fotos. "78 mil" son 78000 km. Un número de cuatro cifras entre 1950 y el año actual suele ser el año.
- segmento: por la carrocería que se ve en las fotos o por el modelo nombrado. Si no hay cómo saberlo, null.
- fotos: para cada foto, por su índice empezando en 0, qué muestra.

No opinás del estado del auto ni de su precio.`

export type Ficha = {
  marca: string | null
  modelo: string | null
  version: string | null
  anio: number | null
  km: number | null
  segmento: Segmento | null
  tipos: TipoFoto[]
  faltantes: CampoFicha[]
}

// Reads the line and the photos and returns what it could deduce plus what it couldn't.
// Never invents: what isn't in the evidence comes back null and listed as missing.
export async function extraerFicha(linea: string, urlsFotos: string[]): Promise<Ficha> {
  const respuesta = await openai().responses.parse({
    ...CONFIG_BASE,
    instructions: INSTRUCCIONES,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: `Línea del vendedor: ${linea}` },
          ...urlsFotos.map((url) => ({ type: "input_image" as const, image_url: url, detail: "auto" as const })),
        ],
      },
    ],
    text: { format: zodTextFormat(Respuesta, "ficha") },
  })

  const leida = respuesta.output_parsed
  if (!leida) throw new Error("extraerFicha: the model returned no parsed ficha")

  // The year and the km come only from the line. If the line doesn't back them up, they don't stand.
  const anio = leida.anio !== null && linea.includes(String(leida.anio)) ? leida.anio : null
  const sinAnio = anio === null ? linea : linea.replace(String(anio), "")
  const km = leida.km !== null && /\d/.test(sinAnio) ? leida.km : null

  const tipos = urlsFotos.map(
    (_, i) => leida.fotos.find((foto) => foto.indice === i)?.tipo ?? ("otra" as const),
  )

  const ficha = {
    marca: limpio(leida.marca),
    modelo: limpio(leida.modelo),
    version: limpio(leida.version),
    anio,
    km,
    segmento: leida.segmento,
  }
  const faltantes = CAMPOS_FICHA.filter((campo) => ficha[campo] === null)
  return { ...ficha, tipos, faltantes }
}

function limpio(texto: string | null): string | null {
  const t = texto?.trim()
  return t ? t : null
}
