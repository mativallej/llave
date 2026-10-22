# Proposal

## Why

**Es el mantra hecho producto, y sin esto el Stage 1 no mide lo que dice medir.** Un formulario con chat prueba que la gente completa formularios; lo que se está testeando es *que en cada paso sepas exactamente qué va a pasar*, y eso no existe sin un lugar donde el cliente mire su caso sin preguntar.

El mostrador de Starbucks no te muestra la receta: te muestra dónde está tu vaso. No acelera el café — te deja verlo avanzar, y eso alcanza.

Del otro lado hay una restricción que define el diseño: **Abelardo no trabaja en una pantalla.** Lee y decide en WhatsApp —el briefing y las fotos le llegan ahí, completos— y abre el link solo para marcar. La regla que lo mantiene lejos de un CRM: **cada estado muestra únicamente sus propias acciones.** No hay un formulario con todos los campos ni una vista general donde haya que buscar.

Y la propuesta vive en el link, no en un WhatsApp. Eso gana dos cosas que un mensaje no da: **el link es la prueba** —queda en una URL con fecha y los dos miran lo mismo, lo que vuelve verificable *"no renegociamos por lo que ya estaba informado"*— y **obliga a poner vigencia**, porque una cotización sin vencimiento hay que honrarla para siempre.

## What Changes

- **`/c/[token]`**: un server component que resuelve el rol por el token y renderiza una de dos vistas. **Sin auth: el token es la autenticación.**
- **La vista del cliente — el mostrador**: qué pasó ya con fecha, qué falta y qué sigue, y **cada número a medida que existe con la fecha en que se fijó**. El precio del auto que se lleva desde el primer minuto; el valor de toma cuando está; la diferencia cuando están los dos.
- **La vista del operador**: ocho estados, cada uno con solo sus acciones, más cuatro cosas que no son estados y entran porque evitan que el caso se muera o que la tasación salga sobre información mala: corregir un dato, pedirle algo al cliente de un toque, una nota libre, y el historial del teléfono.
- **Dos marcas que son métrica, no operación**: que se renegoció un precio en la entrega, y la respuesta post-venta de si hubiera venido sin el canal.
- **La baja automática del stock**: si un caso cierra con un auto del stock como salida, ese auto se marca vendido.
- Cada transición escribe su evento.

## Capabilities

### New Capabilities

- `seguimiento-del-caso`: qué ve cada parte de un caso, qué puede hacer en cada estado, y qué queda registrado.

### Modified Capabilities

- `stock`: la baja de un auto deja de depender de que alguien se acuerde — una venta lo consume.

## Impact

**Dependencias:** `fundacion-datos` y `canal-publico`.

**Lo que hace falta no equivocar:** mientras se busca un auto que no está en stock —el único tramo donde el cliente queda a oscuras— la vista muestra el estado de la búsqueda **sin nombrar a nadie más que a Falkenberg**. Es la regla dura de copy y es fácil de romper justo acá, porque la tentación es mostrar a cuántas puertas se preguntó.

**La propuesta congela los datos:** los campos del caso son editables hasta que se publica la propuesta, y después quedan fijos. Es lo que vuelve exigible la garantía.

**Fuera de alcance:** la calculadora de cuotas (la propuesta se carga a mano), los recordatorios automáticos, y el cierre por inactividad.
