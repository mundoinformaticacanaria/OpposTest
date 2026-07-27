# Conversor de bancos OpposTest

Este directorio contiene el procedimiento reproducible para transformar exámenes oficiales en bancos JSON de OpposTest.

## Archivos

- `PROMPT_CONVERSOR_OPPOSTEST.md`: instrucciones completas para una IA o futuro GPT personalizado.
- `CHECKLIST_VALIDACION_BANCOS.md`: controles documentales, técnicos y funcionales.
- `taxonomia-base.json`: catálogo de identificadores temáticos ya utilizados. Evita crear nombres incompatibles entre bancos.

## Flujo

1. Aportar cuestionario y respuestas oficiales.
2. Ejecutar el prompt.
3. Revisar el informe de validación.
4. Validar el JSON con OpposTest.
5. Importar y hacer una prueba funcional.
6. Mantener los bancos reales fuera del repositorio público.

## Estado

El procedimiento es todavía un borrador operativo. Debe probarse con documentos de formatos distintos antes de incorporarse a un GPT personalizado.
