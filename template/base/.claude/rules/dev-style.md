# dev-style

1. Archivos pequeños, un módulo = una responsabilidad. Si un archivo hace
   dos cosas, el siguiente cambio va a tocar las dos.
2. Sin `console.log` de depuración en el código productivo. Si hace falta
   observabilidad, es logging estructurado, no un `print` olvidado.
3. Nomenclatura consistente con el vocabulario del dominio, no con el de la
   librería de turno. Evita nombres vacíos: `data`, `info`, `result`,
   `item`, `object`, `handle`, `process`, `manager`.
4. **Test obligatorio donde un fallo sería silencioso** — es decir, donde el
   sistema seguiría corriendo pero con estado corrupto o contexto falso:
   parsers de entrada externa, código que escribe registros que no se
   pueden reescribir, y cualquier consulta cuyo resultado alimente una
   decisión automática. El resto, validación manual: cobertura por
   cobertura no es el objetivo.
5. Código que interactúa con una base de datos se prueba contra una base
   real efímera, no solo con fakes. El riesgo específico ahí es la
   interacción con SQL, y un fake no la reproduce.
6. Escribe código que se lea como el que ya está alrededor: misma densidad
   de comentarios, mismos nombres, mismos modismos. La consistencia vale
   más que tu preferencia personal.
7. Un comentario explica **por qué**, no qué. El qué ya está en el código.

## Cuándo no refactorizar

Si el cambio pedido es de tres líneas, entrega tres líneas. Aprovechar un
fix para reordenar el módulo entero mezcla dos revisiones en un diff y hace
imposible saber cuál rompió qué.
