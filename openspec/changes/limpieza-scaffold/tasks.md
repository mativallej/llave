# Tasks

## 1. Confirmar antes de borrar

- [ ] 1.1 Listar los once componentes a borrar y confirmarlos con Matías. **El repo no tiene commits: lo que se borra no vuelve.**
  *Verifica:* `git log --oneline` → sin commits, y la lista revisada.

## 2. Limpiar

- [ ] 2.1 Borrar los componentes del modelo viejo: `hero.tsx`, `intent-cards.tsx`, `what-we-do.tsx`, `how-it-works.tsx`, `trust-signals.tsx`, `deliveries-preview.tsx`, `whatsapp-preview.tsx`, `whatsapp-sticky-button.tsx`, `photo-upload.tsx`, `header.tsx`, `footer.tsx`.
  *Verifica:* `grep -rn "intent-card\|deliveries-preview\|whatsapp-preview" app components lib` → sin resultados.
- [ ] 2.2 `app/page.tsx` en un placeholder mínimo que nombra el change que lo reemplaza.
- [ ] 2.3 `app/layout.tsx`: metadata real —título, descripción, `lang="es-AR"`— sin el copy viejo.

## 3. Identidad del proyecto

- [ ] 3.1 `package.json`: `"name": "llave"`, y `"packageManager": "pnpm@<version instalada>"`.
- [ ] 3.2 `.gitignore`: confirmar que cubre `.env*`, `.next`, `node_modules`.
  *Verifica:* `git status --short` → ningún `.env` ni `.next` listado.

## 4. Dependencias que faltan

El scaffold de v0 no trae nada de lo que el proyecto necesita. Sin esto, las verificaciones de los changes siguientes no corren.

- [ ] 4.1 `pnpm add @supabase/supabase-js @supabase/ssr openai zod`
- [ ] 4.2 `pnpm add -D vitest @vitejs/plugin-react` y el script `"test": "vitest run"`.
  *Verifica:* `pnpm test` → corre y reporta 0 tests, exit 0.
- [ ] 4.3 `supabase init` → crea `supabase/config.toml` y `supabase/migrations/`.
  *Verifica:* `supabase --version` ≥ 2.x y el directorio existe.
- [ ] 4.4 Confirmar que `.env.example` está commiteado y que `.env.local` no.
  *Verifica:* `git check-ignore .env.local` → ignorado; `git check-ignore .env.example` → exit 1.

## 5. Verificación y primer commit

- [ ] 5.1 `pnpm install && npx tsc --noEmit && pnpm build`
  *Verifica:* los tres en exit 0.
- [ ] 5.2 Primer commit del repo con el scaffold limpio, `AGENTS.md`, `openspec/` y este change.
  *Verifica:* `git log --oneline` → un commit.
