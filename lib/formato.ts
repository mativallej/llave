const PESOS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
const ENTERO = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 })

export function pesos(monto: number): string {
  return PESOS.format(monto)
}

export function kilometros(km: number): string {
  return `${ENTERO.format(km)} km`
}

export function haceDias(dias: number): string {
  if (dias <= 0) return "hoy"
  if (dias === 1) return "ayer"
  return `hace ${dias} días`
}
