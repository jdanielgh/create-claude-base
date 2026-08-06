# api-design

1. El contrato se diseña antes que la implementación, y se escribe. Un
   endpoint que se descubre leyendo el controlador no es una API.
2. Toda entrada se valida en el borde, con un esquema, antes de llegar al
   dominio. Nunca confíes en que el cliente mande lo que dijo que mandaría.
3. Errores con forma consistente: código estable que el cliente pueda
   ramificar, mensaje legible para humanos, y nunca detalles internos
   (stack traces, SQL, nombres de tabla) hacia afuera.
4. Códigos HTTP correctos. `200` con `{"error": ...}` dentro obliga a todo
   cliente a parsear el cuerpo para saber si funcionó.
5. Las operaciones que crean o cobran son idempotentes, con clave de
   idempotencia. Los reintentos existen y van a ocurrir.
6. Paginación desde el primer día en cualquier colección que pueda crecer.
   Retrofitearla después rompe a todos los clientes a la vez.
7. Cambios incompatibles = versión nueva. Nunca cambiar el significado de
   un campo existente.
8. Nada de secretos ni datos personales en URLs o query strings: quedan en
   logs de acceso y en el historial del navegador.

## Base de datos

1. Toda migración tiene su reverso escrito y probado antes de aplicarse.
2. Una migración que reescribe una tabla grande se planifica aparte — puede
   bloquearla en producción.
3. Índices para los patrones de consulta reales, verificados con el plan de
   ejecución, no por intuición.
4. Las transacciones abarcan la unidad de trabajo completa. Una operación
   de varios pasos que falla a la mitad y deja estado parcial es peor que
   una que falla entera.
