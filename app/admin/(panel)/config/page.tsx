import { FilaConfig } from "@/components/admin/fila-config"
import { requerirRol } from "@/lib/auth/rol"
import { listarConfig } from "@/lib/config"

export const metadata = { title: "Config — Llave" }

export default async function PaginaConfig() {
  await requerirRol("falkenberg")
  const filas = await listarConfig()

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Config</h1>
        <p className="text-sm text-muted-foreground">
          Datos que cambian por motivos del negocio. Se guardan acá y valen al instante, sin tocar código.
        </p>
      </div>
      <ul className="flex flex-col divide-y rounded-lg border">
        {filas.map((fila) => (
          <FilaConfig key={fila.clave} clave={fila.clave} valor={fila.valor} nota={fila.nota} />
        ))}
      </ul>
    </>
  )
}
