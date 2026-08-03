# Conversor de bancos OpposTest

Este directorio contiene el procedimiento reproducible para transformar exámenes oficiales en bancos JSON de OpposTest.

## GPT personalizado

Se puede utilizar **OpposTest Bank Builder** para convertir exámenes tipo test y sus respuestas oficiales en bancos JSON compatibles con OpposTest, o para revisar bancos ya creados:

https://chatgpt.com/g/g-6a706edefe4c81918051bb82d7789b27-oppostest-bank-builder

El GPT debe recibir siempre una fuente oficial de respuestas. Cuando se use para validar documentalmente un banco, también debe aportarse el cuestionario oficial correspondiente.

## Limitación de respuestas visuales en PDF

Según el entorno y el plan desde el que se utilice el GPT, un PDF puede procesarse principalmente como texto. En ese caso, el texto extraído no conserva resaltados, subrayados, colores, círculos ni otras marcas visuales que indiquen la respuesta correcta.

Por tanto:

- un PDF con respuestas indicadas únicamente mediante marcas visuales solo permite generar un banco definitivo cuando todas esas marcas pueden comprobarse de forma inequívoca;
- haber renderizado o revisado algunas páginas no acredita la validación visual del documento completo;
- la fuente preferente es una plantilla oficial textual, por ejemplo `1-B, 2-A, 3-D`;
- también pueden utilizarse imágenes PNG/JPG legibles o un PDF cuyo contenido visual completo sea accesible;
- cuando no puedan verificarse todas las respuestas, el GPT debe detener la generación del banco definitivo y explicar la limitación, sin deducir respuestas.

## Archivos

- `PROMPT_CONVERSOR_OPPOSTEST.md`: instrucciones completas del procedimiento.
- `CHECKLIST_VALIDACION_BANCOS.md`: controles documentales, técnicos y funcionales.
- `taxonomia-base.json`: catálogo de identificadores temáticos ya utilizados. Evita crear nombres incompatibles entre bancos.

## Flujo

1. Aportar el cuestionario y una fuente oficial de respuestas.
2. Confirmar que las respuestas son accesibles como texto o pueden verificarse visualmente en su totalidad.
3. Ejecutar el prompt o utilizar OpposTest Bank Builder.
4. Revisar el informe de validación.
5. Validar el JSON con OpposTest.
6. Importar y hacer una prueba funcional.
7. Mantener los bancos reales fuera del repositorio público.

## Estado

El procedimiento y el GPT personalizado han sido probados con exámenes oficiales de distintos formatos. Los bancos generados deben seguir revisándose documentalmente y probarse mediante una importación real antes de considerarlos definitivos.
