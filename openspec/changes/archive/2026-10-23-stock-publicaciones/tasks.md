# Tasks

## 1. Auth del admin

- [x] 1.1 Supabase Auth por email en `/admin`, con `middleware.ts` que protege `/admin/*`.
  *Verifica:* sin sesión, `curl -I /admin/stock` → redirect al login.
  *Verifica, resultado:* con `pnpm start`, `curl -I /admin/stock` → `HTTP/1.1 307`, `location: /admin/login`. Va en `proxy.ts` y no en `middleware.ts`: ver la nota 1. Login por email y contraseña (`/admin/login`), sin depender de un servidor de mail.
- [x] 1.2 Tabla de perfiles con `rol` (`falkenberg` \| `vendedor`) y el helper `rolActual()`.
  *Verifica:* migración `perfil_y_stock` aplicada (tabla `perfil` con RLS y sin policies: la lee solo la service role). `rolActual()` y `requerirRol()` en `lib/auth/rol.ts`. Una sesión sin fila en `perfil` no entra: el acceso lo da la service role al crear la fila, nunca un registro desde la web. `node --env-file=.env.local scripts/crear-usuario.mts <email> <nombre> <rol>` crea la cuenta y el perfil; probado con un usuario de prueba, que se borró después.

## 2. El alta por foto y línea

- [x] 2.1 Cliente de OpenAI en `lib/agente/cliente.ts` con la configuración de `AGENTS.md` — el snapshot con fecha, `reasoning: { effort: "low" }`, `store: false`.
  *Verifica:* `MODELO = "gpt-5.5-2026-04-23"` y `CONFIG_BASE = { model, reasoning: { effort: "low" }, store: false }`, que usa toda llamada. `grep -rnE '"gpt-5\.5"|effort: "(none|minimal)"' lib/agente` → sin resultados.
- [x] 2.2 Subida múltiple de fotos a Storage con drag & drop **y desde la cámara**, con signed URLs.
  *Verifica:* en un iPhone, el input abre la cámara.
  *Verifica, como se corrió:* no hay un iPhone en este entorno. Lo verificable acá: el DOM de `/admin/stock` tiene un input con `capture="environment"` y `accept="image/*"` (el que iOS abre como cámara) y otro con `multiple` para la galería; arrastrar y soltar funciona sobre la caja. Las fotos se achican a 1600 px en el teléfono y suben directo al bucket privado con un token de subida firmado (`createSignedUploadUrl`): la anon no tiene ninguna policy de Storage. Prueba de punta a punta con Playwright: la foto quedó en `fotos/stock/<uuid>.jpg` y la URL firmada de lectura → 200 `image/jpeg`. **Pendiente de Matías o Abelardo: probarlo una vez en un iPhone real.**
- [x] 2.3 `extraerFicha(linea, urls)`: devuelve los campos deducidos **más la lista de los que no pudo deducir**. Nunca completa un campo que no está en la evidencia.
  *Verifica:* test de vitest con *"Entró un Corolla XEI 2019 con 78 mil"* → marca, modelo, versión, anio y km poblados; `precio` siempre ausente.
  *Verifica, resultado:* `lib/agente/ficha.test.ts` contra el modelo real: Toyota / Corolla / XEI / 2019 / 78000, `faltantes = []`, sin propiedad `precio`; y con *"Entró un Corolla XEI con 78 mil"* → `anio = null` y en `faltantes`. 2/2. El esquema de salida no tiene campo de precio, y el código descarta un año que no está escrito en la línea.
- [x] 2.4 Confirmación de a un dato por vez para lo que quedó marcado.
  *Verifica:* `/admin/stock/[slug]` muestra solo el primer faltante, con "Quedan N datos por confirmar"; la versión es la única que se puede saltear ("No tiene versión"). Playwright: con la línea sin año, la pantalla preguntó "¿De qué año es?", se confirmó 2019 y la pregunta desapareció.
- [x] 2.5 **El precio, a mano, obligatorio para publicar.** El agente no lo propone ni lo estima.
  *Verifica:* test — publicar sin precio devuelve error de validación.
  *Verifica, resultado:* `lib/stock/stock.integracion.test.ts`: `publicarAuto` sin precio → `ErrorStock` "Falta el precio…" y el auto queda sin publicar. Además lo respalda el check `auto_publicado_con_precio` de la base. En Playwright, el interruptor sin precio mostró "Falta el precio" y volvió atrás.
- [x] 2.6 El `slug` se genera solo y es único.
  *Verifica:* test de integración — un slug ocupado devuelve `-2`, uno libre vuelve tal cual. Unit test de `slugBase` (sin acentos ni símbolos).

## 3. Mantenimiento

- [x] 3.1 Lista de autos con foto, precio, publicado sí/no y **días desde la última actualización**.
  *Verifica:* `/admin/stock` muestra portada (URL firmada), precio o "Sin precio", km, "Actualizado hace N días", el interruptor y cuántos datos faltan confirmar.
- [x] 3.2 Toggle de publicar/despublicar en un toque, sin confirmación intermedia.
  *Verifica:* un `Switch` con actualización optimista; si la regla no deja (sin precio, datos sin confirmar), vuelve y dice por qué. Playwright: un toque publicó.
