# Tasks

## 1. La ruta y los roles

- [x] 1.1 `/c/[token]` server component que resuelve `acceso` → rol, y 404 si el token no existe. **Sin auth.**
  *Verifica:* `pnpm build && pnpm start -p 3100`, con dos casos de prueba creados por `enviarPedido`, y `curl` contra la app compilada:
  - `/c/inventadoinventadoxxxxx` → `404`;
  - `/c/no-es-un-token` → `404`;
  - token del cliente → `200`, `0` botones `data-accion`, sin "Qué hacer ahora";
  - token del operador → `200` con "Qué hacer ahora". En `pendiente_inspeccion` muestra `marcar_inspeccionado no_vino perder`; en `pendiente_conseguir`, `conseguido proximo_aviso perder`.
  - Las cuatro páginas tienen `noindex`.
  - El HTML del cliente no contiene el token del operador, ni el teléfono, ni el nombre, ni `valor_toma` (`0` en los cuatro).
- [x] 1.2 `acceso.abierto_en` en la primera apertura, y el evento `caso_abierto_operador` cuando el rol es operador.
  *Verifica:* `lib/caso/caso.integracion.test.ts` › "el link resuelve el rol; la primera apertura del operador es un evento, y una vista previa no cuenta" ✓.
  Además, contra la app compilada con un caso recién creado:
  - antes de abrir: `caso_abierto_operador: 0 · abierto_en: vacío`;
  - dos aperturas con user-agent `WhatsApp/2.24…` y `facebookexternalhit/1.1`: sigue en `0 · vacío`;
  - dos aperturas con user-agent de iPhone: `1 · con fecha`.

## 2. La vista del cliente — el mostrador

- [x] 2.1 Línea de tiempo de lo que pasó, **con fecha**: pedido recibido, fotos recibidas, turno agendado, auto revisado.
  *Verifica:* captura a 400px de `/c/<token del cliente>` con el caso en `pendiente_inspeccion`. Muestra "Recibimos tu pedido", "Recibimos las fotos" y "Te dimos turno para el jueves 29 de octubre a las 10:00", cada una con "23 de octubre".
  `components/caso/vista-cliente.test.tsx` › "el turno se dice con el día y la hora de Argentina, en 24 horas" ✓.
- [x] 2.2 Qué falta y qué sigue, en una línea.
  *Verifica:* en la app, `pendiente_inspeccion` → "Sigue: Tu turno es el jueves 29 de octubre a las 10:00."; `pendiente_conseguir` → "Falta: El auto que te llevás. Sigue: Falkenberg lo está buscando."
- [x] 2.3 Los números **a medida que existen, con la fecha al lado de cada uno**. La fecha no es decoración: es lo que convierte el link en registro.
  *Verifica:* `vista-cliente.test.tsx` › "con solo el precio de salida, lo muestra con su fecha y el valor de toma como pendiente" ✓. En la app: "$ 24.500.000 · fijado el 23 de octubre" y "El tuyo: Todavía no: lo pone Falkenberg después de verlo en persona."
- [x] 2.4 La propuesta publicada: los dos números, la diferencia y hasta cuándo vale.
  *Verifica:* `vista-cliente.test.tsx` › "con la propuesta publicada, muestra los dos números, la diferencia y hasta cuándo vale" ✓.
- [x] 2.5 Estado de la búsqueda cuando el auto no está en stock: qué se busca, desde cuándo, cuándo se vuelve a avisar.
  *Verifica:*
  - `vista-cliente.test.tsx` › "en pendiente_conseguir dice qué se busca, desde cuándo y cuándo se vuelve a avisar, sin nombrar a terceros" ✓.
  - `vista-cliente.test.tsx` › "en ningún estado aparecen terceros ni el margen" ✓: el HTML no contiene "agencias", "red", "consultamos" ni ningún tercero.
  - En la app: `grep -i -E 'agencia|concesionaria oficial|\bred\b|consultamos|tercer|margen|ganancia'` sobre las dos vistas del cliente → ninguno.
- [x] 2.6 Nunca muestra el margen.
  *Verifica:* el mismo test, "en ningún estado aparecen terceros ni el margen" ✓, y el mismo `grep` en la app → ninguno.

## 3. La vista del operador

