// Issues an operator token for the MCP. The token is the authentication: whoever has it operates
// with that role. Printed once; keep it like a password.
//
//   node --env-file=.env.local scripts/crear-operador.mts <nombre> <falkenberg|vendedor>

import { randomBytes } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const [nombre, rol] = process.argv.slice(2)
if (!nombre || (rol !== "falkenberg" && rol !== "vendedor")) {
  console.error("Uso: node --env-file=.env.local scripts/crear-operador.mts <nombre> <falkenberg|vendedor>")
  process.exit(1)
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function crear() {
  const token = randomBytes(32).toString("base64url")
  const { error } = await db.from("operador").insert({ token, nombre, rol })
  if (error) {
    console.error(`No se pudo crear el operador: ${error.message}`)
    process.exit(1)
  }
  console.log(`Listo: ${nombre} (${rol}). Su token es ${token}`)
}

void crear()
