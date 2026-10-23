# Spec Delta

## Purpose

Que mantener el stock al día cueste dos minutos desde un teléfono, y que el canal público nunca muestre un auto que ya no está.

## ADDED Requirements

### Requirement: El alta de un auto es una foto y una línea, no un formulario

Dar de alta un auto SHALL requerir solo fotos y una línea de texto libre; el resto de los campos los deduce el agente y el humano confirma lo que falte.

#### Scenario: Alta con una línea completa

- **WHEN** se suben fotos y se escribe *"Entró un Corolla XEI 2019 con 78 mil"*
- **THEN** marca, modelo, versión, año y kilómetros quedan poblados y solo se pide el precio

#### Scenario: Alta con una línea incompleta

- **WHEN** la línea no dice el año
- **THEN** el año queda marcado como faltante y se pide de a un dato por vez, sin inventarlo

#### Scenario: El agente no pone el precio

- **WHEN** el agente procesa la línea y las fotos
- **THEN** `precio` nunca viene poblado por el agente, y publicar sin precio devuelve un error de validación

### Requirement: La baja de un auto vendido no depende de que alguien se acuerde

Marcar un auto como vendido SHALL despublicarlo en la misma operación.

#### Scenario: Se marca vendido

- **WHEN** el operador marca un auto como vendido
- **THEN** `vendido_en` queda con fecha y `publicado` pasa a `false` sin ningún paso adicional

#### Scenario: Un auto lleva mucho sin tocarse

- **WHEN** hay autos publicados con más de 14 días sin actualizar
- **THEN** el admin muestra un aviso con el conteo arriba de la lista

### Requirement: El admin funciona desde un teléfono

Las pantallas del admin SHALL funcionar a 400px de ancho sin scroll horizontal.

#### Scenario: Alta parado en el galpón

- **WHEN** se abre `/admin/stock` a 400px
- **THEN** `scrollWidth` es igual a `clientWidth` y el botón de fotos abre la cámara
