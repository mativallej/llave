# Proposal

## Why

El repo tiene un scaffold de Next.js del 28 de abril de 2026, **sin ningún commit**, y los componentes son del modelo que se descartó: un SaaS multi-tenant donde el cliente mandaba un *request* de tres intenciones a un vendedor con subdominio propio.

Se ve en los nombres: `intent-cards.tsx` es literalmente el "request de 3 intenciones", y `deliveries-preview.tsx` y `whatsapp-preview.tsx` muestran un flujo que ya no existe. El modelo actual está en `AGENTS.md` y no se parece: un solo galpón, sin tenants, sin subdominios, con el agente conversacional como puerta.

**Dejarlos es peor que borrarlos**, porque un agente que lea `components/` va a tomar el modelo viejo como referencia y lo va a reproducir.

El toolchain, en cambio, sirve entero y no hay motivo para rearmarlo.

## What Changes

- **Se conserva el toolchain:** Next 16.2.4, React 19, Tailwind 4, shadcn (`new-york`/`neutral`/`lucide`), TypeScript 5.7, pnpm, `tsconfig`, `next.config.mjs`, `postcss.config.mjs`, `components.json`.
- **Se conservan** `lib/utils.ts`, `components/ui/**` (shadcn sin modelo de negocio adentro) y `components/theme-provider.tsx`.
- **Se borran los componentes del modelo viejo:** `hero.tsx`, `intent-cards.tsx`, `what-we-do.tsx`, `how-it-works.tsx`, `trust-signals.tsx`, `deliveries-preview.tsx`, `whatsapp-preview.tsx`, `whatsapp-sticky-button.tsx`, `photo-upload.tsx`, `header.tsx`, `footer.tsx`.
- **`app/page.tsx` queda en un placeholder** que dice que el canal se construye en `canal-publico`.
- `package.json` pasa de `"name": "my-project"` a `"name": "llave"`, y se fija `packageManager`.
- **Primer commit del repo**, con el scaffold limpio y este change.

## Capabilities

### New Capabilities

- `base-tecnica`: qué toolchain usa el repo y qué no vive en él.

### Modified Capabilities

*(ninguna)*

## Impact

**Borrado real y sin red:** el repo no tiene commits, así que lo que se borre no se recupera de git. Los once componentes están listados uno por uno arriba a propósito — **se revisa la lista antes de ejecutar**, no después.

**Nada depende de ellos todavía:** no hay rutas más allá de `app/page.tsx`, ni tests, ni imports fuera de ese árbol.

**Fuera de alcance:** cualquier componente nuevo. Este change solo saca y deja el piso limpio.
