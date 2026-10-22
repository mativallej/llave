import { ClipboardList, Search, MessageCircle } from "lucide-react"

const steps = [
  {
    n: 1,
    icon: ClipboardList,
    title: "Llenás el form",
    desc: "5 campos, 2 minutos.",
  },
  {
    n: 2,
    icon: Search,
    title: "Trabajamos tu pedido",
    desc: "Andrés y el equipo lo evalúan en 24-48hs.",
  },
  {
    n: 3,
    icon: MessageCircle,
    title: "Te llega la propuesta por WhatsApp",
    desc: "Auto, cuota, permuta y saldo. Todo en un mensaje.",
  },
] as const

export function HowItWorks() {
  return (
    <section className="mx-auto mt-12 max-w-6xl px-4 md:mt-20 md:px-6">
      <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
        Cómo funciona
      </h2>
      <p className="mt-1 text-sm text-muted-foreground md:text-base">
        Simple. Sin idas y vueltas.
      </p>

      <ol className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        {steps.map(({ n, icon: Icon, title, desc }) => (
          <li
            key={n}
            className="relative rounded-xl bg-card p-5 shadow-card md:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-sm font-bold text-background">
                {n}
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <h3 className="mt-4 text-lg font-bold leading-tight md:text-xl">
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
