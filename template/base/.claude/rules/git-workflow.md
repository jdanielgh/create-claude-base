# git-workflow

Flujo no negociable: **rama → PR → revisión explícita → merge**.

1. Nunca commitear directo sobre la rama principal. Si estás parado en ella
   y hay que cambiar algo, primero rama.
2. Un PR = un cambio con una intención. Si el título necesita un "y", son
   dos PRs.
3. Nada se mergea sin que el usuario lo haya revisado y dicho que sí. Que
   la verificación esté en verde no es autorización para mergear.
4. Antes de abrir el PR: verificación del proyecto en verde localmente
   (typecheck + tests). No delegues eso a CI para enterarte diez minutos
   después.
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
