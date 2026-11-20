# Nella Melody 1.0.0 · cómo instalarlo en la tablet de Antonella

Archivo: `NellaMelody-1.0.0.apk` (4,8 MB). Funciona sin internet, siempre en horizontal y a pantalla completa.

## Instalarlo (Samsung Galaxy Tab S9 FE+)

1. Pásale el archivo a la tablet: por WhatsApp (como documento), Google Drive, Quick Share o con un cable.
2. En la tablet, toca el archivo `NellaMelody-1.0.0.apk`.
3. Si aparece "Por tu seguridad, tu tablet no puede instalar apps desconocidas de esta fuente", toca **Ajustes** y activa **Permitir desde esta fuente**. Vuelve atrás.
4. Toca **Instalar**. Si Play Protect avisa que es una app desconocida, toca **Más detalles → Instalar de todas formas**. Es normal: la app no viene de la Play Store.
5. Ábrela desde el ícono de My Melody. La primera vez Android muestra un aviso de "pantalla completa": se toca **Entendido**.

Para salir del juego: deslizar desde el borde de abajo (o de arriba) para que aparezcan los botones de Android.

## Muy importante para las próximas versiones

- **Nunca desinstales la app para poner una versión nueva**: desinstalar borra toda su partida (Notas Rosas, corazones, flores, cartas leídas). Las versiones nuevas se instalan encima y la partida se conserva.
- Para que Android acepte instalar encima, cada versión tiene que estar firmada con **la misma clave**: `apk/firma/nella-melody-firma.keystore` (es la clave de esta laptop, `C:\Users\…\.android\debug.keystore`). **Guarda una copia en dos lugares fuera de la laptop** (por ejemplo, Drive y un pendrive). Si se pierde, una versión nueva ya no se podría instalar sin borrar la partida.
- Para la próxima versión, sube `versionCode` (2, 3, …) y `versionName` en `apk/android/app/build.gradle`.

## Cómo compilar una versión nueva (para Nico)

Desde `apk/`, con PowerShell:

```
python preparar_www.py
npx cap copy android
cd android
$env:JAVA_HOME = 'D:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot'
$env:ANDROID_HOME = 'D:\Android\SDK'
$env:GRADLE_USER_HOME = 'D:\Android\Gradle'
$env:TEMP = 'E:\tmpnella'; $env:TMP = 'E:\tmpnella'
.\gradlew.bat assembleRelease
```

El APK queda en `apk/android/app/build/outputs/apk/release/app-release.apk`. (La carpeta temporal corta `E:\tmpnella` evita el error "Unable to establish loopback connection" de Gradle.)

## Qué se probó antes de entregar

- En un emulador de Android 17 (Pixel 7 Pro): se instala, abre en horizontal y a pantalla completa, el 3D y la letra funcionan, la partida empieza de cero ("Primera visita", 0/100 Notas, regalo de bienvenida) y **se guarda** al cerrar y volver a abrir la app.
- El juego no pide nada a internet: three.js y la letra Fredoka van dentro del APK.
- La prueba automática del "mono loco" (más de 25 corridas de 10 minutos simulados durante el desarrollo) no encontró fallas.
- Lo único que no se pudo probar es la tablet real: si algo se ve raro allá, una captura alcanza para arreglarlo.
