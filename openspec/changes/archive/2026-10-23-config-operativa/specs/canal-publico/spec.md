# Spec Delta

## ADDED Requirements

### Requirement: El plazo de contacto sigue al flag de las garantías

La pantalla de pedido enviado SHALL mostrar la frase de `plazo_contacto` solo cuando `garantias_falkenberg` esté en `true`, porque el plazo de 48 horas es una de las garantías que banca Falkenberg.

#### Scenario: Garantías apagadas

- **WHEN** `plazo_contacto` tiene su frase y `garantias_falkenberg` está en `false`
- **THEN** el HTML de la home no contiene la frase ni "48 horas"

#### Scenario: Garantías prendidas

- **WHEN** `garantias_falkenberg` está en `true`
- **THEN** después de mandar el pedido se lee *"Falkenberg lo revisa y te escribe por WhatsApp."* seguido de la frase del plazo
