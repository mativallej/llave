# Tasks

## 1. El cálculo, como lógica pura y testeada

- [ ] 1.1 `lib/metricas/calcular.ts`: las ocho métricas como funciones puras sobre un array de eventos y casos, sin tocar la base.
  *Verifica:* `npx vitest run lib/metricas` con un set de eventos fijo → los ocho números esperados.
- [ ] 1.2 Las ocho: ventas cerradas/mes · costo por venta · pedido→cita · cita cumplida→propuesta (y la **mediana de días**) · propuesta→venta · **"no hubiera ido sin esto"** · citas/semana sobre 15 · **perdidos por silencio propio**.
- [ ] 1.3 La métrica 6 devuelve **siempre** el numerador, el denominador y los sin preguntar. No un porcentaje solo.
  *Verifica:* test — con 12 ventas y 5 respuestas, el resultado expone `sinPreguntar: 7`.
- [ ] 1.4 División por cero: cuando no hay denominador, la métrica es `null` y la UI dice "sin datos", no "0%".

## 2. El tablero

- [ ] 2.1 `/admin/tablero` con las ocho en orden, números grandes, y el selector de período (mes actual / últimos 3 meses).
- [ ] 2.2 El embudo como lista de pasos con la conversión entre cada par.
- [ ] 2.3 Aviso de **renegociaciones** en rojo y arriba de todo cuando es mayor a cero.
  *Verifica:* test de render — con un caso con `renegocio = true`, el aviso es el primer elemento del main.
- [ ] 2.4 Aviso de **ventas sin preguntar** con el conteo.
- [ ] 2.5 Aviso de **semana llena** cuando las citas cumplidas de la semana llegan a 15.
- [ ] 2.6 Carga manual de `gasto_mes`.
- [ ] 2.7 Sin librería de charts. Números y una tabla.

## 3. La tabla de casos

- [ ] 3.1 `/admin/casos`: ref, teléfono, qué entrega, qué busca, zona, estado, **días sin movimiento**, quién lo tiene.
- [ ] 3.2 Filtros por estado y por antigüedad. **Nada más.**
- [ ] 3.3 El link del operador de cada caso.
- [ ] 3.4 **La pantalla solo lee.** Ninguna acción de caso se ejecuta desde acá.
  *Verifica:* `grep -rn "update\|insert" app/admin/casos` → solo lecturas.

## 4. Tools del MCP

- [ ] 4.1 `metricas(periodo)` — las ocho, con numerador y denominador. Nunca un porcentaje solo.
- [ ] 4.2 `avisos()` — renegociaciones, ventas sin preguntar, y si la semana se llenó.
  *Verifica:* el inspector del MCP devuelve los mismos números que la pantalla.

## 5. Responsive y verificación

- [ ] 5.1 A 400px sin scroll horizontal.
- [ ] 5.2 `npx tsc --noEmit && pnpm build && npx vitest run`
