# design-ui

Criterio visual por defecto de {{PROJECT_NAME}}: **moderno y minimalista**.

Estas reglas son el piso. El detalle fino (paletas, pares tipográficos,
motion) viene de las skills instaladas — `ui-ux-pro-max`, `minimalist-ui`,
`impeccable`. Este archivo existe para que el criterio aplique aunque la
skill no se dispare.

## Lo que no se hace

El look genérico de interfaz generada por IA, que hay que evitar
activamente porque es el default hacia el que se cae solo:

- Inter en todo, gradiente morado sobre blanco, cards muy redondeadas con
  sombra difusa.
- Gradientes decorativos que no comunican nada.
- Sombras pesadas para simular profundidad. La jerarquía se construye con
  espacio y contraste tipográfico.
- Emojis como iconos de interfaz.
- Animaciones que retrasan al usuario. Si el movimiento no comunica un
  cambio de estado, sobra.
- Glassmorphism, neumorphism y cualquier efecto que se lea como decoración
  encima en vez de estructura.

## Lo que sí

**Espaciado.** Escala de 8 px, siempre múltiplos (4 solo para ajustes
ópticos internos). El espacio en blanco es jerarquía, no sobrante.

**Color.** 60/30/10: 60% neutro de fondo, 30% superficie secundaria, 10%
acento. Un solo acento. Monocromo cálido por defecto; el color se reserva
para estado y para la acción principal.

**Tipografía.** Máximo 4 tamaños y 2 pesos. Ancho de línea entre 45 y 75
caracteres en texto largo. Cuerpo mínimo 16 px.

**Contraste (WCAG AA).** Texto normal 4.5:1, texto grande 3:1, controles
3:1. Verificado contra el fondo real, no supuesto.

**Iconografía.** Un set, un grosor, un tamaño base.

## Web específicamente

- **Responsive de verdad:** unidades relativas, grid/flex, `max-width:100%`
  en imágenes. El contenido ancho (tablas, bloques de código, diagramas)
  scrollea dentro de su propio contenedor — el `body` nunca scrollea en
  horizontal.
- **Tema claro y oscuro.** `prefers-color-scheme` como señal, más un
  override explícito si hay selector propio, y que el override gane en
  ambas direcciones.
- **Teclado.** Todo lo que se puede hacer con el ratón se puede hacer con
  teclado, con foco visible. Orden de tabulación que siga el orden visual.
- **Estados, los cuatro:** vacío, cargando, error y con contenido.
- **Sin saltos de layout.** Reserva el espacio de imágenes y contenido
  asíncrono antes de que llegue.

## Antes de dar una vista por terminada

1. ¿Se lee la jerarquía entrecerrando los ojos?
2. ¿Contraste AA verificado, no supuesto?
3. ¿Funciona en 375 px de ancho y en tema oscuro?
4. ¿Navegable solo con teclado?
5. ¿Se puede quitar algo sin perder función? Si sí, quítalo.
