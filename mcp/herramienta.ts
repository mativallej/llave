import type { z, ZodRawShape } from "zod"
import type { Rol } from "@/lib/auth/rol"
import type { OperadorMcp } from "@/lib/operador"

// What a tool is. Kept apart from the server so the tool modules don't import it back.

// origen: the app's URL, to build case links. Unknown over stdio.
export type Contexto = { operador: OperadorMcp; origen?: string }

export type Herramienta<S extends ZodRawShape = ZodRawShape> = {
  nombre: string
  descripcion: string
  entrada: S
  lectura: boolean
  destructiva?: boolean
  roles?: Rol[]
  ejecutar: (args: z.infer<z.ZodObject<S>>, contexto: Contexto) => Promise<unknown>
}

export function definir<S extends ZodRawShape>(herramienta: Herramienta<S>): Herramienta<S> {
  return herramienta
}
