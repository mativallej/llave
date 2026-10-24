# limites-de-uso Specification

## Purpose
Que ningún endpoint público se pueda usar sin límite, y que quien llega al límite sepa qué hacer y cuándo.

## Requirements

### Requirement: Cada endpoint público tiene un límite por conexión

El chat, el envío de pedidos, los links de subida, el link del caso, el MCP sin token y el login del admin SHALL tener un máximo de usos por IP y por ventana de tiempo.

#### Scenario: Un loop contra el chat

- **WHEN** una misma IP pasa los 60 turnos en 10 minutos
- **THEN** `/api/chat` responde 429 sin llamar al modelo, y el chat muestra un mensaje de Tuerca que dice que espere unos minutos

#### Scenario: Pedidos en serie

- **WHEN** una misma IP pasa los 10 pedidos en una hora
- **THEN** el pedido no se crea y el formulario dice que se puede probar de nuevo en una hora

#### Scenario: Tokens al azar contra el MCP

- **WHEN** una misma IP pasa los 20 intentos con tokens bien formados que no son de nadie en 10 minutos
- **THEN** `/api/mcp` responde 429, y sin token o con uno mal formado sigue respondiendo 401 sin tocar la base

### Requirement: Los turnos de Tuerca tienen un techo total

`/api/chat` SHALL tener, además del límite por IP, un máximo de turnos por hora entre todas las conexiones.

#### Scenario: Muchas IPs a la vez

- **WHEN** entre todas las conexiones se pasan los 1000 turnos en una hora
- **THEN** el chat responde 429 con un mensaje de Tuerca hasta que empieza la hora siguiente

### Requirement: El límite no guarda la IP

El contador SHALL identificar cada conexión por un hash de su IP, nunca por la IP.

#### Scenario: Se mira la tabla

- **WHEN** se lee la tabla `limite`
- **THEN** ninguna clave contiene una IP

### Requirement: Si el contador falla, el canal sigue andando

Una falla al contar SHALL dejar pasar el pedido y quedar en el log.

#### Scenario: La base no responde al contar

- **WHEN** `contar_uso` devuelve un error
- **THEN** el pedido sigue como si estuviera dentro del límite
