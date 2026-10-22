# Spec Delta

## Purpose

Que el cliente pueda ver en qué está su caso sin preguntarle a nadie, y que el operador pueda moverlo sin trabajar en una pantalla.

## ADDED Requirements

### Requirement: El link es la autenticación y resuelve el rol

`/c/[token]` SHALL renderizar la vista correspondiente al rol del token, sin pedir login.

#### Scenario: Token del cliente

- **WHEN** se abre el link que recibió el cliente
- **THEN** ve el estado de su caso, nunca las acciones del operador ni el margen

#### Scenario: Token inexistente

- **WHEN** el token no está en `acceso`
- **THEN** la ruta devuelve 404

### Requirement: Cada número se muestra con la fecha en que se fijó

La vista del cliente SHALL mostrar cada número junto a la fecha en que quedó fijado.

#### Scenario: Solo existe el precio de salida

- **WHEN** el caso todavía no tiene valor de toma
- **THEN** se muestra el precio del auto que se llevaría con su fecha, y el valor de toma como pendiente

#### Scenario: La propuesta está publicada

- **WHEN** hay valor de toma y precio de salida
- **THEN** se muestran los dos, la diferencia y hasta cuándo vale

### Requirement: La propuesta publicada congela los datos del caso

Una vez publicada la propuesta, los campos del caso SHALL dejar de ser editables.

#### Scenario: Se intenta corregir después de publicar

- **WHEN** el operador intenta cambiar `auto_entrega` con la propuesta publicada
- **THEN** la operación falla y el caso queda igual

#### Scenario: Se publica la propuesta

- **WHEN** el operador publica
- **THEN** `vence_prop` queda a siete días y se escribe el evento `propuesta_publicada`

### Requirement: Cada estado muestra únicamente sus propias acciones

La vista del operador SHALL exponer solo las acciones del estado actual del caso.

#### Scenario: El caso espera la cita

- **WHEN** el estado es `pendiente_cita`
- **THEN** están "Agendé la cita" y "No sirve", y ninguna acción de los otros estados está en el DOM

### Requirement: El estado de la búsqueda no nombra terceros

La vista del cliente SHALL describir la búsqueda de un auto que no está en stock sin mencionar otras agencias ni ninguna red.

#### Scenario: El caso está en `pendiente_conseguir`

- **WHEN** el cliente abre su link
- **THEN** ve qué se busca, desde cuándo y cuándo se vuelve a avisar, sin ninguna referencia a terceros

### Requirement: Una venta consume el auto del stock

Cerrar una venta cuyo auto de salida es del stock SHALL marcar ese auto como vendido y despublicarlo.

#### Scenario: Se cierra la venta

- **WHEN** el operador marca el caso como cerrado
- **THEN** el auto de salida queda con `vendido_en` y `publicado = false`, sin ningún paso manual
