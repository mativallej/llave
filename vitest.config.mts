import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/server-only.ts", import.meta.url)),
    },
  },
  test: {
    passWithNoTests: true,
    // .env.local, so the integration tests reach the real database. They skip themselves without it.
    env: loadEnv(mode, process.cwd(), ""),
  },
}))
