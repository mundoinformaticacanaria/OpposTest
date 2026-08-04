#!/usr/bin/env python3
"""Reconstruye y publica los cuatro bancos públicos de OpposTest.

Este script es temporal para la issue #10. La fuente está comprimida y fragmentada
porque el conector de GitHub solo admite contenido UTF-8. Antes de procesarla se
verifica su SHA-256 para impedir que un fragmento incompleto genere bancos dañados.
"""

from __future__ import annotations

import base64
import bz2
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / ".bank-source-v3"
EXPECTED_SOURCE_SHA256 = "097b759df6c4ef7b35c5dc6d82006ee13b0677455fa7a33ccafc5d101f24559e"
EXPECTED_TOTAL = 1312

BANK_SPECS = {
    "gobcan-a1": {
        "filename": "gobcan-a1-ti-2026.json",
        "id": "gobcan-a1-ti-2026",
        "name": "Gobierno de Canarias A1 TI — primer ejercicio 2026",
        "description": "Cuestionario oficial del primer ejercicio de Tecnologías de la Información, subgrupo A1, con 80 preguntas ordinarias y 6 de reserva.",
        "expected": 86,
    },
    "gobcan-a2": {
        "filename": "gobcan-a2-ti-2026.json",
        "id": "gobcan-a2-ti-2026",
        "name": "Gobierno de Canarias A2 TI — primer ejercicio 2026",
        "description": "Cuestionario oficial del primer ejercicio de Tecnologías de la Información, subgrupo A2, con 80 preguntas ordinarias y 6 de reserva.",
        "expected": 86,
    },
    "scs-a1": {
        "filename": "scs-a1-informatica-estabilizacion-2022.json",
        "id": "scs-a1-informatica-estabilizacion-2022",
        "name": "SCS A1 Informática — estabilización 2022",
        "description": "Repertorio definitivo del proceso selectivo de Técnico/a Titulado/a Superior en Informática del Servicio Canario de la Salud.",
        "expected": 600,
    },
    "scs-a2": {
        "filename": "scs-a2-informatica-estabilizacion-2022.json",
        "id": "scs-a2-informatica-estabilizacion-2022",
        "name": "SCS Técnico Titulado Medio Informática — estabilización 2022",
        "description": "Repertorio definitivo del proceso selectivo de Técnico/a Titulado/a Medio en Informática del Servicio Canario de la Salud.",
        "expected": 540,
    },
}


def normalize(value: object) -> str:
    text = "" if value is None else str(value)
    text = text.lower().replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def question_blob(question: dict) -> str:
    return normalize(" ".join(str(question.get(key, "")) for key in ("id", "bank_id", "source", "notes", "legal_reference")))


def classify_question(question: dict) -> str | None:
    blob = question_blob(question)

    if any(token in blob for token in ("gobcan a1", "a1til26", "a1 ti 2026", "tecnicos facultativos superiores")):
        return "gobcan-a1"
    if any(token in blob for token in ("gobcan a2", "a2tinl26", "a2 ti 2026", "tecnicos facultativos de grado medio")):
        return "gobcan-a2"
    if any(token in blob for token in ("scs a1", "titulado superior informatica", "tecnico a titulado a superior en informatica")):
        return "scs-a1"
    if any(token in blob for token in ("scs a2", "ttm informatica", "titulado medio informatica", "tecnico a titulado a medio en informatica")):
        return "scs-a2"
    return None


def read_source() -> dict:
    chunks = sorted(SOURCE_DIR.glob("chunk-*"))
    expected_names = [f"chunk-{index:02d}" for index in range(14)]
    if [chunk.name for chunk in chunks] != expected_names:
        raise RuntimeError(f"Fragmentos inesperados: {[chunk.name for chunk in chunks]}")

    encoded = "".join(chunk.read_text(encoding="utf-8").strip() for chunk in chunks)
    raw = bz2.decompress(base64.b64decode(encoded, validate=True))
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_SOURCE_SHA256:
        raise RuntimeError(f"SHA-256 incorrecto: {digest}; esperado: {EXPECTED_SOURCE_SHA256}")

    payload = json.loads(raw.decode("utf-8"))
    if not isinstance(payload, dict):
        raise RuntimeError("La fuente no contiene un objeto JSON.")
    return payload


