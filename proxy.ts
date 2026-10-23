import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Refreshes the admin session and keeps everyone without one out of /admin.
// The role is checked later, in the pages and actions: here there is only the session.
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (aGuardar) => {
          for (const { name, value } of aGuardar) request.cookies.set(name, value)
          respuesta = NextResponse.next({ request })
          for (const { name, value, options } of aGuardar) respuesta.cookies.set(name, value, options)
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname !== "/admin/login") {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }
  return respuesta
}

export const config = {
  matcher: ["/admin/:path*"],
}
