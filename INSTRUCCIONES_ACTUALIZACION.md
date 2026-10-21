# PlanningBand — actualización de lectura musical y diseño

Esta actualización corrige la presentación del repertorio y ajusta la interfaz de PlanningBand. Está preparada para aplicarse sobre el proyecto actual de GitHub/Netlify, no como una instalación nueva.

## Qué cambia

- Limpia puntos utilizados como relleno visual en los PDF importados, por ejemplo `Adoro.Tu.Majestad` pasa a `Adoro Tu Majestad`.
- Convierte separadores de puntos de acordes en espacios reales; por ejemplo `..Cm...........Fm` pasa a una línea con los acordes separados y espacios de alineación.
- Muestra una vista previa de la letra y los acordes durante la importación.
- Normaliza también canciones importadas anteriormente al mostrarlas y al abrirlas para editarlas. No se reescribe toda la base de datos al cargar la página; al abrir/guardar una canción como administrador se persistirán los cambios de esa canción.
- Suaviza el fondo Smooth Gradient con los colores `#F2CF08`, `#E4FD02`, `#33DD4E` y `#5DFA86` a baja opacidad.
- Deja los títulos en negro, el texto secundario en gris oscuro y los botones con fondo sólido blanco.
- Retira la barra lateral derecha, la barra lateral izquierda duplicada y el aviso superior de sincronización, consolidando la navegación en la barra superior.
- Aumenta tamaños de textos y filas del calendario y tipos de servicio, con ajustes para pantallas móviles.
- Mantiene PlanningBand y suaviza los acentos de color del logo.
- Cambia el diseño del documento de impresión de canciones para que use textos neutrales y botones blancos.

## Archivos incluidos

- `src/main.jsx`
- `src/styles.css`
- `public/planningband-logo.svg`
- `index.html`

## Procedimiento recomendado

1. **Haz un respaldo primero:** en GitHub abre tu repositorio y confirma el estado actual con un commit, o crea una rama de respaldo.
2. Descarga y descomprime este ZIP en tu computador.
3. En el repositorio de GitHub, reemplaza únicamente los cuatro archivos incluidos, respetando las rutas y mayúsculas/minúsculas.
4. **No reemplaces ni elimines otros archivos.** En particular, conserva `src/firebase.js`, `src/firebase-config.js`, las reglas `firestore.rules`, `netlify.toml`, las variables de entorno de Netlify, `package.json` y cualquier otro archivo propio del proyecto.
5. Haz `Commit changes` en GitHub y espera que Netlify despliegue el commit.
6. Solo considera aplicado el cambio cuando Netlify indique `Published`. Abre la web y recarga con `Ctrl + Shift + R`.

## Pruebas recomendadas tras desplegar

1. Inicia sesión con el administrador y confirma que cargan servicios, personas y canciones existentes.
2. Abre una canción que antes mostraba palabras separadas por puntos: comprueba letra y acordes. La vista normalizadora no borra datos en Firestore solo por abrir el repertorio.
3. Importa **un único PDF** de prueba. Revisa título, artista, tonalidad, letra, acordes y vista previa antes de guardar.
4. Abre esa canción con una cuenta Visor y comprueba que la lectura también se muestra limpia.
5. Comprueba la navegación superior en computadora y móvil, y confirma que los botones tengan fondo sólido y los textos alto contraste.

## Alcance y límites

- El lector trabaja en el navegador y no guarda los bytes del PDF en Firebase Storage.
- La extracción requiere un PDF con texto seleccionable. Si el PDF contiene solo páginas escaneadas como imágenes, todavía necesita OCR; no debe darse por correcto un resultado vacío.
- La ubicación horizontal de los acordes se reconstruye a partir de las posiciones del texto del PDF. La vista previa editable permite corregir cualquier alineación que no se haya recuperado perfectamente.
- La actualización no modifica colecciones, documentos, reglas ni credenciales de Firebase.

## Nota sobre la compilación

He validado sintácticamente JSX, CSS y las funciones de normalización con ejemplos representativos. No pude completar una compilación de Vite en este entorno, porque no se pudieron instalar las dependencias desde npm. La compilación y el funcionamiento deben confirmarse en el despliegue automático de Netlify antes de considerar liberada esta versión.
