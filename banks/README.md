# Bancos públicos para OpposTest

Este directorio contiene bancos JSON compatibles con **OpposTest**. Los archivos incluyen únicamente metadatos, temas, preguntas y respuestas; no contienen historial, progreso, favoritas ni configuración personal.

## Catálogo

| Banco | Preguntas | Descarga |
|---|---:|---|
| Gobierno de Canarias A1 TI — primer ejercicio 2026 | 86 (80 ordinarias + 6 de reserva) | [Descargar JSON](https://raw.githubusercontent.com/mundoinformaticacanaria/OpposTest/main/banks/gobcan-a1-ti-2026.json) |
| Gobierno de Canarias A2 TI — primer ejercicio 2026 | 86 (80 ordinarias + 6 de reserva) | [Descargar JSON](https://raw.githubusercontent.com/mundoinformaticacanaria/OpposTest/main/banks/gobcan-a2-ti-2026.json) |
| SCS A1 Informática — estabilización 2022 | 600 | [Descargar JSON](https://raw.githubusercontent.com/mundoinformaticacanaria/OpposTest/main/banks/scs-a1-informatica-estabilizacion-2022.json) |
| SCS Técnico Titulado Medio Informática — estabilización 2022 | 540 | [Descargar JSON](https://raw.githubusercontent.com/mundoinformaticacanaria/OpposTest/main/banks/scs-a2-informatica-estabilizacion-2022.json) |

**Total publicado: 1.312 preguntas.**

## Cómo importar un banco

1. Descarga el archivo JSON correspondiente.
2. Abre [OpposTest](https://mundoinformaticacanaria.github.io/OpposTest/).
3. Entra en **Datos**.
4. En **Carga de datos**, pulsa **Elegir archivo**.
5. Selecciona **Importar banco de preguntas**.
6. Elige el JSON descargado.

La importación añade las preguntas al contenido existente. Los identificadores que ya estén presentes se omiten para evitar duplicados.

## Validación

Los cuatro bancos:

- utilizan `schema_version: 1`;
- pasan el validador de OpposTest;
- no contienen identificadores duplicados;
- no contienen referencias a temas inexistentes;
- no incluyen datos personales de estudio.

## Fuentes y responsabilidad

Cada pregunta conserva en su campo `source` la referencia disponible al organismo, ejercicio y documento de origen. Estos bancos son material de apoyo para el estudio y no sustituyen a las publicaciones oficiales. Ante cualquier discrepancia, prevalece siempre la documentación oficial del proceso selectivo.

## Autor del proyecto

OpposTest ha sido diseñado y desarrollado por **Xerach Hernández Quesada**.

- [LinkedIn](https://www.linkedin.com/in/xerach-hernandez-quesada/)
- [GitHub](https://github.com/mundoinformaticacanaria)