- [x] 3.1 Los ocho estados con **solo sus propias acciones**: `pendiente_fotos`, `pendiente_cita`, `pendiente_inspeccion`, `pendiente_tasacion`, `pendiente_conseguir`, `pendiente_propuesta`, `propuesta_publicada`, `pendiente_entrega`.
  *Verifica:*
  - `components/caso/acciones-estado.test.tsx` › "en cada estado, las acciones de los otros siete no están en el DOM" ✓.
  - `acciones-estado.test.tsx` › "en pendiente_cita están 'Agendé la cita' y 'No sirve', y nada más" ✓.
  - `caso.integracion.test.ts` › "una acción de otro estado no se puede hacer" ✓: la base también lo rechaza.
- [x] 3.2 Cada transición escribe su evento: `cita_agendada`, `cita_cumplida`, `propuesta_publicada`, `venta_cerrada`, `caso_perdido`.
  *Verifica:* `caso.integracion.test.ts` › "cada transición escribe su evento, y el precio del auto que se lleva tiene fecha desde el primer minuto" ✓.
- [x] 3.3 `caso_perdido` pide el motivo y **distingue si se cayó por silencio propio** → `meta.por_silencio`.
  *Verifica:* `caso.integracion.test.ts` › "un caso perdido por silencio propio lo dice en el evento" ✓, con `meta = { por_silencio: true, motivo }`.
- [x] 3.4 Publicar la propuesta setea `vence_prop` a +7 días y **congela los campos del caso**.
  *Verifica:* `caso.integracion.test.ts` › "publicar la propuesta la deja a siete días, escribe su evento y congela el caso" ✓. Después de publicar, editar `auto_entrega` falla dos veces:
  - por `corregirCaso`;
  - por un `update` directo a la tabla, que el trigger `caso_fechas` rechaza.
- [x] 3.5 Corregir un dato, editable solo hasta publicar la propuesta.
  *Verifica:* `components/caso/vista-operador.test.tsx` ✓:
  - "tiene el tel: para llamar y, hasta publicar la propuesta, se puede corregir un dato";
  - "con la propuesta publicada ya no se puede corregir nada".
  El bloqueo de la base lo cubre el test de 3.4.
- [x] 3.6 "Pedirle algo al cliente" genera el WhatsApp ya escrito y lo deja registrado.
  *Verifica:* `caso.integracion.test.ts` › "pedirle algo al cliente arma el WhatsApp ya escrito y lo deja anotado" ✓. El link es `wa.me/<teléfono>` con el texto, y queda la nota "Se le pidió la documentación del auto que entregás."
- [x] 3.7 Nota libre, un campo de texto sin estructura.
  *Verifica:* `mcp/herramientas/casos.integracion.test.ts` › "de la cita a la venta, cada paso deja el mismo evento y los mismos datos" ✓. Agrega la misma nota por el link y por el MCP; queda con texto y autor.
- [x] 3.8 Historial del teléfono: los casos anteriores con su estado y su fecha.
  *Verifica:* en la app, la vista del operador del primer caso muestra "Otros pedidos de este teléfono: LL-8079 · Buscando el auto · 23 de octubre". `casos.integracion.test.ts` › "historial_telefono encuentra los casos aunque el teléfono venga escrito de otra forma" ✓.
- [x] 3.9 Un `tel:` para llamar.
  *Verifica:* en la app, `href="tel:+549…"` en la vista del operador; `vista-operador.test.tsx` ✓.

## 4. Las dos marcas que son métrica

- [x] 4.1 "Se renegoció un precio en la entrega" → `caso.renegocio` + evento `renegociacion`. **Es el gate binario del Stage 1.**
  *Verifica:* `caso.integracion.test.ts` › "la renegociación en la entrega es una marca con su evento" ✓. `vista-operador.test.tsx` › "las dos marcas aparecen en la entrega, y la pregunta post-venta solo con la venta cerrada" ✓.
- [x] 4.2 "¿Hubiera venido a Falkenberg sin esto?" Sí / No / No preguntado → `caso.venta_nueva`, donde **Sí = `true` = venta nueva**.
  *Verifica:* `caso.integracion.test.ts` › "marcar 'Sí' en la pregunta post-venta deja venta_nueva = true" ✓. El test también verifica que "No preguntado" deja `null`, nunca `false`.

## 5. La baja del stock

- [x] 5.1 Al cerrar una venta con un auto del stock como salida, ese auto se marca vendido y se despublica.
  *Verifica:* `caso.integracion.test.ts` › "cerrar la venta consume el auto del stock: vendido y despublicado, sin ningún paso manual" ✓. Por el MCP, `casos.integracion.test.ts` verifica lo mismo con `cerrar_caso`.

## 6. Tools del MCP

Las de caso van acá porque este change construye la máquina de estados que exponen.

