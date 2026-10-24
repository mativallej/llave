# Tasks

## 1. El agente

- [x] 1.1 `app/api/chat/route.ts` con la Responses API, streaming, el loop de herramientas y la configuración exacta de `AGENTS.md`.
  *Verifica:* `grep -rnE '"gpt-5\.5"|effort: "(none|minimal)"' app/api/chat lib/agente` → sin resultados (el modelo es el snapshot con fecha y el effort no baja de `low`).
  *Verifica, resultado:* el grep → sin resultados, exit 1. `lib/agente/tuerca.ts` con `CONFIG_BASE` (snapshot, `effort: "low"`, `store: false`), `include: ["reasoning.encrypted_content"]`, `stream: true` y el loop propio: corre los `function_call`, agrega la salida del modelo y los `function_call_output`, y vuelve a llamar (hasta 6 vueltas). La ruta valida todo con zod y transmite NDJSON. Cada vuelta tiene un plazo de 45 s (nota 5).
- [x] 1.2 El system prompt con las ocho reglas duras, fijo y sin datos del caso, para que el cache automático lo tome por prefijo.
  *Verifica:* `INSTRUCCIONES` es una constante, sin nada del caso. El estado del pedido viaja en cada turno como un mensaje `developer` aparte, nunca dentro de las instrucciones. Además de las ocho reglas de `AGENTS.md`, las instrucciones llevan la regla de copy 1 (ni red ni terceros), la 3 (ni domicilio, ni plazo de punta a punta, ni los dos números verificables) y las dos conversiones (A → B y E → C).
- [x] 1.3 Las seis herramientas con `zodResponsesFunction`, que pone `strict: true`. El enum de `mostrar_autos` **se genera desde la base**, no se hardcodea.
  *Verifica:* test — agregar un auto al stock cambia el enum sin tocar código.
  *Verifica, resultado:* `lib/agente/tuerca.test.ts`: el enum de `mostrar_autos` es la lista de slugs del stock que recibe, y con un auto más lo incluye; las seis van con `strict: true`. La ruta le pasa `stockCanal()`, que lee el stock publicado de la base en cada turno.
- [x] 1.4 `mostrar_precio`: el precio **público y exacto** de los autos elegidos. No es un rango ni una estimación.
  *Verifica:* devuelve `pesos(auto.precio)` del stock y muestra la tarjeta con "Precio público, el mismo para todos". Test 2.3 y la conversación de punta a punta: "El Corolla XEI 2019 sale $ 24.500.000, precio público y exacto."
- [x] 1.5 `pedir_fotos`: **cinco vistas** — frente 3/4, lateral, atrás 3/4, interior delantero, tablero con el kilometraje. Con "No las tengo ahora", que **no bloquea**.
  *Verifica:* Playwright: con "No las tengo ahora", Tuerca dijo "sin fotos la tasación no arranca, pero podés seguir con el pedido igual" y el pedido se mandó sin fotos (estado `pendiente_fotos` en el test de integración).
- [x] 1.6 `pedir_zona`: SVG con Rafaela al centro, anillos a 50 y 100 km y los pueblos clickeables. Accesible con teclado. **Sin Google Maps ni Leaflet.**
  *Verifica:* `components/canal/mapa-zona.tsx`: 18 pueblos ubicados en km desde Rafaela con sus coordenadas reales; cada uno es `role="button"`, `tabIndex=0`, con Enter y Espacio, y `aria-pressed`; "Otra zona" para escribirla. Ninguna librería de mapas en `package.json`. Playwright: tocar Esperanza la deja en el botón de la fila.
- [x] 1.7 `mostrar_resumen`: devuelve error si falta saber si entrega un auto o qué se lleva.
  *Verifica:* `faltaParaResumen` (test en `lib/pedido/tipos.test.ts`, 3/3); con algo faltante, la herramienta devuelve "Todavía no: falta …" y no muestra el formulario. `enviarPedido` aplica la misma regla en el server.
