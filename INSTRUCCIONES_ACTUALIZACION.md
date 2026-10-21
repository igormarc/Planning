# PlanningBand — Citaciones, catálogo, temas y permisos de Visor

## Qué incluye este parche

- `src/main.jsx`: interfaz de repertorio y servicio, asignaciones, semáforo de citaciones, respuesta y motivos de declinación, cola de avisos por correo, etiquetas temáticas, búsqueda externa y permisos visuales de Visor.
- `src/styles.css`: estilos puntuales para catálogo de canciones y estados de respuesta.
- `firestore.rules.updated.txt`: reglas de referencia basadas en la versión inicial de reglas entregada para PlanningBand. Ajusta la lectura completa de servicios/canciones, escritura de canciones por Editor y creación restringida de documentos de correo.

**No se incluyen ni se deben reemplazar** `src/firebase.js`, `src/firebase-config.js`, `netlify.toml`, `package.json`, `.env` ni el logo/`index.html`. No hay migración de colecciones ni de documentos de canciones/servicios.

## 1. Respaldo primero

1. Abre el repositorio de PlanningBand en GitHub.
2. Comprueba que el último despliegue bueno existe en Netlify.
3. En GitHub, crea un commit de respaldo o duplica la rama antes de editar.
4. No elimines el sitio de Netlify ni el proyecto Firebase.

## 2. Actualizar solo los dos archivos de la aplicación

1. Descomprime el ZIP.
2. En el repositorio, abre `src/main.jsx` y reemplaza su contenido con `src/main.jsx` del ZIP.
3. Abre `src/styles.css` y reemplaza su contenido con `src/styles.css` del ZIP.
4. No subas el ZIP como un archivo dentro del repositorio: usa los archivos descomprimidos en las mismas rutas.
5. Haz `Commit changes` y deja que Netlify compile desde el repositorio. No cambies variables de entorno por este parche.

## 3. Actualizar las reglas de Firestore (necesario para los permisos nuevos)

Las reglas son independientes del código del sitio; no se publican por Netlify.

1. Firebase Console → tu proyecto → **Build → Firestore Database → Rules**.
2. Copia el contenido actual a un archivo de respaldo antes de editar.
3. Abre `firestore.rules.updated.txt` en el ZIP.
4. Si las reglas actuales son las mismas que el archivo base de PlanningBand que venía en la instalación anterior, puedes pegar el archivo actualizado completo en el editor de Rules y pulsar **Publish**.
5. Si agregaste reglas propias o tus reglas se ven diferentes, **no reemplaces todo a ciegas**. Integra solo estos cambios en las coincidencias existentes:
   - `/services/{serviceId}`: `allow read: if hasAccess();` (todos los usuarios activos pueden consultar servicios; crear/editar/eliminar sigue limitado a Administrador/Editor).
   - `/songs/{songId}`: `allow read: if hasAccess();`, `allow create, update: if isAdmin() || isEditor();`, `allow delete: if isAdmin();`.
   - Añade el bloque `match /mail/{mailId}` del archivo de reglas. Solo permite encolar citaciones y avisos de declinación bajo condiciones comprobadas; la aplicación no puede leer, actualizar ni borrar la cola.
6. Pulsa **Publish** y comprueba que Firebase acepte las reglas. No pruebes permisos usando datos reales hasta que Firebase confirme que las reglas fueron publicadas.

Estos cambios son necesarios: ocultar botones en React no basta para permisos reales. Las reglas de Firestore deben permitir al Visor leer los servicios/canciones, pero seguir limitando sus respuestas al servicio que tiene asignado.

## 4. Configurar el envío real de correo

El frontend **encola** un documento en Firestore; eso por sí solo no entrega un correo. Para entregar los mensajes hace falta un procesador de correo en servidor.

La integración incluida usa el formato compatible con la extensión **Trigger Email from Firestore**, que escucha una colección configurada y envía el contenido de `to` y `message.subject/text/html`.

Documentación oficial: https://firebase.google.com/docs/extensions/official/firestore-send-email

Si la tienes instalada:
- Confirma que la colección que escucha se llame exactamente `mail`.
- Confirma que SMTP esté configurado y que tenga un remitente autorizado.
- Después de una prueba, abre Firestore → colección `mail` y revisa el campo de estado/entrega que añade la extensión.

Si no la tienes instalada, necesitarás configurar un proveedor SMTP y un procesador. No publiques credenciales SMTP en React, GitHub ni en variables `VITE_*`; son secretos de servidor.

**Plan de continuidad:** Firebase ha anunciado el cierre del servicio administrado de Extensions el 31 de marzo de 2027. Las extensiones ya instaladas deben seguir ejecutándose, pero perderán las capacidades de administración/reconfiguración desde esa fecha. Para una solución duradera, planifica migrar el envío de correo a una Cloud Function o Function Kit antes del cierre: https://firebase.google.com/docs/extensions/faq-and-troubleshooting

## 5. Cómo usar las nuevas funciones

### Convocatorias
- Entra en el servicio → **Equipos**.
- Usa **Convocar por lote** para seleccionar integrantes y definir la posición; al guardar, el sistema encola un correo individual por persona.
- Para reenviar solo a una persona, usa el icono del sobre en su fila.
- El asunto es `Citación PlanningBand`; incluye nombre, servicio, fecha, horario, posición y enlace a la aplicación.
- El integrante inicia sesión y en sus servicios ve **Aceptar convocatoria** o **Declinar**. Declinar requiere un motivo. El semáforo se muestra como verde (aceptó), amarillo (pendiente), rojo (declinó).
- El rechazo se registra en Firestore; también se encola un aviso al correo administrativo asociado al servicio/respuesta, siempre que el procesador de correo esté configurado.

### Canciones
- En **Orden del servicio**, pulsa **Agregar canción** para desplegar el catálogo entero; puedes filtrar por nombre/artista/tema y agregar una tonalidad.
- En el formulario de canción, usa las etiquetas temáticas sugeridas o agrega otras separadas por comas.
- En la biblioteca, filtra por tema/tonalidad. Si una búsqueda no devuelve canciones, aparecen enlaces externos de búsqueda a La Cuerda y Cifra Club.

### Permisos Visor
- Puede consultar todas las canciones y todos los servicios.
- Solo puede aceptar o declinar convocatorias donde su `personId` figure en `invitedPersonIds`.
- No obtiene acceso a la administración de personas, equipos o plantillas.

## 6. Pruebas antes de darlo por terminado

1. Inicia sesión como Administrador y confirma que puedes ver/editar servicios y canciones.
2. Crea/edita una canción con dos etiquetas y verifica el filtro por tema.
3. Abre un servicio → Orden → **Agregar canción**. La lista debe mostrar todas las canciones disponibles sin escribir una búsqueda.
4. En Equipos, selecciona un único integrante y guarda/encola la citación. Revisa la colección `mail` y el correo recibido.
5. Repite con varios integrantes desde convocatoria por lote.
6. Inicia sesión con una cuenta Visor: debe ver todo el calendario y el catálogo, pero solo responder en su citación asignada.
7. Declina una citación sin motivo: no debe dejar avanzar. Luego escribe un motivo, declina y comprueba el semáforo rojo y el correo al administrador.
8. Verifica que los roles Editor/Visor respeten las reglas. Si un query devuelve `Missing or insufficient permissions`, revisa las reglas publicadas y el documento `memberAccess` del usuario.

No he podido ejecutar un despliegue de producción en tus cuentas desde aquí. Esta entrega mantiene los archivos de configuración fuera del ZIP y requiere aplicar las reglas y el procesador de correo descritos arriba.
