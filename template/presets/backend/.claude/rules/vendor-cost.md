# vendor-cost

Aplica a cualquier servicio externo (hosting, base de datos gestionada,
storage, mensajería, auth) que este proyecto use bajo un plan gratuito.
Duplica este archivo con el nombre del proveedor (`cloudflare-cost.md`,
`supabase-cost.md`, `aws-cost.md`, ...) si hay más de uno con límites
propios — no mezcles varios proveedores en el mismo archivo, cada uno tiene
su propio techo y su propia letra chica. Borra este archivo si el proyecto
no depende de ningún tier gratuito.

<!-- Completa antes de la primera sesión larga: qué proveedor y qué
     servicios del alcance actual corren bajo el plan gratuito. -->
**Proveedor:** _(nombre)_. **Servicios en uso bajo el tier gratuito:**
_(lista)_.

1. **Solo tier gratuito.** Ningún servicio, add-on ni configuración que
   dependa de un plan pago se activa sin autorización explícita del
   usuario.
2. **Antes de crear o modificar cualquier recurso** (instancia, bucket,
   función, dominio, tabla, índice) verificar que la operación entra en el
   límite del tier gratuito — no asumirlo. Si la documentación o la
   respuesta de la API no lo deja claro, se pregunta al usuario antes de
   ejecutar.
3. **Nunca activar por default** algo que el proveedor ofrezca como "prueba
   gratis" con cobro automático al vencer, ni servicios de facturación por
   uso ("pay as you go"), aunque el MCP o el dashboard lo sugieran como
   opción por defecto.
4. **Sin método de pago en la cuenta, si el proveedor lo permite.** Es lo
   que convierte pasarse de un límite en una restricción en vez de en un
   cobro. Si el proveedor exige tarjeta incluso para el tier gratuito,
   extremar el punto 2.
5. **Los límites del tier gratuito son parte del diseño, no un obstáculo a
   evitar con un upgrade.** Si una feature pedida no entra, se avisa el
   límite y se ofrecen alternativas dentro del tier gratuito antes de
   sugerir pagar.
6. Cualquier cambio hecho vía el MCP del proveedor cuenta igual que si se
   hiciera a mano en el dashboard — el MCP no es una excepción a esta
   regla.

## El techo, en números

<!-- Tabla con los límites reales del tier gratuito y qué tan cerca está el
     proyecto de cada uno. Verificalo contra la documentación oficial del
     proveedor, con fecha de verificación, no de memoria — los límites
     cambian sin aviso. -->

| Límite | Cuánto | Qué tan cerca estamos |
| --- | --- | --- |
| _(ej. tamaño de base, egress, usuarios activos, conexiones concurrentes)_ | | |

### Las que hay que mirar de verdad

_(De la tabla de arriba, cuáles son las que realmente pueden tocarse con el
uso esperado del proyecto — no todas importan igual. Nombralas y por qué:
qué patrón de uso las quema, no solo el número del límite.)_

## Qué hacer si algo no entra

En orden: reducir el alcance o la frecuencia de la operación → usar una
alternativa local o de menor costo para desarrollo → acotar el alcance de
la feature → avisar el límite al usuario con la alternativa concreta.
Pagar no está en la lista sin un sí explícito.
