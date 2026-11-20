"""Genera el ícono de la app y la pantalla de inicio de Android a partir de arte/retrato.png
(foto de My Melody con fondo transparente, sacada del juego con NellaFase0.retrato()).
Uso: python generar_iconos.py"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(AQUI, 'android', 'app', 'src', 'main', 'res')
retrato = Image.open(os.path.join(AQUI, 'arte', 'retrato.png')).convert('RGBA')
FUENTE = os.path.join(AQUI, '..', 'prototipo-web', '3d', 'vendor', 'fredoka', 'fredoka-latin.woff2')

ROSA_CLARO, ROSA = (255, 240, 246), (255, 156, 196)

# Cabeza y orejas (para el ícono) y cuerpo entero (para la pantalla de inicio).
x0, y0, x1, y1 = retrato.getbbox()
cabeza = retrato.crop((x0 - 20, y0 - 10, x1 + 20, y0 + int((y1 - y0) * 0.74)))
cuerpo = retrato.crop((x0 - 10, y0 - 10, x1 + 10, y1 + 10))


def degradado(tam):
    """Fondo rosa con un brillo claro al centro."""
    img = Image.new('RGBA', (tam, tam))
    d = ImageDraw.Draw(img)
    for i in range(tam // 2, 0, -1):
        k = i / (tam / 2)
        c = tuple(int(ROSA_CLARO[j] + (ROSA[j] - ROSA_CLARO[j]) * k ** 1.6) for j in range(3))
        d.ellipse((tam / 2 - i * 1.42, tam / 2 - i * 1.42, tam / 2 + i * 1.42, tam / 2 + i * 1.42), fill=c + (255,))
    return img


def con_sombra(figura):
    """Una sombrita suave debajo del personaje, para que se despegue del fondo."""
    sombra = Image.new('RGBA', figura.size, (0, 0, 0, 0))
    alfa = figura.split()[3].point(lambda a: int(a * 0.28))
    sombra.paste((180, 60, 110, 255), (0, 0), alfa)
    sombra = sombra.filter(ImageFilter.GaussianBlur(figura.size[0] * 0.02))
    base = Image.new('RGBA', (figura.size[0], figura.size[1] + int(figura.size[1] * 0.03)), (0, 0, 0, 0))
    base.alpha_composite(sombra, (0, int(figura.size[1] * 0.03)))
    base.alpha_composite(figura, (0, 0))
    return base


def encajar(figura, ancho_max, alto_max):
    f = min(ancho_max / figura.size[0], alto_max / figura.size[1])
    return figura.resize((max(1, int(figura.size[0] * f)), max(1, int(figura.size[1] * f))), Image.LANCZOS)


def icono(tam, proporcion=0.86):
    img = degradado(tam)
    fig = con_sombra(encajar(cabeza, tam * proporcion, tam * proporcion))
    img.alpha_composite(fig, ((tam - fig.size[0]) // 2, (tam - fig.size[1]) // 2 + int(tam * 0.03)))
    return img


def redondear(img, radio):
    mascara = Image.new('L', img.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, img.size[0] - 1, img.size[1] - 1), radius=radio, fill=255)
    out = Image.new('RGBA', img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mascara)
    return out


def circular(img):
    mascara = Image.new('L', img.size, 0)
    ImageDraw.Draw(mascara).ellipse((0, 0, img.size[0] - 1, img.size[1] - 1), fill=255)
    out = Image.new('RGBA', img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mascara)
    return out


DENSIDADES = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for nombre, k in DENSIDADES.items():
    carpeta = os.path.join(RES, 'mipmap-' + nombre)
    os.makedirs(carpeta, exist_ok=True)
    lado = int(48 * k)
    grande = icono(lado * 4)
    redondear(grande, lado * 4 * 0.22).resize((lado, lado), Image.LANCZOS).save(os.path.join(carpeta, 'ic_launcher.png'))
    circular(grande).resize((lado, lado), Image.LANCZOS).save(os.path.join(carpeta, 'ic_launcher_round.png'))
    # Ícono adaptable: el personaje dentro de la zona segura (el 66 % del centro).
    lado_adapt = int(108 * k)
    frente = Image.new('RGBA', (lado_adapt * 4, lado_adapt * 4), (0, 0, 0, 0))
    fig = con_sombra(encajar(cabeza, lado_adapt * 4 * 0.6, lado_adapt * 4 * 0.6))
    frente.alpha_composite(fig, ((frente.size[0] - fig.size[0]) // 2, (frente.size[1] - fig.size[1]) // 2 + int(frente.size[1] * 0.02)))
    frente.resize((lado_adapt, lado_adapt), Image.LANCZOS).save(os.path.join(carpeta, 'ic_launcher_foreground.png'))
    degradado(lado_adapt).save(os.path.join(carpeta, 'ic_launcher_background.png'))

with open(os.path.join(RES, 'mipmap-anydpi-v26', 'ic_launcher.xml'), 'w', encoding='utf-8') as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
            '    <background android:drawable="@mipmap/ic_launcher_background"/>\n'
            '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n')
redondo = os.path.join(RES, 'mipmap-anydpi-v26', 'ic_launcher_round.xml')
if os.path.exists(redondo):
    with open(redondo, 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
                '    <background android:drawable="@mipmap/ic_launcher_background"/>\n'
                '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n')
with open(os.path.join(RES, 'values', 'ic_launcher_background.xml'), 'w', encoding='utf-8') as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFD6E6</color>\n</resources>\n')

# Pantalla de inicio: rosa, con My Melody y el nombre del juego, en todos los tamaños que trae Capacitor.
try:
    fuente_ok = ImageFont.truetype(FUENTE, 40)
except Exception:
    fuente_ok = None


def inicio(ancho, alto):
    img = Image.new('RGBA', (ancho, alto), (243, 196, 214, 255))
    lado = min(ancho, alto)
    brillo = degradado(int(lado * 1.4))
    img.alpha_composite(brillo, ((ancho - brillo.size[0]) // 2, (alto - brillo.size[1]) // 2))
    fig = con_sombra(encajar(cuerpo, lado * 0.42, lado * 0.42))
    img.alpha_composite(fig, ((ancho - fig.size[0]) // 2, int(alto * 0.5 - fig.size[1] * 0.62)))
    if fuente_ok:
        f = ImageFont.truetype(FUENTE, int(lado * 0.075))
        f.set_variation_by_axes([700])
        d = ImageDraw.Draw(img)
        texto = 'Nella Melody'
        caja = d.textbbox((0, 0), texto, font=f)
        x = (ancho - (caja[2] - caja[0])) // 2
        y = int(alto * 0.5 + fig.size[1] * 0.45)
        d.text((x, y), texto, font=f, fill=(255, 255, 255, 255), stroke_width=max(2, int(lado * 0.009)), stroke_fill=(232, 111, 163, 255))
    return img.convert('RGB')


hechos = 0
for carpeta in os.listdir(RES):
    ruta = os.path.join(RES, carpeta, 'splash.png')
    if carpeta.startswith('drawable') and os.path.exists(ruta):
        ancho, alto = Image.open(ruta).size
        inicio(ancho, alto).save(ruta)
        hechos += 1
print('Íconos listos; pantallas de inicio:', hechos, '; letra para el nombre:', 'sí' if fuente_ok else 'no')
