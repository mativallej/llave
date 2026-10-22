# KICKOFF

> El prompt para arrancar una sesión de desarrollo autónomo en este repo. Se pega tal cual en una sesión nueva, parado en `~/Desktop/pro/llave`.
>
> **Arranca con un preflight.** El objetivo es que el agente descubra lo que falta en el minuto cero y no en el change 2, cuando ya escribió migraciones que no puede aplicar.

```
Trabajás en el repo de Llave, el canal digital de Falkenberg Meyer Automotores.
Ruta: ~/Desktop/pro/llave

════════════════════════════════════════════════════════════════════════════
PASO 0 — PREFLIGHT. Antes de leer nada más y antes de escribir una línea.
════════════════════════════════════════════════════════════════════════════

Corré estos chequeos y armá una tabla con el resultado de cada uno. Si alguno
falla, PARÁ y decime exactamente qué falta. No empieces a codear con un chequeo
en rojo: el objetivo de este paso es que descubras lo que falta ahora y no en el
change 2, cuando ya escribiste migraciones que no podés aplicar.

NUNCA imprimas el valor de una clave. Verificás que existe y que funciona;
mostrás ✅ o ❌, nunca el contenido.

HERRAMIENTAS
  1. node --version          → ≥ 20
  2. pnpm --version          → ≥ 10
  3. supabase --version      → ≥ 2.x

CLAVES EN .env.local  (si el archivo no existe: cp .env.example .env.local y pará)
  4. NEXT_PUBLIC_SUPABASE_URL       presente y con forma https://<ref>.supabase.co
  5. NEXT_PUBLIC_SUPABASE_ANON_KEY  presente y no vacía
  6. SUPABASE_SERVICE_ROLE_KEY      presente y no vacía
  7. OPENAI_API_KEY                 presente y no vacía

QUE LAS CLAVES REALMENTE FUNCIONEN — que estén escritas no alcanza
  8. La anon key autentica:
       curl -s -o /dev/null -w '%{http_code}' "$URL/rest/v1/" -H "apikey: $ANON"
       → 200. Un 401 es clave inválida; un 000 es que el proyecto no responde.
  9. La service_role autentica y lee el schema:
       curl -s "$URL/rest/v1/" -H "apikey: $SERVICE" -H "Authorization: Bearer $SERVICE"
       → JSON de OpenAPI. Listá qué tablas ya existen (ver chequeo 12).
 10. La OPENAI_API_KEY autentica, con una llamada que no gasta tokens:
       GET https://api.openai.com/v1/models
       → 200, y el snapshot fijado en AGENTS.md aparece en la lista. Un 401 es
         clave inválida.

ESTADO DEL PROYECTO Y DEL LINK
 11. supabase projects list    → el proyecto zqovcwnrwzsmdejvuazg aparece LINKED
                                 y Active Healthy. Si dice COMING_UP, esperá y
                                 reintentá: todavía se está aprovisionando.
 12. supabase migration list --linked
       → si falla con "IPv6 is not supported on your current network", el CLI no
         llega a la base. La salida es volver a correr
         `supabase link --project-ref zqovcwnrwzsmdejvuazg`, que pide la database
         password y guarda la conexión por el pooler IPv4. Eso lo tiene que
         correr Matías, no vos: pará y pedíselo.
 13. ¿El remoto ya tiene esquema?  ESTE ES EL IMPORTANTE.
       El proyecto de Supabase es del 3 de mayo de 2026, no de esta semana, así
       que puede tener tablas de la época del modelo descartado. Listá las tablas
       del schema public.
       → Si está vacío, seguís normal.
       → Si hay tablas, PARÁ y mostrame qué hay antes de tocar nada. No corras
         ninguna migración destructiva ni `db reset` contra el remoto.
 14. ls supabase/config.toml
       → si no existe, la tarea 4.3 de limpieza-scaffold (supabase init) sigue
         pendiente. Si existe, marcala como ya hecha.

VERDICTO
  Tabla con los 14, y una línea: ¿se puede correr autónomo de punta a punta, o
  qué falta? Si todo está verde, seguí al paso 1 sin preguntar.

════════════════════════════════════════════════════════════════════════════
PASO 1 — LEER
════════════════════════════════════════════════════════════════════════════

Leé AGENTS.md completo. Es la constitución del repo — contexto de negocio, el
mantra, las tres reglas duras de copy, las ocho del agente conversacional, el
stack, la tabla config y la lista de qué no construir. Después openspec/project.md.

════════════════════════════════════════════════════════════════════════════
PASO 2 — CONSTRUIR
════════════════════════════════════════════════════════════════════════════

Spec-driven con OpenSpec. Ningún código entra sin un change. Son seis y son una
cadena de dependencias:

  1. limpieza-scaffold      el repo arrastra un scaffold de abril del modelo descartado
  2. fundacion-datos        esquema, RLS, eventos, la tabla config. Todo depende de esto
  3. stock-publicaciones    sin stock el agente no tiene qué mostrar
  4. mcp-operacion          el stock se carga hablándole a Claude. Va acá porque cargar
                            el stock real es prerequisito para publicar la página
  5. canal-publico          la landing, Tuerca y el handoff a WhatsApp
  6. caso-seguimiento       /c/[token], el mostrador y las acciones por estado
  7. tablero-metricas       las ocho métricas y los tres avisos

  Los changes 5 a 7 registran sus propias tools en el MCP: son los que construyen
  lo que esas tools exponen.

PROTOCOLO, por cada change:

  openspec validate <slug>      # antes de tocar un archivo

  - Leé el change COMPLETO primero: proposal.md, design.md si está, tasks.md y
    specs/. Los specs están en formato WHEN/THEN y son el criterio de aceptación.
  - Una tarea a la vez, en orden.
  - Marcá [x] solo cuando la verificación pasó, y escribí en la línea
    *Verifica:* el comando que corriste y su resultado real. Una tarea sin
    verificación no está hecha. No inventes resultados.
  - Antes de cerrar cualquier change:
        pnpm install && npx tsc --noEmit && pnpm build
    Los tres en exit 0, más los tests que pida el change.

  openspec archive <slug>       # recién cuando está hecho y verificado

════════════════════════════════════════════════════════════════════════════
DÓNDE PARAR Y PREGUNTARME. No improvises en ninguno.
════════════════════════════════════════════════════════════════════════════

  - Cualquier chequeo del preflight en rojo.
  - El remoto tiene tablas previas (chequeo 13).
  - Tarea 1.1 de limpieza-scaffold: borra once componentes y el repo NO TIENE
    COMMITS, así que no se recuperan. Mostrame la lista y esperá mi ok.
  - Si la realidad contradice un spec, anotalo en el change y pará. No reescribas
    el spec para que cierre con el código.
  - Si algo de la lista "Qué NO construir" de AGENTS.md te parece necesario,
    explicá por qué en el change en vez de construirlo.

════════════════════════════════════════════════════════════════════════════
TRES COSAS QUE SE ROMPEN SOLAS SI NO LAS CUIDÁS
════════════════════════════════════════════════════════════════════════════

  - La clave garantias_falkenberg de la tabla config arranca en false y se queda
    ahí. Son cinco promesas que paga Andrés y no están aceptadas por escrito. Hay
    un test que verifica que con la fila en false el HTML no las contiene.
  - El agente NUNCA menciona otras agencias, ni una red, ni que el auto se
    consulta con terceros. Ni en el system prompt, ni en el copy, ni en la vista
    del cliente cuando el caso está en pendiente_conseguir.
  - El agente NUNCA pone un precio al auto que el cliente entrega. Sí dice el
    precio del stock, que es público y exacto. Y ninguna tool del MCP estima ese
    valor: el riesgo ahí es mayor, porque el operador sí te lo va a pedir.

Arrancá por el preflight. Mostrame la tabla antes de seguir.
```

