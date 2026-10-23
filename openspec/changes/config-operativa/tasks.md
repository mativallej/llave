# Tasks

## 1. La configuración

- [x] 1.1 Migración: la fila `citas_por_semana` en `15`, con un check de entero positivo; la nota nueva de `plazo_contacto` y su frase, solo si estaba vacía.
  *Verifica:* migración `config_operativa` aplicada por el MCP de Supabase (versión `20261023185116`). La tabla quedó así:
  - `citas_por_semana = 15`;
  - `plazo_contacto = "Lo hace dentro de las 48 horas hábiles."`;
  - `garantias_falkenberg = false`, sin tocar;
  - `whatsapp_abelardo` vacío.
  Un `update` directo a `'abc'` lo rechaza el check (`23514`), y queda 15.
- [x] 1.2 `lib/config.ts`: `citas_por_semana` como número, con su validación al escribir y 15 si la fila no se puede leer.
  *Verifica:*
  - Contra la base, `leerConfig("citas_por_semana")` → `15`, de tipo `number`.
  - `escribirConfig` con `"abc"`, `"0"`, `"1000"` y `"12.5"` → `ErrorConfig: Las citas por semana van como un número entero, por ejemplo 15.`
  - `lib/config.test.ts` › "salen de config como número: 15 de inicio" ✓.
- [x] 1.3 `/admin/config` la muestra y la deja editar.
  *Verifica:* `FilaConfig` tiene el título "Citas por semana" y el teclado numérico. `TITULO` es un `Record<ClaveConfig, string>`, así que una clave sin título no compila (`npx tsc --noEmit` → exit 0). La página lista todas las filas de `config` con su nota.

## 2. El tablero

- [x] 2.1 `calcularMetricas` y `calcularAvisos` reciben la capacidad; `leerTablero` la lee de `config`.
  *Verifica:*
  - `calcular.test.ts` › "la capacidad sale de config: con 20, quince citas no llenan la semana y veinte sí" ✓.
  - Contra la base, `leerTablero` con `citas_por_semana` en 15 → `capacidad: 15`. Con `escribirConfig("citas_por_semana", "20")` → `capacidad: 20`, sin build ni deploy. Después se volvió a 15.

## 3. El plazo de contacto

- [x] 3.1 La home pasa el plazo a la pantalla de enviado solo con `garantias_falkenberg` en `true`.
  *Verifica:*
  - `lib/config.test.ts` ✓: "con las garantías de Falkenberg apagadas no sale…" y "con las garantías prendidas sale tal como está en config".
  - Contra la app compilada (`pnpm build && pnpm start`), con la frase cargada en `config` y el flag en `false`, el HTML de la home tiene `'48 horas'`: 0 y `'Lo hace dentro'`: 0, y en el payload `plazoContacto":""`.
  - El flag no se prendió en ningún momento, ni para probar.

## 4. Verificación

- [x] 4.1 `npx tsc --noEmit && pnpm build && npx vitest run`
  *Verifica:* `pnpm install` → exit 0. `npx tsc --noEmit` → exit 0. `pnpm build` → exit 0. `npx vitest run` → `Test Files 23 passed (23)`, `Tests 100 passed (100)`.

## Notas

- **Un tropiezo en el camino.** Al agregar los tests del plazo pisé sin querer `lib/config.test.ts`, que ya existía. La primera corrida dio 97 tests en vez de 100, y por esa diferencia se vio. Se recuperó el archivo desde git y los tests nuevos se agregaron al final: los dos originales siguen ("una clave que no existe no compila" y "las garantías de Falkenberg arrancan apagadas").
