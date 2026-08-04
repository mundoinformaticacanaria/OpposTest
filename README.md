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
- **Exportar banco compartible** genera un JSON importable con metadatos del banco, temas y preguntas. No incluye historial, progreso, falladas, favoritas ni configuración.
- **Exportar copia completa** incluye banco, historial, progreso y preferencias. Debe tratarse como una copia privada y permite trasladar todo el estudio entre dispositivos.

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
