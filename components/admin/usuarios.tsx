"use client"

import { useState, useTransition } from "react"
import {
  accionCambiarRol,
  accionCrearUsuario,
  accionReactivar,
  accionResetear,
  accionSuspender,
} from "@/app/admin/(panel)/usuarios/acciones"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Usuario } from "@/lib/usuarios"

// Shown once, right after it's made: to hand over in person. Leaving the screen loses it, on purpose.
export function ContrasenaUnaVez({ email, password }: { email: string | null; password: string }) {
  const [copiada, setCopiada] = useState(false)
  return (
    <div role="status" className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-primary/5 p-4">
      <p className="text-sm">La contraseña{email ? ` de ${email}` : ""}:</p>
      <p className="select-all break-all font-mono text-lg">{password}</p>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="self-start"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(password)
            setCopiada(true)
          } catch {
            setCopiada(false)
          }
        }}
      >
        {copiada ? "Copiada" : "Copiar"}
      </Button>
      <p className="text-xs text-muted-foreground">Entregala en persona. No se vuelve a mostrar: si se pierde, se resetea de nuevo.</p>
    </div>
  )
}

export function AltaUsuario() {
  const [error, setError] = useState<string | null>(null)
  const [creada, setCreada] = useState<{ email: string; password: string } | null>(null)
  const [pendiente, iniciar] = useTransition()

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex flex-col gap-3"
        action={(f) =>
          iniciar(async () => {
            setError(null)
            setCreada(null)
            const datos = { email: String(f.get("email") ?? ""), nombre: String(f.get("nombre") ?? ""), rol: String(f.get("rol") ?? "") }
            const resultado = await accionCrearUsuario(datos)
            if (resultado.ok) setCreada({ email: datos.email.trim().toLowerCase(), password: resultado.password })
            else setError(resultado.error)
          })
        }
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor="alta-email">Email</Label>
          <Input id="alta-email" name="email" type="email" autoComplete="off" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="alta-nombre">Nombre</Label>
          <Input id="alta-nombre" name="nombre" autoComplete="off" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="alta-rol">Rol</Label>
          <select
            id="alta-rol"
            name="rol"
            defaultValue="vendedor"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
          >
            <option value="vendedor">Vendedor: stock, casos y tablero</option>
            <option value="falkenberg">Falkenberg: todo, también config y usuarios</option>
          </select>
        </div>
        <Button type="submit" disabled={pendiente} className="self-start">
          Dar de alta
        </Button>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </form>
      {creada && <ContrasenaUnaVez email={creada.email} password={creada.password} />}
    </div>
  )
}

export function FilaUsuario({ usuario, esVos, ingreso }: { usuario: Usuario; esVos: boolean; ingreso: string }) {
  const [confirmando, setConfirmando] = useState<"suspender" | "resetear" | null>(null)
  const [password, setPassword] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciar] = useTransition()
  const otroRol = usuario.rol === "falkenberg" ? "vendedor" : "falkenberg"

  function correr(fn: () => Promise<{ ok: true; password?: string } | { ok: false; error: string }>) {
    iniciar(async () => {
      setError(null)
      const resultado = await fn()
      setConfirmando(null)
      if (!resultado.ok) setError(resultado.error)
      else if (resultado.password) setPassword(resultado.password)
    })
  }

  return (
    <li className="flex flex-col gap-3 p-4" data-usuario={usuario.email ?? usuario.id}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{usuario.nombre}</span>
          <Badge variant="outline">{usuario.rol === "falkenberg" ? "Falkenberg" : "Vendedor"}</Badge>
          {usuario.suspendido && <Badge variant="secondary">Suspendido</Badge>}
          {esVos && <Badge variant="secondary">Vos</Badge>}
        </div>
        <p className="break-all text-sm text-muted-foreground">{usuario.email ?? "Sin email"}</p>
        <p className="text-sm text-muted-foreground">{ingreso}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {!esVos && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pendiente}
            onClick={() => correr(() => accionCambiarRol(usuario.id, otroRol))}
          >
            Pasar a {otroRol === "falkenberg" ? "Falkenberg" : "vendedor"}
          </Button>
        )}
        {!esVos &&
          (usuario.suspendido ? (
            <Button type="button" size="sm" variant="outline" disabled={pendiente} onClick={() => correr(() => accionReactivar(usuario.id))}>
              Reactivar
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" disabled={pendiente} onClick={() => setConfirmando("suspender")}>
              Suspender
            </Button>
          ))}
        <Button type="button" size="sm" variant="outline" disabled={pendiente} onClick={() => setConfirmando("resetear")}>
          Resetear contraseña
        </Button>
      </div>

      {confirmando && (
        <div role="alert" className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
          <p>
            {confirmando === "suspender"
              ? `${usuario.nombre} no va a poder entrar, y si tiene el admin abierto lo pierde en el próximo paso. Se puede reactivar.`
              : `La contraseña actual de ${usuario.nombre} deja de servir en el acto, y la nueva se muestra una sola vez.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={confirmando === "suspender" ? "destructive" : "default"}
              disabled={pendiente}
              onClick={() => correr(() => (confirmando === "suspender" ? accionSuspender(usuario.id) : accionResetear(usuario.id)))}
            >
              {confirmando === "suspender" ? "Sí, suspender" : "Sí, resetear"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmando(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
      {password && <ContrasenaUnaVez email={usuario.email} password={password} />}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </li>
  )
}
