# PlanningBand — actualización visual + importador PDF

Este paquete combina el importador de canciones desde PDF de la entrega anterior con la nueva identidad visual de PlanningBand.

## Qué contiene
- `src/main.jsx`: conserva el flujo de importación PDF ya entregado, incorpora el logo visual y actualiza la invitación visible para usar el nombre PlanningBand.
- `src/styles.css`: mantiene los estilos actuales y añade al final una capa de estilos para el degradado Smooth Gradient `#F2CF08 → #E4FD02 → #33DD4E → #5DFA86`, textos negros/grises oscuros y superficies blancas legibles.
- `public/planningband-logo.svg`: logo vectorial original con calendario, nota musical, micrófono y referencias de escenario; se utiliza también como favicon.
- `index.html`: título, descripción, color de tema y favicon de PlanningBand.
- `package.json`: incluye `pdfjs-dist`, necesario para leer PDF en el navegador, como en el parche anterior.

## Aplicación segura del cambio
1. Antes de tocar el repositorio, crea un commit de respaldo en GitHub.
2. Copia los archivos de este paquete en las mismas rutas del repositorio; crea la carpeta `public` si no existe.
3. **No reemplaces ni borres** `src/firebase-config.js`, `src/firebase.js`, `firestore.rules`, `netlify.toml` ni las variables de entorno de Netlify. Este ZIP no contiene esos archivos.
4. `package.json` solo está incluido para conservar la dependencia `pdfjs-dist` que requiere el importador PDF. Si ya instalaste y desplegaste ese parche, puedes comparar el archivo antes de reemplazarlo; las dependencias Firebase/React/Vite se mantienen.
5. Confirma los cambios en GitHub y espera el despliegue de Netlify.
6. Prueba primero abrir la app, iniciar sesión y luego importar un único PDF de texto seleccionable.

## Diseño
El degradado de cuatro colores se utiliza como fondo y acento; las tarjetas, formularios y zonas de lectura permanecen blancas para evitar perder contraste. La actualización no requiere servicios de imagen externos ni Firebase Storage.

## Nota de verificación
El cambio se basa en el código del importador PDF entregado antes. La compilación final debe verificarse en Netlify tras subirlo; esta actualización visual no requiere modificar Firebase ni las reglas de seguridad.
