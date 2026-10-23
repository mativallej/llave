# Tasks

## 1. El cálculo, como lógica pura y testeada

- [x] 1.1 `lib/metricas/calcular.ts`: las ocho métricas como funciones puras sobre un array de eventos y casos, sin tocar la base.
  *Verifica:* `npx vitest run lib/metricas` → 9 tests ✓. "las ocho métricas, sobre un set fijo › dan los ocho números calculados a mano" ✓, con siete casos y sus eventos armados a mano:
  - 2 ventas; $ 150.000 por venta;
  - pedido→cita 4 de 6;
  - cita→propuesta 3 de 3, mediana 1 día;
  - propuesta→venta 1 de 3;
  - ventas nuevas 1 de 1 respuestas, 1 sin preguntar;
  - 2 de 15 citas esta semana;
  - 1 perdido por silencio de 2.
- [x] 1.2 Las ocho: ventas cerradas/mes · costo por venta · pedido→cita · cita cumplida→propuesta (y la **mediana de días**) · propuesta→venta · **"no hubiera ido sin esto"** · citas/semana sobre 15 · **perdidos por silencio propio**.
  *Verifica:* el mismo test, una aserción por métrica. El embudo tiene su propio test ✓: "es una lista de pasos con la conversión entre cada par, sobre los mismos pedidos".
- [x] 1.3 La métrica 6 devuelve **siempre** el numerador, el denominador y los sin preguntar. No un porcentaje solo.
  *Verifica:* "con 12 ventas y 5 respuestas expone el numerador, el denominador y los 7 sin preguntar" ✓ → `{ si: 3, respondidas: 5, ventas: 12, sinPreguntar: 7, valor: 0.6 }`.
- [x] 1.4 División por cero: cuando no hay denominador, la métrica es `null` y la UI dice "sin datos", no "0%".
  *Verifica:* "todo lo que divide es null, nunca 0" ✓. En `components/admin/tablero.test.tsx`, "sin ninguna respuesta la métrica dice 'sin datos', nunca 0%" ✓.

## 2. El tablero

- [x] 2.1 `/admin/tablero` con las ocho en orden, números grandes, y el selector de período (mes actual / últimos 3 meses).
  *Verifica:* `pnpm build` → `ƒ /admin/tablero`. Sin sesión, `curl` → `307` a `/admin/login`. Con un usuario de prueba y tres casos sembrados (una venta, un perdido por silencio, uno esperando la tasación), Playwright lee las ocho tarjetas en orden en `?periodo=mes` y en `?periodo=3meses`. El selector cambia "en octubre" por "de agosto a octubre · 0,3 por mes".
- [x] 2.2 El embudo como lista de pasos con la conversión entre cada par.
  *Verifica:* en la app: "Conversaciones con Tuerca 0, Pedidos 3, Con cita agendada 67% 2, Fueron a la cita 100% 2, Con propuesta 50% 1, Con venta 100% 1". Coincide con el embudo que devuelve el MCP.
- [x] 2.3 Aviso de **renegociaciones** en rojo y arriba de todo cuando es mayor a cero.
  *Verifica:* `tablero.test.tsx` ✓:
  - "con un caso renegociado, el aviso es el primer elemento del main, en rojo";
  - "sin renegociaciones el aviso no está, y ningún número está pintado de bueno o malo".
  En la app, sin renegociación, el primer elemento del `main` es `sin-preguntar`. Después de `marcarRenegocio` sobre la venta de prueba pasa a ser `renegociacion`, con texto y borde rojos, en los dos temas.
- [x] 2.4 Aviso de **ventas sin preguntar** con el conteo.
  *Verifica:* en la app: "A una venta le falta la pregunta: ¿hubiera venido a Falkenberg sin esto?". `tablero.test.tsx` ✓: "A 7 ventas les falta la pregunta".
