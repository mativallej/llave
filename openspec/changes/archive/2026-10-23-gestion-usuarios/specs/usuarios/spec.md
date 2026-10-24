# Spec Delta

## Purpose

Que quien maneja la concesionaria dé y saque el acceso al admin sin depender de quien tiene el repo.

## ADDED Requirements

### Requirement: Solo Falkenberg gestiona usuarios

`/admin/usuarios` y sus acciones SHALL estar disponibles solo para el rol `falkenberg`.

#### Scenario: Un vendedor intenta entrar

- **WHEN** un usuario con rol `vendedor` abre `/admin/usuarios`
- **THEN** vuelve al stock, y las acciones de usuarios le devuelven error

### Requirement: La contraseña se muestra una sola vez

Al crear un usuario o resetear su contraseña, el sistema SHALL generarla al azar en el servidor y mostrarla una sola vez, sin guardarla ni loguearla en Llave.

#### Scenario: Alta

- **WHEN** un `falkenberg` da de alta a alguien
- **THEN** ve la contraseña una vez para entregarla en persona, y con ella el nuevo usuario entra

#### Scenario: Reseteo

- **WHEN** se resetea la contraseña de un usuario
- **THEN** la anterior deja de servir y la nueva se muestra una vez

### Requirement: Un usuario suspendido no tiene acceso

Suspender a un usuario SHALL impedirle entrar y cortarle el acceso de una sesión ya abierta en su pedido siguiente. Reactivarlo SHALL devolverle el acceso.

#### Scenario: Se suspende a alguien con la sesión abierta

- **WHEN** un `falkenberg` suspende a un usuario que está usando el admin
- **THEN** en su pedido siguiente vuelve al login, y con su contraseña no puede volver a entrar

### Requirement: Nadie se deja afuera a sí mismo

Un usuario SHALL no poder suspenderse ni cambiarse el rol a sí mismo, para que siempre quede al menos un `falkenberg` activo.

#### Scenario: Se intenta suspender la propia cuenta

- **WHEN** un `falkenberg` intenta suspenderse o pasarse a `vendedor`
- **THEN** la operación falla con un mensaje que lo explica, y su fila en la pantalla no ofrece esas acciones
