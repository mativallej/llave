# Tasks

## 1. La ruta y los roles

- [ ] 1.1 `/c/[token]` server component que resuelve `acceso` → rol, y 404 si el token no existe. **Sin auth.**
  *Verifica:* un token inventado → 404; el del cliente → vista del cliente; el del operador → vista del operador.
- [ ] 1.2 `acceso.abierto_en` en la primera apertura, y el evento `caso_abierto_operador` cuando el rol es operador.

## 2. La vista del cliente — el mostrador

- [ ] 2.1 Línea de tiempo de lo que pasó, **con fecha**: pedido recibido, fotos recibidas, turno agendado, auto revisado.
- [ ] 2.2 Qué falta y qué sigue, en una línea.
- [ ] 2.3 Los números **a medida que existen, con la fecha al lado de cada uno**. La fecha no es decoración: es lo que convierte el link en registro.
- [ ] 2.4 La propuesta publicada: los dos números, la diferencia y hasta cuándo vale.
- [ ] 2.5 Estado de la búsqueda cuando el auto no está en stock: qué se busca, desde cuándo, cuándo se vuelve a avisar.
  *Verifica:* test de render — el HTML **no contiene** "agencias", "red", "consultamos" ni ningún tercero.
- [ ] 2.6 Nunca muestra el margen.

## 3. La vista del operador

- [ ] 3.1 Los ocho estados con **solo sus propias acciones**: `pendiente_fotos`, `pendiente_cita`, `pendiente_inspeccion`, `pendiente_tasacion`, `pendiente_conseguir`, `pendiente_propuesta`, `propuesta_publicada`, `pendiente_entrega`.
  *Verifica:* test — en cada estado, las acciones de los otros siete no están en el DOM.
- [ ] 3.2 Cada transición escribe su evento: `cita_agendada`, `cita_cumplida`, `propuesta_publicada`, `venta_cerrada`, `caso_perdido`.
- [ ] 3.3 `caso_perdido` pide el motivo y **distingue si se cayó por silencio propio** → `meta.por_silencio`.
- [ ] 3.4 Publicar la propuesta setea `vence_prop` a +7 días y **congela los campos del caso**.
  *Verifica:* test — después de publicar, un intento de editar `auto_entrega` devuelve error.
- [ ] 3.5 Corregir un dato, editable solo hasta publicar la propuesta.
- [ ] 3.6 "Pedirle algo al cliente" genera el WhatsApp ya escrito y lo deja registrado.
- [ ] 3.7 Nota libre, un campo de texto sin estructura.
- [ ] 3.8 Historial del teléfono: los casos anteriores con su estado y su fecha.
- [ ] 3.9 Un `tel:` para llamar.

## 4. Las dos marcas que son métrica

- [ ] 4.1 "Se renegoció un precio en la entrega" → `caso.renegocio` + evento `renegociacion`. **Es el gate binario del Stage 1.**
- [ ] 4.2 "¿Hubiera venido a Falkenberg sin esto?" Sí / No / No preguntado → `caso.venta_nueva`, donde **Sí = `true` = venta nueva**.
  *Verifica:* test — marcar "Sí" deja `venta_nueva = true`.

## 5. La baja del stock

- [ ] 5.1 Al cerrar una venta con un auto del stock como salida, ese auto se marca vendido y se despublica.
  *Verifica:* test de integración — cerrar el caso deja el auto con `vendido_en` y `publicado = false`.

## 6. Tools del MCP

Las de caso van acá porque este change construye la máquina de estados que exponen.

- [ ] 6.1 Lectura: `listar_casos(estado?, antiguedad?)`, `ver_caso(ref)`, `historial_telefono(telefono)`.
- [ ] 6.2 Escritura, una cosa por tool: `agendar_cita(ref, fecha)`, `marcar_inspeccionado(ref)`, `cargar_tasacion(ref, valor_toma)` (solo rol `falkenberg`), `publicar_propuesta(ref)`, `cerrar_caso(ref, cerro, motivo?)`, `agregar_nota(ref, texto)`.
- [ ] 6.3 **`marcar_venta_nueva(ref, respuesta)`** — la respuesta post-venta. Es la métrica que decide si hay producto y la única que no sale de ningún sistema: que Abelardo la pueda decir hablando es la diferencia entre medirla y no medirla.
- [ ] 6.4 Cada una escribe su evento, igual que la UI.
  *Verifica:* test — mover un caso por MCP deja el mismo evento que moverlo por el link.

## 7. Verificación

- [ ] 7.1 `npx tsc --noEmit && pnpm build && npx vitest run`
