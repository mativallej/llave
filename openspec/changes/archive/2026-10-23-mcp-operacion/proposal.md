# Proposal

## Why

**El stock muere en la semana tres por carga de datos**, y ese es el riesgo operativo más grande del producto: el 80% de las webs de concesionarias muere con el stock viejo. El admin de `stock-publicaciones` ataca eso bajando el alta a una foto y una línea. **Un MCP lo baja a cero pantallas.**

Abelardo tiene 65 años y vive en WhatsApp. Pedirle que abra una web, se loguee y toque un toggle es fricción que se paga todas las semanas. Pedirle que le mande a Claude una foto y *"entró un Corolla XEI 2019 con 78 mil"* no es fricción: es lo que ya hace.

Y hay un segundo motivo que vale más de lo que parece: **la métrica que decide si hay producto no sale de ningún sistema.** *"¿Hubiera venido a Falkenberg sin esto?"* hay que preguntarla cliente por cliente después de cada venta, y hoy depende de que alguien abra una pantalla y marque un radio button. Con un MCP, Abelardo lo dice y queda registrado.

Además cambia **quién puede operar**: Andrés para tasar, un vendedor para mover un caso, Matías para leer las métricas. Sin repartir logins de un admin.

### Lo que un MCP no reemplaza

**El canal del cliente.** Los clientes no tienen Claude, así que la landing con Tuerca sigue siendo la puerta. La división es limpia y conviene dejarla escrita: **el cliente entra por la web, el operador trabaja por MCP o por el link del caso.**

## What Changes

- **Un servidor MCP en TypeScript**, en el mismo repo y desplegado con la app: HTTP para usarlo desde cualquier Claude, y stdio para desarrollo local.
- **Tabla `operador`** con `token`, nombre y rol. **El token es la autenticación**, igual que en los links de caso. Cada llamada del MCP resuelve rol antes de ejecutar.
- **Las herramientas de esta tanda son las de stock y las de lectura.** Los otros changes registran las suyas cuando construyen lo que exponen.
- **El principio que gobierna el diseño de cada tool**, que el proyecto ya tiene escrito en `Automatizaciones para Andrés`:

> **Autonomía para leer. Determinismo para actuar.**

  Leer es libre: buscar en el stock, ver un caso, mirar las métricas. **Actuar es determinístico:** cada tool hace exactamente una cosa con argumentos explícitos. **Ninguna tool toma una instrucción en texto libre.** No hay `hacer(instruccion: string)` — eso le devuelve al modelo la decisión que tiene que tomar el humano.

## Capabilities

### New Capabilities

- `mcp-operacion`: cómo un operador opera el canal desde Claude, qué puede leer, qué puede escribir y qué no puede hacer nunca.

### Modified Capabilities

- `stock`: el alta y la baja de un auto pasan a tener una segunda superficie, con la misma lógica detrás.

## Impact

**Dependencias:** `fundacion-datos` y `stock-publicaciones`. El MCP **reusa las mismas server actions** que el admin — no duplica lógica, y por eso va después y no antes.

**Las reglas duras del agente aplican igual acá, y una es nueva.** El MCP no puede exponer ninguna tool que devuelva o acepte un precio del auto que el cliente entrega, salvo `cargar_tasacion`, que es Andrés escribiendo su propio juicio. **El riesgo del MCP es distinto del de la web:** en la web el agente le habla a un cliente; acá le habla a un operador que le va a pedir que estime. Si una tool devuelve una estimación, Andrés deja de poner el número y el producto pierde lo único que no se automatiza.

**Ninguna tool expone el margen.**

**Cada tool de escritura escribe su evento**, igual que la UI. Si un caso se mueve por MCP y no deja evento, el tablero miente.

**Fuera de alcance:** las tools de caso, propuesta y métricas — las registran `caso-seguimiento` y `tablero-metricas`, que son los changes que construyen eso.

**Requiere de Matías:** decidir si el MCP se expone con un dominio propio y quiénes son los primeros operadores con token.
