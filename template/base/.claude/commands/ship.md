---
description: Entrega el desarrollo terminado para revisión funcional: delega en el agente pre-merge, que revisa, verifica, audita, abre el PR e informa qué queda por probar a mano.
---

Invocá al subagente **`pre-merge`** con el Agent tool.

Todo el flujo de entrega vive ahí: revisión del diff, arreglo de los
hallazgos medium+, la verificación completa, el audit de dependencias, el
PR y el informe final. Este comando no repite ninguno de esos pasos — si
estuvieran también acá, las dos copias divergirían en el tercer cambio.

Lo que tenés que pasarle en el prompt, porque el agente arranca en frío:

1. **Qué se implementó y por qué.** La intención del cambio, no la lista de
   archivos: eso lo lee del diff.
2. **Contra qué rama se compara**, si el proyecto tiene más de una rama de
   larga vida.
3. **Qué ya se probó a mano**, si probaste algo. Le evita pedirte de nuevo
   una comprobación que ya hiciste.
4. **Decisiones que se tomaron durante el desarrollo** y que no se leen del
   código — sobre todo si se descartó una alternativa.

Cuando termine, relevá al usuario el informe completo: veredicto, hallazgos
y cómo se resolvieron, resultado de la verificación, la URL del PR, y
—especialmente— **lo que el agente no pudo verificar**, que es el guion de
la revisión funcional.

El agente nunca mergea. Esa decisión sigue siendo del usuario, y el verde
no es autorización (`rules/git-workflow.md`).

$ARGUMENTS
