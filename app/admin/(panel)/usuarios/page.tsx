import { AltaUsuario, FilaUsuario } from "@/components/admin/usuarios"
import { requerirRol } from "@/lib/auth/rol"
import { fechaConHora } from "@/lib/caso/mostrador"
import { listarUsuarios } from "@/lib/usuarios"

export const metadata = { title: "Usuarios — Llave" }
export const dynamic = "force-dynamic"

export default async function PaginaUsuarios() {
  const yo = await requerirRol("falkenberg")
  const usuarios = await listarUsuarios()

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Quién entra al admin y con qué rol. Falkenberg ve todo, también la config y esta pantalla. Vendedor opera el stock, los
          casos y el tablero.
        </p>
      </div>

      <section aria-labelledby="alta" className="flex flex-col gap-3 rounded-lg border p-4">
        <h2 id="alta" className="text-lg font-semibold">
          Dar de alta
        </h2>
        <AltaUsuario />
      </section>

      <section aria-labelledby="lista" className="flex flex-col gap-3">
        <h2 id="lista" className="text-lg font-semibold">
          Los usuarios
        </h2>
        <ul className="flex flex-col divide-y rounded-lg border">
          {usuarios.map((usuario) => (
            <FilaUsuario
              key={usuario.id}
              usuario={usuario}
              esVos={usuario.id === yo.id}
              ingreso={usuario.ultimoIngreso ? `Entró por última vez el ${fechaConHora(usuario.ultimoIngreso)}` : "Nunca entró"}
            />
          ))}
        </ul>
      </section>
    </>
  )
}