- [x] 2.5 Aviso de **semana llena** cuando las citas cumplidas de la semana llegan a 15.
  *Verifica:* `tablero.test.tsx` › "con 15 citas cumplidas en la semana avisa que hay que frenar los ads" ✓; con 14 no aparece. En `calcular.test.ts`, "los avisos" ✓ y "la semana empieza el lunes a las 0:00 de Argentina" ✓.
- [x] 2.6 Carga manual de `gasto_mes`.
  *Verifica:* en la app, con Playwright: el formulario con mes `2026-10` y "1.200.000" → "Guardado.". El costo por venta pasa de "sin datos · Falta cargar el gasto de octubre." a "$ 1.200.000 · $ 1.200.000 en ads, 1 venta". En `?periodo=3meses` dice "sin datos · Falta cargar el gasto de agosto y septiembre.".
- [x] 2.7 Sin librería de charts. Números y una tabla.
  *Verifica:* se sacó `recharts` (`pnpm remove recharts`) y `components/ui/chart.tsx`, que nadie importaba. `grep -rn "recharts\|ui/chart" app components lib mcp` → sin coincidencias.

## 3. La tabla de casos

- [x] 3.1 `/admin/casos`: ref, teléfono, qué entrega, qué busca, zona, estado, **días sin movimiento**, quién lo tiene.
  *Verifica:* `pnpm build` → `ƒ /admin/casos`. En la app, por defecto muestra los abiertos: "LL-4003 · Falta la tasación · Lo tiene: Falkenberg". Cada caso lleva teléfono, entrega, busca, zona y "Sin movimiento: Se movió hoy".
- [x] 3.2 Filtros por estado y por antigüedad. **Nada más.**
  *Verifica:* en la app, `?estado=cerrado` → 2 casos (Perdido y Venta cerrada); `?estado=pendiente_tasacion` → 1; `?antiguedad=1` → 0, porque los tres se movieron hoy. Es un formulario GET con esos dos campos.
- [x] 3.3 El link del operador de cada caso.
  *Verifica:* en la app, cada caso tiene "Abrir el caso" → `/c/<token del operador>`, en las cuatro vistas.
- [x] 3.4 **La pantalla solo lee.** Ninguna acción de caso se ejecuta desde acá.
  *Verifica:* `grep -rn "update\|insert\|upsert\|delete\|mover_caso\|rpc(" "app/admin/(panel)/casos" lib/caso/tabla.ts` → exit 1, sin coincidencias. La carpeta tiene solo `page.tsx`, sin acciones.

## 4. Tools del MCP

- [x] 4.1 `metricas(periodo)` — las ocho, con numerador y denominador. Nunca un porcentaje solo.
  *Verifica:* `mcp/servidor.test.ts` ✓:
  - "expone las tools de stock, las de lectura del canal, las del caso y las del tablero";
  - "las tools de lectura se declaran de solo lectura…": `metricas` y `avisos` como lectura.
- [x] 4.2 `avisos()` — renegociaciones, ventas sin preguntar, y si la semana se llenó.
  *Verifica:* contra la app compilada, con un operador de prueba, `npx @modelcontextprotocol/inspector --cli "<base>/api/mcp?token=…" --transport http`:
  - `--tool-name avisos` → `{"renegociaciones":1,"ventasSinPreguntar":1,"semanaLlena":false,"citasSemana":2}`;
  - `--tool-name metricas --tool-arg periodo=mes` → ventas 1 · costo 1200000 · pedido→cita 2/3 · cita→propuesta 1/2 · propuesta→venta 1/1 · venta nueva 0 de 0, 1 sin preguntar · semana 2/15 · silencio 1/1.
  Son los mismos números que la pantalla. Además, un script compara tarjeta por tarjeta la pantalla con `tools/call` por HTTP, en los dos períodos y antes y después de cargar el gasto → `diferencias entre pantalla y MCP: 0`.

## 5. Responsive y verificación

