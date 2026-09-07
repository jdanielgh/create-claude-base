# agents-and-context

## Elección de modelo

- **Haiku** para lo mecánico y repetitivo (`ops-runner`): correr scripts,
  leer logs, verificar salidas. No requiere juicio.
- **Sonnet** para desarrollo normal. Es el default.
- **Opus** para decisiones de arquitectura puntuales y para `pre-merge`.
  Escalar a mano dentro del subagente correspondiente, no para toda la
  sesión.

`pre-merge` es la única excepción permanente al default de Sonnet. Es el
agente que decide si un hallazgo es real, si un arreglo lo resuelve de
verdad y si el desarrollo está listo para que alguien le dedique tiempo a
probarlo a mano. Ahí el juicio del modelo es el producto, no un detalle —
y una revisión que deja pasar el bug cuesta más que la diferencia de
precio.

## Qué delegar a un subagente

Delega cuando la salida sea **ruidosa y desechable**: corridas de scripts,
logs largos, búsquedas amplias, verificaciones de integridad. El subagente
consume ese ruido en su propio contexto y devuelve la conclusión.

No delegues cuando necesites el detalle en la sesión principal para seguir
razonando. Un subagente arranca en frío: si tiene que re-derivar todo lo
que ya sabes, sale más caro que hacerlo directo.

**La excepción es revisar código, y ahí el arranque en frío es la
ventaja.** La sesión que escribió el cambio es la peor jueza de ese
cambio: ya se convenció de que funciona. Un diff es contexto
autocontenido —no hay nada que re-derivar—, y la salida (verificación
completa, audit de dependencias) es exactamente el ruido desechable que
esta regla manda delegar. Por eso `pre-merge` es un subagente y no un paso
de la sesión principal.

## Higiene de contexto

1. Nunca pegar dumps grandes en el chat: exports completos, tablas enteras,
   logs de miles de líneas. Ni para depurar.
2. Leer solo el fragmento del archivo que hace falta cuando ya sabes dónde
   está.
3. Cada regla, skill y MCP activo se paga en cada turno. Poda lo que no se
   use en vez de acumularlo por si acaso.
4. Antes de que una compactación corte el hilo, usa `/checkpoint` para
   dejar registrado lo decidido. El hook automático solo deja un marcador
   mecánico: no interpreta nada.
