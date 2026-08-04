#!/usr/bin/env python3
"""Reconstruye y divide el banco público aportado para OpposTest."""

from __future__ import annotations

import base64
import gzip
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / ".bank-source-v2"
OUTPUT_DIR = ROOT / "banks"

SPECS = (
    ("gobcan-a1-ti-2026.json", "gobcan-a1-ti-l26-2026", "Gobierno de Canarias A1 TI — primer ejercicio 2026", "Primer ejercicio tipo test del Cuerpo Facultativo Superior, especialidad de Tecnología de la Información (L26): 80 preguntas ordinarias y 6 de reserva.", "gobcan-a1-ti-l26-2026-", 86),
    ("gobcan-a2-ti-2026.json", "gobcan-a2-tinl26-2026", "Gobierno de Canarias A2 TI — primer ejercicio 2026", "Primer ejercicio tipo test del Cuerpo Facultativo Técnico de Grado Medio, especialidad de Tecnologías de la Información (A2TINL26): 80 preguntas ordinarias y 6 de reserva.", "gobcan-a2-tinl26-", 86),
    ("scs-a1-informatica-estabilizacion-2022.json", "scs-a1-informatica-estabilizacion-2022", "SCS A1 Informática — estabilización 2022", "Repertorio definitivo de 600 preguntas de Técnico/a Titulado/a Superior en Informática del Servicio Canario de la Salud.", "scs-a1-informatica-estabilizacion-2022-", 600),
    ("scs-a2-informatica-estabilizacion-2022.json", "scs-ttm-informatica-estabilizacion-2022", "SCS Técnico Titulado Medio Informática — estabilización 2022", "Repertorio definitivo de 540 preguntas de Técnico/a Titulado/a Medio en Informática del Servicio Canario de la Salud.", "scs-tecnico-titulado-medio-estabilizacion-2022-", 540),
)


def load_source() -> dict:
    parts = sorted(SOURCE_DIR.glob("chunk-*"))
    if not parts:
        raise RuntimeError("No se encontraron fragmentos del banco fuente.")
    encoded = "".join(part.read_text(encoding="ascii").strip() for part in parts)
    return json.loads(gzip.decompress(base64.b64decode(encoded)).decode("utf-8"))


def topics_for_questions(all_topics: list[dict], questions: list[dict]) -> list[dict]:
    topic_map = {topic["id"]: topic for topic in all_topics}
    used = {topic_id for question in questions for topic_id in question.get("topic_ids", [])}
    pending = list(used)
    while pending:
        parent_id = topic_map.get(pending.pop(), {}).get("parent_id")
        if parent_id and parent_id not in used:
            used.add(parent_id)
            pending.append(parent_id)
    missing = sorted(used.difference(topic_map))
    if missing:
        raise RuntimeError(f"Temas inexistentes: {', '.join(missing)}")
    return [topic for topic in all_topics if topic["id"] in used]


def main() -> None:
    source = load_source()
    if source.get("schema_version") != 1:
        raise RuntimeError("El banco fuente no usa schema_version 1.")
    OUTPUT_DIR.mkdir(exist_ok=True)
    generated_at = source.get("bank", {}).get("generated_at")
    total = 0

    for filename, bank_id, name, description, prefix, expected in SPECS:
        questions = [q for q in source["questions"] if q.get("id", "").startswith(prefix)]
        if len(questions) != expected:
            raise RuntimeError(f"{filename}: se esperaban {expected} preguntas y se encontraron {len(questions)}.")
        ids = [question["id"] for question in questions]
        if len(ids) != len(set(ids)):
            raise RuntimeError(f"{filename}: contiene identificadores duplicados.")
        topics = topics_for_questions(source["topics"], questions)
        payload = {
            "schema_version": 1,
            "bank": {"id": bank_id, "name": name, "description": description, "generated_at": generated_at},
            "topics": topics,
            "questions": questions,
        }
        (OUTPUT_DIR / filename).write_text(
            json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        total += len(questions)
        print(f"{filename}: {len(questions)} preguntas, {len(topics)} temas")

    if total != 1312:
        raise RuntimeError(f"Se esperaban 1312 preguntas y se generaron {total}.")
    print("Bancos públicos generados correctamente: 1312 preguntas.")


if __name__ == "__main__":
    main()
