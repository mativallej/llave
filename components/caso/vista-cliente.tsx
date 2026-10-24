import { CONTENIDO } from "@/lib/contenido"
import type { Mostrador } from "@/lib/caso/mostrador"

// Server component on purpose: the client's HTML carries what the client sees and nothing else.
export function VistaCliente({ ref_, mostrador }: { ref_: string; mostrador: Mostrador }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{CONTENIDO.marca}</p>
        <h1 className="text-2xl font-semibold">Tu pedido {ref_}</h1>
      </header>

      <section aria-labelledby="sigue" className="flex flex-col gap-2 rounded-lg border bg-card p-4">
        <h2 id="sigue" className="sr-only">
          Qué falta y qué sigue
        </h2>
        {mostrador.falta && (
          <p>
            <span className="font-medium">Falta: </span>
            {mostrador.falta}
          </p>
        )}
        <p>
          <span className="font-medium">Sigue: </span>
          {mostrador.sigue}
        </p>
        {mostrador.vigencia && <p className="font-medium text-primary">{mostrador.vigencia}</p>}
      </section>

      {mostrador.busqueda && (
        <section aria-labelledby="busqueda" className="flex flex-col gap-1 rounded-lg border bg-card p-4">
          <h2 id="busqueda" className="font-medium">
            Lo que estamos buscando
          </h2>
          <p>{mostrador.busqueda.que}</p>
          {mostrador.busqueda.desde && (
            <p className="text-sm text-muted-foreground">Desde el {mostrador.busqueda.desde}.</p>
          )}
          <p className="text-sm">{mostrador.busqueda.aviso}</p>
        </section>
      )}

      <section aria-labelledby="numeros" className="flex flex-col gap-3">
        <h2 id="numeros" className="text-lg font-semibold">
          Los números
        </h2>
        <dl className="flex flex-col divide-y rounded-lg border bg-card">
          {mostrador.numeros.map((numero) => (
            <div key={numero.titulo} className="flex flex-col gap-0.5 p-4">
              <dt className="text-sm text-muted-foreground">{numero.titulo}</dt>
              {numero.valor ? (
                <dd className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-xl font-semibold">{numero.valor}</span>
                  {numero.fijado && <span className="text-xs text-muted-foreground">fijado el {numero.fijado}</span>}
                </dd>
              ) : (
                <dd className="text-sm">{numero.pendiente}</dd>
              )}
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="linea" className="flex flex-col gap-3">
        <h2 id="linea" className="text-lg font-semibold">
          Lo que pasó
        </h2>
        <ol className="flex flex-col gap-3 border-l-2 border-primary/40 pl-4">
          {mostrador.linea.map((paso) => (
            <li key={paso.que} className="flex flex-col">
              <span>{paso.que}</span>
              <span className="text-sm text-muted-foreground">{paso.fecha}</span>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-sm text-muted-foreground">
        Este link es tuyo: guardalo, acá ves en qué está tu pedido cuando quieras.
      </p>
    </main>
  )
}
