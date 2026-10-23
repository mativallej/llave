# mcp-operacion Specification

## Purpose
Que un operador pueda mantener el stock y leer el estado del canal desde Claude, sin abrir ninguna pantalla, y que esa superficie no le permita hacer nada que la web no le permita.

## Requirements

### Requirement: Cargar un auto por MCP cuesta una línea

El MCP SHALL exponer una tool que cree un auto a partir de texto libre, devolviendo lo que dedujo y lo que falta. Ninguna tool del MCP SHALL recibir fotos: las fotos se suben desde `/admin/stock`.

#### Scenario: Línea completa

- **WHEN** se llama `cargar_auto` con *"entró un Corolla XEI 2019 con 78 mil"*
- **THEN** el auto se crea con marca, modelo, versión, año y km poblados, `precio` vacío y `publicado` en `false`, y la respuesta dice que falta el precio

#### Scenario: Línea incompleta

- **WHEN** la línea no dice el año
- **THEN** el año no se inventa: viene en la lista de campos faltantes

#### Scenario: Se intenta publicar sin precio

- **WHEN** se llama `publicar_auto` sobre un auto sin precio
- **THEN** la llamada falla con un mensaje que lo explica y el auto queda sin publicar

#### Scenario: Se quiere cargar una foto por MCP

- **WHEN** el operador le pasa a Claude una foto o un link a una foto
- **THEN** ninguna tool tiene dónde recibirla, y las instrucciones del servidor dicen que se sube desde `/admin/stock`

### Requirement: El token es la autenticación y resuelve el rol

Toda llamada al MCP SHALL requerir un token de `operador` válido y resolver su rol antes de ejecutar.

#### Scenario: Llamada sin token

- **WHEN** se invoca cualquier tool sin token válido
- **THEN** devuelve error y ninguna operación toca la base

#### Scenario: Llamada con token de vendedor

- **WHEN** un token con rol `vendedor` invoca una tool reservada a `falkenberg`
- **THEN** devuelve error de permiso

### Requirement: Ninguna tool estima el valor del auto que el cliente entrega

El MCP SHALL no exponer ninguna tool que devuelva, acepte o calcule una estimación del valor de toma.

#### Scenario: Se recorre el catálogo de tools

- **WHEN** se listan las tools y sus schemas
- **THEN** ninguna pide ni devuelve un valor de toma estimado, y ninguna expone el margen

#### Scenario: Al operador se le ocurre preguntar

- **WHEN** un operador le pide a Claude una estimación del auto de un cliente
- **THEN** no hay tool que la produzca, y el system prompt del servidor dice que ese número lo pone Andrés después de ver el auto

### Requirement: Ninguna tool toma una instrucción en texto libre

Cada tool de escritura SHALL tener argumentos tipados y explícitos, y hacer exactamente una cosa.

#### Scenario: Se revisa un inputSchema

- **WHEN** se inspecciona cualquier tool de escritura
- **THEN** sus argumentos son campos concretos, y no existe ninguno que reciba una instrucción para interpretar

#### Scenario: Poner el precio

- **WHEN** se quiere fijar el precio de un auto
- **THEN** se usa `poner_precio`, una llamada propia, y no un campo dentro de otra operación

### Requirement: Toda escritura por MCP deja su evento

Las tools que cambian estado SHALL escribir el mismo evento que escribiría la UI.

#### Scenario: Se marca un auto como vendido por MCP

- **WHEN** se llama `marcar_vendido`
- **THEN** el auto queda despublicado y queda registrado igual que si se hubiera hecho desde el admin
