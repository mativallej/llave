# AGENTS.md — Llave

> **Llave es el canal digital de Falkenberg Meyer Automotores**, una multimarca de usados de Rafaela (Santa Fe). Un cliente cuenta qué auto tiene y cuál quiere; Falkenberg lo consigue —de su stock, de su red o de una oficial—, tasa el que entrega, y le da el número final de la diferencia.
>
> Abelardo opera el canal. Andrés es el dueño de la concesionaria y el que tasa. Matías es dueño del producto.

**Este archivo es la constitución del repo.** Se lee antes de cada change de OpenSpec. Si una decisión de producto no está acá ni en el spec del change, se resuelve con el mantra — y si el mantra no alcanza, se para y se pregunta en vez de inventar.

## El mantra, que es el criterio de desempate

> **El Starbucks de las multimarcas: que en cada paso sepas exactamente qué va a pasar.**

El test, antes de construir cualquier cosa: **¿el cliente sabe qué sigue y cuándo?** Si es sí, va. Si es no, falta decirle algo — y casi siempre decirlo es más barato que resolverlo.

Starbucks no ganó por el café: ganó por la consistencia. Cambiar el auto es hoy lo contrario, y la inconsistencia es el producto que el cliente recibe.

## Qué es cotizar, acá

Tres trabajos distintos, y conviene no confundirlos:

1. **Conseguir el auto que el cliente quiere.** Si está en stock el precio ya está; si no, Falkenberg sale a buscarlo. Es lo difícil y es el servicio valioso.
2. **Tasar el auto que entrega.** Lo hace Falkenberg después de verlo en persona. Es juicio humano y no se automatiza.
3. **Dar el número final:** la diferencia entre los dos.

**No hay subasta, no hay puja entre agencias, no hay competencia por el auto que entra.** Falkenberg tasa y punto.

## Las tres reglas duras de copy

Se rompen con facilidad y cada una cuesta plata o reputación.

**1. NUNCA le digas al cliente que su auto se consulta, se tasa o se ofrece en otras agencias, ni que hay una red.** En una ciudad de 120.000 habitantes eso le dice que su operación circula entre comercios locales. El cliente trata con Falkenberg y con nadie más. Si pregunta cómo lo tasan: se contrasta con lo que se paga hoy por un auto así, y lo confirma alguien que lo ve.

**2. Las garantías que paga Falkenberg no se publican sin Falkenberg.** Viven detrás de la clave `garantias_falkenberg` de la tabla `config`, en `false` hasta que Andrés las acepte por escrito. Publicar una promesa que paga otro es su plata y su reputación. **Está en la base y no en una env var a propósito:** cuando firme, prenderlas es editar una fila, no un redeploy.

| Siempre visibles — decisión de producto | Detrás del flag — las banca Falkenberg |
|---|---|
| El precio del auto que te llevás lo sabés antes de sentarte | No renegociamos por lo que ya estaba informado |
| No te tiramos un precio por WhatsApp para engancharte | El auto que te llevás pasa por el taller y queda cubierto |
| Nadie te va a llamar a los dos minutos | La propuesta vale 7 días |
| Te decimos qué falta para darte el número | Te citamos en 48 horas hábiles |
| Una sola visita, con turno | Los trámites los hacemos nosotros |

**3. Nunca se promete** entrega a domicilio, ni un plazo de punta a punta, ni que los dos números sean verificables (solo uno lo es: el precio público del stock).

## Las dos transparencias, y la que no existe

- **De proceso:** SÍ. En cada momento el cliente sabe qué pasó, qué falta y qué sigue.
- **De precios públicos:** SÍ. El precio del auto que se llevaría es exacto y el mismo para todos.
- **De margen:** NO. Nunca. Cuánto gana Falkenberg no se muestra ni se insinúa.

## El árbol de casos

| Entrega | Se lleva | Caso | |
|---|---|---|---|
| sí | nada, quiere la plata | **A** | **no existe.** Comprar al contado exige capital que Falkenberg no pone. Es una puerta, no un caso |
| sí | un usado | **B** | si está en stock el precio ya está |
| sí | un 0km | **C** | **el caso central** |
| no | un usado | **D** | venta simple |
| no | un 0km | **E** | solo el servicio de conseguirlo |

**Las dos conversiones que mueven la plata:** A → B (*"¿y si en vez de la plata te llevás algo?"*) y E → C (*"¿y el que tenés hoy, qué vas a hacer con él?"*).

## Stack

