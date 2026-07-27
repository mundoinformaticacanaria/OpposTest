# ADR-001: PWA local-first

- Estado: aceptada
- Fecha: 2026-07-27

## Contexto

La aplicación es inicialmente personal, debe poder utilizarse desde distintos dispositivos y se quieren evitar costes y mantenimiento de servidor.

## Decisión

Construir OpposTest como PWA estática con almacenamiento IndexedDB y funcionamiento offline.

## Consecuencias

- alojamiento estático gratuito posible;
- no hay cuentas ni servidor;
- cada dispositivo conserva datos independientes;
- la transferencia entre dispositivos se realiza mediante copia de seguridad.
