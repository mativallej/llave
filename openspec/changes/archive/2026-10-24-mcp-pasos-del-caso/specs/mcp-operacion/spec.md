# Spec Delta

## ADDED Requirements

### Requirement: Un caso se lleva de punta a punta hablando con Claude

El MCP SHALL tener una tool por cada paso que lleva un caso hasta la venta, incluidos que llegaron las fotos, que se consiguió el auto buscado y que el cliente aceptó la propuesta. Cada una SHALL dejar el mismo evento y los mismos datos que el paso equivalente en el link del operador.

#### Scenario: Un caso que entró sin fotos

- **WHEN** el operador le dice a Claude que llegaron las fotos de un caso en `pendiente_fotos`
- **THEN** `llegaron_fotos` lo pasa a `pendiente_cita`, y desde ahí el resto de las tools lo llevan hasta `cerrar_caso`

#### Scenario: Se consiguió el auto que se buscaba

- **WHEN** el operador dice qué auto se consiguió y a qué precio, para un caso en `pendiente_conseguir`
- **THEN** `marcar_conseguido` lo pasa a `pendiente_propuesta` con ese auto y ese precio como lo que se lleva el cliente

#### Scenario: El cliente aceptó

- **WHEN** el operador dice que el cliente aceptó la propuesta publicada
- **THEN** `acepto_propuesta` lo pasa a `pendiente_entrega`, y `cerrar_caso` con `cerro: true` cierra la venta

#### Scenario: Un paso fuera de su estado

- **WHEN** se llama a una de estas tools sobre un caso que está en otro estado
- **THEN** falla con un mensaje que dice en qué estado está, y el caso no se mueve
