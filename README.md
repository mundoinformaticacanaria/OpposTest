# OpposTest

OpposTest es una aplicación web progresiva (PWA), local-first y sin backend para practicar test de oposiciones desde el navegador.

## Versión 1.0.0 — MVP

La versión `v1.0.0` constituye el primer producto mínimo viable público. Incluye importación de bancos JSON, creación y corrección de test, preguntas falladas y favoritas, historial local, exportación de bancos compartibles, copias completas y un catálogo inicial de bancos públicos.

Abrir la aplicación: https://mundoinformaticacanaria.github.io/OpposTest/

## Funciones principales

- importar bancos de preguntas en JSON;
- crear test por uno o varios temas;
- repetir preguntas falladas;
- practicar preguntas favoritas;
- conservar historial y progreso en el dispositivo;
- exportar un banco compartible sin datos personales de estudio;
- exportar y restaurar una copia completa del dispositivo;
- descargar bancos públicos listos para importar.

## Bancos públicos

Los bancos publicados se encuentran en [`banks/`](banks/README.md):

- Gobierno de Canarias A1 TI (L26), primer ejercicio 2026: 86 preguntas;
- Gobierno de Canarias A2 TI (TINL26), primer ejercicio 2026: 86 preguntas;
- SCS A1 Informática, estabilización 2022: 600 preguntas;
- SCS Técnico Titulado Medio Informática, estabilización 2022: 540 preguntas.

Total publicado: **1.312 preguntas**.

Para utilizarlos, descarga el JSON correspondiente y en OpposTest abre **Datos → Carga de datos → Importar banco de preguntas**.

## Ejecutar localmente

Requiere Node.js 20 o superior.

```bash
npm run serve
```

Después abre `http://localhost:8080`.

También puede servirse con cualquier servidor web estático. No debe abrirse directamente mediante `file://`, porque el service worker y los módulos ES necesitan HTTP o HTTPS.

## Pruebas

```bash
npm run check
```

## Datos y privacidad

- Los datos se guardan en IndexedDB dentro del navegador.
- No se envía información a ningún servidor.
- Cada dispositivo mantiene sus propios datos.
- **Descargar banco de preguntas** genera un JSON importable con metadatos, temas y preguntas. No incluye historial, progreso, falladas, favoritas ni configuración.
- Ese archivo se carga mediante **Carga de datos → Importar banco de preguntas** y se añade al contenido existente.
- **Descargar copia completa** incluye banco, historial, progreso y preferencias. Debe tratarse como una copia privada.
- Ese archivo se carga mediante **Carga de datos → Restaurar copia completa** y sustituye los datos actuales después de pedir confirmación.

## Estructura

```text
OpposTest/
├── banks/                Bancos públicos listos para importar
├── docs/                 Documentación funcional y técnica
├── samples/              Banco JSON de demostración
├── src/
│   ├── core/             Reglas de negocio y validación
│   ├── data/             IndexedDB, importación y copias
│   └── ui/               Navegación y pantallas
├── tests/                Pruebas automáticas
├── assets/               Iconos y recursos visuales
├── index.html            Entrada de la PWA
├── manifest.webmanifest  Manifiesto instalable
└── service-worker.js     Funcionamiento sin conexión
```

## Autor

Desarrollado por **Xerach Hernández Quesada**.

- LinkedIn: https://www.linkedin.com/in/xerach-hernandez-quesada/
- GitHub: https://github.com/mundoinformaticacanaria

## Licencia

La licencia de software libre está pendiente de decisión. Hasta que se publique una licencia, el código conserva todos los derechos y no debe redistribuirse como si existiera una autorización expresa.
