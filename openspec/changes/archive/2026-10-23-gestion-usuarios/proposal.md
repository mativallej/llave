# Proposal

## Why

**Hoy los usuarios del admin se gestionan con un script.** Para dar de alta a alguien hay que correr `scripts/crear-usuario.mts` con acceso a las claves. Para sacarle el acceso, cambiarle el rol o resetearle la contraseña, hay que entrar al panel de Supabase. Eso deja la gestión en manos de quien tiene el repo, no de quien maneja la concesionaria.

Matías lo pidió el 23/10/2026: una pantalla de usuarios en `/admin`, para el rol `falkenberg`.

## What Changes

**`/admin/usuarios`, solo para `falkenberg`**, con cuatro operaciones:

- **Alta:** email, nombre y rol. La cuenta se crea con una contraseña al azar que **se muestra una sola vez**, para entregarla en persona, como hacía el script. No se guarda en ningún lado de Llave y no sale por mail: el login del admin no depende de un servidor de mail.
- **Suspender y reactivar:** la baja es reversible.
  - La cuenta suspendida no puede volver a entrar: queda bloqueada en Supabase Auth.
  - **Una sesión que ya estaba abierta se corta en el pedido siguiente,** por la columna nueva `perfil.suspendido_en` que se chequea en cada pedido.
  - No hay borrado: un usuario suspendido no tiene acceso, y su nombre sigue en las notas que firmó.
- **Cambio de rol** entre `falkenberg` y `vendedor`.
- **Resetear la contraseña:** una nueva al azar, que también se muestra una sola vez. La anterior deja de servir en el acto.

Cada usuario muestra su nombre, email, rol, estado y cuándo entró por última vez.

**Nadie se suspende ni se cambia el rol a sí mismo.** Quien opera es `falkenberg`, y como no puede tocarse, siempre queda al menos un `falkenberg` activo: nadie se puede dejar afuera a sí mismo ni dejar a la concesionaria sin quien maneje usuarios y config. Su propia contraseña sí la puede resetear.

## Capabilities

### New Capabilities

- `usuarios`: quién entra al admin, con qué rol, y cómo se da y se saca ese acceso desde el admin.

## Impact

**El primer `falkenberg` se sigue creando con el script**: sin un usuario no hay quien entre a la pantalla. Después, todo se hace desde acá.

**Los tokens del MCP son otra llave.** Suspender a alguien en el admin no le revoca su token de operador, que vive en la tabla `operador`. Gestionar esos tokens desde la pantalla queda para otro change si hace falta.

**Fuera de alcance:**
- "Olvidé mi contraseña" y las invitaciones por mail, porque piden un servidor de mail.
- Que cada usuario cambie su propia contraseña.
- El doble factor.
- El borrado definitivo de una cuenta.
