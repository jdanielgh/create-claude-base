# mobile-platform

Reglas de plataforma que no son estética y que se rompen sin darse cuenta.

## Accesibilidad

1. Todo control interactivo tiene etiqueta accesible. Un botón que solo
   contiene un icono es invisible para un lector de pantalla sin ella.
2. La app funciona con el tamaño de fuente del sistema al máximo. Layouts
   con alturas fijas en píxeles se rompen ahí: usa alturas que crezcan.
3. El color nunca es el único portador de información. Error = color +
   icono + texto.
4. Respeta la preferencia de movimiento reducido del sistema.

## Rendimiento

1. Listas largas siempre virtualizadas. Renderizar 500 filas para mostrar 8
   es la causa más común de scroll con tirones.
2. Imágenes dimensionadas y cacheadas, nunca a resolución completa dentro
   de una miniatura.
3. Trabajo pesado fuera del hilo de UI.
4. Mide antes de optimizar. Una impresión de lentitud sin traza es una
   conjetura.

## Estado y red

1. Asume que la red falla. Toda llamada tiene su estado de error visible,
   no un spinner infinito.
2. Nada de credenciales ni tokens en almacenamiento sin cifrar: van al
   llavero seguro de la plataforma.
3. El estado que sobrevive a cerrar la app se declara explícitamente. Lo
   demás se pierde y está bien.

## Antes de tocar el layout de navegación

Cambiar la estructura de navegación toca todas las pantallas. Usa el
subagente `planner` primero.
