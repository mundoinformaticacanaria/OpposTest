# Checklist de validación de bancos OpposTest

Utilizar antes de importar un banco real y antes de dar por estable una nueva versión del conversor.

## A. Fuentes

- [ ] Se identificó el cuestionario correcto.
- [ ] Se identificó la fuente oficial de respuestas.
- [ ] Se comprobó si existe una resolución posterior de correcciones o anulaciones.
- [ ] El modelo o número de cuestionario coincide entre preguntas y respuestas.
- [ ] El número esperado de preguntas está documentado.

## B. Extracción

- [ ] Los enunciados se contrastaron con el PDF.
- [ ] Las opciones conservan su orden original.
- [ ] No se añadieron ni eliminaron opciones.
- [ ] Código, cifras, signos, unidades y referencias legales se conservaron.
- [ ] Los errores de OCR se corrigieron solo después de verificación visual.
- [ ] Las preguntas dependientes de imágenes se transcribieron fielmente o se excluyeron y documentaron.

## C. Respuestas

- [ ] Cada pregunta incluida tiene una respuesta oficial inequívoca.
- [ ] No se utilizó conocimiento propio para resolver preguntas.
- [ ] Los resaltados multilínea se asociaron a una sola opción.
- [ ] Las anuladas no aparecen en `questions`.
- [ ] Los conflictos entre fuentes se documentaron.
- [ ] `correct_option_id` existe entre las opciones.

## D. Identificadores y procedencia

- [ ] `bank.id` es estable y está en kebab-case.
- [ ] Todos los IDs de pregunta son únicos.
- [ ] Se conserva `source.question_number`.
- [ ] Se identifican las preguntas de reserva.
- [ ] Organismo, examen, año, ejercicio y documento no contienen datos inventados.

## E. Temas

- [ ] Se reutilizaron IDs canónicos cuando existían.
- [ ] Un mismo ID conserva el mismo nombre y padre.
- [ ] Todos los temas padre existen.
- [ ] Cada pregunta tiene el tema del examen y un tema sustantivo.
- [ ] Las preguntas de reserva incluyen también su tema material.
- [ ] No se crearon temas excesivamente granulares.

## F. Validación técnica

- [ ] El JSON se parsea correctamente.
- [ ] Cumple `schema_version: 1`.
- [ ] Los IDs de temas son únicos.
- [ ] Los IDs de opciones son únicos dentro de cada pregunta.
- [ ] Todas las referencias de temas existen.
- [ ] Ninguna pregunta incluida tiene `is_annulled: true`.
- [ ] Pasa `validateBank` de OpposTest con 0 errores.
- [ ] El recuento de preguntas cuadra con las exclusiones documentadas.

## G. Prueba en OpposTest

- [ ] El resumen de importación muestra el número esperado de procesadas.
- [ ] No aparecen rechazos inesperados.
- [ ] Una segunda importación detecta todos los duplicados.
- [ ] Se puede crear un test del examen completo.
- [ ] Se puede crear un test de un tema concreto.
- [ ] Las preguntas de reserva pueden filtrarse.
- [ ] Las respuestas correctas se muestran correctamente al revisar un test.

## Criterio de aceptación

El banco puede darse por válido cuando:

- no existe ningún error técnico;
- todas las respuestas proceden de una fuente oficial;
- todas las exclusiones están documentadas;
- y una prueba funcional en OpposTest no revela errores de contenido o clasificación.
