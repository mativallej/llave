import "server-only"

// There is no verification code in the MVP: the channel for it (SMS or WhatsApp) isn't decided, and at ten
// requests a week there's no spam to stop. The interface exists so turning it on is filling this in.
export async function enviarCodigo(telefono: string): Promise<void> {
  // TODO: send the code once the channel is decided, and check it before crear_pedido.
  console.info(`enviarCodigo: sin OTP en el MVP, no se envía nada a ${telefono}`)
}
