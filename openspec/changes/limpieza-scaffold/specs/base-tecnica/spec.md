# Spec Delta

## Purpose

Que el repo contenga el toolchain y nada del modelo de negocio descartado, para que cualquier agente que lea el código no reproduzca un producto que ya no se construye.

## ADDED Requirements

### Requirement: El repo no contiene código del modelo descartado

El árbol de `app/`, `components/` y `lib/` SHALL estar libre de componentes, tipos y copy del modelo SaaS multi-tenant con *request de tres intenciones*.

#### Scenario: Un agente busca referencias de UI

- **WHEN** un agente lee `components/` para entender el producto
- **THEN** solo encuentra primitivas de shadcn y el theme provider, sin ninguna pieza de negocio

#### Scenario: Se busca el vocabulario viejo

- **WHEN** se corre `grep -rn "intent-card\|multi-tenant\|subdomain\|request de 3" app components lib`
- **THEN** no hay resultados

### Requirement: El toolchain queda fijado y verificable

El proyecto SHALL declarar su gestor de paquetes y pasar typecheck y build en limpio.

#### Scenario: Instalación desde cero

- **WHEN** se corre `pnpm install && npx tsc --noEmit && pnpm build`
- **THEN** los tres terminan en exit 0

#### Scenario: El nombre del proyecto

- **WHEN** se lee `package.json`
- **THEN** `name` es `llave` y `packageManager` está declarado
