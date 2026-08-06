# design-ui

Criterio visual por defecto de {{PROJECT_NAME}}: **moderno y minimalista**.

Estas reglas son el piso. El detalle fino (paletas concretas, pares
tipográficos, presets de motion) viene de las skills instaladas —
`ui-ux-pro-max`, `minimalist-ui`, `mobile-app-ui-design`. Este archivo
existe para que el criterio aplique aunque la skill no se dispare.

## Lo que no se hace

El look genérico de interfaz generada por IA, que hay que evitar
activamente porque es el default hacia el que se cae solo:

- Inter en todo, gradiente morado sobre blanco, cards con esquinas muy
  redondeadas y sombra difusa.
- Gradientes decorativos que no comunican nada.
- Sombras pesadas para simular profundidad. Si necesitas jerarquía, úsala
  con espacio y contraste tipográfico, no con blur.
- Emojis como iconos de interfaz.
- Animaciones que retrasan al usuario. Si el movimiento no comunica un
  cambio de estado, sobra.
- Glassmorphism, neumorphism y cualquier efecto que se lea como decoración
  aplicada encima en vez de estructura.

## Lo que sí

**Espaciado.** Grid de 8 pt. Todo margen, padding y alto de componente es
múltiplo de 8 (4 solo para ajustes ópticos dentro de un componente). El
espacio en blanco es la herramienta principal de jerarquía, no un sobrante.

**Color.** Regla 60/30/10: 60% neutro de fondo, 30% superficie secundaria,
10% acento. Un solo acento. Paleta monocroma cálida por defecto; el color
se reserva para estado (éxito, error, advertencia) y para la acción
principal. Un elemento coloreado en una pantalla neutra manda la atención
sin ningún otro recurso.

**Tipografía.** Máximo 4 tamaños y 2 pesos en toda la app. La jerarquía se
construye con contraste de tamaño y peso, no con siete escalones de gris.
Cuerpo mínimo 16 pt/sp — por debajo de eso es inaccesible en un teléfono,
no "compacto".

**Contraste (WCAG AA, no negociable).** Texto normal 4.5:1, texto grande
3:1, elementos de interfaz 3:1. Verificar contra el fondo real, no contra
blanco puro asumido.

**Iconografía.** Un solo set, un solo grosor de trazo, un solo tamaño base.
Mezclar sets es lo que más rápido delata una interfaz sin criterio.

## Móvil específicamente

- **Áreas táctiles:** mínimo 44×44 pt en iOS, 48×48 dp en Android. Vale
  para el área tocable, que puede ser mayor que el icono visible.
- **Thumb zone:** las acciones frecuentes van en el tercio inferior. Lo
  destructivo, deliberadamente lejos del pulgar.
- **Elegir antes que escribir.** Cada campo de texto en un móvil es
  fricción: si las opciones son finitas, es un selector.
- **Estados, siempre los cuatro:** vacío, cargando, error y con contenido.
  Una pantalla diseñada solo para el caso con datos se rompe el primer día
  en producción.
- **Convenciones nativas, no un diseño único calcado en las dos
  plataformas.** iOS: volver arriba a la izquierda, acción arriba a la
  derecha, tabs abajo. Android: volver arriba a la izquierda, menú arriba a
  la derecha, FAB abajo a la derecha.

## Antes de dar una pantalla por terminada

1. ¿Se lee la jerarquía entrecerrando los ojos? Si todo pesa igual, no hay
   diseño.
2. ¿Contraste AA verificado, no supuesto?
3. ¿Están los cuatro estados?
4. ¿Áreas táctiles al mínimo de plataforma?
5. ¿Se puede quitar algo sin perder función? Si sí, quítalo.