- [x] 6.1 Lectura: `listar_casos(estado?, antiguedad?)`, `ver_caso(ref)`, `historial_telefono(telefono)`.
  *Verifica:* `mcp/servidor.test.ts` › "expone las tools de stock, las de lectura del canal y las del caso" ✓. `mcp/servidor.test.ts` › "las tools de lectura se declaran de solo lectura, y lo que no se deshace como destructivo" ✓. `casos.integracion.test.ts` › "ver_caso y listar_casos nunca devuelven la tasación, aunque esté cargada" ✓.
- [x] 6.2 Escritura, una cosa por tool: `agendar_cita(ref, fecha)`, `marcar_inspeccionado(ref)`, `cargar_tasacion(ref, valor_toma)` (solo rol `falkenberg`), `publicar_propuesta(ref)`, `cerrar_caso(ref, cerro, motivo?)`, `agregar_nota(ref, texto)`.
  *Verifica:* `mcp/servidor.test.ts` ✓:
  - "cargar_tasacion es solo de falkenberg: un vendedor no la puede correr";
  - "ninguna tool pide ni devuelve un valor de toma, una estimación ni el margen, salvo cargar_tasacion";
  - "ningún inputSchema tiene un campo que sea una instrucción para interpretar".
  `casos.integracion.test.ts` › "un caso perdido por el MCP deja el mismo evento que por el link, y sin decir si fue silencio no se cierra" ✓.
- [x] 6.3 **`marcar_venta_nueva(ref, respuesta)`** — la respuesta post-venta. Es la métrica que decide si hay producto y la única que no sale de ningún sistema: que Abelardo la pueda decir hablando es la diferencia entre medirla y no medirla.
  *Verifica:* `casos.integracion.test.ts` › "de la cita a la venta…" ✓. `marcar_venta_nueva(si)` por el MCP deja `venta_nueva = true`, igual que el link.
- [x] 6.4 Cada una escribe su evento, igual que la UI.
  *Verifica:* `mcp/herramientas/casos.integracion.test.ts` › "de la cita a la venta, cada paso deja el mismo evento y los mismos datos" ✓. Mueve un caso por las acciones del link y otro por el MCP, paso a paso. Al final:
  - los eventos de los dos son iguales: `cita_agendada`, `cita_cumplida`, `propuesta_publicada`, `venta_cerrada`, con la misma `meta`, salvo la fecha de vencimiento;
  - son iguales `estado`, `cerro`, `valor_toma`, `precio_salida`, `cita_en` y `venta_nueva`.

## 7. Verificación

- [x] 7.1 `npx tsc --noEmit && pnpm build && npx vitest run`
  *Verifica:* al cerrar, `rm -rf .next && pnpm install` → exit 0. `npx tsc --noEmit` → exit 0. `pnpm build` → exit 0, con la ruta `ƒ /c/[token]`.
  `npx vitest run`, seis corridas seguidas → `Test Files 21 passed (21)`, `Tests 81 passed (81)` en las seis.
  En la app compilada, a 400px:
  - `node scripts/verificar-ancho.mjs` sobre las dos vistas en dos estados: `scrollWidth 400, clientWidth 400` en las cuatro.
  - `node scripts/verificar-contraste.mjs`: exit 0. El botón de menor contraste da 8.50 en dark y 6.23 en light.

## Notas

**La máquina de estados.** Vive en un solo lugar, `lib/caso/estados.ts`, y la usan la vista, el servidor y el MCP.

| Estado | Acciones | Va a |
|---|---|---|
| `pendiente_fotos` | Llegaron las fotos | `pendiente_cita` |
| `pendiente_cita` | Agendé la cita | `pendiente_inspeccion` |
| `pendiente_inspeccion` | Vino y lo revisamos | `pendiente_tasacion` si entrega auto; si no, `pendiente_propuesta` o `pendiente_conseguir` |
| | No vino | `pendiente_cita` |
| `pendiente_tasacion` | Cargar la tasación | `pendiente_propuesta` o `pendiente_conseguir` |
| `pendiente_conseguir` | Lo conseguimos (auto y precio) | `pendiente_propuesta` |
| | Próximo aviso | se queda |
| `pendiente_propuesta` | Publicar la propuesta | `propuesta_publicada` |
| `propuesta_publicada` | Aceptó | `pendiente_entrega` |
| `pendiente_entrega` | Cerrar la venta | `cerrado` con `cerro = true` |

"No sirve" está en todos los estados y lleva a `cerrado` con `cerro = false`.

