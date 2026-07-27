# Arquitectura

## Resumen

OpposTest es una PWA estática sin backend.

- Interfaz: HTML, CSS y JavaScript modular.
- Persistencia: IndexedDB.
- Ejecución offline: service worker.
- Importación y exportación: JSON.
- Dependencias en tiempo de ejecución: ninguna.

## Capas

### Núcleo

Contiene reglas independientes del navegador:

- validación de bancos;
- selección de preguntas;
- cálculo de resultados;
- reglas de preguntas pendientes.

### Datos

Responsable de:

- abrir y versionar IndexedDB;
- persistir temas, preguntas, progreso y test;
- importar bancos;
- crear y restaurar copias de seguridad.

### Interfaz

Responsable de:

- navegación;
- formularios;
- presentación de preguntas y resultados;
- mensajes claros al usuario.

## Escalabilidad

La escalabilidad buscada no es soportar millones de usuarios. Es permitir que:

- existan decenas de miles de preguntas;
- se añadan nuevos modos de estudio;
- se sustituya IndexedDB por sincronización remota en una versión posterior;
- los datos puedan migrarse mediante formatos versionados.

## Restricciones del MVP

- Sin autenticación.
- Sin sincronización automática entre dispositivos.
- Sin lectura de PDF.
- Sin OCR.
- Sin IA integrada.
- Sin panel administrativo separado.