def resolve_groups(payload: dict) -> dict[str, list[dict]]:
    questions = payload.get("questions")
    if not isinstance(questions, list):
        raise RuntimeError("La fuente no contiene una lista de preguntas.")

    real_questions = [question for question in questions if not normalize(question.get("id", "")).startswith("demo ")]
    if len(real_questions) != EXPECTED_TOTAL:
        raise RuntimeError(f"Número inesperado de preguntas reales: {len(real_questions)}")

    groups: dict[str, list[dict]] = defaultdict(list)
    unresolved: list[dict] = []
    for question in real_questions:
        key = classify_question(question)
        if key:
            groups[key].append(question)
        else:
            unresolved.append(question)

    # Recuperación segura para fuentes que conserven un identificador de banco
    # reconocible pero no alguno de los textos anteriores.
    if unresolved:
        buckets: dict[str, list[dict]] = defaultdict(list)
        for question in unresolved:
            bucket = normalize(question.get("bank_id") or question.get("source") or "sin origen")
            buckets[bucket].append(question)

        remaining = {key for key in BANK_SPECS if not groups.get(key)}
        for bucket_name, bucket_questions in buckets.items():
            candidates = [
                key for key in remaining
                if BANK_SPECS[key]["expected"] == len(bucket_questions)
                and (len(bucket_questions) != 86 or ("a1" in bucket_name) == (key == "gobcan-a1"))
            ]
            if len(candidates) == 1:
                key = candidates[0]
                groups[key].extend(bucket_questions)
                remaining.remove(key)
            else:
                sample = [question.get("id") for question in bucket_questions[:5]]
                raise RuntimeError(f"No se pudo clasificar el grupo '{bucket_name}' ({len(bucket_questions)}): {sample}")

    counts = {key: len(groups.get(key, [])) for key in BANK_SPECS}
    expected = {key: spec["expected"] for key, spec in BANK_SPECS.items()}
    if counts != expected:
        diagnostics = Counter(classify_question(question) or "sin-clasificar" for question in real_questions)
        raise RuntimeError(f"Distribución incorrecta: {counts}; esperada: {expected}; diagnóstico: {dict(diagnostics)}")
    return groups


def related_topics(payload: dict, questions: list[dict]) -> list[dict]:
    topics = payload.get("topics")
    if not isinstance(topics, list):
        raise RuntimeError("La fuente no contiene una lista de temas.")

    by_id = {topic.get("id"): topic for topic in topics if isinstance(topic, dict) and topic.get("id")}
    needed = {topic_id for question in questions for topic_id in question.get("topic_ids", [])}

    pending = list(needed)
    while pending:
        topic_id = pending.pop()
        topic = by_id.get(topic_id)
        if topic is None:
            raise RuntimeError(f"El tema referenciado no existe: {topic_id}")
        parent_id = topic.get("parent_id")
        if parent_id and parent_id not in needed:
            needed.add(parent_id)
            pending.append(parent_id)

    return [topic for topic in topics if topic.get("id") in needed]


def write_banks(payload: dict, groups: dict[str, list[dict]]) -> None:
    output_dir = ROOT / "banks"
    output_dir.mkdir(exist_ok=True)

    total = 0
    for key, spec in BANK_SPECS.items():
        questions = groups[key]
        question_ids = [question.get("id") for question in questions]
        if len(question_ids) != len(set(question_ids)):
            raise RuntimeError(f"El banco {key} contiene identificadores duplicados.")

        bank = {
            "schema_version": 1,
            "bank": {
                "id": spec["id"],
                "name": spec["name"],
                "description": spec["description"],
                "generated_at": "2026-08-04T00:00:00.000Z",
            },
            "topics": related_topics(payload, questions),
            "questions": questions,
        }
        destination = output_dir / spec["filename"]
        destination.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        total += len(questions)
        print(f"{destination.relative_to(ROOT)}: {len(questions)} preguntas, {len(bank['topics'])} temas")

    if total != EXPECTED_TOTAL:
        raise RuntimeError(f"Total publicado inesperado: {total}")
    print(f"Total publicado: {total} preguntas")


def main() -> None:
    payload = read_source()
    groups = resolve_groups(payload)
    write_banks(payload, groups)


if __name__ == "__main__":
    main()
