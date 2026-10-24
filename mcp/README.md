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

**En la compu, por stdio** (desarrollo, o un operador con Claude Code y el repo clonado):

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

**Por el MCP no se cargan fotos, por ahora.** Una foto pegada en el chat de Claude no le llega a ninguna herramienta: Claude la ve, pero no puede pasarle el archivo a un servidor. Por eso ninguna herramienta recibe fotos, ni pegadas ni por link. Se suben desde el admin: `/admin/stock`, "Sacar foto", que anda en el teléfono. `ver_auto` sí devuelve links a las fotos que ya tiene un auto.

## Las herramientas

**Lectura**

- `buscar_stock(buscar?, publicado?)`: el stock que no está vendido, con precio, si está publicado y los días sin actualizar.
- `ver_auto(slug)`: la ficha completa, con links a las fotos que valen una hora.
- `stock_desactualizado()`: los publicados con más de 14 días sin tocar, que es el aviso del admin sin abrir el admin.

**Escritura** (una cosa cada una)

- `cargar_auto(linea)`: da de alta un auto con la línea. Deduce lo que dice la línea, devuelve lo que falta confirmar y lo deja sin publicar, sin precio y sin fotos.
- `completar_auto(slug, marca?, modelo?, version?, anio?, km?, segmento?)`: completa o corrige la ficha.
- `poner_precio(slug, precio)`: el precio público, en una llamada propia. Lo dicta una persona.
- `publicar_auto(slug)`: falla si falta el precio o un dato que ve el cliente.
- `despublicar_auto(slug)`: lo saca de la página sin marcarlo vendido.
- `marcar_vendido(slug)`: vendido y despublicado en la misma operación.

**Casos** (de `caso-seguimiento`)

- Lectura: `listar_casos(estado?, antiguedad?)`, `ver_caso(ref)`, `historial_telefono(telefono)`. Ninguna devuelve la tasación.
- Escritura, un paso cada una, en el orden del caso: `llegaron_fotos(ref)`, `agendar_cita(ref, fecha)`, `marcar_inspeccionado(ref)`, `cargar_tasacion(ref, valor_toma)` (solo rol `falkenberg`), `marcar_conseguido(ref, auto, precio)`, `publicar_propuesta(ref)`, `acepto_propuesta(ref)`, `cerrar_caso(ref, cerro, motivo?, por_silencio?)`. Además, `agregar_nota(ref, texto)` y `marcar_venta_nueva(ref, respuesta)`.
- Lo que no tiene herramienta (no vino, el próximo aviso de una búsqueda, corregir un dato, la renegociación, pedirle algo al cliente) se hace desde el link del caso, que devuelve `ver_caso`.

**Tablero** (de `tablero-metricas`)

- `metricas(periodo)`: las ocho métricas con numerador y denominador, y el embudo.
- `avisos()`: renegociaciones, ventas sin preguntar y si la semana se llenó.

Cada change que construye algo registra sus herramientas en `mcp/servidor.ts`.
