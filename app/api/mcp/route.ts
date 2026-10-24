import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { dentroDelLimite, ipDe } from "@/lib/limites"
import { resolverOperador, tokenBienFormado, tokenDe } from "@/lib/operador"
import { crearServidor } from "@/mcp/servidor"

// The MCP over HTTP, for any Claude. Stateless: one server per request, which is what a serverless
// function can hold. Without a valid operator token nothing runs and the database is not touched.

export const dynamic = "force-dynamic"

async function manejar(pedido: Request): Promise<Response> {
  const token = tokenDe(pedido)
  const operador = await resolverOperador(token)
  if (!operador) {
    // A well-formed token that belongs to nobody already went to the database: those attempts count, and
    // past the limit the answer is 429. Missing or malformed ones never reach it, so they cost nothing.
    if (tokenBienFormado(token) && !(await dentroDelLimite("mcpSinToken", ipDe(pedido.headers)))) {
      return Response.json(
        {
          jsonrpc: "2.0",
          error: { code: -32029, message: "Demasiados intentos sin un token válido desde esta conexión. Probá de nuevo dentro de 10 minutos." },
          id: null,
        },
        { status: 429 },
      )
    }
    return Response.json(
      {
        jsonrpc: "2.0",
        error: { code: -32001, message: "Falta un token de operador válido (Authorization: Bearer <token>)." },
        id: null,
      },
      { status: 401 },
    )
  }

  const servidor = crearServidor({ operador, origen: new URL(pedido.url).origin })
  const transporte = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await servidor.connect(transporte)
  try {
    return await transporte.handleRequest(pedido)
  } finally {
    await servidor.close()
  }
}

export { manejar as DELETE, manejar as GET, manejar as POST }
