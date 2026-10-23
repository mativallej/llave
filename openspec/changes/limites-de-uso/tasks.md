# Tasks

## 1. El contador

- [ ] 1.1 Migración: la tabla `limite` (RLS sin policies) y la función `contar_uso`, que solo ejecuta la service role.
  *Verifica:* test de integración — con máximo 3, las tres primeras pasan y la cuarta no; otra clave cuenta aparte.
- [ ] 1.2 `lib/limites.ts`: los límites en un solo lugar, la IP de los encabezados, la clave con el hash, y el chequeo que falla abierto.
  *Verifica:* test — la clave no contiene la IP; si la base falla, el pedido pasa.

## 2. Los endpoints

- [ ] 2.1 `/api/chat`: los tres límites; si se pasa, 429 con el mensaje de Tuerca, y la UI lo muestra como un mensaje suyo.
  *Verifica:* test — con el límite pasado, 429 y el mensaje, sin llamar al modelo.
- [ ] 2.2 `mandarPedido` y `pedirSubidasCliente`: si se pasa, el error dice cuándo probar de nuevo.
- [ ] 2.3 `/c/[token]`: si se pasa, una página que dice que espere unos minutos, sin buscar el token.
- [ ] 2.4 `/api/mcp`: los intentos sin token válido cuentan; pasado el límite, 429.
  *Verifica:* test — sin token y con el límite pasado, 429.
- [ ] 2.5 Login del admin: cada intento cuenta; pasado el límite, no se llama a Supabase.

## 3. Verificación

- [ ] 3.1 Contra la app compilada, pasar cada límite de verdad y ver la respuesta.
- [ ] 3.2 `npx tsc --noEmit && pnpm build && npx vitest run`
