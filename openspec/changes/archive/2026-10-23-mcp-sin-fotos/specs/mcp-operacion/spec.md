# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Cargar un auto cuesta una foto y una línea`
- TO: `### Requirement: Cargar un auto por MCP cuesta una línea`

## MODIFIED Requirements

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
