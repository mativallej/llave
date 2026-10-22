# Tasks

## 0. Borrar el modelo descartado del remoto

Agregada en la ejecución, con el OK de Matías del 2026-10-22 ("borrá todo"). El proyecto de Supabase es del 3 de mayo y traía el esquema del SaaS multi-tenant: 8 tablas con datos de prueba, 5 funciones, 6 enums, 3 policies en `storage.objects`, 2 buckets vacíos, 1 usuario de auth y 3 migraciones que no están en el repo.

- [ ] 0.1 Migración `borrar_modelo_descartado`: tablas, funciones, enums y las policies de `storage.objects`. Con `if exists`, así que en una base nueva no hace nada.
  *Estado:* escrita en `supabase/migrations/`. Aplicarla con el MCP se cuelga a los 60 s, dos veces, sin aplicar nada: el MCP pide confirmación humana para sentencias destructivas (`drop table`, `drop function`, `drop policy`) y en esta sesión no hay dónde mostrarla. Las migraciones que no borran pasan al instante. **Espera que Matías la confirme o la corra en el SQL Editor.** El archivo se renombra a la versión que asigne el remoto.
- [x] 0.2 Los dos buckets viejos (`lead-photos`, `stock-photos`) por la Storage API: Supabase no deja borrar `storage.buckets` por SQL.
  *Verifica:* los dos con 0 objetos; `DELETE /storage/v1/bucket/<id>` → "Successfully deleted" en ambos; la lista de buckets queda en `fotos`.
- [x] 0.3 El usuario de `auth.users`, por la Admin API.
  *Verifica:* `DELETE /auth/v1/admin/users/<id>` → http 200; quedan 0 usuarios.
- [ ] 0.4 Las tres filas viejas de `supabase_migrations.schema_migrations`, para que el historial del remoto sea el del repo.
  *Estado:* va junto con la 0.1, por el mismo motivo.
- **Se conserva** el event trigger `ensure_rls` → `rls_auto_enable()`: no lo crearon las migraciones viejas, es el de Supabase que prende RLS en cada tabla nueva.

## 1. Migraciones

- [x] 1.1 `auto`: `slug` único, marca, modelo, anio, km, `precio` (público), segmento, `fotos text[]`, `publicado`, `vendido_en`, timestamps.
- [x] 1.2 `caso`: `ref` corto y legible (`LL-4821`), `telefono` indexado, nombre, `estado`, `auto_entrega jsonb`, `salida`, `auto_busca`, `auto_ids uuid[]`, zona, `valor_toma`, `precio_salida`, `vence_prop`, `cerro`, `motivo_perdida`, **`venta_nueva boolean`** (NULL = sin preguntar), **`renegocio boolean default false`**, `creado_en`, `ultimo_evento`.
- [x] 1.3 `acceso`: `token` PK de 22 chars, `caso_id`, `rol` (`cliente` \| `operador`), `abierto_en`.
- [x] 1.4 `nota`: `caso_id`, texto, autor, `creada_en`.
- [x] 1.5 `evento`: `bigserial`, `caso_id`, `tipo`, `meta jsonb`, `en`, con índices en `(tipo, en)` y `(caso_id, en)`.
- [x] 1.6 `gasto_mes`: `mes date` PK, `monto numeric`.
- [x] 1.7 `config`: `clave text` PK, `valor text`, `nota text` (para qué sirve, legible), `actualizado_en`. **Es dato operativo, no secreto de build**: cambia sin redeploy.
  Seed con tres claves: `whatsapp_abelardo` (vacía), `garantias_falkenberg` (`false`), `plazo_contacto` (vacía — la redacción del plazo de 48 horas todavía no está decidida).
  *Verifica (1.1–1.7):* migración `esquema` aplicada; con la service role, `config` → las tres claves con `''`, `'false'`, `''`.
  *Decisiones de la ejecución:*
  - Los ocho estados de la 3.1 de `caso-seguimiento` son los **abiertos**. El caso necesita uno terminal: `cerrado`, y `cerro` dice si fue venta (`true`) o pérdida (`false`). Así no se inventa un noveno estado para "perdido".
  - `evento.caso_id` admite NULL **solo** para `chat_iniciado`, que pasa antes de que exista un caso (check `evento_con_caso`).
  - `evento` no borra en cascada con el caso: el histórico de las métricas no se pierde por borrar un caso.
  - Los checks de la base respaldan tres reglas que de otro modo vivirían solo en el código: no se publica un auto sin precio, un auto vendido no queda publicado, y un `caso_perdido` siempre dice si fue silencio propio.
  - `marca`, `modelo`, `anio` y `km` admiten NULL porque el alta por foto y línea crea el auto antes de saber todo; lo que falta se confirma después (`stock-publicaciones`).
  - El primer check de `por_silencio` dejaba pasar `meta = {}`, porque un check que da NULL pasa. Lo encontró el test de integración y lo corrige la migración `evento_perdido_check`.
