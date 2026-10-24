# Tasks

## 1. El MCP sin fotos

- [x] 1.1 `cargar_auto` recibe solo `linea` y llama a `crearAutoDesdeLinea(linea, [])`.
  *Verifica:* `mcp/herramientas/stock.integracion.test.ts`, contra la base y el modelo:
  - "cargar_auto con la línea sola: deduce, no inventa, y queda sin publicar, sin precio y sin fotos" ✓. Toyota Corolla XEI 2019, 78.000 km, `precio` null, `publicado` false, `fotos` `[]`, y la respuesta dice que las fotos se suben desde `/admin/stock`.
- [x] 1.2 Ninguna tool tiene un campo de entrada para fotos, links, rutas o archivos.
  *Verifica:* `mcp/servidor.test.ts` › "ninguna tool recibe fotos: ni links, ni rutas, ni archivos" ✓. Ningún inputSchema tiene `foto`, `fotos`, `imagen`, `url`, `link`, `ruta` ni `archivo`.
- [x] 1.3 Se va `archivosLocales` del `Contexto`, del stdio y de la ruta HTTP; se borran `importarFotos` y lo que usaba solo ella.
  *Verifica:* `grep -rn "importarFotos\|archivosLocales\|leerFoto" app lib mcp components scripts` → exit 1, sin coincidencias. También se fueron `tipoImagen`, `MAX_BYTES_FOTO` y los imports de `node:fs` y `node:path` en `lib/stock/stock.ts`. El admin sigue subiendo fotos por su camino: links firmados de subida.
- [x] 1.4 Las instrucciones del servidor y `mcp/README.md` dicen que las fotos se suben desde `/admin/stock`.
  *Verifica:* el mismo test ✓ comprueba que las instrucciones dicen "no se cargan fotos" y nombran `/admin/stock`. El README quedó al día, también con las tools de caso y de tablero que faltaban.

## 2. Verificación

- [x] 2.1 `cargar_auto` contra la base y el modelo, con una línea sola: deduce, no inventa, queda sin publicar ni precio.
  *Verifica:* los dos tests de 1.1 ✓.
  - "una línea sin año no inventa el año" ✓: "entró un Gol Trend con 120 mil" → `anio` null y `anio` en lo que falta.
  - "publicar sin precio falla con un mensaje que lo explica…" ✓.
- [x] 2.2 `npx tsc --noEmit && pnpm build && npx vitest run`
  *Verifica:* `rm -rf .next && pnpm install` → exit 0. `npx tsc --noEmit` → exit 0. `pnpm build` → exit 0. `npx vitest run` → `Test Files 23 passed (23)`, `Tests 96 passed (96)`.
