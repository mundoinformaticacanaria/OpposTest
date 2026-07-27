# Formato JSON de bancos

El formato de intercambio es JSON y está versionado mediante `schema_version`.

## Ejemplo mínimo

```json
{
  "schema_version": 1,
  "bank": {
    "id": "demo",
    "name": "Banco de demostración"
  },
  "topics": [
    {
      "id": "informatica",
      "name": "Informática",
      "parent_id": null
    }
  ],
  "questions": [
    {
      "id": "demo-001",
      "statement": "Enunciado de la pregunta",
      "options": [
        { "id": "A", "text": "Primera opción" },
        { "id": "B", "text": "Segunda opción" }
      ],
      "correct_option_id": "A",
      "topic_ids": ["informatica"],
      "is_annulled": false
    }
  ]
}
```

## Identificadores

Para preguntas oficiales se recomienda:

```text
organismo-año-examen-número
```

Ejemplos:

```text
age-2025-a1-001
scs-2012-a1-073
cabildo-gc-2022-a2-041
```

Para preguntas manuales:

```text
manual-2026-000001
```

## Duplicados en el MVP

Si el identificador ya existe:

- se conserva la pregunta existente;
- se omite la importada;
- se incluye en el resumen como duplicada;
- no se comparan ni fusionan contenidos.

## Rechazos

Una pregunta se rechaza cuando:

- carece de identificador o enunciado;
- tiene menos de dos opciones;
- repite identificadores de opción;
- la respuesta correcta no corresponde con una opción;
- no tiene temas;
- referencia temas inexistentes;
- está anulada.
