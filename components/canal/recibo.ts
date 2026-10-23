"use client"

// The client keeps the link to their case in this browser. Storage can be missing, blocked or throw
// (private mode, cleared data): every access is wrapped, and without it the page works the same.

export type Recibo = { ref: string; link: string; fecha: string }

const CLAVE = "llave:recibo"

export function leerRecibo(): Recibo | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE)
    if (!crudo) return null
    const recibo = JSON.parse(crudo) as Recibo
    return recibo?.ref && recibo?.link ? recibo : null
  } catch {
    return null
  }
}

export function guardarRecibo(recibo: Recibo): void {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(recibo))
  } catch {
    // Without storage the receipt only lives on screen; the link is shown anyway.
  }
}

export function borrarRecibo(): void {
  try {
    window.localStorage.removeItem(CLAVE)
  } catch {
    // Nothing to erase if there was no storage.
  }
}
