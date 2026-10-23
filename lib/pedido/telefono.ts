// The phone is the case's index: the only id shared by the web, WhatsApp and a call. Every Argentine
// mobile number written any way ends up as +549 + area code + number, ten digits after the 9.

export function normalizarTelefono(texto: string): string | null {
  let digitos = texto.replace(/\D/g, "")
  if (digitos.startsWith("00")) digitos = digitos.slice(2)
  if (digitos.startsWith("54")) {
    digitos = digitos.slice(2)
    if (digitos.startsWith("9")) digitos = digitos.slice(1)
  }
  if (digitos.startsWith("0")) digitos = digitos.slice(1)

  // The old mobile prefix "15" goes after the area code, which has 2, 3 or 4 digits.
  if (digitos.length === 12) {
    for (const largoArea of [4, 3, 2]) {
      if (digitos.slice(largoArea, largoArea + 2) === "15") {
        digitos = digitos.slice(0, largoArea) + digitos.slice(largoArea + 2)
        break
      }
    }
  }

  // Without the area code there's no knowing it: the channel covers towns with other codes.
  if (digitos.length !== 10) return null
  return `+549${digitos}`
}

export const AYUDA_TELEFONO = "Escribilo con la característica, por ejemplo 3492 15 123456."
