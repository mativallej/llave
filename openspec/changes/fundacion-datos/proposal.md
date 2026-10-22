# Proposal

## Why

Todo lo demás depende de dos cosas que todavía no existen: **el esquema** y **la captura de eventos**.

El esquema es directo. Los eventos son el que se suele dejar para después, y es el error que decide si el experimento sirve: **un evento que se agrega la semana siguiente no tiene histórico y la métrica arranca de cero.** Las siete métricas del Stage 1 se calculan sobre el embudo —pedido, cita agendada, cita cumplida, propuesta, venta— y si esos cinco momentos no escriben en el mismo commit que la feature que los produce, el canal corre tres meses y después se discute si salió bien.

Hay además **dos números que no salen de ningún evento** y necesitan un campo editable: la respuesta post-venta de si el cliente hubiera ido a Falkenberg sin el canal, y el gasto mensual en ads, que vive en la cuenta de Meta de Andrés.

Y una distinción que no es cosmética: **el silencio propio se cuenta aparte del silencio del cliente.** Si el cliente no contesta, cerrar el caso está bien. Si no contestamos nosotros y el caso se cierra igual, se automatizó perder el lead y encima desapareció de la vista.

## What Changes

- **Siete tablas** en `supabase/migrations/`: `auto`, `caso`, `acceso`, `nota`, `evento`, `gasto_mes`, más el `storage` bucket de fotos.
- **RLS en todas**: `auto` publicado es lectura pública; `caso`, `nota` y `evento` solo por service role o por token válido; `gasto_mes` solo admin.
- **Un helper de eventos** (`lib/db/eventos.ts`) con los nueve tipos tipados, para que escribir un evento sea una línea y no haya forma de escribir un tipo que no existe.
- **`caso.venta_nueva`** en positivo a propósito: `true` = *no hubiera venido sin el canal*. El nombre en negativo metía una doble negación en la métrica que decide si hay producto, y es el tipo de error que la reporta invertida sin que nadie lo note.
- **`caso_perdido` lleva `meta.por_silencio`** para separar el silencio propio del del cliente.
- **Tipos generados** en `lib/db/types.ts` y un server client único en `lib/db/server.ts`.
- **Una tabla `config`** clave-valor, server-only, para lo que es **dato operativo y no secreto de build**: el WhatsApp de Abelardo, el flag de las garantías de Falkenberg y la redacción del plazo de contacto. Como env vars, cambiar cualquiera de los tres exige un redeploy — y los tres cambian por motivos de negocio, no de código. Cuando Andrés firme las garantías, prenderlas tiene que ser editar una fila.
- **Seed de cuatro autos marcados como ficticios.**

## Capabilities

### New Capabilities

- `datos-del-caso`: qué se guarda de un caso, de un auto y de cada paso del embudo, y con qué permisos se lee.

### Modified Capabilities

*(ninguna)*

## Impact

**Contratos que arrancan acá y no se cambian después sin migrar datos:** los nueve tipos de `evento`, los nombres de estado de `caso.estado`, y que el **teléfono es el índice** — es lo único consistente entre la web, WhatsApp y una llamada.

**Dependencia:** `limpieza-scaffold`.

**Fuera de alcance:** cualquier UI. Este change es esquema, permisos, tipos y el helper.

**Requiere de Matías:** un proyecto de Supabase y sus claves en `.env.local`. Sin eso las migraciones no se pueden aplicar y la verificación de las tareas 2 y 4 no corre.
