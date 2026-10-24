import "server-only"
import OpenAI from "openai"

// AGENTS.md: a dated snapshot, never the alias. The agent's behavior doesn't move without a change.
export const MODELO = "gpt-5.5-2026-04-23"

// What every call shares. effort never below "low"; store false because what the client says about their
// car isn't kept on OpenAI's side.
export const CONFIG_BASE = {
  model: MODELO,
  reasoning: { effort: "low" },
  store: false,
} as const

let cliente: OpenAI | undefined

export function openai(): OpenAI {
  if (!cliente) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error("OPENAI_API_KEY must be set")
    cliente = new OpenAI({ apiKey })
  }
  return cliente
}
