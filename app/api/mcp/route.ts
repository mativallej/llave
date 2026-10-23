import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { resolverOperador, tokenDe } from "@/lib/operador"
import { crearServidor } from "@/mcp/servidor"

// The MCP over HTTP, for any Claude. Stateless: one server per request, which is what a serverless
// function can hold. Without a valid operator token nothing runs and the database is not touched.

export const dynamic = "force-dynamic"

async function manejar(pedido: Request): Promise<Response> {
  const operador = await resolverOperador(tokenDe(pedido))
  if (!operador) {
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
