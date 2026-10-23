import { Canal } from "@/components/canal/canal"
import { ComoFunciona } from "@/components/canal/como-funciona"
import { Garantias } from "@/components/canal/garantias"
import { leerConfig } from "@/lib/config"
import { CONTENIDO } from "@/lib/contenido"
import { stockCanal } from "@/lib/pedido/canal"

// The stock and the config are read on every request: publishing a car or switching on the guarantees
// shows up here without a redeploy.
export const dynamic = "force-dynamic"

export default async function Inicio() {
  const [stock, garantiasFalkenberg, plazoContacto] = await Promise.all([
    stockCanal(),
    leerConfig("garantias_falkenberg"),
    leerConfig("plazo_contacto"),
  ])

  return (
    <main className="flex min-h-dvh flex-col">
      <Canal stock={stock} destacados={stock.slice(0, 6)} plazoContacto={plazoContacto} />
      <ComoFunciona />
      <Garantias mostrarFalkenberg={garantiasFalkenberg} />
      <footer className="mx-auto w-full max-w-3xl px-4 py-8 text-sm text-muted-foreground">
        <p>
          {CONTENIDO.marca} · {CONTENIDO.lugar}
        </p>
        <p>{CONTENIDO.asistente.aclaracion}</p>
      </footer>
    </main>
  )
}
