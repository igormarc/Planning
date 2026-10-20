# Alabanza — Gestión de servicios de iglesia

Aplicación web creada desde cero inspirada funcionalmente en las capturas compartidas. Incluye planificación de servicios, orden del servicio, repertorio de canciones, equipos por instrumento, directorio de personas y permisos/roles.

## 1. Probar sin configurar Firebase

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre la dirección local que muestre Vite. Sin configuración de Firebase, la app entra en modo demostración y guarda los cambios en el almacenamiento local de ese navegador. Esa información no se sincroniza entre dispositivos.

## 2. Conectar Firebase

1. En Firebase Console, abre tu proyecto.
2. En Authentication > Sign-in method, habilita **Email/Password** y crea al menos un usuario en Authentication > Users.
3. En Project settings > General, registra una aplicación web si aún no tienes una y copia su configuración.
4. Copia `.env.example` a `.env.local` y rellena los seis valores `VITE_FIREBASE_*`.
5. En Firestore Database, crea la base de datos si aún no existe.
6. Revisa las reglas incluidas en `firestore.rules` y publícalas en Firestore Rules. Estas reglas son una base para un solo espacio compartido: cualquier persona autenticada en ese proyecto tiene acceso de lectura y escritura. No las uses sin revisar si necesitas permisos por rol o separar iglesias.
7. Si usarás adjuntos, habilita Firebase Storage y revisa/publica `storage.rules`. Las reglas de ejemplo permiten que cualquier usuario autenticado lea y escriba los archivos de servicio, con límite de 30 MB.
8. Ejecuta `npm run dev` de nuevo. Al detectar la configuración, la app solicitará inicio de sesión y guardará los registros en Firestore.

Los datos demo que están en el modo local no se copian automáticamente a Firestore. La app permite cargar datos de ejemplo desde el botón de datos de ejemplo en el menú Servicios cuando la nube está vacía.

## 3. Publicar en Netlify

En Netlify configura el repositorio de GitHub que contiene estos archivos. Build command: `npm run build`. Publish directory: `dist`.

En Site configuration > Environment variables, añade las mismas variables `VITE_FIREBASE_*` de `.env.local`, verifica que `VITE_FIREBASE_STORAGE_BUCKET` corresponda al bucket de tu proyecto si usarás adjuntos, vuelve a desplegar y verifica que Firebase Authentication tenga habilitado el dominio de tu sitio Netlify en Authentication > Settings > Authorized domains.

## Colecciones de Firestore

`services`, `songs`, `people`, `teams`, `serviceTypes`, `notes`.

## Contenido de esta primera versión

- Autenticación Firebase por correo y contraseña cuando hay configuración; modo demo local si no la hay.
- Calendario y servicios próximos.
- Crear, editar y eliminar servicios y tipos de servicio.
- Orden de servicio con secciones, canciones, tonalidad, duración y reordenación.
- Equipos de músicos por instrumento y asignación de integrantes.
- Biblioteca de canciones con búsqueda, BPM, tonalidades, letra y acordes.
- Directorio de personas con roles, equipos, contacto y permisos.
- Notas del servicio y pestaña de ensayo.

Los adjuntos de servicios se suben a Firebase Storage cuando la aplicación tiene configurado `VITE_FIREBASE_STORAGE_BUCKET`. Se incluye una regla base en `storage.rules`, con un máximo de 30 MB por archivo. Revisa esas reglas con los permisos de tu iglesia antes de publicarlas.
