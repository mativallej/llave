# Tasks

## 1. Confirmar antes de borrar

- [x] 1.1 Listar los once componentes a borrar y confirmarlos con Matías. **El repo no tiene commits: lo que se borra no vuelve.**
  *Verifica:* lista revisada y aprobada por Matías en la sesión del 2026-10-22. `git log --oneline` → **dos commits** (`8b6a551 init`, `e0887c9`), no cero: ver la nota 1.

## 2. Limpiar

- [ ] 2.1 Borrar los componentes del modelo viejo: `hero.tsx`, `intent-cards.tsx`, `what-we-do.tsx`, `how-it-works.tsx`, `trust-signals.tsx`, `deliveries-preview.tsx`, `whatsapp-preview.tsx`, `whatsapp-sticky-button.tsx`, `photo-upload.tsx`, `header.tsx`, `footer.tsx`.
  *Verifica:* `grep -rn "intent-card\|deliveries-preview\|whatsapp-preview" app components lib` → sin resultados.
- [x] 2.2 `app/page.tsx` en un placeholder mínimo que nombra el change que lo reemplaza.
  *Verifica:* `grep -c "^import" app/page.tsx` → 0; el texto nombra `canal-publico`.
- [x] 2.3 `app/layout.tsx`: metadata real —título, descripción, `lang="es-AR"`— sin el copy viejo.
  *Verifica:* `grep -nE "vendé|24-48|4,6|keywords" app/layout.tsx` → sin resultados; `grep -c 'lang="es-AR"' app/layout.tsx` → 1.

## 3. Identidad del proyecto

- [x] 3.1 `package.json`: `"name": "llave"`, y `"packageManager": "pnpm@<version instalada>"`.
  *Verifica:* `name` = `llave`, `packageManager` = `pnpm@10.28.0` (`pnpm --version` → 10.28.0).
- [x] 3.2 `.gitignore`: confirmar que cubre `.env*`, `.next`, `node_modules`.
  *Verifica:* cubría solo `.env*.local`; pasó a `.env*` con `!.env.example`. `git status --short` → ningún `.env` ni `.next` listado.

## 4. Dependencias que faltan

El scaffold de v0 no trae nada de lo que el proyecto necesita. Sin esto, las verificaciones de los changes siguientes no corren.

- [x] 4.1 `pnpm add @supabase/supabase-js @supabase/ssr openai zod`
  *Verifica:* instalados `@supabase/supabase-js` 2.118, `@supabase/ssr` 0.12.7, `openai` 7.43, `zod` 3.25.76. Zod queda en 3.25 y no en 4: es lo que aceptan a la vez `openai` (`^3.25 || ^4`), `@modelcontextprotocol/sdk` (`^3.25 || ^4`) y el `@hookform/resolvers` 3 que trae shadcn.
- [x] 4.2 `pnpm add -D vitest @vitejs/plugin-react` y el script `"test": "vitest run"`.
  *Verifica:* `pnpm test` → "No test files found, exiting with code 0", exit 0 (`vitest.config.ts` con `passWithNoTests` y el alias `@`).
- [x] 4.3 `supabase init` → crea `supabase/config.toml` y `supabase/migrations/`.
  *Verifica:* `supabase --version` → 2.121.0; existen `supabase/config.toml` y `supabase/migrations/` (este último lo crea a mano: `supabase init` 2.121 no lo genera).
- [x] 4.4 Confirmar que `.env.example` está commiteado y que `.env.local` no.
  *Verifica:* `git check-ignore .env.local` → ignorado, exit 0; `git check-ignore .env.example` → exit 1.

## 5. Verificación y primer commit

- [ ] 5.1 `pnpm install && npx tsc --noEmit && pnpm build`
  *Verifica:* los tres en exit 0.
  *Estado al 2026-10-22:* install exit 0; **tsc exit 2** por `components/intent-cards.tsx`, uno de los que borra la 2.1; build exit 0 solo porque `next.config.mjs` trae `typescript.ignoreBuildErrors: true` de v0. Pasa cuando se haga la 2.1.
- [ ] 5.2 Primer commit del repo con el scaffold limpio, `AGENTS.md`, `openspec/` y este change.
  *Verifica:* `git log --oneline` → un commit.

## Notas de ejecución — la realidad contra el change

1. **El repo ya tiene commits.** `8b6a551 init` trae el scaffold entero, incluidos los once componentes, así que el borrado **sí se recupera**: `git checkout 8b6a551 -- <archivo>`. La 5.2 ("primer commit del repo") no aplica tal como está escrita: el cierre del change es un commit más.
2. **Hay diez archivos del modelo viejo fuera de la lista de once.** La proposal dice que no hay rutas más allá de `app/page.tsx`, y no es cierto:
   - `app/comprar/page.tsx`, `app/vender/page.tsx`, `app/cambiar/page.tsx`, `app/confirmacion/page.tsx` — las tres intenciones y su confirmación.
   - `components/forms/form-comprar.tsx`, `form-vender.tsx`, `form-cambiar.tsx`, `form-stepper-header.tsx`.
   - `lib/mock-data.ts` (lo importan casi todos los componentes viejos) y `lib/validations.ts` (los schemas de los formularios).

   Las cuatro rutas importan los once componentes, así que borrar solo los once rompe el build; y el spec pide que `app/`, `components/` y `lib/` queden sin código del modelo descartado. Para cumplir el spec hay que borrar los 21. **Los diez de más esperan el OK de Matías.**
3. **El borrado lo frenó el control de permisos de la sesión** (modo Auto), incluso con solo los once aprobados. La 2.1 y la 5.1 quedan pendientes de eso; nada se movió ni se vació para esquivarlo.
4. `next.config.mjs` trae `typescript.ignoreBuildErrors: true` de v0: `pnpm build` pasa aunque el typecheck falle. Por eso la verificación de cada change corre `npx tsc --noEmit` aparte. Se deja como está porque el change conserva el toolchain.
