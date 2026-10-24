// Opens each route at 400px and checks there is no horizontal scroll: scrollWidth === clientWidth.
// Logs into /admin first when E2E_EMAIL and E2E_PASSWORD are set.
//
//   node scripts/verificar-ancho.mjs http://localhost:3100 /admin/stock /admin/config

import { chromium } from "playwright"

const [base, ...rutas] = process.argv.slice(2)
if (!base || rutas.length === 0) {
  console.error("Uso: node scripts/verificar-ancho.mjs <base> <ruta> [ruta…]")
  process.exit(1)
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const pagina = await navegador.newPage({ viewport: { width: 400, height: 860 } })

if (process.env.E2E_EMAIL && process.env.E2E_PASSWORD) {
  await pagina.goto(`${base}/admin/login`)
  await pagina.getByLabel("Email").fill(process.env.E2E_EMAIL)
  await pagina.getByLabel("Contraseña").fill(process.env.E2E_PASSWORD)
  await pagina.getByRole("button", { name: "Entrar" }).click()
  await pagina.waitForURL("**/admin/stock")
}

let fallas = 0
for (const ruta of rutas) {
  await pagina.goto(`${base}${ruta}`, { waitUntil: "networkidle" })
  const { scrollWidth, clientWidth } = await pagina.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  const ok = scrollWidth === clientWidth
  if (!ok) fallas++
  console.log(`${ok ? "ok   " : "FALLA"} ${ruta} → scrollWidth ${scrollWidth}, clientWidth ${clientWidth} (${pagina.url().replace(base, "")})`)
}

await navegador.close()
process.exit(fallas === 0 ? 0 : 1)
