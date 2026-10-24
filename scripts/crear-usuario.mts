// Creates an admin user: a Supabase Auth account plus its row in perfil. Without that row there is no access.
//
//   node --env-file=.env.local scripts/crear-usuario.mts <email> <nombre> <falkenberg|vendedor>
//
// Prints a one-time password to hand over in person. Nobody signs up from the web.

import { randomBytes } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const [email, nombre, rol] = process.argv.slice(2)
if (!email || !nombre || (rol !== "falkenberg" && rol !== "vendedor")) {
  console.error("Uso: node --env-file=.env.local scripts/crear-usuario.mts <email> <nombre> <falkenberg|vendedor>")
  process.exit(1)
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function crear() {
  const password = randomBytes(12).toString("base64url")
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) {
    console.error(`No se pudo crear el usuario: ${error.message}`)
    process.exit(1)
  }

  const { error: errorPerfil } = await db.from("perfil").insert({ id: data.user.id, nombre, rol })
  if (errorPerfil) {
    await db.auth.admin.deleteUser(data.user.id)
    console.error(`No se pudo crear el perfil, se deshizo el usuario: ${errorPerfil.message}`)
    process.exit(1)
  }

  console.log(`Listo: ${nombre} (${rol}) entra con ${email} y la contraseña ${password}`)
}

void crear()
