// The MCP over stdio, for local development and for an operator running Claude Code on their own machine.
// Here the photos can also be local file paths.
//
//   LLAVE_TOKEN=<token> pnpm mcp:stdio
//
// stdout is the protocol: nothing else may be printed there, so every message goes to stderr.

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { resolverOperador } from "@/lib/operador"
import { crearServidor } from "./servidor"

async function arrancar() {
  const operador = await resolverOperador(process.env.LLAVE_TOKEN ?? null)
  if (!operador) {
    console.error("LLAVE_TOKEN no es un token de operador válido. Se emite con scripts/crear-operador.mts.")
    process.exit(1)
  }
  await crearServidor({ operador, archivosLocales: true }).connect(new StdioServerTransport())
  console.error(`MCP de Llave por stdio, operando como ${operador.nombre} (${operador.rol}).`)
}

void arrancar()