**Dos cosas sobre los estados:**
- `cerrado` es el estado terminal. El spec nombra los ocho abiertos; el cierre, vendido o perdido, se distingue por `cerro`.
- Las transiciones sin evento propio (fotos, no vino, tasación, conseguido, próximo aviso, aceptó) dejan su fecha en una columna: `fotos_en`, `valor_toma_en`, `precio_salida_en`, `buscando_desde`. Los tipos de evento son los nueve fijos de `fundacion-datos`.

**Lo que este change agregó al spec, y por qué:**
- **`cerrar_caso` lleva `por_silencio`.** El spec dice `cerrar_caso(ref, cerro, motivo?)`, pero la 3.3 pide distinguir el silencio propio. Por eso `por_silencio` es opcional en el schema y obligatorio cuando `cerro` es `false`: sin él, la tool devuelve un error en vez de suponer `false`. Si se supusiera, el caso que más importa medir quedaría subcontado.
- **La vista previa de WhatsApp no cuenta como apertura.** WhatsApp, Facebook y los demás bots de preview abren el link antes que nadie. Si contaran, `caso_abierto_operador` se registraría en el momento del envío y la métrica de "cuánto tardó en abrirlo" daría cero siempre. Se filtran por user-agent (`esVistaPrevia`). Los metadatos de la página no dicen nada del caso, porque la preview los muestra.
- **"Pedirle algo al cliente" queda registrado como nota**, firmada, y no como evento. Los tipos de evento son los nueve de `fundacion-datos`, y agregar uno es cambiar ese change.
- **La hora va en 24 horas** ("jueves 29 de octubre a las 10:00"). `es-AR` por defecto escribe "10:00 a. m.", y al final de una oración quedaba "a. m..".

**Lo que apareció al verificar, fuera de este change:**
- **Dos tests de integración tenían el timeout por defecto y vivían al borde.** `enviarPedido` (5s) tardaba 4,9s solo, y el `beforeAll` de las tools de stock (10s) también estaba al límite. Con la suite entera en paralelo contra la base remota, se pasaban. Ahora tienen 30s explícitos, como los demás tests que van a la red.
- **Un turno de Tuerca podía terminar vacío y en silencio.** Es de `canal-publico`. En la suite completa, el test "ante '¿cuánto vale mi Corolla?' no da ningún número…" falló una vez con `expected 0 to be greater than 0`: el turno no había devuelto texto.
  - El loop solo leía `response.completed`. Si el stream terminaba en `response.incomplete`, en `response.failed`, en un evento `error`, o sin evento final, el turno salía vacío sin ningún error. Es la trampa de AGENTS.md.
  - Ahora esos cuatro casos son un corte: se loguea `turno:` con el motivo y el cliente lee "Se me cortó la conexión. ¿Me repetís lo último?". Un turno que termina sin texto por cualquier otro camino recibe el mismo aviso y su log.
  - `lib/agente/tuerca.corte.test.ts` lo prueba sin red: 3 tests ✓.
  - El test de reglas ahora falla si el turno se cortó, en vez de pasar sin haber probado la regla.
  - **La causa del lado del modelo no se reprodujo.** Fueron 8 llamadas aisladas y 6 suites completas, todas con texto. Si vuelve a pasar, el log va a decir cuál fue.

**Para que decida Matías:**
- **El link del operador no tiene identidad.** Quien lo tiene opera el caso, y eso incluye cargar la tasación: en el link, `cargar_tasacion` no está restringida a Falkenberg, y en el MCP sí (rol `falkenberg`). Si la tasación tiene que ser solo de Andrés también en el link, hace falta o un segundo link para él, o que cargarla pida el login del admin. Las dos opciones cambian el diseño del link, y por eso no se hizo acá.
- **El MCP no cubre todos los pasos.** Las tools son las que lista la 6.2. Fotos recibidas, no vino, conseguido, próximo aviso, aceptó la propuesta, corregir, renegociación y pedirle algo al cliente se hacen desde el link, que `ver_caso` devuelve.
  - Consecuencia práctica: por el MCP solo no se puede cerrar una venta si nadie marcó "Aceptó" en el link. `cerrar_caso(cerro: true)` pide que el caso esté esperando la entrega, igual que el link.
  - Si Abelardo va a operar todo hablando, faltan esas tools. Se agregan en un change propio.
- **`ver_caso` y `listar_casos` nunca devuelven la tasación**, ni siquiera con la propuesta publicada. El cliente sí la ve en su link. Es la lectura estricta de la regla del MCP: ninguna tool devuelve el valor del auto que entra.
