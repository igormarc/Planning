# Alabanza — Gestión de servicios de iglesia

Aplicación web React + Vite creada desde cero a partir de las referencias visuales compartidas. El diseño usa turquesa como color principal, tipografía ampliada y navegación adaptable a móvil.

## Qué incluye

- Calendario y servicios organizados por tipos/plantillas. Dentro de cada tipo se muestra la fecha escrita en español.
- Orden del servicio por secciones, canciones, tonalidad, duración y notas de ensayo.
- Equipos por instrumento/función y asignación de integrantes por lote.
- Biblioteca musical con letra y acordes en texto, tonalidad original, acordes transpuestos, enlaces a música/video y PDF externos con tonalidad identificada.
- PDFs de letra y acordes generados bajo demanda en el dispositivo del usuario mediante la función de imprimir/Guardar como PDF. No se guardan como archivos dentro de Firebase.
- Convocatorias individuales, confirmación/declinación obligatoria con motivo, estado visible para el administrador y atajos para abrir mensajes de WhatsApp o correo ya redactados.
- Roles Administrador, Editor y Visor, con reglas de Firestore incluidas para limitar lectura y escritura.
- Al editar un integrante existente, el administrador puede enviarle un enlace por correo de Firebase para crear o restablecer su contraseña. El perfil de acceso se autoriza desde el panel de administración.

## 1. Probar localmente sin credenciales

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre la dirección local indicada por Vite. Sin variables de Firebase, la app funciona en modo de demostración y guarda cambios en el navegador actual. Los datos de ese modo no se sincronizan con otros dispositivos.

## 2. Preparar Firebase sin Storage

Esta aplicación solo usa Firebase Authentication y Cloud Firestore. No importa Firebase Storage, no sube archivos ni requiere configurar un bucket.

1. En Firebase Console, selecciona el proyecto que usarás y registra una aplicación web.
2. En Authentication > Sign-in method, habilita **Email/Password**. Habilita **Google** también si quieres que la cuenta administradora pueda iniciar sesión con Google.
3. En Authentication > Settings > Authorized domains, agrega tu dominio de Netlify y el dominio personalizado, si tienes uno.
4. Crea o abre Firestore Database.
5. Copia `.env.example` como `.env.local` y completa los cinco valores de la aplicación web. En Netlify configura esas mismas variables en Site configuration > Environment variables.
6. **Respalda primero las reglas que ya tienes.** El archivo `firestore.rules` incluido es una base de seguridad específica para esta aplicación. Revísalo y fusiónalo cuidadosamente con tus reglas existentes antes de publicarlo; no reemplaces reglas de otra aplicación sin revisar el impacto.

### Dar de alta al primer administrador

La primera cuenta debe autorizarse una vez desde Firebase Console, ya que nadie puede darse permisos de administrador desde la pantalla de acceso:

1. Crea el usuario inicial en Authentication (con correo/contraseña) o inicia sesión con Google usando el correo que será administrador.
2. En Firestore crea un documento en la colección `people`, con un ID propio, por ejemplo `admin-01`, y estos campos (ajusta nombre y correo):

```json
{
  "id": "admin-01",
  "firstName": "Nombre",
  "lastName": "Administrador",
  "email": "admin@tuiglesia.cl",
  "role": "Administrador",
  "status": "Activo",
  "instruments": [],
  "teams": []
}
```

3. Crea un documento en `memberAccess` cuyo ID sea el correo del administrador en minúsculas (por ejemplo `admin@tuiglesia.cl`), con estos campos:

```json
{
  "email": "admin@tuiglesia.cl",
  "personId": "admin-01",
  "role": "Administrador",
  "active": true
}
```

El `personId` debe coincidir exactamente con el ID del documento en `people`. A partir de ahí, el administrador puede dar de alta integrantes desde la app. Cuando una persona está guardada, vuelve a abrir su ficha y pulsa **Enviar enlace de acceso**; Firebase creará su cuenta si aún no existe y enviará el correo para establecer/restablecer su contraseña. El administrador debe tener Email/Password habilitado para usar este flujo.

## 3. Reglas y roles

- **Administrador:** gestiona servicios, tipos, canciones, integrantes, roles y configuración.
- **Editor:** gestiona servicios y equipos, pero no administra roles ni modifica los detalles del repertorio.
- **Visor:** recibe solo los servicios donde está convocado, su posición, fecha, canciones y sus propias respuestas.

Las respuestas de asistencia se almacenan en documentos de `serviceResponses` por persona/servicio, para que un visor no pueda leer los motivos de otra persona. Los permisos reales de base de datos están en `firestore.rules`; las reglas deben publicarse y probarse en el proyecto correcto antes de usar la app en producción.

## 4. Enlaces a PDF sin Firebase Storage

Si ya tienes un PDF, súbelo a un lugar que ya uses (por ejemplo Drive u OneDrive) y pega un enlace compartido en la canción. Registra el tipo de documento y la tonalidad antes de añadirlo. Verifica que el enlace permita al equipo abrir el documento. Firebase guarda solamente la URL y los metadatos, no los bytes del PDF.

Para canciones ingresadas como texto, los PDF de letra y acordes se preparan al momento de abrirlos/ imprimirlos. Esto evita generar y guardar copias repetidas en Firebase. Las versiones transpuestas de acordes se guardan como texto, por lo que ocupan muy poco espacio.

## 5. Avisos por WhatsApp/correo y respuestas

Al convocar a varias personas, la app guarda los integrantes y posiciones en lote. En la ficha del servicio, cada contacto tiene accesos que abren WhatsApp o el cliente de correo con un mensaje preparado. Por diseño sin costo de mensajería, el administrador pulsa **Enviar** dentro de la aplicación elegida; no se envía WhatsApp o correo masivo en segundo plano.

Cada integrante autorizado ve la convocatoria al entrar a la app, puede aceptar o declinar y debe escribir un motivo al declinar. El estado y motivo aparecen al administrador para organizar un reemplazo.

## 6. Publicar en Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Configura las variables `VITE_FIREBASE_*` del archivo `.env.example` como variables de entorno en Netlify y vuelve a desplegar.
- Comprueba el dominio autorizado en Firebase Authentication y prueba los tres roles con cuentas distintas antes de usarlo oficialmente.

## Colecciones utilizadas

`services`, `songs`, `people`, `teams`, `serviceTypes`, `notes`, `memberAccess` y `serviceResponses`.
