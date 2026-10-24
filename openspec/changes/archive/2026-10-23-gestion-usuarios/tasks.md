# Tasks

## 1. Datos

- [x] 1.1 Migración: `perfil.suspendido_en timestamptz`.
  *Verifica:* migración `perfil_suspendido` aplicada por el MCP de Supabase (versión `20261023201032`); los tipos tienen la columna en `Row`, `Insert` y `Update`.
- [x] 1.2 `rolActual()` no da acceso a un perfil suspendido.
  *Verifica:* `lib/auth/rol.test.ts` › "una sesión con un perfil suspendido no tiene acceso; la misma sin suspender, sí" ✓.

## 2. Las operaciones

- [x] 2.1 `lib/usuarios.ts`: listar (perfil + Supabase Auth: email, último ingreso), crear, cambiar rol, resetear contraseña, suspender y reactivar.
  *Verifica:* `lib/usuarios.integracion.test.ts` › "de punta a punta: alta, rol, reseteo, suspensión y vuelta" ✓, contra Supabase y entrando con la clave pública, como el login:
  - el usuario creado entra con la contraseña de 16 caracteres que se mostró, y la lista pasa a tener su último ingreso;
  - el rol va y vuelve;
  - después del reseteo, la vieja no entra y la nueva sí;
  - suspendido: entrar devuelve `user_banned`, `getUser` con el token de la sesión que estaba abierta ya no devuelve usuario, y `suspendido_en` queda con fecha;
  - reactivado, vuelve a entrar.
- [x] 2.2 Nadie se suspende ni se cambia el rol a sí mismo.
  *Verifica:* `lib/usuarios.integracion.test.ts` › "nadie se suspende ni se cambia el rol a sí mismo" ✓. Los dos intentos fallan con "No te podés … a vos mismo" y el perfil queda igual; la propia contraseña sí se puede resetear.
- [x] 2.3 La contraseña se genera al azar en el servidor, se devuelve una vez y no se guarda ni se loguea.
  *Verifica:*
  - `generarPassword` usa 12 bytes de `crypto.randomBytes` en base64url.
  - La contraseña solo viaja en la respuesta de la acción: no hay columna que la guarde y ningún `console` la imprime.
  - En la app, después de recargar la página, la contraseña ya no aparece en el HTML.
  - "un email repetido, uno mal escrito o un rol que no existe no crean nada" ✓.

## 3. La pantalla

- [x] 3.1 `/admin/usuarios`, solo `falkenberg`; el link aparece en la navegación solo para ese rol.
  *Verifica:* en la app compilada, con dos navegadores: la navegación del `falkenberg` tiene "Usuarios" y la del `vendedor` no. El `vendedor` que abre `/admin/usuarios` termina en `/admin/stock`.
- [x] 3.2 La lista con nombre, email, rol, estado y último ingreso; la fila propia dice "Vos" y no ofrece suspender ni cambiar el rol.
  *Verifica:* `components/admin/usuarios.test.tsx` → 4 tests ✓. En la app, la fila propia tiene "Vos", 0 botones "Suspender" y 0 "Pasar a…".
- [x] 3.3 El alta y el reseteo muestran la contraseña una vez, con un botón para copiarla y el aviso de que no se vuelve a mostrar.
  *Verifica:* en la app, el alta muestra la contraseña con "Copiar" y "No se vuelve a mostrar", y con ella el nuevo usuario entra. El reseteo muestra la nueva: con la vieja no entra y con la nueva sí.
- [x] 3.4 Suspender y resetear piden confirmación.
  *Verifica:* en la app: "Suspender" → "Sí, suspender"; "Resetear contraseña" → "Sí, resetear". Las capturas muestran el texto de cada confirmación.
- [x] 3.5 A 400px sin scroll horizontal, y el contraste de los botones en dark y light.
  *Verifica:*
  - `/admin/usuarios` a 400px: `scrollWidth 400, clientWidth 400` en light y en dark. La navegación con los cinco links entra en dos renglones.
  - Contraste con las dos confirmaciones abiertas: 10 botones; el de menor contraste da 6.39 en dark y 5.16 en light ("Sí, suspender"). Capturas revisadas.

