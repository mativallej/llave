# Tasks

## 1. Las tools

- [x] 1.1 `llegaron_fotos(ref)`, `marcar_conseguido(ref, auto, precio)` y `acepto_propuesta(ref)` en `mcp/herramientas/casos.ts`, cada una sobre la operación de `lib/caso/caso.ts` que usa el link.
  *Verifica:* `llegaron_fotos` → `llegaronFotos`, `marcar_conseguido` → `conseguido`, `acepto_propuesta` → `aceptoPropuesta`: las mismas funciones que llaman `accionLlegaronFotos`, `accionConseguido` y `accionAcepto` del link. `npx tsc --noEmit` → exit 0.
- [x] 1.2 El catálogo: las tres están, son de escritura, y ningún campo nuevo es una instrucción ni un valor de toma.
  *Verifica:* `mcp/servidor.test.ts` → 8 tests ✓.
  - El catálogo tiene las tres, que no son de solo lectura.
  - "ninguna tool pide ni devuelve un valor de toma…" sigue pasando con `marcar_conseguido.precio`: es el precio público del auto que se lleva, no el del que entrega.
  - `auto`, el texto de qué auto se consiguió, entra a propósito en la lista de textos libres permitidos.
- [x] 1.3 Instrucciones del servidor, descripción de `ver_caso` y `mcp/README.md` al día.
  *Verifica:*
  - Las instrucciones dicen que un caso se mueve "desde que llegan las fotos hasta que se cierra la venta", y que el precio de `marcar_conseguido` lo dice quien opera.
  - `ver_caso` y el README listan lo que sigue solo en el link: no vino, próximo aviso, corregir, renegociación y pedirle algo al cliente.
  - `cerrar_caso` dice que va después de `acepto_propuesta`.

## 2. Verificación

- [x] 2.1 Un caso con auto que entrega, de "faltan las fotos" a la venta, y uno que busca un auto que no está, de la búsqueda a la venta, los dos solo por el MCP; cada paso deja el mismo evento y los mismos datos que por el link.
  *Verifica:* `mcp/herramientas/casos-pasos.integracion.test.ts` contra la base, cada caso al lado de un gemelo movido por el link y comparando el estado después de cada paso:
  - "de 'faltan las fotos' a la venta, todo por el MCP, deja lo mismo que por el link" ✓. `llegaron_fotos` → `agendar_cita` → `marcar_inspeccionado` → `cargar_tasacion` → `publicar_propuesta` → `acepto_propuesta` → `cerrar_caso`, con los eventos iguales (`cita_agendada`, `cita_cumplida`, `propuesta_publicada`, `venta_cerrada`) y `fotos_en` con fecha en los dos.
  - "de la búsqueda a la venta: marcar_conseguido deja el auto y su precio como lo que se lleva" ✓. La tool devuelve `pendiente_propuesta` con `se_lleva` y `precio_del_que_se_lleva: 12000000`; después publicar, aceptar y cerrar, igual que el link.
  - En `casos.integracion.test.ts` › "de la cita a la venta…" ✓, el paso de aceptar ahora es la tool `acepto_propuesta` y no la llamada directa a la función.
- [x] 2.2 Fuera de su estado, cada tool falla con un mensaje claro y no mueve el caso.
  *Verifica:* "fuera de su estado, cada una falla diciendo en qué estado está, y el caso no se mueve" ✓:
  - en `pendiente_fotos`, `acepto_propuesta` y `marcar_conseguido` fallan con "está en pendiente_fotos";
  - `llegaron_fotos` pasa, y una segunda vez falla con "está en pendiente_cita";
  - el caso queda en `pendiente_cita`.
- [x] 2.3 `npx tsc --noEmit && pnpm build && npx vitest run`
  *Verifica:* `rm -rf .next && pnpm install` → exit 0. `npx tsc --noEmit` → exit 0. `pnpm build` → exit 0. `npx vitest run`, dos corridas → `Test Files 33 passed (33)`, `Tests 128 passed (128)`. No quedaron datos de prueba: casos 0, operadores 0, autos de prueba 0, filas de `limite` 0.

## Notas

- **Un tropiezo del test, no de las tools.** En la primera corrida, el gemelo del link de la búsqueda falló. Los dos pedidos eran idénticos, y `enviarPedido` trata un pedido idéntico de hace pocos minutos como el mismo: devolvió el mismo caso, el MCP lo movió y el link ya no pudo. Ahora los gemelos difieren en la zona, y el test verifica que sean casos distintos.
