---
description: Registrar en docs/DECISIONS.md las decisiones de diseño reales tomadas en esta sesión, y sugerir /compact si corresponde.
---

A diferencia del hook automático de checkpoint (que solo deja un marcador
mecánico en `.claude/state/` sin interpretar nada), este comando sí razona.

Revisa lo discutido y decidido en esta sesión y añade a `docs/DECISIONS.md`
una entrada breve y concreta: **qué se decidió y por qué**, con las
alternativas que se descartaron. No un resumen de todo lo que se hizo — el
historial de git ya cubre eso, y una entrada genérica ensucia el documento
para las que sí importan.

Si en esta sesión no se decidió nada de diseño, dilo y no escribas nada.

Después de escribir la entrada, si la sesión ya cubrió una tarea completa o
el contexto se siente cargado, sugiere `/compact` explícitamente.

$ARGUMENTS
