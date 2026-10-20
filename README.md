# Alabanza — Gestión de servicios de iglesia

Aplicación React + Vite creada a partir de las referencias visuales compartidas. Usa turquesa como color principal, tipografía ampliada y navegación adaptada a móviles.

## Instalación y conexión

**Empieza por la guía detallada:** [GUIA_INSTALACION_PASO_A_PASO.md](./GUIA_INSTALACION_PASO_A_PASO.md). Incluye los nombres exactos de los menús y botones de Firebase, Netlify y GitHub, cómo copiar cada variable, cómo publicar las reglas y cómo crear el primer administrador desde Firestore.

## Qué incluye

- Calendario y servicios organizados por tipos y plantillas.
- Orden del servicio con canciones, tonalidad, duración y notas.
- Equipos por instrumento/función y asignación de integrantes por lote.
- Biblioteca musical con letra y acordes en texto, tonalidad original, acordes transpuestos, enlaces a música/vídeo y referencias a PDF externos.
- Vistas imprimibles para generar PDF bajo demanda en el dispositivo, sin almacenar copias en Firebase.
- Convocatorias individuales, respuestas aceptar/declinar con motivo obligatorio y mensajes preparados de WhatsApp/correo.
- Roles Administrador, Editor y Visor, con reglas de Firestore en `firestore.rules`.
- Enlace por correo de Firebase para que los integrantes establezcan o restablezcan su contraseña.

## Configuración técnica

- Requiere Node.js 20 o superior.
- Variables necesarias: las cinco `VITE_FIREBASE_*` que aparecen en `.env.example`.
- Build command para Netlify: `npm run build`.
- Publish directory: `dist`.
- No se usa Firebase Storage.

## Antes de publicar

El código fuente no contiene credenciales de tus cuentas ni significa que la app ya esté desplegada dentro de ellas. Debes completar la configuración de Firebase y Netlify. Revisa cuidadosamente `firestore.rules` antes de publicarlas; no reemplaces las reglas de un proyecto compartido con otra aplicación sin respaldarlas y revisar el impacto.

Una vez conectada, crea la primera cuenta Administrador según la guía. Los demás usuarios se gestionan desde **Personas y permisos**.
