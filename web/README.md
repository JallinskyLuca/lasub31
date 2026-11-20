# La Sub 31

Landing del club en negro, blanco y dorado, pensada primero para celulares.

## Ver la página

Abrí `index.html` en el navegador. La carpeta `assets` debe mantenerse junto al archivo.

## Publicar en Netlify

**Panel online:** desde que se agregó `/sub31admin/`, publicá desde la raíz del proyecto usando Netlify CLI o Git, para incluir las funciones del backend. Subir solo `web` permite mostrar las páginas estáticas, pero no activa el panel. Consultá `../DEPLOY-NETLIFY.md` para configurar el acceso y publicar esta versión.

La portada queda en `/` y el linktree para la bio de Instagram en `/links/`, bajo el mismo dominio. El botón Página Web del linktree apunta a `https://lasub31.netlify.app/`.

La copia lista para publicar está en `web/links/index.html`; el diseño original se conserva en `Linktree-caseroSUB31/index.html`. X fue eliminado. WhatsApp queda oculto en la copia publicable hasta tener su enlace real; al cargarlo, quitá el atributo `hidden` del botón correspondiente.

## Archivos

- `index.html`: contenido, navegación y enlaces de redes.
- `styles.css`: diseño, adaptaciones para celular y animaciones.
- `script.js`: menú móvil, carrusel del equipo, visor de camisetas y progreso de lectura.
- `club-data.js`: fotografías del equipo, información del torneo y fixture confirmado.
- `live-content.js`: consulta los resultados y la foto guardados desde el panel online; conserva el respaldo local si el servicio falla.
- `sub31admin/`: interfaz del panel privado. El backend y su configuración están fuera de `web`, en la raíz del proyecto.
- `assets/Tablas.jpeg`: última tabla de posiciones compartida por el club, publicada debajo del fixture.
- `editar-fixture.html` y `editar-fixture.js`: editor del fixture sin servidor ni base de datos.
- `assets/`: escudo, fotografías del equipo y la familia, conjuntos de camisetas.
  - `assets/equipo/`: las tres fotos del equipo y la foto de familia.
  - `assets/camisetas/`: los conjuntos negro y blanco (frente, dorso, short y conjunto completo).
  - `assets/camisetas/originales/`: los PNG originales sin comprimir. No se usan en la página; podés borrarlos cuando confirmes que todo se ve bien.

## Cambiar el contenido

Los textos y enlaces se editan en `index.html`. Las descripciones de las camisetas también aparecen en el objeto `kits` de `script.js`.

Las redes conectadas son Instagram, TikTok y YouTube. El contacto dirige a Instagram. No se agregaron fechas de partidos, títulos, nombres de jugadores ni datos históricos sin confirmar.

La tipografía Manrope se carga desde Google Fonts; si no hay conexión, se usa la fuente del sistema. Los íconos de redes están integrados y su licencia figura dentro del HTML.

Las secciones aparecen con una animación suave una sola vez al entrar en pantalla. Se mantiene el espacio de cada sección para evitar saltos. La animación se omite cuando el visitante prefiere movimiento reducido; el contenido también queda visible sin JavaScript o sin soporte de IntersectionObserver. La navegación con teclado revela de inmediato la sección que recibe el foco.

## Equipo, familia, torneo y fixture

Las tres fotos reales del equipo se configuran en `equipo.fotos` de `club-data.js`. Podés agregar imágenes en `assets/equipo/` y sumar su ruta, descripción y pie a esa lista. El carrusel es manual, con botones, puntos, flechas del teclado y deslizamiento en celular; conserva las fotos completas, sin recortar jugadores. El enlace “Ver foto completa” abre el archivo original en otra pestaña.

La sección **Familia** (`#familia`) usa la foto grupal `assets/equipo/familia.jpg` como imagen de portada y textos propios en `index.html`. Su intención es contar que La Sub 31 no es solo once jugadores: también son las familias, los amigos y todos los que acompañan al club.

La foto de familia se muestra a un máximo de 1280 px de ancho, que es su tamaño real, para no ampliarla y perder nitidez. Si algún día la reemplazás por una versión de mayor resolución, actualizá también el `max-width` de `.family-figure` en `styles.css` para poder mostrarla más grande.

Las camisetas se muestran en `#camisetas` con dos conjuntos (negra y blanca) y cuatro vistas cada uno: frente, dorso, short y conjunto completo. Las rutas y los textos alternativos están en el objeto `kits` de `script.js`; los archivos viven en `assets/camisetas/`.

Completá los datos del torneo y los partidos cuando estén confirmados. Los campos vacíos muestran estados pendientes. Las fechas usan el formato `AAAA-MM-DD` y los horarios corresponden a Argentina.

Los partidos con `estado: 'jugado'` aparecen en la pestaña Jugados. Si se completan `golesSub31` y `golesRival` con números, se muestra el resultado. El campo opcional `goleadores` agrega debajo del partido el resumen de autores informado por el club.

El fixture 2026 tiene cargadas las 11 fechas aportadas por el club. Las primeras siete figuran como victorias de La Sub 31; las fechas 8 a 11 están programadas entre el 28 de noviembre y el 19 de diciembre de 2026. Todos los partidos se disputan en La Maderera, Ramos Mejía; los horarios siguen pendientes.

La tabla de posiciones se muestra como imagen debajo del fixture. Al reemplazar `assets/Tablas.jpeg`, conservá el mismo nombre para actualizarla sin cambiar el HTML; revisá también el resumen textual de la sección si cambian el puesto, los puntos o los partidos jugados.

El torneo conectado es Super League Oficial. La referencia a jornadas de sábados y domingos proviene de su biografía oficial de Instagram: https://www.instagram.com/superleagueoficial/ (consultada el 8 de octubre de 2026).

Para publicar esta versión, conservá juntos todos los archivos de la carpeta `web` y sus imágenes.

## Patrocinadores

La sección incluye a Raíces Verdes (Mates Exclusivos) y GEB (Soluciones Digitales), con los logos originales aportados por el club. Los archivos se encuentran en `assets/patrocinador-raices-verdes.png` y `assets/patrocinador-geb.png`. No se asignaron enlaces de marca sin confirmar. El botón para nuevas propuestas de patrocinio dirige al Instagram de La Sub 31; podés cambiar su destino en `index.html`.

## Actualización manual sin backend

Este es el editor anterior, conservado como herramienta local. Cuando el panel online ya tenga datos guardados, sus datos tienen prioridad sobre los cambios hechos en `club-data.js`.

1. Abrí `editar-fixture.html`, manteniéndolo junto a `club-data.js` y `editar-fixture.js`.
2. Elegí un partido y completá rival, estado, día, horario, cancha y resultado. Podés editar varios partidos. Los borradores quedan en ese navegador y dispositivo, no en el sitio publicado.
3. Tocá “Descargar actualización”. Se genera `club-data.js`, conservando las fotos y la información del torneo. Los partidos jugados deben tener ambos marcadores completos; los pendientes no exportan resultados.
4. Reemplazá `web/club-data.js` con el archivo descargado. Si la descarga se llama `club-data (1).js`, renombrala a `club-data.js`.
5. Cuando publiques en GitHub Pages, actualizá ese archivo en el repositorio de la web. Luego actualizá la página para ver los cambios.

El editor local no publica ni modifica el archivo original por sí solo. El panel online `/sub31admin/`, en cambio, guarda resultados y foto de tabla mediante Netlify Functions y Blobs. La tabla no se calcula a partir de los resultados: se carga la imagen real del torneo y su resumen.
