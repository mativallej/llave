# Proposal

## Why

**Los endpoints públicos no tienen límite de pedidos.** Cualquiera puede:
- llamar a `/api/chat` en un loop, y cada turno es una llamada a OpenAI que se paga;
- mandar pedidos falsos, y cada uno es un caso nuevo y un WhatsApp para Abelardo;
- pedir links de subida a Storage sin parar;
- probar contraseñas en el login del admin.

Además, el login pasa por el servidor: Supabase ve la IP de Vercel y no la del que prueba, así que su propio límite por IP no separa a un atacante de Andrés.

Matías lo pidió el 23/10/2026.

## What Changes

**Un contador en Postgres**, sin servicio nuevo ni cola de jobs: la tabla `limite` y la función `contar_uso(clave, segundos, maximo)`. Cuenta por ventana fija y en una sola sentencia, así que dos pedidos simultáneos no se pisan. Las ventanas viejas se borran al pasar.

**Los límites, por conexión (IP):**

| Qué | Ventana | Máximo |
|---|---|---|
| Turnos con Tuerca (`/api/chat`) | 10 minutos | 60 |
| Turnos con Tuerca | 1 día | 300 |
| Turnos con Tuerca, **entre todos** | 1 hora | 1000 |
| Pedidos enviados | 1 hora | 10 |
| Links para subir fotos | 1 hora | 30 |
| Aperturas del link del caso (`/c/[token]`) | 10 minutos | 120 |
| `/api/mcp` sin un token válido | 10 minutos | 20 |
| Intentos de login del admin | 15 minutos | 10 |

**Cuando se pasa, se dice qué hacer y cuándo**, que es el mantra aplicado a un error:
- Tuerca contesta con su voz que hay que esperar unos minutos.
- El formulario dice que se puede probar de nuevo en una hora.
- El MCP devuelve 429.
- El login dice cuándo se puede volver a probar.

**La IP no se guarda.** La clave es un hash SHA-256 de la IP, y la fila se borra a los dos días.

## Capabilities

### New Capabilities

- `limites-de-uso`: cuánto puede usar una conexión cada endpoint público, y qué ve cuando se pasa.

## Impact

**Si el contador falla, el pedido pasa.** Un límite que tira abajo el canal cuando la base tose es peor que no tener límite. Queda en el log.

**Muchas personas pueden compartir una IP.** En el celular, las compañías ponen a muchos clientes detrás de la misma. Los números de arriba dan para varias conversaciones a la vez desde una misma IP; si alguna vez se queda corto, se ajustan en `lib/limites.ts`.

**El techo total de Tuerca es el único que afecta a todos a la vez.** Está para que un ataque distribuido no se convierta en una factura de OpenAI. Mil turnos por hora son decenas de conversaciones simultáneas: muy por encima de lo que espera una concesionaria de Rafaela.

**Los números son constantes en el código y no van en `config`.** Son protección técnica y no cambian por motivos del negocio. Si eso cambia, se mudan.

**Decidido sin cambios en este change:** el link del operador viaja en el WhatsApp del cliente, que es quien lo reenvía a Abelardo. Matías lo aceptó así (23/10/2026).