- [x] 1.8 Visión por signed URL. El agente confirma en una línea si la foto es el auto que tiene o el que busca.
  *Verifica:* Playwright con una foto subida desde "Agregar fotos": viajó como `pedidos/tmp/<uuid>.jpg`, la ruta la firmó y el modelo la recibió como `input_image`. La respuesta miró la cobertura y no el estado: "Recibí la foto, pero no se distingue una vista del auto… ¿Podés subir una foto del frente tres cuartos?". La instrucción de preguntar si es el auto que tiene o el que busca está en el prompt, para cuando no quede claro.

## 2. Las reglas duras, con tests

- [x] 2.1 Test: ante *"¿cuánto vale mi Corolla?"* la respuesta **no contiene ningún número de precio** del auto del cliente.
- [x] 2.2 Test: ante *"¿cómo lo tasan?"* la respuesta **no menciona otras agencias, ni red, ni consultar a terceros**.
- [x] 2.3 Test: el agente **sí** dice el precio de un auto del stock cuando se lo piden.
- [x] 2.4 Test de la trampa: ante *"quiero ver la Hilux"* el turno emite un `function_call` de `mostrar_autos` y la herramienta **corrió**. No alcanza con que haya texto. Se corre en cada cambio de modelo o de effort.
  *Verifica:* `npx vitest run lib/agente` → los cuatro pasan.
  *Verifica, resultado:* `npx vitest run lib/agente` → todos pasan contra el modelo real (4 de reglas + 2 de herramientas + 2 de la ficha). El stock de los tests (con una Hilux) se le pasa al agente como argumento: nada se publica en la página real. 2.1 revisa que no haya `$`, miles con punto ni "mil/millones/palos/lucas/dólares"; 2.2, que no aparezcan agencia, otras concesionarias, red, terceros ni consultar; 2.4, que haya un evento `herramienta: mostrar_autos` y la tarjeta de la Hilux, que solo existe si el ejecutor corrió.

## 3. La página

- [x] 3.1 Hero, la caja con textarea + cámara + envío, y tres chips. Al escribir, la caja **se convierte** en la conversación — no navega.
  *Verifica:* Playwright: el chip "Quiero cambiar mi auto" arranca la conversación, la URL sigue en `/`, aparece el panel del pedido y la caja queda abajo. Los chips no ofrecen "quiero vender": el caso A es una puerta, no un caso.
- [x] 3.2 Fila fija de dos botones que **muestran el estado**: "Agregar fotos" → "3 fotos", "Elegir zona" → "Esperanza".
  *Verifica:* Playwright: "Elegir zona" → "Esperanza" después de tocarla en el mapa; "Agregar fotos" → "1 foto" después de subir una.
- [x] 3.3 Grilla de seis autos desde la base **con el precio visible**, con "Lo quiero" y "Algo parecido" que siembran la conversación. Sin filtros, sin búsqueda, sin páginas de detalle.
  *Verifica:* los primeros seis publicados en el orden del admin; cada tarjeta con precio, y los dos botones mandan "Quiero el …" o "Busco algo parecido al …". Sin filtros ni detalle.
- [x] 3.4 Cómo funciona, en tres pasos.
- [x] 3.5 Garantías: las cinco de producto siempre; las cinco de Falkenberg **detrás de `leerConfig("garantias_falkenberg")`**, leída en el server.
  *Verifica:* test de render — con la fila en `false`, el HTML no contiene "taller" ni "7 días" ni "48 horas".
  *Verifica, resultado:* `components/canal/garantias.test.tsx` (3/3): con `false` no aparecen "taller", "7 días", "48 horas", "trámites" ni "renegociamos", y sí las cinco de producto; con `true`, las diez; el resto del copy no promete domicilio ni nombra terceros. La página lee el flag en el server en cada pedido (`dynamic = "force-dynamic"`), así que prenderlo es editar la fila: esto cierra la mitad de la 4.1 de `stock-publicaciones` que quedó para acá. **La fila nunca se prendió.**
- [x] 3.6 Todas las frases de garantía y el copy de la página **en un solo archivo de contenido**.
  *Verifica:* `lib/contenido.ts`; los componentes del canal no tienen copy propio.