- [x] 3.3 "Marcar como vendido" → `vendido_en` y **despublica en la misma operación**.
  *Verifica:* test — después de marcar vendido, `publicado = false`.
  *Verifica, resultado:* test de integración: `vendido_en` no nulo y `publicado = false` en el mismo `update`; el check `auto_vendido_no_publicado` de la base lo respalda. El botón pide un segundo toque (ver la nota 3).
- [x] 3.4 Aviso arriba de la lista cuando hay autos publicados con más de 14 días sin actualizar, con el conteo.
  *Verifica:* `stockDesactualizado()` (publicados con `actualizado_en` de hace más de 14 días) y el aviso arriba de todo con el conteo y los nombres. Reordenar no reinicia el reloj (nota 4), probado por test de integración.
- [x] 3.5 Reordenar para elegir los seis destacados.
  *Verifica:* columna `auto.orden` (migración `perfil_y_stock`); flechas en cada publicado y "Destacado" en los primeros seis. `moverAuto` renumera la lista de publicados sin empates; con un borrador devuelve error (test).
- [x] 3.6 Pantalla de edición con el formulario completo, para corregir.
  *Verifica:* "Corregir los datos", plegado en `/admin/stock/[slug]`: marca, modelo, versión, año, km y segmento. El alta nunca pasa por acá.

## 4. Config operativa

- [x] 4.1 `/admin/config`: editar las claves de `config` con su `nota` al lado, para que se entienda qué hace cada una sin leer código. Solo rol `falkenberg`.
  *Verifica:* cambiar `garantias_falkenberg` a `true` y ver las cinco garantías en la home **sin redeploy**.
  *Verifica, como se corrió:* la home con garantías la construye `canal-publico`, así que esa mitad se verifica allá (su tarea 3.5). Y **`garantias_falkenberg` no se prendió ni para probar**: arranca en `false` y se queda ahí. El mecanismo se probó con `plazo_contacto`: guardar desde `/admin/config` → la base tiene el valor nuevo → al recargar se ve, sin redeploy → restaurado a `''`. Con el perfil en `vendedor`, `/admin/config` lleva a `/admin/stock` y el menú no muestra Config.
- [x] 4.2 `garantias_falkenberg` muestra una advertencia al prenderlo: son cinco promesas que paga Andrés y requieren su aceptación por escrito.
  *Verifica:* Playwright: al tocar el interruptor aparece "Son cinco promesas que paga Andrés." y "Prender las garantías" queda deshabilitado hasta marcar "Andrés las aceptó por escrito". Se tocó "Dejarlas apagadas": la base sigue en `false`.

## 5. Responsive y verificación

- [x] 5.1 Todo el admin a 400px sin scroll horizontal.
  *Verifica:* puppeteer a 400px en `/admin/stock` → `scrollWidth === clientWidth`.
  *Verifica, resultado:* con Playwright y el Chromium que trae el entorno (nota 2), `scripts/verificar-ancho.mjs` logueado: `/admin/login`, `/admin/stock`, `/admin/stock/<slug>` (con y sin datos por confirmar) y `/admin/config` → `scrollWidth 400, clientWidth 400` en las cinco.
- [x] 5.2 `npx tsc --noEmit && pnpm build && npx vitest run`
  *Verifica:* los tres en exit 0.
  *Verifica, resultado:* desde cero (`rm -rf .next`): `pnpm install` exit 0, `npx tsc --noEmit` exit 0, `pnpm build` exit 0, `npx vitest run` → 20/20 en 6 archivos.

## Notas de ejecución — la realidad contra el change

1. **`middleware.ts` es `proxy.ts` en Next 16.** La convención `middleware` está deprecada y renombrada (`node_modules/next/dist/docs/.../proxy.md`). Mismo comportamiento: corre antes de la ruta, refresca la sesión y redirige.
2. **Playwright y no puppeteer.** El entorno trae Chromium para Playwright (revisión 1194, la de `playwright@1.56.1`, que es la versión que se instaló). El chequeo es el mismo: `scrollWidth === clientWidth`.
3. **"Se vendió" pide un segundo toque.** El spec no pide confirmación ahí, pero es la única acción que no se deshace desde el admin y saca el auto de la página; un toque de más parado en el galpón la dispara. El de publicar sigue siendo un toque.
4. **Reordenar no cuenta como actualizar** (migración `auto_actualizado_sin_orden`). Si mover un auto en la lista reiniciara "días sin actualizar", un auto vendido que se reordena cada semana no saltaría nunca en el aviso de los 14 días, que es justo el que lo tiene que cazar.
5. **Columnas que el esquema no tenía:** `auto.version` (la 2.3 la pide) y `auto.orden` (para la 3.5). El seed se corrigió para llevar la versión aparte, con "(ejemplo)" en el modelo.
6. **Publicar pide además marca, modelo, año y km**, no solo el precio: es lo que el cliente ve en la tarjeta. La versión puede quedar vacía.
7. **Los primeros usuarios los crea Matías** con `scripts/crear-usuario.mts`: hace falta el email de Andrés, de Abelardo y de quien venda. La contraseña se imprime una vez para entregarla en persona.
8. Supabase avisa que la protección contra contraseñas filtradas de Auth está apagada. Se prende desde el dashboard (Auth → Providers → Email); no se puede desde acá.
