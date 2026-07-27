# OpposTest

OpposTest es una aplicación web progresiva (PWA), local-first y sin backend para practicar test de oposiciones desde el navegador.

## Objetivo

Ofrecer una herramienta práctica, funcional, sencilla y robusta para:

- importar bancos de preguntas en JSON;
- crear test por uno o varios temas;
- repetir preguntas falladas;
- practicar preguntas favoritas;
- conservar historial y progreso en el dispositivo;
- exportar y restaurar todos los datos.

## Estado

Versión inicial `v0.1.0`. Incluye un prototipo funcional con almacenamiento IndexedDB, importación JSON, generación de test, corrección, falladas, favoritas, historial y copia de seguridad.

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
- La copia de seguridad permite trasladar banco, historial y progreso entre dispositivos.

## Estructura

```text
OpposTest/
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