- [x] 1.8 Bucket de Storage para las fotos, privado, con signed URLs.
  *Verifica:* `supabase db reset` → todas las migraciones aplican sin error.
  *Verifica, como se corrió:* este contenedor no tiene daemon de Docker, así que no hay `supabase db reset` local. Cada migración se aplicó al remoto con `apply_migration` del MCP, en orden, todas con `{"success":true}`: `esquema`, `storage_fotos`, `rls`, `evento_ultimo_evento`, `evento_perdido_check`. `list_migrations` las lista con la misma versión que el nombre de archivo en `supabase/migrations/`. El bucket `fotos` existe con `public = false`.

## 2. RLS

- [x] 2.1 `auto`: `select` público solo donde `publicado = true`; escritura solo admin.
  *Verifica:* policy `auto_publicado_es_publico` (select, `anon` y `authenticated`, `using (publicado)`); ninguna policy de escritura: escribe solo la service role desde el server.
- [x] 2.2 `caso`, `nota`, `evento`: nada público. Lectura por `token` válido de `acceso`, resuelta en el server. Escritura por service role.
- [x] 2.3 `gasto_mes`: solo admin.
- [x] 2.4 `config`: **nada público, ni siquiera lectura.** Se lee solo con service role, desde server components y server actions. El número de WhatsApp termina en un `wa.me` generado en el server, así que nunca necesita llegar al browser.
  *Verifica:* con la clave anónima, `select * from config` → 0 filas.
  *Verifica:* con la clave anónima, `select * from caso` → 0 filas; `select * from auto where publicado` → las del seed.
  *Verifica, resultado:* con la anon por REST, `config`, `caso`, `acceso`, `nota`, `evento` y `gasto_mes` → `[]` (http 200); `auto?publicado=is.true` → los 4 del seed. `get_advisors` (security) marca "RLS sin policy" en las seis tablas privadas, que es justamente lo buscado.

## 3. Tipos, cliente y helper de eventos

- [ ] 3.1 Tipos generados en `lib/db/types.ts`. **No se escriben a mano.**
  *Estado:* espera la 0.1. Hoy el generador (`generate_typescript_types` del MCP: el CLI no está linkeado) devuelve también las tablas y enums del modelo viejo, y escribirlas en `lib/` es justo lo que sacó `limpieza-scaffold`. Hasta entonces `npx tsc --noEmit` falla por el módulo `./types` faltante.
  *Verifica:* `supabase gen types typescript` y `npx tsc --noEmit` en exit 0.
- [x] 3.2 Server client único en `lib/db/server.ts`.
  *Verifica:* `db()` con la service role, creado en el primer uso; los tests de integración lo usan contra el remoto y pasan.
- [x] 3.3 `lib/db/eventos.ts`: unión tipada de los nueve tipos —`chat_iniciado`, `pedido_enviado`, `caso_abierto_operador`, `cita_agendada`, `cita_cumplida`, `propuesta_publicada`, `venta_cerrada`, `caso_perdido`, `renegociacion`— y `registrar(tipo, casoId, meta?)`. `caso_perdido` acepta `por_silencio: boolean` en `meta`.
  *Verifica:* un test de vitest que un tipo inválido no compila (`// @ts-expect-error`).
  *Verifica, resultado:* `lib/db/eventos.test.ts` con tres `@ts-expect-error` (tipo inventado, `caso_perdido` sin meta, `pedido_enviado` sin caso). `pnpm test` → pasa. El chequeo de tipos lo hace `npx tsc --noEmit` en la 5.1.
- [x] 3.4 `registrar()` actualiza `caso.ultimo_evento` en la misma transacción.
  *Verifica:* trigger `evento_actualiza_caso` (after insert), así vale para cualquiera que escriba un evento: la web, el link o el MCP. `lib/db/eventos.integracion.test.ts` contra el remoto: `ultimo_evento` = `evento.en`, `caso_perdido` guarda `{por_silencio: true}`, y la base rechaza uno sin `por_silencio`. 3/3, y limpia sus filas (0 casos y 0 eventos después).
- [x] 3.5 `lib/config.ts`: `leerConfig(clave)` tipado contra las claves conocidas, cacheado por request. **Server only** — si se importa desde un componente de cliente, el build falla.
  *Verifica:* test — una clave que no existe en la unión no compila.
  *Verifica, resultado:* `lib/config.test.ts`: `@ts-expect-error` con una clave inventada, y contra el remoto `leerConfig("garantias_falkenberg")` → `false`. Server only: una ruta temporal con un componente `"use client"` que importa `@/lib/config` → `pnpm build` exit 1, "You're importing a module that depends on server-only"; la ruta se borró después. `garantias_falkenberg` falla cerrado: cualquier cosa que no sea el literal `"true"` es `false`.

## 4. Seed

- [x] 4.1 Cuatro autos de ejemplo, **con "(ejemplo)" en el modelo** para que ninguna captura de pantalla se confunda con stock real.
  *Verifica:* `select count(*) from auto where publicado` → 4.
  *Verifica, resultado:* `supabase/seed.sql` aplicado al remoto; con la service role, `count=exact` sobre `auto?publicado=is.true` → `0-3/4`; con la anon, los mismos 4 slugs.

## 5. Verificación

- [ ] 5.1 `pnpm install && npx tsc --noEmit && pnpm build`
  *Verifica:* los tres en exit 0.
