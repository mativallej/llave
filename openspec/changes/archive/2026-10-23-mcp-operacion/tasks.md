# Tasks

## 1. El servidor

- [x] 1.1 `pnpm add @modelcontextprotocol/sdk`
  *Verifica:* `@modelcontextprotocol/sdk` 1.32.1 en `package.json`; acepta el `zod` 3.25 del repo.
- [x] 1.2 Servidor MCP en TypeScript en `mcp/`, con los dos transportes: **stdio** para desarrollo local y **HTTP** servido desde la app en `/api/mcp` para usarlo desde cualquier Claude.
  *Verifica:* `npx @modelcontextprotocol/inspector` contra el stdio → lista las tools.
  *Verifica, resultado:* `npx @modelcontextprotocol/inspector --cli -e LLAVE_TOKEN=<token> … pnpm --silent mcp:stdio --method tools/list` → las 9 tools; `--method tools/call --tool-name buscar_stock --tool-arg buscar=corolla` → el Corolla de ejemplo con datos reales. HTTP, con `pnpm start`: `POST /api/mcp` sin token → 401; `initialize` con `Authorization: Bearer` → `serverInfo {name: "llave"}`; `tools/list` con Bearer y con `?token=` → 9 tools. HTTP sin estado, un servidor por pedido (`WebStandardStreamableHTTPServerTransport`), que es lo que aguanta una función de Vercel. Ver las notas 3 y 4.
- [x] 1.3 Las tools **reusan las server actions** de `stock-publicaciones`. Nada de lógica duplicada.
  *Verifica:* `grep -rn "from .*supabase" mcp/` → solo a través de `lib/`, nunca un cliente propio.
  *Verifica, resultado:* `grep -rn "from .*supabase" mcp/` → sin resultados; `grep -rn "@supabase" mcp/ app/api/mcp/` → sin resultados. Las tools llaman a las mismas funciones de `lib/stock/stock.ts` que llaman las server actions del admin (que son finas: sesión, rol y la misma función).

## 2. Autenticación

- [x] 2.1 Tabla `operador`: `token` PK (nanoid), `nombre`, `rol` (`falkenberg` \| `vendedor`), `creado_en`, `ultimo_uso`.
  *Verifica:* migración `operador` aplicada, con RLS y sin policies. El token es de 43 caracteres base64url (32 bytes de `crypto.randomBytes`, no nanoid: no hace falta una dependencia para eso). Se emite con `scripts/crear-operador.mts`, probado (token del inspector, borrado después).
- [x] 2.2 El HTTP resuelve el token del header `Authorization` y el rol antes de ejecutar cualquier tool. Sin token válido, error claro y nada se ejecuta.
  *Verifica:* test — una llamada sin token devuelve error y no toca la base.
  *Verifica, resultado:* `app/api/mcp/route.test.ts`, con `db()` reemplazado por uno que falla si se lo llama: sin token → 401 "Falta un token de operador válido…" y `db` sin llamadas; con un token mal formado, lo mismo. Además acepta `?token=` (nota 3).
- [x] 2.3 `ultimo_uso` se actualiza en cada llamada. Es lo que después dice si el MCP se usa o es decoración.
  *Verifica:* lo escribe el envoltorio de cada tool antes de ejecutarla (`registrarUso`), sea por HTTP o por stdio. El test de integración comprueba que queda con fecha después de las llamadas.

## 3. Tools de lectura — autonomía

- [x] 3.1 `buscar_stock(query?, publicado?)` — lista autos con marca, modelo, año, km, precio, publicado y días sin actualizar.
  *Verifica:* por el inspector, `buscar=corolla` → el Corolla de ejemplo con esos campos. El filtro se llama `buscar` y no `query`, para que el argumento se lea en castellano como los demás.
- [x] 3.2 `ver_auto(slug)` — la ficha completa con las fotos.
  *Verifica:* test de integración: devuelve la ficha y `publicado`; las fotos van como links firmados de una hora.
- [x] 3.3 `stock_desactualizado()` — los publicados con más de 14 días sin tocar. **Es el aviso del admin, disponible sin abrir el admin.**
  *Verifica:* la misma `stockDesactualizado()` que usa el aviso de `/admin/stock`.

## 4. Tools de escritura — determinismo

Cada una hace **una** cosa, con argumentos explícitos. Ninguna toma texto libre con una instrucción adentro.

- [x] 4.1 `cargar_auto(linea, fotos[])` — **la principal.** Devuelve la ficha deducida **y la lista de campos que no pudo deducir**. Crea el auto **sin publicar**. Nunca inventa un campo.
  *Verifica:* test — con *"entró un Corolla XEI 2019 con 78 mil"* y dos fotos, devuelve los campos poblados, `precio` ausente y `publicado: false`.
  *Verifica, resultado:* `mcp/herramientas/stock.integracion.test.ts`, contra la base, Storage y el modelo: con la línea y dos fotos (PNG generados en el test, por link firmado) → Toyota / Corolla / XEI / 2019 / 78000, `precio: null`, `publicado: false`, `fotos: 2`, `falta[0] = "precio"`. Un link que no es una foto → error claro. El test borra el auto, las cuatro fotos y su operador al terminar.
- [x] 4.2 `completar_auto(slug, campos)` — completa lo que faltaba. Campos explícitos, no un objeto libre.
  *Verifica:* argumentos `marca?`, `modelo?`, `version?`, `anio?`, `km?`, `segmento?` (enum) al mismo nivel que `slug`; sin objeto anidado. Llama a `completarAuto`, la misma del admin.
