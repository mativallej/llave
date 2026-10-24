# Tasks

## 1. El contador

- [x] 1.1 Migración: la tabla `limite` (RLS sin policies) y la función `contar_uso`, que solo ejecuta la service role.
  *Verifica:* migración `limite_de_uso` aplicada por el MCP de Supabase (versión `20261023185543`). Consultado en la base: RLS prendido; `contar_uso` la ejecuta `service_role` y no `anon` ni `authenticated`. `lib/limites.integracion.test.ts` ✓:
  - "con máximo 3, las tres primeras pasan y la cuarta no; otra clave cuenta aparte";
  - "veinte pedidos al mismo tiempo cuentan veinte: ninguno pisa a otro" → 3 pasan y `cuenta = 20`;
  - "anon no la puede ejecutar".
- [x] 1.2 `lib/limites.ts`: los límites en un solo lugar, la IP de los encabezados, la clave con el hash, y el chequeo que falla abierto.
  *Verifica:* `lib/limites.test.ts` ✓:
  - "la IP es la primera de x-forwarded-for, o x-real-ip, o ninguna";
  - "la clave no contiene la IP: es un hash…";
  - "dice lo que dice la base";
  - "si la base devuelve un error o no responde, el pedido pasa y queda en el log".

## 2. Los endpoints

- [x] 2.1 `/api/chat`: los tres límites; si se pasa, 429 con el mensaje de Tuerca, y la UI lo muestra como un mensaje suyo.
  *Verifica:* `app/api/chat/route.test.ts` → 4 tests ✓: por conexión, techo total y máximo del día, cada uno con su mensaje y sin llamar al modelo. En la app compilada:
  - 60 pedidos desde una IP → 60 `400`, y el 61 → `429` con `{"error":"Vamos muy rápido para mí. Esperá unos minutos y seguimos desde acá."}`;
  - otra IP sigue pasando;
  - en el navegador, con la conexión pasada del límite, el cliente escribe y Tuerca contesta ese mensaje en su burbuja (captura a 400px revisada).
- [x] 2.2 `mandarPedido` y `pedirSubidasCliente`: si se pasa, el error dice cuándo probar de nuevo.
  *Verifica:* `app/acciones.test.ts` → 2 tests ✓. El pedido no se crea ("…Probá de nuevo dentro de una hora."), y no se dan links de subida. El mensaje de las fotos agrega "Podés mandar el pedido igual, sin fotos.", porque las fotos no bloquean el pedido.
- [x] 2.3 `/c/[token]`: si se pasa, una página que dice que espere unos minutos, sin buscar el token.
  *Verifica:* en la app, dentro de una misma ventana de 10 minutos: 120 aperturas desde una IP → 120 `404`, y la 121 → "Se abrieron muchos links seguidos desde esta conexión. Probá de nuevo dentro de 10 minutos.". Otra IP sigue dando `404`.
- [x] 2.4 `/api/mcp`: los intentos con un token bien formado que no es de nadie cuentan; pasado el límite, 429. Sin token o mal formado sigue sin tocar la base.
  *Verifica:* `app/api/mcp/route.test.ts` → 4 tests ✓, con los dos de antes intactos ("sin token… no toca la base"). En la app:
  - 21 intentos con un token desconocido → 20 `401` y 1 `429`;
  - 25 intentos sin token → 25 `401`, sin contar.
- [x] 2.5 Login del admin: cada intento cuenta; pasado el límite, no se llama a Supabase.
  *Verifica:* `app/admin/login/acciones.test.ts` ✓. En el navegador:
  - 10 intentos con contraseña mala → "El email o la contraseña no coinciden.";
  - el 11 → "Demasiados intentos desde esta conexión. Probá de nuevo dentro de 15 minutos.".

## 3. Verificación

- [x] 3.1 Contra la app compilada, pasar cada límite de verdad y ver la respuesta.
  *Verifica:* lo de 2.1 a 2.5. Cada escenario usó una IP de prueba distinta (rango 203.0.113.x, reservado para documentación). Al terminar se vació la tabla `limite`: `quedan = 0`.
- [x] 3.2 `npx tsc --noEmit && pnpm build && npx vitest run`
  *Verifica:* `rm -rf .next && pnpm install` → exit 0. `npx tsc --noEmit` → exit 0. `pnpm build` → exit 0. `npx vitest run`, dos corridas → `Test Files 28 passed (28)`, `Tests 115 passed (115)`.

## Notas

- **El primer intento con `/c/` cruzó el borde de la ventana.** Las 122 aperturas quedaron 99 en una y 23 en la siguiente, y la ventana fija se reinició en el medio; la base lo mostró así. Repetido arrancando lejos del borde, saltó en la 121. Es como funciona una ventana fija: alguien que pega justo en el borde puede llegar al doble del máximo en poco tiempo. Para estos números alcanza.
- **El primer intento del login con el navegador no mandaba los 11.** Hacía click sin esperar la respuesta anterior, y llegaron 6 (también se vio en la base). Con el script esperando cada respuesta, saltó en el 11.
- **`x-forwarded-for` solo se puede creer detrás de Vercel**, que lo escribe él. Si la app corriera en otro lado sin un proxy que lo pise, un atacante podría inventarse una IP por pedido y saltar los límites por conexión. El techo total de Tuerca lo sigue frenando igual.
