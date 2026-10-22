# Proposal

## Why

El agente muestra tarjetas del stock. **Sin stock mantenido no tiene qué mostrar, y un auto vendido que sigue publicado es el agente mintiéndole al cliente.**

Y hay un dato que ordena el diseño de esta pantalla: **el 80% de las webs de concesionarias muere con el stock viejo.** No por falta de ganas. Sacar seis fotos de un auto son dos minutos; **llenar marca, modelo, año, versión, kilómetros, combustible y transmisión es lo que nadie hace la tercera semana.** El formulario es la causa de muerte.

Lo mantiene Abelardo, que tiene 65 años y lo va a hacer parado en el galpón, desde un teléfono. Si dar de alta un auto cuesta un formulario de siete campos, esto deja de funcionar en febrero.

Por eso el alta **no es un formulario: es una foto y una línea de texto.**

## What Changes

- **`/admin`** con Supabase Auth por email. Dos roles: `falkenberg` ve todo, `vendedor` ve lo suyo.
- **`/admin/stock`**, la pantalla más usada del producto:
  - **Alta por foto + línea suelta.** *"Entró un Corolla XEI 2019 con 78 mil"* + fotos → el agente lee el texto y las imágenes y completa marca, modelo, versión y tipo de las fotos; año y km del texto. Lo que no pudo deducir queda marcado y se confirma de a un dato por vez. **Nunca inventa un dato que no está.**
  - **El precio se escribe siempre a mano.** Es el único campo que el agente no toca: es público y es una de las garantías de la página.
  - **Un solo toggle** para publicar y despublicar, sin pantalla intermedia.
  - **"Marcar como vendido"** setea `vendido_en` y **despublica solo**.
  - **Aviso visible** cuando hay autos publicados sin actualizar en más de 14 días.
  - Reordenar para elegir los seis de "Autos de esta semana".
- **El formulario completo existe solo como pantalla de edición**, para corregir — nunca como entrada.
- Funciona a 400px.

## Capabilities

### New Capabilities

- `stock`: cómo entra, se mantiene y se despublica un auto, y qué ve el canal público de él.

### Modified Capabilities

*(ninguna)*

## Impact

**Es el change que decide si el producto sobrevive al mes tres.** Las métricas y el agente se construyen igual con un formulario; la diferencia aparece en la semana tres, cuando el alta tiene que seguir costando dos minutos.

**Dependencia:** `fundacion-datos`.

**Reutiliza el agente** del canal público para leer la línea y las fotos, así que el cliente de Anthropic y el helper de visión se montan acá y `canal-publico` los usa.

**Fuera de alcance:** el watcher de la carpeta de Drive donde Abelardo deja fotos hoy, y la baja automática al cerrarse una venta — esa se conecta en `caso-seguimiento`, que es donde una venta consume un auto.