- [x] 4.3 `poner_precio(slug, precio)` — **separada a propósito.** El precio es público y es una garantía: se escribe en una llamada propia, nunca de pasada dentro de otra.
  *Verifica:* ninguna otra tool tiene un argumento de precio (test del catálogo).
- [x] 4.4 `publicar_auto(slug)` — falla con un mensaje claro si falta el precio.
  *Verifica:* test — publicar sin precio devuelve error y el auto queda sin publicar.
  *Verifica, resultado:* test de integración: `isError` con "Falta el precio…", y `ver_auto` sigue diciendo `publicado: false`.
- [x] 4.5 `despublicar_auto(slug)`
  *Verifica:* llama a `despublicarAuto`, la misma del admin.
- [x] 4.6 `marcar_vendido(slug)` — despublica en la misma operación.
  *Verifica:* llama a `marcarVendido` (un solo `update` con `vendido_en` y `publicado = false`, con test de integración en `stock-publicaciones`); declarada `destructiveHint` para que Claude confirme antes.

## 5. Lo que el MCP no puede hacer, verificado

- [x] 5.1 **Ninguna tool devuelve ni acepta una estimación del valor del auto que el cliente entrega.** No existe `estimar_valor` ni nada equivalente.
  *Verifica:* test — la lista de tools no contiene ninguna cuyo schema pida o devuelva un valor de toma.
  *Verifica, resultado:* `mcp/servidor.test.ts` recorre nombres y propiedades de cada `inputSchema` y `outputSchema`, a cualquier profundidad, contra `valor|toma|tasac|estim|margen|ganancia|comisi` → ninguna.
- [x] 5.2 **Ninguna tool expone el margen.**
  *Verifica:* el mismo test cubre `margen`, `ganancia` y `comisi`.
- [x] 5.3 **Ninguna tool acepta una instrucción en texto libre.** Cada una tiene argumentos tipados.
  *Verifica:* test — ningún `inputSchema` tiene un campo que sea una instrucción.
  *Verifica, resultado:* ningún campo se llama como una instrucción (`instruc|comando|prompt|accion|hacer|orden|pedido|mensaje`), y todo campo de texto libre tiene que estar en una lista explícita de datos (`slug`, `linea`, `buscar`, `marca`, `modelo`, `version`, `segmento`): un campo de texto nuevo obliga a sumarlo ahí a conciencia. `linea` es la descripción del auto, no una orden.
- [x] 5.4 El system prompt del servidor dice explícitamente que no estima precios y que el valor de toma lo pone Andrés después de ver el auto.
  *Verifica:* `INSTRUCCIONES_MCP` va en `initialize` (visto por stdio); el test comprueba "No estimás nunca el valor del auto que entrega un cliente" y "lo pone Andrés después de ver el auto en persona".

## 6. Documentación y verificación

- [x] 6.1 `mcp/README.md`: cómo conectarlo desde Claude, cómo se emite un token de operador, y la lista de tools con una línea cada una.
  *Verifica:* Claude Code por HTTP con encabezado, conector de Claude web o teléfono con `?token=`, stdio local con `pnpm --silent`; emitir y revocar tokens; las fotos; las 9 tools.
- [x] 6.2 `npx tsc --noEmit && pnpm build && npx vitest run`
  *Verifica, resultado:* desde cero (`rm -rf .next`): `pnpm install` exit 0, `npx tsc --noEmit` exit 0, `pnpm build` exit 0 (con `ƒ /api/mcp`), `npx vitest run` → 32/32 en 9 archivos.

## Notas de ejecución — la realidad contra el change

1. **Una foto pegada en el chat de Claude no le llega a una tool.** La proposal imagina a Abelardo mandándole a Claude una foto y la línea. Claude ve la foto, pero no puede pasarle el archivo a un servidor MCP. Por eso `cargar_auto` recibe **links https** (o rutas de archivo por stdio), y las instrucciones del servidor se lo dicen a Claude para que se lo explique al operador. El contrato de la tool del spec se cumple, pero el flujo "mando la foto por el chat" no existe así: con las fotos en el teléfono, el camino corto es `/admin/stock` → "Sacar foto", y el resto (precio, publicar, vendido) por Claude. **Es una decisión de producto para Matías:** si alcanza con eso, o si hace falta otra puerta para las fotos.
2. **No hay ninguna tool de stock reservada a `falkenberg`.** En el admin, los dos roles operan el stock y el spec no reserva ninguna. El corte por rol está en el envoltorio de cada tool (`roles`) y se probó con una tool de prueba: un token de vendedor recibe "es solo para falkenberg" y la tool no corre. Lo usa por primera vez `cargar_tasacion`, en `caso-seguimiento`.
3. **`?token=` además del encabezado.** El conector personalizado de Claude web no deja poner encabezados, así que la URL lleva el token. Esa URL es la llave entera; queda dicho en el README.
4. **stdio con `pnpm --silent`:** el encabezado de `pnpm` sale por la salida estándar, que en stdio es el protocolo, y lo rompe. Probado: sin `--silent`, el inspector cierra la conexión. Y en este contenedor el inspector levanta el proceso sin las variables del proxy de salida, así que para la prueba se le pasaron con `-e`; en una compu normal no hace falta.
5. **Los primeros operadores y el dominio** los decide Matías (la proposal ya lo dice): `scripts/crear-operador.mts` emite el token.
