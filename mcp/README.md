# El MCP de Llave

El canal se opera desde Claude. **Leer es libre** (buscar en el stock, ver un auto). **Actuar es determinístico**: cada herramienta hace una sola cosa, con argumentos concretos. Ninguna toma una instrucción en texto libre, ninguna estima el valor del auto que entrega un cliente y ninguna muestra el margen.

Los clientes entran por la web; el operador trabaja por acá o por el link del caso.

## Conectarlo desde Claude

Hace falta un **token de operador** (abajo cómo se emite). El token es la autenticación: quien lo tiene opera con ese rol. Se guarda como una contraseña.

**Claude Code**, contra la app desplegada:

```bash
claude mcp add --transport http llave https://<dominio>/api/mcp --header "Authorization: Bearer <token>"
```

**Claude en la web o en el teléfono**, como conector personalizado: la URL va con el token adentro, porque ahí no se pueden poner encabezados.

```
https://<dominio>/api/mcp?token=<token>
```

Esa URL es la llave entera: no se comparte ni se pega en un chat.

**En la compu, por stdio** (desarrollo, o un operador con Claude Code y el repo clonado). Acá las fotos pueden ser rutas a archivos:

```bash
claude mcp add llave -e LLAVE_TOKEN=<token> -- pnpm --silent --dir /ruta/a/llave mcp:stdio
```

El `--silent` importa: por stdio, la salida estándar es el protocolo, y el encabezado que imprime `pnpm` lo rompe.

## Emitir y revocar un token

```bash
node --env-file=.env.local scripts/crear-operador.mts "Abelardo" vendedor
node --env-file=.env.local scripts/crear-operador.mts "Andrés" falkenberg
```

Imprime el token una sola vez. Para revocarlo se borra su fila de la tabla `operador`. La columna `ultimo_uso` dice si cada operador lo usa.

## Las fotos

Una foto pegada en el chat de Claude **no le llega a las herramientas**: Claude la ve, pero no puede pasarle el archivo a un servidor. `cargar_auto` recibe **links https** a las fotos (o rutas de archivo por stdio). El servidor las baja, chequea que sean JPG, PNG o WEBP de hasta 10 MB y las copia al bucket privado. Si las fotos están solo en el teléfono, el camino corto es el admin: `/admin/stock`, "Sacar foto".

## Las herramientas

**Lectura**

- `buscar_stock(buscar?, publicado?)`: el stock que no está vendido, con precio, si está publicado y los días sin actualizar.
- `ver_auto(slug)`: la ficha completa, con links a las fotos que valen una hora.
- `stock_desactualizado()`: los publicados con más de 14 días sin tocar, que es el aviso del admin sin abrir el admin.

**Escritura** (una cosa cada una)

- `cargar_auto(linea, fotos)`: da de alta un auto con la línea y las fotos. Deduce lo que está en la evidencia, devuelve lo que falta confirmar y lo deja sin publicar ni precio.
- `completar_auto(slug, marca?, modelo?, version?, anio?, km?, segmento?)`: completa o corrige la ficha.
- `poner_precio(slug, precio)`: el precio público, en una llamada propia. Lo dicta una persona.
- `publicar_auto(slug)`: falla si falta el precio o un dato que ve el cliente.
- `despublicar_auto(slug)`: lo saca de la página sin marcarlo vendido.
- `marcar_vendido(slug)`: vendido y despublicado en la misma operación.

Los changes que construyen el caso, el seguimiento y el tablero registran sus propias herramientas en `mcp/servidor.ts`.
