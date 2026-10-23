import { CONTENIDO } from "@/lib/contenido"

export function ComoFunciona() {
  return (
    <section aria-labelledby="como-funciona" className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10">
      <h2 id="como-funciona" className="text-2xl font-semibold">
        {CONTENIDO.comoFunciona.titulo}
      </h2>
      <ol className="grid gap-4 sm:grid-cols-3">
        {CONTENIDO.comoFunciona.pasos.map((paso, i) => (
          <li key={paso.titulo} className="flex flex-col gap-2 rounded-lg border bg-card p-4">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            >
              {i + 1}
            </span>
            <h3 className="font-medium">{paso.titulo}</h3>
            <p className="text-sm text-muted-foreground">{paso.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
