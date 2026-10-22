# Proposal

## Why

**Si las métricas no se capturan y no se miran, el canal corre tres meses y después se discute si salió bien** — que es exactamente el error que el framework marca en el paso de métricas: definirlas después de construir.

El tablero no es un reporte: es el instrumento con el que se decide seguir, frenar o cambiar. Y tiene una métrica que no se parece a las otras: **"no hubiera ido a Falkenberg sin esto"**, en entrevista post-venta. Es el leap of faith en una pregunta y es la única que separa **venta nueva** de **venta que igual pasaba**. Sin ella las otras seis pueden verse bien con el canal aportando cero: un cliente que ya iba a ir entra por el ad, cierra, y cuenta como atribuible.

Es también la única que **no sale de ningún sistema**. Hay que ir a buscarla, cliente por cliente, después de cada venta. Por eso el tablero muestra la deuda: cuántas ventas cerradas todavía no la tienen.

## What Changes

- **`/admin/tablero`** con ocho métricas en orden de prioridad, y nada más. Números grandes, el período arriba, y el embudo como una lista de pasos con la conversión entre cada par.
- **Tres avisos**, que son lo que convierte el tablero en algo que se mira:
  - **Renegociaciones**: si es mayor a cero, en rojo y arriba de todo. Es un gate binario — una sola rompe la garantía más fuerte del producto.
  - **Casos sin preguntar**: cuántas ventas tienen `venta_nueva` en `NULL`. Es la deuda de la métrica que más importa.
  - **La semana se llenó**: cuando las citas cumplidas llegan a 15, avisa que hay que frenar los ads antes de acumular cola.
- **Carga manual de `gasto_mes`**, porque el gasto en ads vive en la cuenta de Meta de Andrés.
- **El denominador siempre visible** en la métrica 6: un 80% sobre 5 respuestas de 12 ventas no es un 80%.
- **Tabla de casos** en `/admin/casos`: una vista que **lee**, con filtros por estado y antigüedad y nada más.

## Capabilities

### New Capabilities

- `metricas`: qué se mide, cómo se calcula cada número, y qué avisa el tablero sin que nadie lo busque.

### Modified Capabilities

*(ninguna)*

## Impact

**Dependencias:** todos los anteriores — el tablero lee los eventos que escriben los otros changes.

**Los umbrales no van en el código.** El tablero muestra los números; qué número significa que funciona es una decisión que todavía no está tomada y que no se hardcodea. Cuando esté, entra como configuración, no como constante en un componente.

**Fuera de alcance:** charts, exportación, informes a medida, cohortes. Ocho números y una tabla.
