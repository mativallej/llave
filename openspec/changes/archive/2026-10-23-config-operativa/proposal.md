# Proposal

## Why

Dos datos que cambian por motivos del negocio quedaron fuera de `config`, y AGENTS.md dice que esos datos van en una fila y no en el código:

- **La capacidad semanal**, las 15 citas cumplidas por semana a las que el tablero avisa que hay que frenar los ads. Era una constante en `lib/metricas/calcular.ts`: cambiarla pedía un deploy.
- **La redacción del plazo de contacto**, que estaba vacía "hasta que se decida". Matías la pidió el 23/10/2026.

## What Changes

- **Clave nueva `citas_por_semana`** en `config`, en `15` de inicio, un entero positivo. El tablero y la tool `avisos` la leen, y se edita desde `/admin/config`.
- **`plazo_contacto` lleva su frase:** *"Lo hace dentro de las 48 horas hábiles."* Va después de *"Falkenberg lo revisa y te escribe por WhatsApp."*, en la pantalla de pedido enviado.
- **El plazo se muestra solo con `garantias_falkenberg` en `true`.** El plazo de 48 horas es una de las cinco garantías que banca Falkenberg, y el spec de `canal-publico` prohíbe mostrarlo con el flag apagado. Decisión de Matías (23/10/2026): la frase queda cargada y aparece cuando Andrés acepte las garantías por escrito. La nota de la fila lo dice.

## Capabilities

### Modified Capabilities

- `metricas`: la capacidad semanal sale de `config`.
- `canal-publico`: el plazo de contacto sigue al flag de las garantías.

## Impact

**Hoy el plazo no se ve en ningún lado.** `garantias_falkenberg` está en `false` y no se toca.

**Si `citas_por_semana` no se puede leer como un entero positivo**, el tablero usa 15 y lo deja en el log. Un aviso que no aparece por un dato mal cargado es peor que uno con el número de siempre.