| | |
|---|---|
| Framework | Next.js 16.2.4 (App Router) + React 19 + TypeScript 5.7 |
| Estilos | Tailwind 4 + shadcn/ui (`new-york`, base `neutral`, iconos `lucide`) |
| Datos | Supabase — Postgres + Storage + Auth. **El Auth es solo para el admin**, nunca para el cliente |
| Config operativa | La tabla `config`, server-only: el WhatsApp de Abelardo, el flag de garantías, la redacción del plazo. **Nada de esto va en env vars** — cambia por motivos de negocio y no debería pedir un deploy |
| Agente | `openai` (Responses API), `gpt-5.5-2026-04-23`. Solo el agente de la web: el MCP lo usa el operador desde Claude |
| Deploy | Vercel |
| MCP | `@modelcontextprotocol/sdk` en TypeScript, en `mcp/`. HTTP en `/api/mcp` y stdio para desarrollo |
| Paquetes | pnpm |

**Nada de ORM encima de Supabase. Nada de cola de jobs. Nada de librería de charts pesada** — el tablero son números grandes y una tabla.

## La configuración del agente, que tiene una trampa

```ts
const respuesta = await client.responses.create({
  model: "gpt-5.5-2026-04-23",              // snapshot con fecha, nunca el alias
  instructions: INSTRUCCIONES,              // fijo: el cache de OpenAI es por prefijo
  input,                                    // la conversación entera, en cada turno
  tools: [...],                             // zodResponsesFunction → strict: true
  reasoning: { effort: "low" },
  store: false,
  include: ["reasoning.encrypted_content"],
  stream: true,
});
```

- **El modelo es un snapshot con fecha, nunca el alias.** `gpt-5.5` a secas cambia cuando OpenAI lo actualiza, y con él cambia cómo habla Tuerca. El comportamiento del agente no se mueve sin un change: es el mantra aplicado al propio agente.
- `reasoning: { effort: "low" }` porque es un chat, y el razonamiento largo es latencia.
- **La trampa no depende del proveedor.** Un modelo puede escribir la llamada a la herramienta en el texto visible en vez de emitir un `function_call`: el turno sale bien, la herramienta nunca corre, y **no hay error**. Acá eso significa que el panel no se llena y nadie se entera. Por eso el effort no baja de `"low"`, y cualquier cambio de modelo o de effort pasa antes por el test de `canal-publico` que verifica que la herramienta corrió.
- `strict: true` en las herramientas: usá `zodResponsesFunction` de `openai/helpers/zod`, que lo pone solo.
- **El loop de herramientas es nuestro.** La Responses API no trae un runner: si la salida tiene un `function_call`, se ejecuta la herramienta, se agregan al `input` la salida del modelo y el `function_call_output`, y se vuelve a llamar. Son veinte líneas; no agregues un framework de agentes para eso.
- **`store: false`.** La conversación tiene lo que el cliente cuenta de su auto, y no queda guardada del lado de OpenAI. Por eso cada turno manda la conversación entera, y `include: ["reasoning.encrypted_content"]` deja que el razonamiento vuelva cifrado dentro del loop sin que OpenAI lo guarde.
- **`INSTRUCCIONES` no lleva nada del caso adentro.** El cache de OpenAI es automático y por prefijo: si el system prompt cambia de un cliente a otro, no se cachea nunca.

Esto es solo el agente de la web: Tuerca y la ficha del stock. El MCP no llama a ningún modelo; el operador lo usa desde Claude, y eso no cambia.

## Las reglas duras del agente conversacional

Van en el system prompt y son la parte más importante del producto.

1. **NO TASA EL AUTO QUE ENTREGA.** Nunca un precio, ni un rango, ni *"vale aproximadamente"*. Lo hace Falkenberg después de verlo. Si el agente tira un número, o la concesionaria lo honra sin haber visto el auto, o el cliente se enoja cuando llega el real. En una ciudad de 120.000 eso se paga una sola vez.
2. **SÍ DICE EL PRECIO DEL AUTO QUE SE LLEVA**, porque es público y exacto. La asimetría es el producto: lo que sale tiene precio de lista, lo que entra necesita que alguien lo mire.
3. **Si el auto que quiere no está en stock, no inventa que lo tiene.** Anota qué busca y dice que Falkenberg sale a conseguirlo. Es una promesa real y es la parte valiosa del servicio.
4. **De las fotos chequea COBERTURA, NO ESTADO.** Nunca opina de golpes, óxido, desgaste ni nada que afecte el valor: eso lo decide quien lo ve, y si el agente lo adelanta el cliente lo toma como promesa.
5. **Las fotos no bloquean el pedido.** Si no las tiene, explica que sin fotos no arranca la tasación y sigue hasta el final. Un pedido sin fotos vale igual.
6. **No pide teléfono ni nombre en el chat.** Eso lo pide el formulario del final.
7. **Nunca se hace pasar por una persona.** Si le preguntan, lo dice: es el asistente y después sigue el vendedor.
8. **Cómo habla:** castellano rioplatense, voseo, frases cortas. Una sola pregunta por mensaje. Sin emojis, sin listas, sin negritas. Máximo tres oraciones.

