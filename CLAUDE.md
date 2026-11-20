# Nella Melody

Mascota virtual 3D de My Melody, regalo de Nico para Antonella. Objetivo: tablet Samsung Galaxy Tab S9 FE+ (16:10, 1280×800 CSS px) como APK que funcione sin internet. Todo en español (Latinoamérica).

## Estructura

- `prototipo-web/3d/`: **el juego** (lo que va al APK). El resto de `prototipo-web/` son prototipos viejos que solo quedan como historia.
  - `index.html`: interfaz, estilos e importmap (three.js local en `vendor/`).
  - `escena3d.js`: escena, personaje, máquina de estados, gestos, baño, columpio y el final de la Nota 100. API de pruebas en `window.NellaFase0`.
  - `cuartos.js`: decorado de cocina, baño y patio. `cocina.js`: comida, refri y hambre. `tienda.js`: corazones, racha y tiendita. `patio.js`: flores, florero, Kuromi y aguas termales. `encargos.js`: encargos, Notas Rosas y deseos. `cartas.js`: cartas y textos. `titulo.js`: arranque, título, opciones, globo de diálogo y versión.
  - `pruebas.js`: prueba "mono loco" (`NellaPruebas.monoLoco(segundos, semilla)`).
- `apk/`: proyecto Capacitor 7. `preparar_www.py` copia el juego a `apk/www`; `generar_iconos.py` genera el ícono y la pantalla de inicio desde `apk/arte/retrato.png`.
- `docs/`: diseño (`diseno-ambientes.md`, con lo hecho en cada paso), investigación de la serie y capturas. `concepts_brief.md`: brief original.
- `entrega/`: guía de instalación. El APK se publica en GitHub Releases, no en el repo.

## Reglas del proyecto

- **Sin motor de física:** movimiento con resortes y curvas de paso fijo; todo estado tiene tiempo máximo y salida segura a `libre`.
- **Medidas de la interfaz en `cqw`/`cqh`** (relativas a `#marco`, 16:10), nunca en `vw`/`vh`.
- **Guardado** en `localStorage` por módulo (`nella-*`), validando todo al cargar. Las Notas solo suben. La prueba del mono loco no guarda Notas ni encargos.
- **Sin dependencias de internet:** three.js y la letra Fredoka viven en `prototipo-web/3d/vendor/`.
- Al cambiar un `.js`, sube su `?v=` en el `import` o en `index.html`; si no, el navegador usa la copia vieja.
- Textos originales; nombres de la serie respetados (Kuromi Note, rakkyo, etc.).

## Probar

```bash
python -m http.server 8123 --directory prototipo-web
```

Abre `http://localhost:8123/3d/index.html?pruebas` (con `?pruebas` aparece la fila de pruebas en Opciones; también se abre tocando 7 veces el título "Opciones"). Después de cada cambio, corre el mono loco con varias semillas desde la consola: `NellaPruebas.monoLoco(600, 9)` debe devolver `ok: true`.

## Compilar el APK

Desde `apk/`, en PowerShell (pasos completos en `entrega/COMO-INSTALAR.md`):

```
python preparar_www.py; npx cap copy android; cd android
$env:JAVA_HOME='D:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot'; $env:ANDROID_HOME='D:\Android\SDK'
$env:GRADLE_USER_HOME='D:\Android\Gradle'; $env:TEMP='E:\tmpnella'; $env:TMP='E:\tmpnella'
.\gradlew.bat assembleRelease
```

- El `TEMP` corto evita el error "Unable to establish loopback connection" de Gradle.
- **Firma:** siempre la misma clave (`~/.android/debug.keystore`, respaldada fuera del repo). Con otra clave, Android no instala la versión nueva encima, y desinstalar borra la partida de Antonella. **Nunca subir la clave al repo.**

## Versiones

SemVer `mayor.menor.parche`. Al publicar una versión hay que cambiarla en tres lugares a la vez: `VERSION` en `prototipo-web/3d/titulo.js`, `versionName` y `versionCode` (sube siempre) en `apk/android/app/build.gradle`, y `version` en `apk/package.json`. Después se anota en `CHANGELOG.md`, se crea la etiqueta `vX.Y.Z` y se sube el APK a Releases.
