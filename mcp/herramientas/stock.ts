import "server-only"
import { z } from "zod"
import { SEGMENTOS } from "@/lib/stock/campos"
import {
  type Auto,
  completarAuto,
  crearAutoDesdeLinea,
  despublicarAuto,
  diasDesde,
  faltantesDe,
  importarFotos,
  listarStock,
  marcarVendido,
  nombreAuto,
  ponerPrecio,
  publicarAuto,
  stockDesactualizado,
  urlsFirmadas,
  verAuto,
} from "@/lib/stock/stock"
import { definir } from "../herramienta"

// The same domain operations the admin calls: one place for the rules, two surfaces.

const slug = z.string().min(1).describe("El slug del auto, como lo devuelve buscar_stock")

function resumen(auto: Auto) {
  return {
    slug: auto.slug,
    nombre: nombreAuto(auto),
    marca: auto.marca,
    modelo: auto.modelo,
    version: auto.version,
    anio: auto.anio,
    km: auto.km,
    precio: auto.precio,
    publicado: auto.publicado,
    dias_sin_actualizar: diasDesde(auto.actualizado_en),
    falta_confirmar: faltantesDe(auto),
  }
}

export const herramientasStock = [
  definir({
    nombre: "buscar_stock",
    descripcion:
      "Lista el stock que no está vendido, con marca, modelo, año, km, precio, si está publicado y los días sin actualizar. Se puede filtrar por marca o modelo y por publicado.",
    lectura: true,
    entrada: {
      buscar: z.string().optional().describe("Marca o modelo, por ejemplo 'corolla'"),
      publicado: z.boolean().optional().describe("true: solo publicados; false: solo borradores"),
    },
    ejecutar: async ({ buscar, publicado }) => {
      const texto = buscar?.trim().toLowerCase()
      return (await listarStock())
        .filter((auto) => publicado === undefined || auto.publicado === publicado)
        .filter((auto) => !texto || nombreAuto(auto).toLowerCase().includes(texto))
        .map(resumen)
    },
  }),

  definir({
    nombre: "ver_auto",
    descripcion: "La ficha completa de un auto, con links a sus fotos (valen una hora).",
    lectura: true,
    entrada: { slug },
    ejecutar: async ({ slug }) => {
      const auto = await verAuto(slug)
      const urls = await urlsFirmadas(auto.fotos)
      return {
        ...resumen(auto),
        segmento: auto.segmento,
        vendido_en: auto.vendido_en,
        fotos: auto.fotos.map((ruta) => urls[ruta]).filter(Boolean),
      }
    },
  }),

  definir({
    nombre: "stock_desactualizado",
    descripcion:
      "Los autos publicados que llevan más de 14 días sin tocar: los que más probablemente ya se vendieron y siguen en la página.",
    lectura: true,
    entrada: {},
    ejecutar: async () => (await stockDesactualizado()).map(resumen),
  }),

  definir({
    nombre: "cargar_auto",
    descripcion:
      "Da de alta un auto a partir de la línea que mandó el vendedor y de las fotos. Deduce lo que está en la línea y en las fotos, nunca inventa un dato, y devuelve lo que falta confirmar. El auto queda sin publicar y sin precio.",
    lectura: false,
    entrada: {
      linea: z.string().min(1).describe("La línea tal como la mandaron, por ejemplo 'Entró un Corolla XEI 2019 con 78 mil'"),
      fotos: z
        .array(z.string())
        .max(12)
        .describe("Links https a las fotos (o rutas absolutas a archivos si el servidor corre en la compu del operador)"),
    },
    ejecutar: async ({ linea, fotos }, { archivosLocales }) => {
      const rutas = await importarFotos(fotos, { archivosLocales })
      const { auto, faltantes } = await crearAutoDesdeLinea(linea, rutas)
      return {
        ...resumen(auto),
        fotos: rutas.length,
        falta: ["precio", ...faltantes],
        siguiente:
          faltantes.length > 0
            ? "Confirmá lo que falta con completar_auto, después poner_precio y publicar_auto."
            : "Falta el precio: poner_precio, y después publicar_auto.",
      }
    },
  }),

  definir({
    nombre: "completar_auto",
    descripcion:
      "Completa o corrige datos de la ficha de un auto: marca, modelo, versión, año, km o segmento. No toca el precio: eso es poner_precio.",
    lectura: false,
    entrada: {
      slug,
      marca: z.string().optional(),
      modelo: z.string().optional(),
      version: z.string().optional().describe("Vacío si el auto no tiene versión"),
      anio: z.number().int().optional(),
      km: z.number().int().nonnegative().optional(),
      segmento: z.enum(SEGMENTOS).optional(),
    },
    ejecutar: async ({ slug, ...campos }) => resumen(await completarAuto(slug, campos)),
  }),

  definir({
    nombre: "poner_precio",
    descripcion:
      "Fija el precio público de un auto del stock, en pesos. Va en una llamada propia porque es público y es una garantía: lo dicta una persona.",
    lectura: false,
    entrada: { slug, precio: z.number().positive().describe("En pesos, sin puntos") },
    ejecutar: async ({ slug, precio }) => resumen(await ponerPrecio(slug, precio)),
  }),

  definir({
    nombre: "publicar_auto",
    descripcion: "Publica un auto en la página. Falla si le falta el precio o algún dato que ve el cliente.",
    lectura: false,
    entrada: { slug },
    ejecutar: async ({ slug }) => resumen(await publicarAuto(slug)),
  }),

  definir({
    nombre: "despublicar_auto",
    descripcion: "Saca un auto de la página sin marcarlo como vendido.",
    lectura: false,
    entrada: { slug },
    ejecutar: async ({ slug }) => resumen(await despublicarAuto(slug)),
  }),

  definir({
    nombre: "marcar_vendido",
    descripcion: "Marca un auto como vendido y lo despublica en la misma operación. No se deshace desde acá.",
    lectura: false,
    destructiva: true,
    entrada: { slug },
    ejecutar: async ({ slug }) => resumen(await marcarVendido(slug)),
  }),
]
