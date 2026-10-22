# Tasks

## 1. El servidor

- [ ] 1.1 `pnpm add @modelcontextprotocol/sdk`
- [ ] 1.2 Servidor MCP en TypeScript en `mcp/`, con los dos transportes: **stdio** para desarrollo local y **HTTP** servido desde la app en `/api/mcp` para usarlo desde cualquier Claude.
  *Verifica:* `npx @modelcontextprotocol/inspector` contra el stdio → lista las tools.
- [ ] 1.3 Las tools **reusan las server actions** de `stock-publicaciones`. Nada de lógica duplicada.
  *Verifica:* `grep -rn "from .*supabase" mcp/` → solo a través de `lib/`, nunca un cliente propio.

## 2. Autenticación

- [ ] 2.1 Tabla `operador`: `token` PK (nanoid), `nombre`, `rol` (`falkenberg` \| `vendedor`), `creado_en`, `ultimo_uso`.
- [ ] 2.2 El HTTP resuelve el token del header `Authorization` y el rol antes de ejecutar cualquier tool. Sin token válido, error claro y nada se ejecuta.
  *Verifica:* test — una llamada sin token devuelve error y no toca la base.
- [ ] 2.3 `ultimo_uso` se actualiza en cada llamada. Es lo que después dice si el MCP se usa o es decoración.

## 3. Tools de lectura — autonomía

- [ ] 3.1 `buscar_stock(query?, publicado?)` — lista autos con marca, modelo, año, km, precio, publicado y días sin actualizar.
- [ ] 3.2 `ver_auto(slug)` — la ficha completa con las fotos.
- [ ] 3.3 `stock_desactualizado()` — los publicados con más de 14 días sin tocar. **Es el aviso del admin, disponible sin abrir el admin.**

## 4. Tools de escritura — determinismo

Cada una hace **una** cosa, con argumentos explícitos. Ninguna toma texto libre con una instrucción adentro.

- [ ] 4.1 `cargar_auto(linea, fotos[])` — **la principal.** Devuelve la ficha deducida **y la lista de campos que no pudo deducir**. Crea el auto **sin publicar**. Nunca inventa un campo.
  *Verifica:* test — con *"entró un Corolla XEI 2019 con 78 mil"* y dos fotos, devuelve los campos poblados, `precio` ausente y `publicado: false`.
- [ ] 4.2 `completar_auto(slug, campos)` — completa lo que faltaba. Campos explícitos, no un objeto libre.
- [ ] 4.3 `poner_precio(slug, precio)` — **separada a propósito.** El precio es público y es una garantía: se escribe en una llamada propia, nunca de pasada dentro de otra.
- [ ] 4.4 `publicar_auto(slug)` — falla con un mensaje claro si falta el precio.
  *Verifica:* test — publicar sin precio devuelve error y el auto queda sin publicar.
- [ ] 4.5 `despublicar_auto(slug)`
- [ ] 4.6 `marcar_vendido(slug)` — despublica en la misma operación.

## 5. Lo que el MCP no puede hacer, verificado

- [ ] 5.1 **Ninguna tool devuelve ni acepta una estimación del valor del auto que el cliente entrega.** No existe `estimar_valor` ni nada equivalente.
  *Verifica:* test — la lista de tools no contiene ninguna cuyo schema pida o devuelva un valor de toma.
- [ ] 5.2 **Ninguna tool expone el margen.**
- [ ] 5.3 **Ninguna tool acepta una instrucción en texto libre.** Cada una tiene argumentos tipados.
  *Verifica:* test — ningún `inputSchema` tiene un campo que sea una instrucción.
- [ ] 5.4 El system prompt del servidor dice explícitamente que no estima precios y que el valor de toma lo pone Andrés después de ver el auto.

## 6. Documentación y verificación

- [ ] 6.1 `mcp/README.md`: cómo conectarlo desde Claude, cómo se emite un token de operador, y la lista de tools con una línea cada una.
- [ ] 6.2 `npx tsc --noEmit && pnpm build && npx vitest run`
