# El misterio de los Fader - sitio simple

## Estructura
- `index.html` - portada + lista de capítulos
- `styles.css` - estilos globales
- `chapitulos/` - una página HTML por capítulo
- `img/cover.png` - portada
- `img/chapters/` - imágenes de los capítulos

## Publicación en GitHub Pages
1. Crea un repositorio nuevo.
2. Sube todos estos archivos.
3. Ve a **Settings > Pages**.
4. En **Build and deployment**, elige **Deploy from a branch**.
5. Selecciona la rama principal y la carpeta raíz.
6. Guarda y espera la publicación.

## Reemplazar imágenes
Cada capítulo usa un archivo dentro de `img/chapters/`.
Puedes reemplazar cada SVG por una imagen real manteniendo el mismo nombre.
Ejemplo:
- `capitulo-01.svg`
- `capitulo-02.svg`
- `capitulo-final.svg`


## Reproductor global
- `global-player.js` y `global-player.css` ya están integrados.
- La cola y el tiempo se guardan en el navegador.
- Capítulo 1 incluye un ejemplo de pistas opcionales.
