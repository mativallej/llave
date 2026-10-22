const tags = [
  "Compramos, vendemos y cambiamos",
  "Multimarca",
  "0km y usados hasta 10 años",
  "Rango $5M - $50M",
  "Rafaela + 80km a la redonda",
]

export function WhatWeDo() {
  return (
    <section className="mx-auto mt-12 max-w-6xl px-4 md:mt-16 md:px-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Qué hacemos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Foco en permuta, atención humana, sin vueltas.
          </p>
        </div>
      </div>
      <ul className="mt-5 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag}>
            <span className="inline-flex items-center rounded-full bg-secondary px-4 py-2 text-xs font-medium text-foreground md:text-sm">
              {tag}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
