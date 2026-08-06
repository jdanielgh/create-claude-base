---
description: Correr la verificación completa del proyecto (typecheck + tests) y reportar solo lo que falla.
---

Corre la verificación completa de este proyecto. Si no sabes cuál es el
comando, búscalo en los scripts del gestor de paquetes antes de inventar
uno.

Reporta:

- **Verde:** una línea. No listes los tests que pasaron.
- **Rojo:** el fallo concreto — archivo, línea, y la aserción que falló.
  Luego el diagnóstico de la causa, no solo la salida copiada.

No arregles nada sin decir primero qué está roto y por qué. Un test que
falla puede estar detectando un bug real o puede estar mal escrito, y
tocarlo antes de saber cuál de las dos cosas es hace desaparecer la señal.

Si la verificación tarda, córrela en segundo plano en vez de bloquear.

$ARGUMENTS
