import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Supabase Auth is only the admin's session. Data never goes through this client: it goes through db().
export async function clienteAuth() {
  const almacen = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (aGuardar) => {
          try {
            for (const { name, value, options } of aGuardar) almacen.set(name, value, options)
          } catch {
            // Server components can't write cookies; proxy.ts refreshes the session on every /admin request.
          }
        },
      },
    },
  )
}
