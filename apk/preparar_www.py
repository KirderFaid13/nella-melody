"""Copia el juego (prototipo-web/3d) a apk/www, la carpeta que Capacitor mete en el APK.
Se corre antes de cada compilación: python preparar_www.py"""
import os
import shutil

AQUI = os.path.dirname(os.path.abspath(__file__))
ORIGEN = os.path.join(AQUI, '..', 'prototipo-web', '3d')
DESTINO = os.path.join(AQUI, 'www')

if os.path.isdir(DESTINO):
    shutil.rmtree(DESTINO)
os.makedirs(DESTINO)

copiados = 0
for nombre in sorted(os.listdir(ORIGEN)):
    origen = os.path.join(ORIGEN, nombre)
    if nombre in ('img', 'vendor') and os.path.isdir(origen):
        shutil.copytree(origen, os.path.join(DESTINO, nombre))
        copiados += sum(len(f) for _, _, f in os.walk(origen))
    elif nombre == 'index.html' or nombre.endswith('.js'):
        shutil.copy2(origen, DESTINO)
        copiados += 1

print('Copiados', copiados, 'archivos a', os.path.normpath(DESTINO))
