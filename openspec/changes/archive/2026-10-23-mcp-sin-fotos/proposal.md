# Proposal

## Why

**Una foto pegada en el chat de Claude no le llega a ninguna tool.** Claude la ve, pero no puede pasarle el archivo a un servidor. Por eso `cargar_auto` pedía links https a las fotos, y ese camino no lo usa nadie que saca la foto con el teléfono, parado en el galpón.

Matías decidió (23/10/2026) que **el MCP no acepta fotos por ahora.** Las fotos se suben desde `/admin/stock`, que tiene "Sacar foto" y anda en el teléfono.

## What Changes

- `cargar_auto(linea)`: solo la línea. Deduce lo que dice la línea, nunca inventa, y devuelve lo que falta.
- **Ninguna tool del MCP recibe fotos**: ni links, ni rutas de archivos, ni imágenes. Se va el modo `archivosLocales` del stdio, que existía solo para las fotos.
- `ver_auto` sigue devolviendo links a las fotos que ya tiene el auto: leer no cambia.
- Las instrucciones del servidor y `mcp/README.md` dicen dónde se suben las fotos.
- Se borra `importarFotos`, que bajaba fotos de un link: lo usaba solo el MCP.

## Capabilities

### Modified Capabilities

- `mcp-operacion`: cargar un auto por MCP cuesta una línea, sin fotos.

## Impact

**Publicar sigue sin exigir fotos**, como hasta ahora; lo que cambia es que por MCP no se pueden agregar. Si un auto se publica sin fotos por MCP, la home lo muestra sin foto.

**Volver atrás es una tool nueva**, no un parámetro: si las fotos vuelven al MCP, entran en un change propio y con un camino que funcione desde el teléfono. El código que se borra queda en el historial de git.
