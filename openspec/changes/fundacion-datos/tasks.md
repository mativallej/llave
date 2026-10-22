# Tasks

## 1. Migraciones

- [ ] 1.1 `auto`: `slug` único, marca, modelo, anio, km, `precio` (público), segmento, `fotos text[]`, `publicado`, `vendido_en`, timestamps.
- [ ] 1.2 `caso`: `ref` corto y legible (`LL-4821`), `telefono` indexado, nombre, `estado`, `auto_entrega jsonb`, `salida`, `auto_busca`, `auto_ids uuid[]`, zona, `valor_toma`, `precio_salida`, `vence_prop`, `cerro`, `motivo_perdida`, **`venta_nueva boolean`** (NULL = sin preguntar), **`renegocio boolean default false`**, `creado_en`, `ultimo_evento`.
- [ ] 1.3 `acceso`: `token` PK de 22 chars, `caso_id`, `rol` (`cliente` \| `operador`), `abierto_en`.
- [ ] 1.4 `nota`: `caso_id`, texto, autor, `creada_en`.
- [ ] 1.5 `evento`: `bigserial`, `caso_id`, `tipo`, `meta jsonb`, `en`, con índices en `(tipo, en)` y `(caso_id, en)`.
- [ ] 1.6 `gasto_mes`: `mes date` PK, `monto numeric`.
- [ ] 1.7 `config`: `clave text` PK, `valor text`, `nota text` (para qué sirve, legible), `actualizado_en`. **Es dato operativo, no secreto de build**: cambia sin redeploy.
  Seed con tres claves: `whatsapp_abelardo` (vacía), `garantias_falkenberg` (`false`), `plazo_contacto` (vacía — la redacción del plazo de 48 horas todavía no está decidida).
- [ ] 1.8 Bucket de Storage para las fotos, privado, con signed URLs.
  *Verifica:* `supabase db reset` → todas las migraciones aplican sin error.

## 2. RLS

- [ ] 2.1 `auto`: `select` público solo donde `publicado = true`; escritura solo admin.
- [ ] 2.2 `caso`, `nota`, `evento`: nada público. Lectura por `token` válido de `acceso`, resuelta en el server. Escritura por service role.
- [ ] 2.3 `gasto_mes`: solo admin.
- [ ] 2.4 `config`: **nada público, ni siquiera lectura.** Se lee solo con service role, desde server components y server actions. El número de WhatsApp termina en un `wa.me` generado en el server, así que nunca necesita llegar al browser.
  *Verifica:* con la clave anónima, `select * from config` → 0 filas.
  *Verifica:* con la clave anónima, `select * from caso` → 0 filas; `select * from auto where publicado` → las del seed.

## 3. Tipos, cliente y helper de eventos

- [ ] 3.1 Tipos generados en `lib/db/types.ts`. **No se escriben a mano.**
  *Verifica:* `supabase gen types typescript` y `npx tsc --noEmit` en exit 0.
- [ ] 3.2 Server client único en `lib/db/server.ts`.
- [ ] 3.3 `lib/db/eventos.ts`: unión tipada de los nueve tipos —`chat_iniciado`, `pedido_enviado`, `caso_abierto_operador`, `cita_agendada`, `cita_cumplida`, `propuesta_publicada`, `venta_cerrada`, `caso_perdido`, `renegociacion`— y `registrar(tipo, casoId, meta?)`. `caso_perdido` acepta `por_silencio: boolean` en `meta`.
  *Verifica:* un test de vitest que un tipo inválido no compila (`// @ts-expect-error`).
- [ ] 3.4 `registrar()` actualiza `caso.ultimo_evento` en la misma transacción.
- [ ] 3.5 `lib/config.ts`: `leerConfig(clave)` tipado contra las claves conocidas, cacheado por request. **Server only** — si se importa desde un componente de cliente, el build falla.
  *Verifica:* test — una clave que no existe en la unión no compila.

## 4. Seed

- [ ] 4.1 Cuatro autos de ejemplo, **con "(ejemplo)" en el modelo** para que ninguna captura de pantalla se confunda con stock real.
  *Verifica:* `select count(*) from auto where publicado` → 4.

## 5. Verificación

- [ ] 5.1 `pnpm install && npx tsc --noEmit && pnpm build`
  *Verifica:* los tres en exit 0.
