# Llave

El canal digital de Falkenberg Meyer Automotores — Rafaela y 100 km a la redonda.

El contexto de negocio, el mantra, las reglas duras de copy, las del agente y la lista de qué no construir están en **`AGENTS.md`** en la raíz. Este archivo es solo la convención técnica.

## Stack

- **Next.js 16.2.4** (App Router) · React 19 · TypeScript 5.7 · pnpm
- **Tailwind 4** + shadcn/ui — estilo `new-york`, base `neutral`, iconos `lucide`
- **Supabase** — Postgres + Storage + Auth. El Auth es solo del admin
- **`@anthropic-ai/sdk`** con `claude-opus-5` para el agente
- **Vercel** para deploy

## Convenciones

| | |
|---|---|
| Rutas | App Router. El canal público en `/`, el caso en `/c/[token]`, el admin en `/admin/*` |
| Datos | Server actions con el patrón de un solo `supabase` server client. Nada de ORM |
| Migraciones | SQL en `supabase/migrations/`, numeradas. Toda tabla con RLS |
| Tipos | Generados de Supabase en `lib/db/types.ts`. No se escriben a mano |
| Tests | `vitest` para lógica pura — el mapeo de estados, el cálculo de las métricas, la normalización de teléfonos |
| Idioma | Código, tipos y commits en inglés. **Todo lo que ve un usuario, en castellano rioplatense** |

## Lo que nunca va al repo

Datos reales de clientes, teléfonos, fotos de autos de clientes, el número de WhatsApp de Abelardo, claves de Supabase o de Anthropic. El seed son cuatro autos **marcados como ficticios**.
