import { FormularioLogin } from "./formulario"

export const metadata = { title: "Entrar — Llave" }

export default function PaginaLogin() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Admin de Falkenberg</h1>
        <p className="text-sm text-muted-foreground">
          El usuario lo crea Falkenberg. Si no tenés uno, pedíselo a Andrés.
        </p>
      </div>
      <FormularioLogin />
    </main>
  )
}