## Por qué el preflight está primero y es tan explícito

**Un agente autónomo sin preflight descubre que falta una clave en el change 2**, después de haber escrito siete migraciones que no puede aplicar. Y la salida de ahí suele ser peor que el problema: inventar un mock de Supabase, o marcar tareas como hechas con verificaciones que no corrió.

**Los chequeos 8, 9 y 10 existen porque "la clave está escrita" no es lo mismo que "la clave funciona".** Una anon key pegada de más con un salto de línea pasa cualquier `grep` y falla en la primera query.

**El chequeo 13 es el que más puede ahorrar.** El proyecto de Supabase es del 3 de mayo, de la época del modelo descartado, así que puede tener tablas viejas. Un agente que corre migraciones contra un schema que no esperaba hace un desastre silencioso.

**El chequeo 12 no lo puede resolver el agente**, y está escrito para que no lo intente: volver a correr `supabase link` pide la database password, que es interactivo.

## Las dos paradas que no se pueden delegar

"100% autónomo" no incluye **borrar archivos sin revisar** ni **inventar credenciales**. Lo demás se resuelve con `AGENTS.md` y los specs.

Las otras dos condiciones de parada —un spec contradicho por la realidad, y algo de la lista de "no construir" que parece necesario— están porque son los dos momentos donde un agente autónomo tiende a **arreglar el spec en vez de levantar la mano**.

## Para retomar a mitad de camino

```bash
openspec list                 # qué changes quedan y su progreso
```

El prompt es el mismo: el preflight vuelve a correr —es barato y detecta una clave que venció— y en la última línea cambiás el change donde quedó.
