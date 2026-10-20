# Alabanza — Gestión de servicios de iglesia

Aplicación React + Vite para administrar servicios, repertorio musical, equipos y convocatorias. Diseño turquesa y adaptado prioritariamente a móviles.

## Configuración de Firebase (sin variables de Netlify)

1. Abre `src/firebase-config.js`.
2. Completa los cinco valores de configuración de tu app web de Firebase.
3. Guarda el archivo y publica el cambio en GitHub. Netlify volverá a compilar el sitio automáticamente si está conectado al repositorio.

Guía detallada: [GUIA_INSTALACION_PASO_A_PASO.md](./GUIA_INSTALACION_PASO_A_PASO.md).

## Módulos incluidos

- Calendario y servicios organizados por tipos y plantillas.
- Orden del servicio con canciones, tonalidad, duración y notas.
- Equipos por instrumento/función y asignación de integrantes por lote.
- Biblioteca musical con letras y acordes como texto, tonalidades alternativas, enlaces a canciones y referencias a PDF externos.
- Vista imprimible para generar PDF bajo demanda, sin guardarlos en Firebase Storage.
- Convocatorias individuales, aceptación/declinación con motivo obligatorio y mensajes preparados para WhatsApp/correo.
- Roles Administrador, Editor y Visor, con reglas en `firestore.rules`.

## Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Node.js: 20 o superior
- Ya no requiere configurar variables `VITE_*` en Netlify.

## Importante

No elimines tu proyecto Firebase para reiniciar el despliegue. La configuración de la app web no es una contraseña; la seguridad depende de Authentication y reglas de Firestore. Antes de publicar reglas, revisa si el proyecto Firebase comparte datos con otra aplicación. La cuenta del primer administrador debe existir en Firebase Authentication y tener los documentos de perfil/permisos requeridos por el código.
