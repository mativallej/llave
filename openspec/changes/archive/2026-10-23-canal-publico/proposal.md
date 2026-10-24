# Proposal

## Why

Es la puerta, y es el instrumento con el que se contesta la única pregunta del Stage 1: **¿alguien usa esto en vez del WhatsApp del vendedor que ya conoce?**

El competidor no es una startup: es el vendedor conocido, gratis y confiable. Así que la página no gana por tener un chat — gana porque el cliente **llega sabiendo el precio del auto que se llevaría** y porque le dicen qué sigue en cada paso.

Hay una decisión que vale explicar porque parece una omisión: **no hay código de verificación en el MVP.** El canal del código —SMS o WhatsApp— no está decidido, y exigirlo dejaría la página sin poder tomar un solo pedido en producción. El OTP existe para evitar spam, y a diez pedidos por semana no hay spam que evitar: sería optimización prematura bloqueando lo único que mide algo.

Y las fotos del chat **son cinco, no dieciséis.** Las dieciséis vistas de Motorway y AUTO1 son el mínimo para tasar **sin ver el auto**. Acá el auto se inspecciona en persona, así que las fotos no sirven para tasar: sirven para **triage** — decidir si el caso merece uno de los quince turnos de la semana. Pedir dieciséis es fricción sin contrapartida, justo antes del traspaso que más casos mata.

## What Changes

- **`/`**: una pantalla con el input como protagonista. Titular, la caja, tres chips de arranque, la grilla de seis autos **con el precio visible**, cómo funciona, y las garantías.
- **Tuerca**, el agente, en `app/api/chat/route.ts` con streaming y seis herramientas: `actualizar_pedido`, `mostrar_autos`, `mostrar_precio`, `pedir_fotos`, `pedir_zona`, `mostrar_resumen`.
- **El panel del pedido** que el cliente ve llenarse mientras conversa.
- **Visión**: las fotos van a Storage y al modelo por signed URL. Una foto puede ser el auto que tiene o el que busca, y de la foto sola no se deduce — el agente confirma en una línea.
- **El cierre**: nombre y WhatsApp, se crea el caso y los dos tokens, y se genera el `wa.me` con el pedido pre-escrito **y el link del operador**. Sin ese link el caso queda partido entre la página y el teléfono de Abelardo.
- **El recibo** queda arriba de la página con el link del cliente, en `localStorage` envuelto en try/catch, **con botón de borrar**.
- **Las garantías de Falkenberg detrás de la clave `garantias_falkenberg`** de la tabla `config`, leída en el server, en `false`.

## Capabilities

### New Capabilities

- `canal-publico`: cómo una persona arma su pedido, qué le decimos y qué no, y cómo llega a Abelardo.

### Modified Capabilities

*(ninguna)*

## Impact

**Dependencias:** `fundacion-datos` y `stock-publicaciones` — el agente muestra tarjetas del stock publicado, así que sin stock no hay nada que mostrar.

**Las tres reglas duras de copy de `AGENTS.md` se verifican con tests**, no con revisión a ojo: que el agente no tase, que no mencione otras agencias, y que las garantías de Falkenberg no se rendericen con el flag en `false`.

**Lo que no se promete y hay que chequear en el copy:** entrega a domicilio, ningún plazo de punta a punta, y que los dos números sean verificables — solo uno lo es.

**Fuera de alcance:** el OTP, la calculadora de cuotas, los turnos con franjas.

**Requiere de Matías:** el número de WhatsApp de Abelardo y la redacción del plazo de 48 horas, **los dos como filas de `config`** y no como variables de entorno. Mientras `whatsapp_abelardo` esté vacía el handoff no se puede generar, y el change lo tiene que decir en vez de inventar un número.