- [x] 3.7 Diseño según `AGENTS.md`, con los tokens de dark mode en las tres formas y `body` con background explícito.
  *Verifica:* puppeteer a 400px → sin scroll horizontal; y en dark mode ningún botón con texto del mismo color que su fondo.
  *Verifica, resultado:* `app/globals.css`: tokens en `:root`, oscuro bajo `@media (prefers-color-scheme: dark)` con `:root:not([data-theme="light"])` y de nuevo en `:root[data-theme="dark"]`; `body` con `background` explícito; `prefers-reduced-motion` respetado; "sobre acento" como token (se sacaron un hover fijo `#e2e2e2` y dos `text-white` de shadcn). Con Playwright (nota 6): `/` a 400px → `scrollWidth 400 = clientWidth 400` en claro, en oscuro y con la conversación entera abierta. `scripts/verificar-contraste.mjs` en `/` y `/admin/login` → el botón de menor contraste: 8,50 en oscuro y 6,23 en claro.

## 4. El cierre y el handoff

- [x] 4.1 Nombre y WhatsApp con validación y normalización del teléfono. **Sin OTP** — `enviarCodigo(telefono)` existe como interfaz que loguea a consola, con un TODO.
  *Verifica:* `lib/pedido/telefono.test.ts` (3/3): ocho formas de escribir un celular de Rafaela dan `+5493492123456`; características de 2 y 3 cifras; sin característica devuelve null (nota 7). `lib/pedido/verificacion.ts` con `enviarCodigo` y su TODO, sin usarse.
- [x] 4.2 Rechazo de duplicados exactos en los últimos minutos.
  *Verifica:* test de integración: el mismo pedido y el mismo teléfono (escrito de otra forma) en 10 minutos devuelve el pedido que ya existía (`duplicado: true`, misma ref y mismo link) y no crea otro caso.
- [x] 4.3 Al confirmar: crea `caso`, los dos `acceso`, sube las fotos y escribe `pedido_enviado`.
  *Verifica:* test de integración — un pedido deja una fila en `caso`, dos en `acceso` y un `evento`.
  *Verifica, resultado:* `lib/pedido/canal.integracion.test.ts`: una fila en `caso` (estado `pendiente_cita`, teléfono normalizado), dos en `acceso` (cliente y operador) y un `evento` `pedido_enviado` con `{fotos: 1}`, y la foto movida a `casos/<id>/1.jpg`. Caso, accesos y evento salen de `crear_pedido`, una función de Postgres en una sola transacción (migración `crear_pedido`).
- [x] 4.4 `wa.me` con el pedido pre-escrito, la `ref` **y el link del operador**. El número sale de `leerConfig("whatsapp_abelardo")` **en el server** — nunca llega al browser como variable.
  *Verifica:* `grep -rn "whatsapp_abelardo" app components` → solo en código de servidor.
  *Verifica, resultado:* en `app/` y `components/` aparece solo en `components/admin/fila-config.tsx`, el editor de `/admin/config` (detrás del login y del rol `falkenberg`), donde para editar el número tiene que verse. En la página pública no aparece: lo leen `lib/config.ts` y `lib/pedido/canal.ts`, los dos `server-only`, y el `wa.me` sale armado de la server action después de mandar el pedido. Test del mensaje: lleva la ref, lo que entrega, lo que se lleva con su precio, la zona, las fotos y "Caso: <link del operador>". **Con `whatsapp_abelardo` vacío no hay link**: el pedido se registra igual, la pantalla no muestra el botón y el server lo deja logueado (test de integración y Playwright). Ver las notas 2 y 3.
- [x] 4.5 El chat cierra y el recibo queda arriba con el link del cliente, en `localStorage` con try/catch, **con botón de borrar** y "Hacer otro pedido".
  *Verifica:* con el storage bloqueado, la página renderiza igual.
  *Verifica, resultado:* Playwright con `localStorage` que tira `SecurityError` al tocarlo: renderiza, se conversa y no hay errores de página. Con storage normal: después de mandar, el recibo "Tu pedido LL-… · 23 de octubre" queda arriba, sigue al recargar, "Ver en qué está" apunta a `/c/<token>` y "Borrar" lo saca.
- [x] 4.6 `chat_iniciado` en el primer mensaje del cliente.
  *Verifica:* la ruta lo escribe cuando el historial no tiene mensajes del cliente, con `{chat}` en `meta` y sin caso. Dos conversaciones de Playwright → dos eventos, uno por `chat` id.

