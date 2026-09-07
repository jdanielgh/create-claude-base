# dependency-audit

Política para vulnerabilidades de dependencias: qué bloquea, qué no, y la
escalera de qué intentar cuando el arreglo automático no alcanza. Cómo se
ejecuta (comandos concretos, cuándo corre) vive en `agents/pre-merge.md` —
ese es el único lugar donde se corre, así que la mecánica no se repite acá.

## Qué peso tiene cada dependencia

No todas llegan al usuario final, y tratarlas igual genera ruido que
termina haciendo que se ignore la que importa.

- **Dependencias de producción** — corren en el cliente o en el servidor
  que atiende tráfico real. Una high o critical acá **bloquea** hasta
  resolverse o documentarse como excepción.
- **Dependencias de la cadena de build** (bundler, transpilador, framework
  de build, generador de tipos): no se despliegan, pero **su salida sí**.
  Una vulnerabilidad ahí es riesgo de cadena de suministro. Se reporta con
  el mismo peso que una de producción, pero no bloquea sola.
- **Dependencias de test y lint**: no producen nada que se despliegue. Se
  reportan y nunca bloquean.

## Arreglo automático

El arreglo automático del gestor de paquetes (`npm audit fix` o el
equivalente) **sin flags que fuercen major** está permitido: se queda
dentro de los rangos semver ya declarados, así que no mete cambios mayores
por su cuenta. La variante que fuerza versiones (`--force` en npm) está
prohibida — hace bumps que rompen compatibilidad sin avisar, y un lockfile
reescrito a ciegas es exactamente el tipo de cambio que nadie revisa.

Semver es una promesa, no una garantía: **todo arreglo automático se valida
corriendo la verificación completa**, y va en su propio commit para poder
revertirse solo, sin arrastrar el desarrollo que lo acompaña.

Si después del arreglo alguna capa queda en rojo, se revierte el lockfile y
la vulnerabilidad pasa a tratarse como no resuelta. Nunca se deja una rama
rota por perseguir un advisory.

## Escalera para una high de producción que el arreglo automático no resuelve

En orden. Se baja al siguiente paso solo si el anterior no aplica.

1. **¿Es alcanzable desde una entrada real del proyecto?** Es la pregunta
   que resuelve la mayoría de los casos, y hay que contestarla con el
   advisory en la mano, no por intuición. Enumerá las superficies de
   entrada reales del proyecto — qué recibe datos de fuera: archivos
   subidos, parámetros de URL, respuestas de APIs de terceros, campos de
   texto libre, colas de mensajes — y verificá si el código vulnerable
   está en el camino de alguna. Si no hay camino, no bloquea: se registra
   con el motivo.
2. **¿Existe la versión parcheada aguas arriba, pero el paquete padre no la
   tomó todavía?** Entonces un override de resolución (`overrides` en
   `package.json`, o el mecanismo equivalente del gestor de paquetes),
   apuntando solo a esa dependencia transitiva. Es el escape que evita
   forzar versiones a ciegas. Se valida con la verificación completa y se
   documenta por qué está.
3. **¿El arreglo exige un bump mayor?** Va en **PR propio**, con las
   breaking changes listadas. No se cuela dentro del PR de una feature: son
   dos intenciones (`rules/git-workflow.md`).
4. **¿Se puede mitigar en el código del proyecto?** Si la vía es una
   entrada externa concreta, endurecer la validación antes de pasarla a la
   librería suele cerrar el camino más rápido y más barato que perseguir
   una versión.
5. **¿Se puede reemplazar o sacar la dependencia?** A veces es la respuesta
   honesta.
6. **Si nada de lo anterior aplica**, bloquea. Seguir adelante es una
   decisión explícita del usuario, no un default.

## Registro de excepciones

Toda high o critical de producción que quede sin arreglar va a un registro
de excepciones del proyecto (por ejemplo `docs/security-exceptions.md`),
**con fecha de revisión**. Una excepción sin fecha no es una excepción: es
silencio permanente, y a los tres meses nadie recuerda por qué está ahí.
