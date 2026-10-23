# Tasks

## 1. La configuración

- [ ] 1.1 Migración: la fila `citas_por_semana` en `15`, con un check de entero positivo; la nota nueva de `plazo_contacto` y su frase, solo si estaba vacía.
- [ ] 1.2 `lib/config.ts`: `citas_por_semana` como número, con su validación al escribir y 15 si la fila no se puede leer.
- [ ] 1.3 `/admin/config` la muestra y la deja editar.

## 2. El tablero

- [ ] 2.1 `calcularMetricas` y `calcularAvisos` reciben la capacidad; `leerTablero` la lee de `config`.
  *Verifica:* test — con capacidad 20, 15 citas no llenan la semana y 20 sí.

## 3. El plazo de contacto

- [ ] 3.1 La home pasa el plazo a la pantalla de enviado solo con `garantias_falkenberg` en `true`.
  *Verifica:* test — con el flag en false el plazo no llega; con true, sí. Y contra la app compilada, con la frase cargada y el flag en false, el HTML de la home no contiene "48 horas".

## 4. Verificación

- [ ] 4.1 `npx tsc --noEmit && pnpm build && npx vitest run`
