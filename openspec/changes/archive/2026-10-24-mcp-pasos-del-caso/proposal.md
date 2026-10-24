# Proposal

## Why

**Hablando con Claude no se podía cerrar una venta.** Tres pasos del caso existían solo en el link del operador:
- **"llegaron las fotos"**: sin él, un caso que entra sin fotos se queda en `pendiente_fotos`;
- **"lo conseguimos"**: sin él, un caso que busca un auto que no está en stock no llega a la propuesta;
- **"aceptó la propuesta"**: sin él, `cerrar_caso` no tiene un caso en `pendiente_entrega` para cerrar.

Matías pidió agregarlas el 24/10/2026.

## What Changes

Tres tools de escritura en el MCP, una por paso, que llaman a la misma operación que el link del operador y por lo tanto dejan los mismos datos y eventos:

- **`llegaron_fotos(ref)`**: el cliente mandó las fotos (por WhatsApp o en persona), y el caso pasa a esperar la cita. Las fotos en sí no pasan por el MCP, como decidió `mcp-sin-fotos`: la tool marca el paso.
- **`marcar_conseguido(ref, auto, precio)`**: Falkenberg consiguió el auto que se buscaba, y el caso pasa a la propuesta con ese auto y su precio. El precio es el del auto que se lleva el cliente, que es público; lo dice el operador y nunca lo propone Claude. Nada acá toca el valor del auto que entrega el cliente.
- **`acepto_propuesta(ref)`**: el cliente aceptó, y el caso pasa a esperar la entrega, donde `cerrar_caso` lo cierra.

Las instrucciones del servidor, `ver_caso` y `mcp/README.md` dejan de decir que estos pasos van por el link.

## Capabilities

### Modified Capabilities

- `mcp-operacion`: un caso se puede llevar de punta a punta hablando con Claude.

## Impact

**Siguen solo en el link:** "no vino", el próximo aviso de una búsqueda, corregir un dato, la marca de renegociación y "pedirle algo al cliente". Si alguno hace falta por Claude, va en otro change.