- [x] 5.1 A 400px sin scroll horizontal.
  *Verifica:* `E2E_EMAIL=… E2E_PASSWORD=… node scripts/verificar-ancho.mjs` sobre `/admin/tablero`, `/admin/tablero?periodo=3meses`, `/admin/casos` y `/admin/casos?estado=cerrado` → `scrollWidth 400, clientWidth 400` en las cuatro.
  `node scripts/verificar-contraste.mjs` sobre `/admin/tablero` y `/admin/casos` → exit 0. El botón de menor contraste da 8.06 en dark y 6.23 en light. El script ahora inicia sesión igual que `verificar-ancho.mjs`.
  Capturas a 400px en light y dark revisadas a ojo.
- [x] 5.2 `npx tsc --noEmit && pnpm build && npx vitest run`
  *Verifica:* `rm -rf .next && pnpm install` → exit 0. `npx tsc --noEmit` → exit 0. `pnpm build` → exit 0. `npx vitest run`, tres corridas seguidas → `Test Files 23 passed (23)`, `Tests 95 passed (95)` en las tres.
  Al terminar se borró todo lo de prueba: casos, auto, gasto de octubre, operador y usuario. La base quedó como estaba: `gasto_mes: [] · casos: 0 · eventos: 0 · perfiles: 0 · operadores: 0`.

## Notas

**Cómo se calcula cada número.** El spec nombra las métricas pero no fija sus definiciones; quedan estas, en `lib/metricas/calcular.ts`:
- **Ventas** (1) y **costo por venta** (2) cuentan las ventas cerradas en el período, sin importar cuándo entró el pedido.
- **El costo por venta no se calcula si falta el gasto de algún mes del período**, y dice cuál falta. Un gasto parcial daría un costo más bajo que el real.
- **Las tres conversiones (3 a 5) y el embudo leen la misma cohorte**: los pedidos que entraron en el período, y hasta dónde llegó cada uno. Así la pantalla nunca muestra dos versiones de la misma conversión. Del mes en curso, los más nuevos todavía no tuvieron tiempo de llegar lejos, y la pantalla lo dice ("Los pedidos que entraron en octubre").
- **"No hubiera ido sin esto"** (6) es los "sí" sobre los que respondieron, entre las ventas del período. "No se preguntó" y "nunca se marcó" cuentan los dos como sin preguntar.
- **Perdidos por silencio** (8) muestra los perdidos por silencio junto al total de perdidos, sin mezclarlos.
- La semana arranca el lunes a las 0:00 de Argentina, y los meses son los de Argentina (UTC-3, sin horario de verano).
- Las fechas se comparan por instante y no como texto: la base escribe `+00:00` con microsegundos, y JavaScript escribe `Z`.

**Los avisos no dependen del período.** Las renegociaciones y las ventas sin preguntar son de siempre: una renegociación no deja de importar porque cambió el mes.

**Lo que este change agregó al spec, y por qué:**
- **"Quién lo tiene" sale del estado** (`QUIEN_TIENE` en `lib/caso/estados.ts`): Cliente, Vendedor o Falkenberg. No existe la asignación de casos a personas, y un motor de ruteo está en "Qué NO construir".
- **La "tabla" de casos es una lista**, una ficha por caso. Una `<table>` de nueve columnas no entra en 400px sin scroll horizontal.
- **El tablero y el gasto los ven y los cargan los dos roles.** El spec no lo restringe, y la deuda de ventas sin preguntar es de quien pregunta. El gasto va en pesos enteros: "1.500.000" y "1500000" son lo mismo.
- **`recharts` y `components/ui/chart.tsx` se sacaron.** Venían del scaffold, nadie los usaba, y AGENTS.md prohíbe una librería de charts.

**Para que decida Matías:**
- **El 15 de la semana llena es una constante** (`CAPACIDAD_SEMANAL`), porque el spec lo fija en 15. No es un umbral de éxito: es la capacidad de atender.
  - Si va a cambiar por motivos del negocio, el lugar es la tabla `config`, como el WhatsApp de Abelardo.
  - Moverla ahí pide una migración, y en esta sesión el conector de Supabase necesita que lo vuelvas a autorizar.
- **Ningún número tiene umbral**, como pide el spec. Cuando se decida qué valor significa que funciona, entra como configuración.
