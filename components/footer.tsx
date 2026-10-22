import Link from "next/link"
import { Phone, Mail, MapPin, Star, KeyRound } from "lucide-react"
import { tenant } from "@/lib/mock-data"

export function Footer() {
  return (
    <footer className="mt-16 bg-foreground text-background md:mt-24">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold">{tenant.name}</p>
            <p className="mt-3 inline-flex items-start gap-2 text-sm leading-relaxed text-[#afafaf]">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {tenant.address}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-background">
              Contacto
            </p>
            <a
              href={`tel:${tenant.phone}`}
              className="flex items-center gap-2 text-[#afafaf] transition-colors hover:text-background"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {tenant.phone}
            </a>
            <a
              href={`mailto:${tenant.email}`}
              className="flex items-center gap-2 text-[#afafaf] transition-colors hover:text-background"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {tenant.email}
            </a>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-background">
              Reseñas
            </p>
            <Link
              href={tenant.google.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-[#e2e2e2]"
            >
              <Star
                className="h-4 w-4 fill-foreground text-foreground"
                aria-hidden="true"
              />
              Ver reviews en Google
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[#4b4b4b] pt-6 text-xs text-[#afafaf] md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {tenant.name}. Todos los derechos
            reservados.
          </p>
          <Link
            href="https://llave.com.ar"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-background"
          >
            Powered by
            <span className="inline-flex items-center gap-1 font-semibold text-background">
              <KeyRound className="h-3 w-3" aria-hidden="true" />
              Llave
            </span>
            · llave.com.ar
          </Link>
        </div>
      </div>
    </footer>
  )
}
