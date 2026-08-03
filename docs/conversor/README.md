# Conversor de bancos OpposTest

Este directorio contiene el procedimiento reproducible para transformar exámenes oficiales en bancos JSON de OpposTest.

## GPT personalizado

Se puede utilizar **OpposTest Bank Builder** para convertir exámenes tipo test y sus respuestas oficiales en bancos JSON compatibles con OpposTest, o para revisar bancos ya creados:

https://chatgpt.com/g/g-6a706edefe4c81918051bb82d7789b27-oppostest-bank-builder

El GPT debe recibir siempre una fuente oficial de respuestas. Cuando se use para validar documentalmente un banco, también debe aportarse el cuestionario oficial correspondiente.

## Archivos

- `PROMPT_CONVERSOR_OPPOSTEST.md`: instrucciones completas del procedimiento.
- `CHECKLIST_VALIDACION_BANCOS.md`: controles documentales, técnicos y funcionales.
- `taxonomia-base.json`: catálogo de identificadores temáticos ya utilizados. Evita crear nombres incompatibles entre bancos.

## Flujo

1. Aportar cuestionario y respuestas oficiales.
2. Ejecutar el prompt o utilizar OpposTest Bank Builder.
3. Revisar el informe de validación.
4. Validar el JSON con OpposTest.
5. Importar y hacer una prueba funcional.
6. Mantener los bancos reales fuera del repositorio público.

## Estado

El procedimiento y el GPT personalizado han sido probados con exámenes oficiales de distintos formatos. Los bancos generados deben seguir revisándose documentalmente y probarse mediante una importación real antes de considerarlos definitivos.
