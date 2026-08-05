#!/usr/bin/env python3
from __future__ import annotations

import base64
import bz2
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / '.bank-source-v3'
EXPECTED_SHA256 = '097b759df6c4ef7b35c5dc6d82006ee13b0677455fa7a33ccafc5d101f24559e'

SPECS = [
    {
        'filename': 'gobcan-a1-ti-l26-2026.json',
        'prefix': 'gobcan-a1-ti-l26-2026-',
        'expected': 86,
        'id': 'gobcan-a1-ti-l26-2026',
        'name': 'Gobierno de Canarias A1 TI (L26) — primer ejercicio 2026',
        'description': 'Cuestionario oficial del primer ejercicio del Cuerpo Facultativo Superior, especialidad de Tecnología de la Información (L26), con 80 preguntas ordinarias y 6 de reserva.'
    },
    {
        'filename': 'gobcan-a2-tinl26-2026.json',
        'prefix': 'gobcan-a2-tinl26-',
        'expected': 86,
        'id': 'gobcan-a2-tinl26-2026',
        'name': 'Gobierno de Canarias A2 TI (TINL26) — primer ejercicio 2026',
        'description': 'Cuestionario oficial del primer ejercicio del Cuerpo Facultativo de Grado Medio, especialidad de Tecnologías de la Información (TINL26), con 80 preguntas ordinarias y 6 de reserva.'
    },
    {
        'filename': 'scs-a1-informatica-estabilizacion-2022.json',
        'prefix': 'scs-a1-informatica-estabilizacion-2022-',
        'expected': 600,
        'id': 'scs-a1-informatica-estabilizacion-2022',
        'name': 'SCS A1 Informática — estabilización 2022',
        'description': 'Repertorio definitivo del proceso selectivo de Técnico/a Titulado/a Superior en Informática del Servicio Canario de la Salud.'
    },
    {
        'filename': 'scs-ttm-informatica-estabilizacion-2022.json',
        'prefix': 'scs-tecnico-titulado-medio-estabilizacion-2022-',
        'expected': 540,
        'id': 'scs-ttm-informatica-estabilizacion-2022',
        'name': 'SCS Técnico Titulado Medio Informática — estabilización 2022',
        'description': 'Repertorio definitivo del proceso selectivo de Técnico/a Titulado/a Medio en Informática del Servicio Canario de la Salud.'
    }
]


def load_source() -> dict:
    chunks = sorted(SOURCE_DIR.glob('chunk-*'))
    names = [chunk.name for chunk in chunks]
    expected_names = [f'chunk-{index:02d}' for index in range(14)]
    if names != expected_names:
        raise RuntimeError(f'Fragmentos inesperados: {names}')

    encoded = ''.join(chunk.read_text(encoding='utf-8').strip() for chunk in chunks)
    raw = bz2.decompress(base64.b64decode(encoded, validate=True))
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_SHA256:
        raise RuntimeError(f'SHA-256 incorrecto: {digest}')
    return json.loads(raw.decode('utf-8'))


def related_topics(all_topics: list[dict], questions: list[dict]) -> list[dict]:
    by_id = {topic['id']: topic for topic in all_topics}
    needed = {topic_id for question in questions for topic_id in question.get('topic_ids', [])}
    pending = list(needed)
    while pending:
        topic_id = pending.pop()
        topic = by_id.get(topic_id)
        if topic is None:
            raise RuntimeError(f'Tema inexistente: {topic_id}')
        parent_id = topic.get('parent_id')
        if parent_id and parent_id not in needed:
            needed.add(parent_id)
            pending.append(parent_id)
    return [topic for topic in all_topics if topic['id'] in needed]


def main() -> None:
    source = load_source()
    questions = source['questions']
    all_topics = source['topics']
    output = ROOT / 'banks'
    output.mkdir(exist_ok=True)

    published_ids: set[str] = set()
    total = 0
    for spec in SPECS:
        selected = [question for question in questions if question['id'].startswith(spec['prefix'])]
        if len(selected) != spec['expected']:
            raise RuntimeError(f"{spec['filename']}: {len(selected)} preguntas; se esperaban {spec['expected']}")
        for question in selected:
            if question['id'] in published_ids:
                raise RuntimeError(f"Identificador duplicado: {question['id']}")
            published_ids.add(question['id'])

        bank = {
            'schema_version': 1,
            'bank': {
                'id': spec['id'],
                'name': spec['name'],
                'generated_at': '2026-08-05T00:00:00.000Z',
                'description': spec['description']
            },
            'topics': related_topics(all_topics, selected),
            'questions': selected
        }
        destination = output / spec['filename']
        destination.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        total += len(selected)
        print(f'{destination}: {len(selected)} preguntas; {len(bank["topics"])} temas')

    if total != 1312:
        raise RuntimeError(f'Total inesperado: {total}')
    print('Total publicado: 1312 preguntas')


if __name__ == '__main__':
    main()
