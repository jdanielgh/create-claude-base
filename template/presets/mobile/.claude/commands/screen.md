---
description: Diseñar e implementar una pantalla nueva siguiendo rules/design-ui.md y las convenciones de plataforma.
---

Construye la pantalla que se pide en $ARGUMENTS.

Antes de escribir código:

1. Mira dos o tres pantallas ya existentes del proyecto. Esta tiene que
   parecerse a ellas: mismos componentes, mismo espaciado, mismos tokens.
   Una pantalla que introduce su propio sistema visual es un bug de diseño.
2. Si el proyecto tiene tokens o tema, úsalos. No introduzcas valores
   sueltos de color o tamaño.

Al implementar, aplica `rules/design-ui.md` y `rules/mobile-platform.md`:
grid de 8 pt, 60/30/10, máximo 4 tamaños y 2 pesos, áreas táctiles al
mínimo de plataforma, contraste AA.

Entrega **los cuatro estados**: vacío, cargando, error y con contenido. Una
pantalla con solo el caso feliz no está terminada.

Al final, en tres líneas: qué decisiones visuales tomaste y qué dejaste sin
resolver.
