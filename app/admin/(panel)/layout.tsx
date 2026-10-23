import Link from "next/link"
import { Button } from "@/components/ui/button"
import { requerirRol } from "@/lib/auth/rol"
import { salir } from "../login/acciones"

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const operador = await requerirRol()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/admin/tablero">Tablero</Link>
          <Link href="/admin/casos">Casos</Link>
          <Link href="/admin/stock">Stock</Link>
          {operador.rol === "falkenberg" && <Link href="/admin/config">Config</Link>}
        </nav>
        <form action={salir} className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{operador.nombre}</span>
          <Button type="submit" variant="ghost" size="sm">
            Salir
          </Button>
        </form>
      </header>
      <main className="flex flex-1 flex-col gap-6 px-4 py-6">{children}</main>
    </div>
  )
}
