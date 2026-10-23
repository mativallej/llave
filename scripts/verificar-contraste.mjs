// Checks that no button ends up with text the colour of its background: for every visible button and
// button-styled link, the contrast between its text and its effective background (walking up through
// transparent ancestors). Runs in dark and light. Colours come back as oklch(), so each one is painted on a
// canvas and read back as RGB.
//
//   node scripts/verificar-contraste.mjs http://localhost:3100 / /admin/login

import { chromium } from "playwright"

const [base, ...rutas] = process.argv.slice(2)
if (!base || rutas.length === 0) {
  console.error("Uso: node scripts/verificar-contraste.mjs <base> <ruta> [ruta…]")
  process.exit(1)
}
const MINIMO = 3

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
let fallas = 0

for (const tema of ["dark", "light"]) {
  const pagina = await navegador.newPage({ viewport: { width: 400, height: 860 }, colorScheme: tema })
  for (const ruta of rutas) {
    await pagina.goto(`${base}${ruta}`, { waitUntil: "networkidle" })
    const resultados = await pagina.evaluate(() => {
      const lienzo = document.createElement("canvas")
      lienzo.width = lienzo.height = 1
      const ctx = lienzo.getContext("2d", { willReadFrequently: true })
      const rgba = (color) => {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = "#000"
        ctx.fillStyle = color
        ctx.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
        return { r, g, b, a: a / 255 }
      }
      const luminancia = ({ r, g, b }) => {
        const canal = (v) => {
          const c = v / 255
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
      }
      const fondo = (el) => {
        for (let nodo = el; nodo; nodo = nodo.parentElement) {
          const color = rgba(getComputedStyle(nodo).backgroundColor)
          if (color.a > 0.5) return color
        }
        return rgba(getComputedStyle(document.body).backgroundColor)
      }
      return [...document.querySelectorAll("button, a[data-slot=button], [role=button]")]
        .filter((el) => el.offsetParent !== null && el.textContent.trim())
        .map((el) => {
          const texto = rgba(getComputedStyle(el).color)
          const detras = fondo(el)
          const [l1, l2] = [luminancia(texto), luminancia(detras)].sort((a, b) => b - a)
          return { boton: el.textContent.trim().slice(0, 40), contraste: (l1 + 0.05) / (l2 + 0.05) }
        })
    })
    for (const { boton, contraste } of resultados) {
      if (contraste < MINIMO) {
        fallas++
        console.log(`FALLA ${tema} ${ruta} "${boton}" contraste ${contraste.toFixed(2)}`)
      }
    }
    const peor = Math.min(...resultados.map((r) => r.contraste))
    console.log(`${tema.padEnd(5)} ${ruta} → ${resultados.length} botones, el de menor contraste: ${peor.toFixed(2)}`)
  }
  await pagina.close()
}

await navegador.close()
process.exit(fallas === 0 ? 0 : 1)
