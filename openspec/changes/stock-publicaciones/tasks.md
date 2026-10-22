# Tasks

## 1. Auth del admin

- [ ] 1.1 Supabase Auth por email en `/admin`, con `middleware.ts` que protege `/admin/*`.
  *Verifica:* sin sesión, `curl -I /admin/stock` → redirect al login.
- [ ] 1.2 Tabla de perfiles con `rol` (`falkenberg` \| `vendedor`) y el helper `rolActual()`.

## 2. El alta por foto y línea

- [ ] 2.1 Cliente de Anthropic en `lib/agente/cliente.ts` con la configuración de `AGENTS.md` — thinking adaptativo, `effort: "low"`, sin `eager_input_streaming`.
- [ ] 2.2 Subida múltiple de fotos a Storage con drag & drop **y desde la cámara**, con signed URLs.
  *Verifica:* en un iPhone, el input abre la cámara.
- [ ] 2.3 `extraerFicha(linea, urls)`: devuelve los campos deducidos **más la lista de los que no pudo deducir**. Nunca completa un campo que no está en la evidencia.
  *Verifica:* test de vitest con *"Entró un Corolla XEI 2019 con 78 mil"* → marca, modelo, versión, anio y km poblados; `precio` siempre ausente.
- [ ] 2.4 Confirmación de a un dato por vez para lo que quedó marcado.
- [ ] 2.5 **El precio, a mano, obligatorio para publicar.** El agente no lo propone ni lo estima.
  *Verifica:* test — publicar sin precio devuelve error de validación.
- [ ] 2.6 El `slug` se genera solo y es único.

## 3. Mantenimiento

- [ ] 3.1 Lista de autos con foto, precio, publicado sí/no y **días desde la última actualización**.
- [ ] 3.2 Toggle de publicar/despublicar en un toque, sin confirmación intermedia.
- [ ] 3.3 "Marcar como vendido" → `vendido_en` y **despublica en la misma operación**.
  *Verifica:* test — después de marcar vendido, `publicado = false`.
- [ ] 3.4 Aviso arriba de la lista cuando hay autos publicados con más de 14 días sin actualizar, con el conteo.
- [ ] 3.5 Reordenar para elegir los seis destacados.
- [ ] 3.6 Pantalla de edición con el formulario completo, para corregir.

## 4. Config operativa

- [ ] 4.1 `/admin/config`: editar las claves de `config` con su `nota` al lado, para que se entienda qué hace cada una sin leer código. Solo rol `falkenberg`.
  *Verifica:* cambiar `garantias_falkenberg` a `true` y ver las cinco garantías en la home **sin redeploy**.
- [ ] 4.2 `garantias_falkenberg` muestra una advertencia al prenderlo: son cinco promesas que paga Andrés y requieren su aceptación por escrito.

## 5. Responsive y verificación

- [ ] 5.1 Todo el admin a 400px sin scroll horizontal.
  *Verifica:* puppeteer a 400px en `/admin/stock` → `scrollWidth === clientWidth`.
- [ ] 5.2 `npx tsc --noEmit && pnpm build && npx vitest run`
  *Verifica:* los tres en exit 0.
