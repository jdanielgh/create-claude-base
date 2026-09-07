# Proyecto: {{PROJECT_NAME}}

<!-- Completa estas dos líneas antes de la primera sesión larga. Un CLAUDE.md
     genérico se ignora solo; uno específico cambia todas las respuestas. -->

**Qué es:** _(una o dos frases: qué hace el sistema y para quién)_

**Stack:** _(lenguaje, framework, base de datos, servicios externos)_

## Reglas globales

1. Respuestas de desarrollo directas, sin relleno. Código y la explicación
   mínima necesaria, salvo que se pida detalle.
2. No hardcodear claves ni tokens: todo por variables de entorno, con el
   archivo de entorno fuera de git.
3. Toda entrada externa (respuesta de API, webhook, archivo subido, salida
   de un modelo) se valida antes de persistirla.
4. Todo desarrollo terminado pasa por el subagente `pre-merge` antes de
   pedir revisión funcional — él revisa, verifica y audita. Nada se
   mergea sin eso y sin el sí explícito del usuario. Ver
   `rules/git-workflow.md`.
5. Las tareas mecánicas y ruidosas (migraciones, backups, scripts de
   mantenimiento) se delegan al subagente `ops-runner`, no a la sesión
   principal: su salida no vale el contexto que ocupa.
6. Cualquier corrida que gaste saldo real de una API de IA sigue
   `rules/ai-cost.md` completo, sin excepción.
7. Si hay una tarea en curso registrada en `.claude/state/tasks/`, retomala
   desde ahí en vez de empezar de cero. Ver `rules/resumable-tasks.md`.

<!-- Añade acá lo que sea específico de este proyecto: invariantes que nunca
     se rompen, tablas que nunca se tocan, límites de arquitectura. Sé
     concreto — "escribe buen código" no cambia nada, "nunca UPDATE sobre
     `events`" sí. -->

## Dónde vive cada cosa

El detalle por tema vive en `rules/` y `skills/`, no en este archivo: esto
se carga en cada turno y crece mal.

- `rules/` — reglas que siempre aplican (estilo, git, seguridad, costo de IA).
- `agents/` — subagentes con contexto propio, para trabajo que no debe
  contaminar la sesión principal.
- `commands/` — comandos `/` para flujos repetidos.
- `hooks/` — automatizaciones deterministas. Nunca llaman al modelo.
- `state/` — estado efímero de sesión. Fuera de git.

_Base generada con [create-claude-base](https://github.com/jdanielgh/create-claude-base) ({{PRESET}}, {{DATE}})._