## El MCP: autonomía para leer, determinismo para actuar

El canal se opera desde Claude, no desde una pantalla. **Leer es libre** —buscar en el stock, ver un caso, mirar las métricas. **Actuar es determinístico:** cada tool hace exactamente una cosa con argumentos tipados.

**Ninguna tool toma una instrucción en texto libre.** No existe `hacer(instruccion: string)`: eso le devuelve al modelo la decisión que tiene que tomar el humano.

Y dos cosas que el MCP **nunca** puede exponer, porque el riesgo acá es distinto al de la web —el operador *va* a pedirle una estimación:

- **Ninguna tool devuelve, acepta ni calcula un valor del auto que el cliente entrega**, salvo `cargar_tasacion`, que es Andrés escribiendo su propio juicio. Si una tool estima, Andrés deja de poner el número y el producto pierde lo único que no se automatiza.
- **Ninguna tool expone el margen.**

**El cliente entra por la web, el operador trabaja por MCP o por el link del caso.** Los clientes no tienen Claude; esa división no se cruza.

## Diseño

- Paleta propia con tokens en `:root`, redefinidos para dark mode bajo `@media (prefers-color-scheme: dark)` guardado con `:root:not([data-theme="light"])` y de nuevo bajo `:root[data-theme="dark"]`. `body` con background explícito.
- **No** el gradiente violeta-azul, **no** crema con serif y terracota, **no** negro con verde ácido. Neutros con un sesgo de tono hacia el acento, no grises puros.
- Funciona a 400px, sin scroll horizontal. **El admin también** — se usa desde un teléfono, parado en el galpón.
- Respetá `prefers-reduced-motion`.

**Cuidado con la cascada:** no escribas el color de texto de los botones con reglas de alta especificidad tipo `:root:not([data-theme="light"]) button { color: ... }`. Eso le gana a cualquier variante y los botones transparentes terminan con texto blanco sobre fondo blanco. Definí los colores "sobre acento" como tokens y que las variantes ganen por cascada normal.

## Qué NO construir

Calculadora de cuotas o propuesta automática. Turnos con franjas y recordatorios automáticos. Motor de reglas de ruteo. Motor de cotización o tabla de precios del auto que entra. Cloud API de WhatsApp. Catálogo navegable, filtros o búsqueda. App nativa. Scoring de leads. Cola de jobs. Embudos configurables o campos personalizados en el admin. **Cualquier cosa multi-tenant.**

**Si algo de esta lista parece necesario para que funcione: pará y explicá por qué en el change, en vez de construirlo.**

## Cómo se trabaja acá

**Spec-driven, con OpenSpec.** Ningún código entra sin un change aprobado.

```bash
openspec list                 # los changes abiertos
openspec validate <slug>      # antes de empezar a codear
openspec archive <slug>       # cuando está hecho y verificado
```

1. **Leé el change completo** —`proposal.md`, `design.md` si está, `tasks.md`, `specs/`— antes de tocar un archivo.
2. **Una tarea a la vez**, en orden. Marcá `[x]` solo cuando la verificación pasó.
3. **Cada tarea lleva su línea `*Verifica:*`** con el comando corrido y su resultado. Una tarea sin verificación no está hecha.
4. **Si la realidad contradice el spec**, no improvises: anotalo en el change y pará.
5. **Al terminar**, `openspec archive` lo mueve a `changes/archive/<fecha>-<slug>/`.

### El orden de los changes, que es una cadena de dependencias

| # | Change | Habilita |
|---|---|---|
| 1 | `limpieza-scaffold` | que el repo no arrastre el modelo viejo |
| 2 | `fundacion-datos` | todo lo demás depende del esquema y de los eventos |
| 3 | `stock-publicaciones` | sin stock el agente no tiene qué mostrar |
| 4 | **`mcp-operacion`** | que el stock se cargue hablándole a Claude. Va acá y no al final: **cargar el stock real es un prerequisito para publicar la página** |
| 5 | `canal-publico` | la puerta y el handoff |
| 6 | `caso-seguimiento` | el mostrador, que es el mantra hecho producto |
| 7 | `tablero-metricas` | el instrumento con el que se decide |

**Cada change del 5 al 7 registra sus propias tools en el MCP**, porque son los que construyen lo que esas tools exponen. El MCP crece con el producto en vez de adelantarse a él.

### La verificación mínima de cualquier change

```bash
pnpm install
npx tsc --noEmit
pnpm build
```

Nada se marca hecho sin que los tres pasen.
