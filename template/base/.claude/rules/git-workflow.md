# git-workflow

Flujo no negociable:
**rama → agente `pre-merge` → PR → revisión funcional → merge**.

**Todo desarrollo terminado pasa por el subagente `pre-merge` antes de
pedir revisión.** No es opcional ni depende de qué tan chico parezca el
cambio: es el paso que revisa el diff, arregla los hallazgos medium+, corre
la verificación completa más el audit de dependencias, abre el PR y
devuelve el guion de lo que queda por probar a mano. Un PR que no pasó por
ahí no está listo para revisarse. Se invoca con `/ship` o llamando al
agente directo.

El agente arranca en frío a propósito: la sesión que escribió el código ya
se convenció de que funciona, y esa es exactamente la revisión que no
sirve.

**Excepción: ramas 100% de documentación.** Una rama que solo toca archivos
de documentación o de `.claude/rules/` —nada de código ni configuración que
afecte el build o el runtime— no pasa por `pre-merge`. No hay diff de
lógica que revisar ni capas de verificación que correr sobre texto. El
resto del flujo sigue igual: rama propia, PR, y nada se mergea sin el sí
explícito del usuario. Si una rama mezcla un cambio de código con la doc,
ya no es 100% documentación y pasa por `pre-merge` completo.

1. Nunca commitear directo sobre la rama principal. Si estás parado en ella
   y hay que cambiar algo, primero rama.
2. Un PR = un cambio con una intención. Si el título necesita un "y", son
   dos PRs.
3. Nada se mergea sin que el usuario lo haya revisado y dicho que sí. Que
   la verificación esté en verde no es autorización para mergear.
4. Antes de abrir el PR: la verificación completa en verde localmente, más
   el audit de dependencias. No delegues eso a CI para enterarte diez
   minutos después. **La definición de esas capas vive en un solo lugar —
   `agents/pre-merge.md`.** Si cambia el conjunto de capas, cambia ahí y en
   ningún otro archivo.
5. Commits y push solo cuando se piden. No commitees "para no perder el
   trabajo" sin avisar.
6. Nunca `--no-verify` ni saltarse hooks de commit. Si un hook falla, el
   problema es lo que el hook detectó.
7. Antes de cualquier operación destructiva (`reset --hard`, `push --force`,
   `checkout --` sobre cambios sin guardar), preguntar. Casi siempre hay una
   alternativa que no pierde trabajo.

## Mensajes de commit

Imperativo, en el idioma del repo, describiendo el efecto y no el archivo
tocado. `Evitar reprocesar mensajes ya completados` sirve;
`actualizar service.ts` no dice nada que el diff no diga mejor.