## 5. Tools del MCP

- [x] 5.1 Registrar en el MCP las tools de lectura del canal: `ver_pedido(ref)` y `listar_pedidos_del_dia()`.
  *Verifica:* el inspector del MCP las lista y devuelven datos reales.
  *Verifica, resultado:* el inspector por stdio → 11 tools, con `ver_pedido` y `listar_pedidos_del_dia`. `mcp/herramientas/pedidos.integracion.test.ts`, con un pedido real: `ver_pedido` devuelve estado, lo que entrega, lo que busca, la zona y el link del operador, **sin ningún valor de toma ni margen**; `listar_pedidos_del_dia` lo incluye. "Del día" es en hora de Argentina.

## 6. Verificación

- [x] 6.1 `npx tsc --noEmit && pnpm build && npx vitest run`
  *Verifica, resultado:* desde cero (`rm -rf .next`): `pnpm install` exit 0, `npx tsc --noEmit` exit 0, `pnpm build` exit 0 (`ƒ /`, `ƒ /api/chat`), `npx vitest run` → 54/54 en 15 archivos.

## Notas de ejecución — la realidad contra el change

1. **El test de la trampa usa la Hilux tal cual:** el agente recibe el stock como argumento, así que el test le pasa uno con una Hilux sin publicar nada en la página real.
2. **El cliente recibe el link del operador.** El `wa.me` lo manda el cliente desde su teléfono, así que el texto pre-escrito, con "Caso: <link del operador>", pasa por sus manos: puede abrir la vista del operador de su propio caso. Es lo que pide el spec ("sin ese link el caso queda partido"), pero es un riesgo real para `caso-seguimiento`, donde esa vista tiene acciones. **Decisión para Matías:** si se acepta, o si el operador tiene que llegar al caso de otra forma (por ejemplo, el MCP o un listado en el admin).
3. **Mientras `whatsapp_abelardo` esté vacío no hay handoff.** El pedido queda registrado y el cliente ve su ref y su link, pero a Abelardo no le llega nada por WhatsApp: hay que mirarlo con `listar_pedidos_del_dia` por el MCP. **Falta que Matías cargue el número** en `/admin/config`, y la redacción de `plazo_contacto` si se quiere decir cuándo se escribe.
4. **Dos puntas públicas que cuestan plata, sin límite de tráfico.** `/api/chat` llama a OpenAI y `pedirSubidasCliente` emite tokens de subida al bucket, sin login (el cliente no se loguea). Hay topes por pedido (historial de 60 mensajes, 2000 caracteres, 6 vueltas de 45 s, 5 fotos por tanda de hasta 10 MB) pero no un límite por persona, que pediría infraestructura que no está. Y las fotos de una conversación que nunca se manda quedan en `pedidos/tmp/` (no hay cola de jobs que las limpie). Para mirar después del lanzamiento.
5. **Un turno se colgó una vez en los tests** hasta los 90 s: el stream de OpenAI quedó quieto (el SDK espera hasta 10 minutos). Repetido tres veces, pasó en 4 s. Por eso cada vuelta tiene un plazo de 45 s, y si vence Tuerca dice "Se me cortó la conexión. ¿Me repetís lo último?" en vez de dejar la pantalla quieta.
6. **Playwright y no puppeteer** (el Chromium del entorno); `scripts/verificar-ancho.mjs` y `scripts/verificar-contraste.mjs` quedan para repetirlos.
7. **Un teléfono sin característica se rechaza** en vez de suponer la de Rafaela: el canal cubre pueblos con otras características (Esperanza 3496, Sunchales 3493, San Francisco 3564) y suponer dejaría números equivocados sin que nadie lo note.
8. **El estado inicial del caso:** entrega con fotos → `pendiente_cita`; entrega sin fotos → `pendiente_fotos`; no entrega y eligió del stock → `pendiente_cita`; no entrega y busca algo que no está → `pendiente_conseguir`. La máquina de estados completa es de `caso-seguimiento`.
9. **`/c/[token]` todavía no existe:** el link del recibo y el del operador dan 404 hasta `caso-seguimiento`.
