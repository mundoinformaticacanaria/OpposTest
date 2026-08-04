# OpposTest

OpposTest es una aplicación web progresiva (PWA), local-first y sin backend para practicar test de oposiciones desde el navegador.

## Objetivo

Ofrecer una herramienta práctica, funcional, sencilla y robusta para:

- importar bancos de preguntas en JSON;
- crear test por uno o varios temas;
- repetir preguntas falladas;
- practicar preguntas favoritas;
- conservar historial y progreso en el dispositivo;
- exportar un banco compartible sin datos personales de estudio;
- exportar y restaurar una copia completa del dispositivo.

## Estado

Versión inicial `v0.1.0`. Incluye un prototipo funcional con almacenamiento IndexedDB, importación JSON, generación de test, corrección, falladas, favoritas, historial, banco compartible y copia de seguridad completa.

## Aplicación publicada

OpposTest está disponible en GitHub Pages:

https://mundoinformaticacanaria.github.io/OpposTest/

## Bancos públicos

El directorio [`banks/`](banks/) contiene bancos JSON listos para importar en OpposTest. El catálogo actual reúne **1.312 preguntas** de exámenes de informática del Gobierno de Canarias y del Servicio Canario de la Salud.

Consulta el [catálogo de bancos públicos](banks/README.md) para ver el contenido, descargar los archivos y conocer el procedimiento de importación.

## Ejecutar localmente

Requiere Node.js 20 o superior.

```bash
npm run serve
```

Después abre:

```text
http://localhost:8080
```

También puede servirse con cualquier servidor web estático. No debe abrirse directamente mediante `file://`, porque el service worker y los módulos ES necesitan HTTP o HTTPS.

## Pruebas

```bash
npm test
```

## Datos y privacidad

- Los datos se guardan en IndexedDB dentro del navegador.
- No se envía información a ningún servidor.
- Cada dispositivo mantiene sus propios datos.
- **Descargar banco de preguntas** genera un JSON importable con metadatos del banco, temas y preguntas. No incluye historial, progreso, falladas, favoritas ni configuración.
- Ese archivo se carga mediante **Carga de datos → Importar banco de preguntas** y se añade al contenido existente.
- **Descargar copia completa** incluye banco, historial, progreso y preferencias. Debe tratarse como una copia privada.
- Ese archivo se carga mediante **Carga de datos → Restaurar copia completa** y sustituye los datos actuales después de pedir confirmación.

## Autor

OpposTest ha sido diseñado y desarrollado por **Xerach Hernández Quesada**.

- [LinkedIn](https://www.linkedin.com/in/xerach-hernandez-quesada/)
- [GitHub](https://github.com/mundoinformaticacanaria)

## Estructura

```text
OpposTest/
├── banks/                Bancos JSON públicos para importar
├── docs/                 Documentación funcional y técnica
├── samples/              Bancos JSON de demostración
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

## Licencia

La licencia de software libre se decidirá antes de publicar la primera versión estable. Hasta entonces, el código no debe redistribuirse como si tuviera una licencia concedida.
