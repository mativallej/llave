import Link from "next/link"
import { KeyRound } from "lucide-react"
import { tenant } from "@/lib/mock-data"

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:h-16 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
          aria-label={`${tenant.shortName} — inicio`}
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-base font-bold md:text-lg">
            {tenant.shortName}
          </span>
        </Link>

        <Link
          href="https://llave.com.ar"
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-[#e2e2e2] hover:text-foreground md:text-xs"
        >
          <span className="hidden sm:inline">Powered by</span>
          <span className="font-semibold text-foreground">Llave</span>
          <KeyRound
            className="h-3 w-3 text-foreground transition-transform group-hover:rotate-12"
            aria-hidden="true"
          />
        </Link>
      </div>
    </header>
  )
}
