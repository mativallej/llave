"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { entrar, type EstadoLogin } from "./acciones"

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState<EstadoLogin, FormData>(entrar, null)

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {estado?.error && (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  )
}
