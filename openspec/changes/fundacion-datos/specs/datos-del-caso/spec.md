# Spec Delta

## Purpose

Que cada paso del embudo quede registrado en el momento en que pasa, con permisos que no expongan datos de clientes, y que las dos cosas que no son eventos tengan dónde vivir.

## ADDED Requirements

### Requirement: Cada paso del embudo escribe su evento en el momento

Toda función que produzca un cambio de estado del caso SHALL escribir su `evento` en la misma operación, no en un hook posterior.

#### Scenario: Se crea un caso

- **WHEN** un cliente confirma su pedido
- **THEN** existe una fila en `evento` con `tipo = 'pedido_enviado'` y el `caso_id` del caso creado

#### Scenario: Un caso se cae porque no contestamos

- **WHEN** el operador marca el caso como perdido por silencio propio
- **THEN** el evento `caso_perdido` lleva `meta.por_silencio = true`, distinguible del silencio del cliente

### Requirement: El teléfono es el índice del caso

`caso.telefono` SHALL estar indexado y ser el único identificador que cruza la web, WhatsApp y una llamada.

#### Scenario: Se busca el historial de una persona

- **WHEN** se consulta por un teléfono que ya abrió un caso antes
- **THEN** se obtienen todos sus casos con su estado y su fecha

### Requirement: La métrica post-venta se guarda en positivo

El campo que registra la respuesta post-venta SHALL llamarse `venta_nueva`, donde `true` significa que el cliente **no** hubiera ido a Falkenberg sin el canal, y `NULL` que no se preguntó.

#### Scenario: Se calcula la métrica

- **WHEN** se calcula el porcentaje de ventas nuevas
- **THEN** es `count(venta_nueva) / count(venta_nueva is not null)`, sin ninguna negación en la expresión

#### Scenario: Una venta sin preguntar

- **WHEN** una venta se cierra y nadie hizo la pregunta
- **THEN** `venta_nueva` queda en `NULL` y la venta cuenta como deuda de medición, no como respuesta negativa

### Requirement: Los datos de clientes no son públicos

Las tablas `caso`, `nota` y `evento` SHALL ser inaccesibles con la clave anónima.

#### Scenario: Lectura con la clave anónima

- **WHEN** se consulta `caso` con la clave pública
- **THEN** devuelve cero filas

#### Scenario: Lectura del stock publicado

- **WHEN** se consulta `auto` con la clave pública
- **THEN** devuelve solo las filas con `publicado = true`
