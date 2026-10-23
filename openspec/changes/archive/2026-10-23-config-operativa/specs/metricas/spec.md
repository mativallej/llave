# Spec Delta

## MODIFIED Requirements

### Requirement: El tablero avisa cuando la capacidad se llenó

El tablero SHALL avisar cuando las citas cumplidas de la semana lleguen a la capacidad semanal, que vive en la clave `citas_por_semana` de `config` (15 de inicio) y se cambia sin deploy.

#### Scenario: La semana se llenó

- **WHEN** las citas cumplidas en la semana en curso llegan al valor de `citas_por_semana`
- **THEN** aparece el aviso de frenar el gasto en ads

#### Scenario: Se cambia la capacidad

- **WHEN** `citas_por_semana` pasa de 15 a 20
- **THEN** con 15 citas cumplidas el aviso no aparece, y con 20 sí, sin tocar código
