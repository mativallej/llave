import Link from "next/link"
import { ArrowRight, Car, Banknote, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"

const intents = [
  {
    href: "/comprar",
    icon: Car,
    title: "Quiero comprar",
    desc: "Contanos qué buscás y te conseguimos opciones.",
  },
  {
    href: "/vender",
    icon: Banknote,
    title: "Quiero vender",
    desc: "Te cotizamos tu auto en 24-48hs.",
  },
  {
    href: "/cambiar",
    icon: Repeat,
    title: "Quiero cambiar",
    desc: "Permuta + saldo. Lo más elegido.",
    featured: true,
  },
] as const

export function IntentCards() {
  return (
    <section
      id="intenciones"
      aria-label="¿Qué necesitás hacer?"
      className="mx-auto max-w-6xl px-4 md:px-6"
    >
      <div className="sr-only" id="intenciones-heading">
        ¿Qué necesitás hacer?
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {intents.map(({ href, icon: Icon, title, desc, featured }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative flex items-start gap-4 rounded-xl p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated md:flex-col md:gap-3 md:p-6",
              featured
                ? "bg-foreground text-background"
                : "bg-card text-foreground",
            )}
          >
            {featured && (
              <span className="absolute -top-2 right-4 rounded-full bg-background px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground shadow-card">
                Más elegido
              </span>
            )}
            <span
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-full md:h-12 md:w-12",
                featured
                  ? "bg-background text-foreground"
                  : "bg-secondary text-foreground",
              )}
            >
              <Icon className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between md:mt-1">
                <h3 className="text-lg font-bold md:text-xl">{title}</h3>
                <ArrowRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 md:hidden",
                    featured ? "text-background" : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                />
              </div>
              <p
                className={cn(
                  "mt-1 text-sm leading-relaxed",
                  featured ? "text-background/80" : "text-muted-foreground",
                )}
              >
                {desc}
              </p>
              <span className="mt-3 hidden items-center gap-1 text-sm font-semibold md:inline-flex">
                Empezar
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
