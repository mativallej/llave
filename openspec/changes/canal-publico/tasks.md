# Tasks

## 1. El agente

- [ ] 1.1 `app/api/chat/route.ts` con `toolRunner`, streaming y la configuración exacta de `AGENTS.md`.
  *Verifica:* `grep -n "thinking" app/api/chat/route.ts` → sin resultados (el adaptativo es el default y no se pasa).
- [ ] 1.2 El system prompt con las ocho reglas duras, con `cache_control`.
- [ ] 1.3 Las seis herramientas con `betaZodTool` y `strict: true`. El enum de `mostrar_autos` **se genera desde la base**, no se hardcodea.
  *Verifica:* test — agregar un auto al stock cambia el enum sin tocar código.
- [ ] 1.4 `mostrar_precio`: el precio **público y exacto** de los autos elegidos. No es un rango ni una estimación.
- [ ] 1.5 `pedir_fotos`: **cinco vistas** — frente 3/4, lateral, atrás 3/4, interior delantero, tablero con el kilometraje. Con "No las tengo ahora", que **no bloquea**.
- [ ] 1.6 `pedir_zona`: SVG con Rafaela al centro, anillos a 50 y 100 km y los pueblos clickeables. Accesible con teclado. **Sin Google Maps ni Leaflet.**
- [ ] 1.7 `mostrar_resumen`: devuelve error si falta saber si entrega un auto o qué se lleva.
- [ ] 1.8 Visión por signed URL. El agente confirma en una línea si la foto es el auto que tiene o el que busca.

## 2. Las reglas duras, con tests

- [ ] 2.1 Test: ante *"¿cuánto vale mi Corolla?"* la respuesta **no contiene ningún número de precio** del auto del cliente.
- [ ] 2.2 Test: ante *"¿cómo lo tasan?"* la respuesta **no menciona otras agencias, ni red, ni consultar a terceros**.
- [ ] 2.3 Test: el agente **sí** dice el precio de un auto del stock cuando se lo piden.
  *Verifica:* `npx vitest run lib/agente` → los tres pasan.

## 3. La página

- [ ] 3.1 Hero, la caja con textarea + cámara + envío, y tres chips. Al escribir, la caja **se convierte** en la conversación — no navega.
- [ ] 3.2 Fila fija de dos botones que **muestran el estado**: "Agregar fotos" → "3 fotos", "Elegir zona" → "Esperanza".
- [ ] 3.3 Grilla de seis autos desde la base **con el precio visible**, con "Lo quiero" y "Algo parecido" que siembran la conversación. Sin filtros, sin búsqueda, sin páginas de detalle.
- [ ] 3.4 Cómo funciona, en tres pasos.
- [ ] 3.5 Garantías: las cinco de producto siempre; las cinco de Falkenberg **detrás de `leerConfig("garantias_falkenberg")`**, leída en el server.
  *Verifica:* test de render — con la fila en `false`, el HTML no contiene "taller" ni "7 días" ni "48 horas".
- [ ] 3.6 Todas las frases de garantía y el copy de la página **en un solo archivo de contenido**.
- [ ] 3.7 Diseño según `AGENTS.md`, con los tokens de dark mode en las tres formas y `body` con background explícito.
  *Verifica:* puppeteer a 400px → sin scroll horizontal; y en dark mode ningún botón con texto del mismo color que su fondo.

## 4. El cierre y el handoff

- [ ] 4.1 Nombre y WhatsApp con validación y normalización del teléfono. **Sin OTP** — `enviarCodigo(telefono)` existe como interfaz que loguea a consola, con un TODO.
- [ ] 4.2 Rechazo de duplicados exactos en los últimos minutos.
- [ ] 4.3 Al confirmar: crea `caso`, los dos `acceso`, sube las fotos y escribe `pedido_enviado`.
  *Verifica:* test de integración — un pedido deja una fila en `caso`, dos en `acceso` y un `evento`.
- [ ] 4.4 `wa.me` con el pedido pre-escrito, la `ref` **y el link del operador**. El número sale de `leerConfig("whatsapp_abelardo")` **en el server** — nunca llega al browser como variable.
  *Verifica:* `grep -rn "whatsapp_abelardo" app components` → solo en código de servidor.
- [ ] 4.5 El chat cierra y el recibo queda arriba con el link del cliente, en `localStorage` con try/catch, **con botón de borrar** y "Hacer otro pedido".
  *Verifica:* con el storage bloqueado, la página renderiza igual.
- [ ] 4.6 `chat_iniciado` en el primer mensaje del cliente.

## 5. Tools del MCP

- [ ] 5.1 Registrar en el MCP las tools de lectura del canal: `ver_pedido(ref)` y `listar_pedidos_del_dia()`.
  *Verifica:* el inspector del MCP las lista y devuelven datos reales.

## 6. Verificación

- [ ] 6.1 `npx tsc --noEmit && pnpm build && npx vitest run`
