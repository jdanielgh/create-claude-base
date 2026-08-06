---
description: Preparar el cambio actual para revisión: verificación en verde, rama, commit y PR — deteniéndose antes de mergear.
---

Lleva el trabajo actual hasta un PR listo para revisar, siguiendo
`rules/git-workflow.md`. Nunca mergeas: eso lo decide el usuario.

Pasos, en orden, deteniéndote si alguno falla:

1. Revisa qué cambió realmente (`git status` y el diff). Si hay cambios que
   no pertenecen a este trabajo, dilo antes de commitearlos.
2. Corre la verificación completa. Si está en rojo, párate acá y reporta.
3. Si estás sobre la rama principal, crea una rama con nombre descriptivo.
4. Commit con un mensaje en imperativo que describa el efecto del cambio.
5. Abre el PR con un cuerpo que diga qué cambia, por qué, y cómo se
   verificó.
6. Devuelve la URL del PR y **detente**. No mergeas ni aunque la
   verificación esté verde.

$ARGUMENTS
