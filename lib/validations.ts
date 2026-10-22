import { z } from "zod"

// WhatsApp argentino. Aceptamos formatos:
//  +54 9 3492 555123 / 03492555123 / 3492555123 / 549...
//  Mínimo 10 dígitos, máximo 15.
const phoneRegex = /^[+\d\s\-()]{10,20}$/

const whatsappSchema = z
  .string({ required_error: "Necesitamos tu WhatsApp" })
  .min(8, "Número muy corto")
  .max(20, "Número muy largo")
  .regex(phoneRegex, "Ingresá un número válido (ej: +54 9 3492 555123)")

const zonaSchema = z
  .string({ required_error: "Decinos tu zona" })
  .min(2, "Decinos tu zona")
  .max(80, "Demasiado largo")

const provinciaSchema = z
  .string({ required_error: "Elegí una provincia" })
  .min(1, "Elegí una provincia")

const ciudadSchema = z
  .string({ required_error: "Elegí una ciudad" })
  .min(1, "Elegí una ciudad")

export const comprarSchema = z
  .object({
    marca: z
      .string({ required_error: "Elegí una marca" })
      .min(1, "Elegí una marca"),
    modelos: z
      .array(z.string())
      .min(1, "Elegí al menos un modelo")
      .max(8, "Máximo 8 modelos"),
    tipoOperacion: z.enum(["contado", "financiado", "permuta"], {
      required_error: "Elegí cómo querés operar",
    }),
    usadoDescripcion: z.string().max(500, "Máximo 500 caracteres").optional(),
    nombre: z
      .string({ required_error: "Decinos tu nombre" })
      .min(2, "Mínimo 2 caracteres")
      .max(50, "Máximo 50 caracteres"),
    apellido: z
      .string({ required_error: "Decinos tu apellido" })
      .min(2, "Mínimo 2 caracteres")
      .max(50, "Máximo 50 caracteres"),
    provincia: provinciaSchema,
    ciudad: ciudadSchema,
    telefono: whatsappSchema,
  })
  .superRefine((data, ctx) => {
    if (data.tipoOperacion === "permuta") {
      const desc = data.usadoDescripcion?.trim() ?? ""
      if (desc.length < 15) {
        ctx.addIssue({
          path: ["usadoDescripcion"],
          code: z.ZodIssueCode.custom,
          message: "Contanos un poco más sobre tu usado (mínimo 15 caracteres)",
        })
      }
    }
  })
export type ComprarInput = z.infer<typeof comprarSchema>

export const venderSchema = z.object({
  marca: z
    .string({ required_error: "Elegí una marca" })
    .min(1, "Elegí una marca"),
  modelo: z
    .string({ required_error: "Elegí un modelo" })
    .min(1, "Elegí un modelo"),
  anio: z.coerce
    .number({ invalid_type_error: "Año inválido" })
    .int("Año inválido")
    .min(1990, "Año mínimo 1990")
    .max(2026, "Año máximo 2026"),
  km: z.coerce
    .number({ invalid_type_error: "Kilómetros inválidos" })
    .int("Kilómetros inválidos")
    .min(0, "No puede ser negativo")
    .max(1_000_000, "Demasiados km"),
  estado: z.enum(["excelente", "muy-bueno", "bueno", "regular"], {
    required_error: "Elegí el estado",
  }),
  fotos: z
    .array(z.any())
    .min(1, "Subí al menos una foto")
    .max(12, "Máximo 12 fotos"),
  nombre: z
    .string({ required_error: "Decinos tu nombre" })
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres"),
  apellido: z
    .string({ required_error: "Decinos tu apellido" })
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres"),
  provincia: provinciaSchema,
  ciudad: ciudadSchema,
  telefono: whatsappSchema,
})
export type VenderInput = z.infer<typeof venderSchema>

export const cambiarSchema = z.object({
  // Tu auto actual
  tuMarca: z
    .string({ required_error: "Elegí una marca" })
    .min(1, "Elegí una marca"),
  tuModelo: z
    .string({ required_error: "Elegí un modelo" })
    .min(1, "Elegí un modelo"),
  tuAnio: z.coerce
    .number({ invalid_type_error: "Año inválido" })
    .int("Año inválido")
    .min(1990, "Año mínimo 1990")
    .max(2026, "Año máximo 2026"),
  tuKm: z.coerce
    .number({ invalid_type_error: "Kilómetros inválidos" })
    .int("Kilómetros inválidos")
    .min(0, "No puede ser negativo")
    .max(1_000_000, "Demasiados km"),
  tuEstado: z.enum(["excelente", "muy-bueno", "bueno", "regular"], {
    required_error: "Elegí el estado",
  }),
  tuFotos: z
    .array(z.any())
    .min(1, "Subí al menos una foto")
    .max(12, "Máximo 12 fotos"),
  // Lo que querés
  buscaMarca: z
    .string({ required_error: "Elegí una marca" })
    .min(1, "Elegí una marca"),
  buscaModelos: z
    .array(z.string())
    .min(1, "Elegí al menos un modelo")
    .max(8, "Máximo 8 modelos"),
  presupuestoExtra: z.enum(
    ["hasta-5m", "5-15m", "15-30m", "mas-30m", "con-financiacion"],
    { required_error: "Elegí un presupuesto extra" },
  ),
  // Contacto
  nombre: z
    .string({ required_error: "Decinos tu nombre" })
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres"),
  apellido: z
    .string({ required_error: "Decinos tu apellido" })
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres"),
  provincia: provinciaSchema,
  ciudad: ciudadSchema,
  telefono: whatsappSchema,
})
export type CambiarInput = z.infer<typeof cambiarSchema>
