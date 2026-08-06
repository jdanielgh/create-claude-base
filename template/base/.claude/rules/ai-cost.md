# ai-cost

Aplica a cualquier ejecución que gaste saldo real de una API de IA, sin
importar cuán chica parezca la corrida. Borra este archivo si el proyecto
no consume ninguna.

1. **Nunca en tests automatizados ni en CI.** El acceso al modelo va detrás
   de una abstracción justamente para esto: los tests usan un fake
   determinista. Un `push` no debe generar gasto por sí solo. Si algo tiene
   que validarse contra la API real, es un smoke test manual y explícito,
   fuera de la verificación estándar.
2. **Costo estimado antes de correr.** Declarar modelo, cantidad de
   llamadas y estimación en USD — aunque sea de orden de magnitud — y
   esperar confirmación explícita. Nunca gastar saldo sin ese OK previo.
3. **Verificación doble antes de la corrida real**, no una pasada:
   - Verificación del proyecto en verde, todo con fakes.
   - Un smoke test controlado contra la API real, con datos inventados, que
     cubra los casos borde que rompen el parseo: salida vacía, JSON
     inválido, respuesta truncada por límite de longitud.
   - Repetir la revisión una segunda vez, de forma independiente. "Ya lo
     revisé una vez" no alcanza para algo que cuesta dinero y no es
     trivialmente reversible.
4. **Idempotencia obligatoria.** Una corrida interrumpida o repetida nunca
   debe reprocesar lo ya completado con éxito. Verificarlo explícitamente
   antes, no asumirlo: es lo único que evita pagar dos veces si algo falla
   a la mitad.
5. **Después de la corrida**, registrar el costo real observado, no solo el
   estimado. Es lo que calibra las estimaciones siguientes.
