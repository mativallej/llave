import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Usuario } from "@/lib/usuarios"
import { ContrasenaUnaVez, FilaUsuario } from "./usuarios"

vi.mock("@/app/admin/(panel)/usuarios/acciones", () => ({}))

const ANDRES: Usuario = {
  id: "u1",
  nombre: "Andrés",
  email: "andres@falkenberg.test",
  rol: "falkenberg",
  suspendido: false,
  creadoEn: "2026-10-23T15:00:00Z",
  ultimoIngreso: null,
}

// Las contraseñas reales se generan al azar en el servidor y no se guardan: esto es un texto de prueba.
const CLAVE_DE_PRUEBA = "clave-de-prueba-no-real"

const fila = (usuario: Usuario, esVos: boolean) =>
  renderToStaticMarkup(<FilaUsuario usuario={usuario} esVos={esVos} ingreso="Nunca entró" />)

describe("la fila de un usuario", () => {
  it("la propia dice Vos y solo ofrece resetear la contraseña", () => {
    const h = fila(ANDRES, true)
    expect(h).toContain("Vos")
    expect(h).toContain("Resetear contraseña")
    expect(h).not.toContain("Suspender")
    expect(h).not.toContain("Pasar a")
  })

  it("la de otro ofrece cambiar el rol, suspender y resetear", () => {
    const h = fila({ ...ANDRES, id: "u2", nombre: "Abelardo", rol: "vendedor" }, false)
    expect(h).not.toContain(">Vos<")
    expect(h).toContain("Pasar a Falkenberg")
    expect(h).toContain("Suspender")
    expect(h).toContain("Resetear contraseña")
  })

  it("un suspendido lo dice y ofrece reactivar", () => {
    const h = fila({ ...ANDRES, id: "u3", suspendido: true }, false)
    expect(h).toContain("Suspendido")
    expect(h).toContain("Reactivar")
    expect(h).not.toContain(">Suspender<")
  })

  it("la contraseña se muestra con el aviso de que no vuelve", () => {
    const h = renderToStaticMarkup(<ContrasenaUnaVez email="a@b.test" password={CLAVE_DE_PRUEBA} />)
    expect(h).toContain(CLAVE_DE_PRUEBA)
    expect(h).toContain("No se vuelve a mostrar")
  })
})
