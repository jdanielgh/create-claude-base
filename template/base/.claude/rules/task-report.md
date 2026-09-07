# task-report

Qué se responde cuando una tarea termina.

Existe para separar lo que el usuario necesita para **probar y decidir** de
lo que ya está en el diff, el commit y el informe de `pre-merge` — y no
tiene sentido repetir. Todo lo que no cambie qué tiene que probar o qué
tiene que decidir es contexto que paga y no usa.

Cinco secciones, en este orden. La que no aplica se omite; no se rellena.

## 1. Lo que quedó roto

Solo lo **no resuelto**: qué falla, dónde quedó documentado, y **en qué
tarea se arregla**. Un pendiente sin tarea asignada no lo retoma nadie.

Lo ya arreglado no va — ni el hallazgo, ni el diagnóstico, ni el test que
lo cubre. Eso vive en el diff y en el informe de `pre-merge`.

## 2. Estado del proyecto

Dos o tres líneas: dónde quedó el trabajo, en qué rama, qué PR abierto.

## 3. Qué probar

El link del preview (si el proyecto tiene uno) y **qué tocar**, en
imperativo. No es la lista de todo lo que no se pudo automatizar: es lo que
hay que abrir y mirar.

Si un caso necesita una receta para reproducirse — un estado previo, una
fecha concreta, un valor editado a mano — va la receta. Sin eso el caso no
se prueba y la sección miente.

**Una línea al final si hay una herramienta que le sacaría trabajo de
encima** — un MCP, un plugin, un navegador, un servicio —, diciendo siempre
**qué mejora o qué pasaría a cubrir**. Una herramienta sin eso es una
recomendación que no se puede evaluar. Solo cuando convierte una prueba
manual en automática: no es un repaso de herramientas en cada informe.

## 4. Decidí vos

Las decisiones que no tienen respuesta técnica correcta: dos
comportamientos que funcionan igual y hay que elegir uno. Sección propia y
no una línea dentro de la siguiente, porque es lo único del informe que
nadie más puede contestar — mezclada con "¿mergeo?" se pierde, y entonces
el proyecto se construye con el default que elegí yo.

Va la pregunta con las dos opciones y qué cuesta cada una. No el
razonamiento completo.

## 5. Siguiente ejecución

Qué sigue, y qué trámite hace falta de él para arrancarlo: el sí para
mergear (`rules/git-workflow.md`) o una credencial que solo el usuario
tiene.

## Lo que no va

- Tablas de capas, conteos de tests, tiempos, resultados de audit.
- Hallazgos ya arreglados, con o sin su porqué.
- El informe de `pre-merge` reenviado. Ese informe es para esta sesión, que
  es la que decide qué hacer con él; al usuario llega el destilado.
- El razonamiento de una decisión ya tomada. Si es discutible, entonces es
  una decisión de diseño y va en la sección 4 como pregunta.
