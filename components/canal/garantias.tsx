import { Check } from "lucide-react"
import { CONTENIDO } from "@/lib/contenido"

// The five product guarantees always; Falkenberg's five only when config says Andrés accepted them in
// writing. The flag is read on the server and arrives here as a prop: off means not in the HTML at all.
export function Garantias({ mostrarFalkenberg }: { mostrarFalkenberg: boolean }) {
  const frases = mostrarFalkenberg
    ? [...CONTENIDO.garantias.producto, ...CONTENIDO.garantias.falkenberg]
    : CONTENIDO.garantias.producto

  return (
    <section aria-labelledby="garantias" className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10">
      <h2 id="garantias" className="text-2xl font-semibold">
        {CONTENIDO.garantias.titulo}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {frases.map((frase) => (
          <li key={frase} className="flex items-start gap-3 rounded-lg border bg-card p-4">
            <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>{frase}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
