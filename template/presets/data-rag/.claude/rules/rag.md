# rag

1. **Los datos crudos nunca se pegan en el contexto del chat**, ni para
   depurar. Toda recuperación pasa por el código de búsqueda. Para fixtures
   de prueba, datos inventados.
2. La búsqueda semántica **complementa** a la exacta, no la sustituye. Si
   el usuario pide algo que se resuelve con un filtro determinista (fecha,
   identificador, participante), se resuelve con el filtro.
3. Los embeddings son regenerables por definición; los registros de origen
   no. Cambiar de modelo de embeddings implica regenerar el índice, nunca
   tocar los datos originales.
4. Toda respuesta generada a partir de recuperación cita de dónde salió.
   Una afirmación sin referencia al registro que la respalda no se entrega.
5. Si la recuperación devuelve contexto irrelevante, el diagnóstico va en
   este orden: ¿los datos entraron bien? → ¿el chunking parte por unidades
   con sentido? → ¿el modelo de embeddings es adecuado? → recién entonces,
   top-k. Subir el top-k para tapar un problema de ingesta empeora el
   resultado y el costo.
6. Límite explícito de elementos en contexto. Un top-k que crece "por si
   acaso" diluye la señal y sube el gasto en cada consulta.
7. Cualquier corrida de embeddings sobre datos reales sigue
   `rules/ai-cost.md` completo — sobre todo la idempotencia: reprocesar lo
   ya indexado es pagar dos veces por lo mismo.
