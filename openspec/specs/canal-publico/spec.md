# canal-publico Specification

## Purpose
Que una persona arme su pedido en cinco minutos sabiendo el precio del auto que se llevaría, y que ese pedido llegue a Abelardo completo y con el link del caso.

## Requirements

### Requirement: El agente no tasa el auto que el cliente entrega

El agente SHALL no emitir ningún precio, rango ni estimación del auto que el cliente entrega.

#### Scenario: Le preguntan cuánto vale el suyo

- **WHEN** el cliente pregunta *"¿cuánto vale mi Corolla 2017?"*
- **THEN** la respuesta no contiene ninguna cifra de precio de ese auto, y explica en una línea que lo confirma Falkenberg después de verlo

#### Scenario: Le preguntan el precio de un auto del stock

- **WHEN** el cliente pregunta el precio de un auto publicado
- **THEN** el agente lo dice exacto, porque es público y es el mismo para todos

### Requirement: El cliente nunca se entera de que hay una red

El agente y todo el copy de la página SHALL no mencionar que el auto se consulta, se tasa o se ofrece en otras agencias.

#### Scenario: Le preguntan cómo tasan

- **WHEN** el cliente pregunta cómo determinan el valor
- **THEN** la respuesta dice que se contrasta con lo que se paga hoy por un auto así y que lo confirma alguien que lo ve, sin nombrar a nadie más que a Falkenberg

### Requirement: Las garantías que paga Falkenberg no se publican sin su OK

La página SHALL renderizar las garantías bancadas por Falkenberg solo cuando la clave `garantias_falkenberg` de `config` esté en `true`.

#### Scenario: El flag está en false

- **WHEN** se renderiza la home con `garantias_falkenberg = false`
- **THEN** el HTML no contiene la cobertura del taller, los 7 días de vigencia, el plazo de 48 horas ni los trámites

### Requirement: Un pedido se puede enviar sin código de verificación y sin fotos

Confirmar un pedido SHALL requerir solo nombre y teléfono.

#### Scenario: Pedido sin fotos

- **WHEN** el cliente dice que no tiene las fotos ahora
- **THEN** el agente sigue hasta el final y el pedido se crea igual, en estado de espera de fotos

#### Scenario: Pedido completo

- **WHEN** el cliente confirma con nombre y teléfono
- **THEN** se crean el caso, los dos tokens de acceso y el evento `pedido_enviado`, y se genera el `wa.me` con la `ref` y el link del operador

### Requirement: El cliente se queda con el link de su caso

Al cerrarse el chat, la página SHALL mostrar el recibo con el link del cliente y permitir borrarlo.

#### Scenario: El cliente vuelve a la página

- **WHEN** recarga después de haber enviado un pedido
- **THEN** ve su recibo con el link y la fecha, y puede borrarlo

#### Scenario: El almacenamiento del navegador está bloqueado

- **WHEN** `localStorage` no está disponible
- **THEN** la página renderiza sin error y el pedido se puede enviar igual