## 4. Verificación

- [x] 4.1 Contra la app compilada:
  - un `falkenberg` da de alta a alguien desde la pantalla, y ese alguien entra con la contraseña que se mostró;
  - lo suspende, y la sesión abierta del otro pierde el acceso en el pedido siguiente.
  *Verifica:* Playwright con dos navegadores:
  - el `vendedor` recién creado entra;
  - lo suspenden, y su sesión abierta que va a `/admin/casos` termina en `/admin/login`;
  - al querer entrar ve "El email o la contraseña no coinciden. Si tu usuario está suspendido, hablá con Andrés.";
  - reactivado, entra.
  Al terminar se borraron los usuarios de prueba: Auth 0, perfiles 0, y la tabla `limite` vacía.
- [x] 4.2 `npx tsc --noEmit && pnpm build && npx vitest run`
  *Verifica:* `rm -rf .next && pnpm install` → exit 0. `npx tsc --noEmit` → exit 0. `pnpm build` → exit 0, con `ƒ /admin/usuarios`. `npx vitest run`, tres corridas → `Test Files 32 passed (32)`, `Tests 125 passed (125)`.

## Notas

**El mensaje del login, y por qué no dice "suspendido".** Supabase responde `user_banned` a una cuenta suspendida aunque la contraseña sea incorrecta; probado contra Supabase. Si el login dijera "estás suspendido" en ese caso, cualquiera podría averiguar qué emails tienen una cuenta suspendida. Por eso:
- la contraseña incorrecta y la cuenta bloqueada reciben el mismo mensaje, con una línea para quien esté suspendido;
- cuando la contraseña sí es correcta y lo que falta es el perfil, o el perfil está suspendido sin el bloqueo de Auth, el login lo dice y cierra la sesión.

**Una sesión abierta se corta por dos lados.** Supabase deja de aceptar su token (`403 user_banned`), y además `rolActual()` mira `suspendido_en` en cada pedido. Si alguna vez el bloqueo de Auth fallara, la segunda alcanza.

**Lo que apareció al verificar, fuera de este change:**
- **`cargar_auto` podía terminar en un auto duplicado.** Es de `stock-publicaciones` y `mcp-operacion`. En una corrida de la suite, "una línea sin año no inventa el año" falló con `MCP error -32001: Request timed out`, a los 60 segundos.
  - La llamada al modelo que arma la ficha (`extraerFicha`) no tenía límite de tiempo, y el cliente del MCP corta a los 60 segundos. Mientras el operador veía un error, el servidor seguía, y el auto podía crearse igual. El operador lo vuelve a cargar y queda duplicado.
  - Ahora la llamada tiene 20 segundos y un reintento, unos 40 en total, por debajo de los 60. Si se pasa, falla con "La lectura de la línea tardó demasiado y el auto no se cargó. Probá de nuevo en un momento.".
  - El admin también muestra ese mensaje: su acción de stock pasó a traducir cualquier error de regla, no solo los de stock.
  - `lib/agente/ficha.corte.test.ts` lo prueba sin red: 2 tests ✓.
  - La lentitud de OpenAI en esa corrida no se volvió a dar en las tres corridas siguientes.

**Para que sepa Matías:**
- **El primer usuario `falkenberg` se sigue creando con `scripts/crear-usuario.mts`.** Sin un usuario no hay quien entre a la pantalla. Después, todo se hace desde acá.
- **Suspender en el admin no toca el token del MCP** de esa persona, si tiene uno: es otra llave, en la tabla `operador`.
- **No hay borrado definitivo, ni "olvidé mi contraseña", ni cambio de la propia contraseña** desde la pantalla. Lo segundo pide un servidor de mail. Si alguno hace falta, va en un change propio.
