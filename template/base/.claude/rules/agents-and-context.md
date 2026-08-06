# agents-and-context

## Elección de modelo

- **Haiku** para lo mecánico y repetitivo (`ops-runner`): correr scripts,
  leer logs, verificar salidas. No requiere juicio.
- **Sonnet** para desarrollo normal. Es el default.
- **Opus** solo para decisiones de arquitectura puntuales. Escalar a mano
  dentro del subagente correspondiente, no para toda la sesión.

## Qué delegar a un subagente

Delega cuando la salida sea **ruidosa y desechable**: corridas de scripts,
logs largos, búsquedas amplias, verificaciones de integridad. El subagente
consume ese ruido en su propio contexto y devuelve la conclusión.

No delegues cuando necesites el detalle en la sesión principal para seguir
razonando. Un subagente arranca en frío: si tiene que re-derivar todo lo
que ya sabes, sale más caro que hacerlo directo.

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
