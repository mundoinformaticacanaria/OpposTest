# Modelo de datos

## Entidades importadas

### Topic

- `id`: identificador estable.
- `name`: nombre visible.
- `parent_id`: identificador del tema padre o `null`.

### Question

- `id`: identificador estable y único.
- `statement`: enunciado.
- `options`: dos o más respuestas posibles.
- `correct_option_id`: respuesta correcta.
- `topic_ids`: uno o varios temas.
- `source`: procedencia opcional.
- `explanation`: explicación opcional.
- `legal_reference`: referencia opcional.
- `notes`: observaciones opcionales.
- `is_annulled`: pregunta anulada.

## Entidades generadas por el uso

### QuestionProgress

- `question_id`.
- `times_shown`.
- `correct_count`.
- `incorrect_count`.
- `omitted_count`.
- `last_answered_at`.
- `last_failed_at`.
- `pending_review`.
- `favorite`.

Regla de repaso:

- un fallo marca `pending_review = true`;
- un acierto en un test de falladas marca `pending_review = false`;
- el historial acumulado nunca se borra automáticamente.

### Attempt

- `id`.
- `started_at`.
- `finished_at`.
- `mode`: `normal`, `failed`, `favorites` o `repeat`.
- `topic_ids`.
- `question_ids`.
- `answers`.
- `correct`.
- `incorrect`.
- `omitted`.
- `score`.
- `penalty`.

### Settings

- número habitual de preguntas;
- penalización por fallo;
- preferencias visuales futuras.
