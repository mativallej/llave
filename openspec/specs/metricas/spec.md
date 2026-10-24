# metricas Specification

## Purpose
Que las ocho métricas del Stage 1 se puedan mirar en una pantalla, que ninguna se reporte invertida o sin contexto, y que el tablero avise solo cuando algo importa.

## Requirements

### Requirement: La métrica de ventas nuevas se muestra con su denominador

La métrica *"no hubiera ido sin esto"* SHALL exponer siempre el numerador, el denominador y la cantidad de ventas sin preguntar.

#### Scenario: Pocas respuestas sobre muchas ventas

- **WHEN** hay 12 ventas cerradas y solo 5 tienen respuesta
- **THEN** el tablero muestra el porcentaje junto a "5 de 12" y "7 sin preguntar"

#### Scenario: Ninguna respuesta todavía

- **WHEN** no hay ninguna venta con `venta_nueva` cargado
- **THEN** la métrica dice "sin datos", nunca "0%"

### Requirement: Una renegociación se avisa arriba de todo

El tablero SHALL mostrar el conteo de renegociaciones como el primer elemento cuando sea mayor a cero.

#### Scenario: Se renegoció un precio

- **WHEN** existe al menos un caso con `renegocio = true`
- **THEN** el aviso es el primer elemento del contenido principal, en rojo

#### Scenario: Nunca se renegoció

- **WHEN** no hay ningún caso con `renegocio`
- **THEN** el aviso no se muestra

### Requirement: El tablero avisa cuando la capacidad se llenó

El tablero SHALL avisar cuando las citas cumplidas de la semana lleguen a la capacidad semanal, que vive en la clave `citas_por_semana` de `config` (15 de inicio) y se cambia sin deploy.

#### Scenario: La semana se llenó

- **WHEN** las citas cumplidas en la semana en curso llegan al valor de `citas_por_semana`
- **THEN** aparece el aviso de frenar el gasto en ads

#### Scenario: Se cambia la capacidad

- **WHEN** `citas_por_semana` pasa de 15 a 20
- **THEN** con 15 citas cumplidas el aviso no aparece, y con 20 sí, sin tocar código

### Requirement: El silencio propio se mide aparte

El tablero SHALL mostrar los casos perdidos por silencio propio como una métrica separada de los perdidos en general.

#### Scenario: Un caso se cayó porque no contestamos

- **WHEN** un `caso_perdido` tiene `meta.por_silencio = true`
- **THEN** cuenta en la métrica de silencio propio y no se mezcla con los que el cliente dejó de contestar

### Requirement: La tabla de casos solo lee

`/admin/casos` SHALL no ejecutar ninguna acción que cambie el estado de un caso.

#### Scenario: Se quiere mover un caso

- **WHEN** el operador necesita cambiar el estado
- **THEN** la tabla lo lleva al link del caso, que es donde se actúa

### Requirement: Los umbrales no viven en el código

El tablero SHALL mostrar los números sin declarar qué valor significa éxito.

#### Scenario: Se lee una métrica

- **WHEN** se renderiza cualquiera de las ocho
- **THEN** no hay ningún umbral hardcodeado que la marque como buena o mala
