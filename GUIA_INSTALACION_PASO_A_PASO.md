# Guía de instalación paso a paso — Alabanza

Esta guía indica **dónde hacer clic, qué valor copiar y dónde pegarlo** para publicar Alabanza con GitHub, Netlify y Firebase. No necesitas crear el código: ya está dentro de este paquete.

> **Importante:** no se puede conectar a tus cuentas desde este archivo. Debes iniciar sesión en GitHub, Netlify y Firebase con tus propias cuentas y completar los pasos. No compartas contraseñas, códigos de verificación ni archivos de cuenta de servicio.

## Antes de comenzar

Ten abiertas estas páginas en pestañas separadas:

- GitHub: <https://github.com>
- Netlify: <https://app.netlify.com>
- Firebase Console: <https://console.firebase.google.com>
- Documentación oficial de Firebase para aplicaciones web: <https://firebase.google.com/docs/web/setup>

Necesitarás acceso de administrador a los tres servicios. **Usa el proyecto de Firebase que quieras dedicar a Alabanza.** Si ese proyecto de Firebase ya lo usa otra aplicación, no reemplaces sus reglas sin revisarlas: lo más seguro es crear un proyecto Firebase independiente para Alabanza.

---

## Parte 1. Subir el código a GitHub

La forma más segura para alguien que no trabaja habitualmente con código es usar GitHub Desktop, porque conserva la conexión del repositorio y carga también las carpetas y archivos de configuración.

### 1.1 Identifica el repositorio que Netlify ya utiliza

1. Abre <https://app.netlify.com> e inicia sesión.
2. Haz clic en el sitio de Alabanza. Si todavía no tiene nombre, abre el sitio que está conectado al repositorio que quieres utilizar.
3. Entra en **Project configuration** (Configuración del proyecto).
4. Busca **Build & deploy** y después la sección **Continuous deployment** o **Repository**. Allí debe aparecer el proveedor y nombre del repositorio de GitHub conectado.
5. Anota el nombre del repositorio. No cambies todavía la configuración de compilación.

Si no aparece ningún repositorio conectado, detente antes de seguir: primero habrá que conectar el sitio de Netlify al repositorio correcto.

### 1.2 Instala GitHub Desktop y clona el repositorio

1. Descarga GitHub Desktop desde <https://desktop.github.com/> e instálalo.
2. Abre GitHub Desktop e inicia sesión con la misma cuenta que tiene acceso al repositorio.
3. En el menú superior, selecciona **File → Clone repository…**.
4. Abre la pestaña **GitHub.com**, busca el repositorio que identificaste en el paso anterior y selecciónalo.
5. En **Local path**, elige una carpeta fácil de encontrar, por ejemplo `Documentos/Alabanza`. Haz clic en **Clone**.
6. GitHub Desktop descargará el contenido del repositorio a esa carpeta.

### 1.3 Copia los archivos de Alabanza a la carpeta clonada

1. Descarga `Alabanza_Gestion_Iglesia_Final_Produccion.zip` desde el enlace entregado en este chat.
2. En Finder (Mac) o Explorador de archivos (Windows), descomprime el ZIP. Dentro verás archivos como `index.html`, `package.json`, `netlify.toml`, `firestore.rules` y la carpeta `src`.
3. Abre la carpeta del repositorio que clonaste con GitHub Desktop.
4. Copia **el contenido del ZIP directamente dentro de la carpeta del repositorio**, no una carpeta extra llamada `Alabanza` dentro de otra. Al final, `package.json` y `index.html` deben quedar en el nivel principal del repositorio y debe existir `src/main.jsx`.
5. Si el sistema pregunta si quieres reemplazar archivos, confirma solamente si estás seguro de que el repositorio está dedicado a esta aplicación. Si tiene archivos de otra aplicación, realiza una copia de seguridad antes de reemplazarlos.
6. No borres la carpeta oculta `.git` de la carpeta del repositorio: GitHub Desktop la necesita para mantener la conexión. El ZIP de Alabanza no debe aportar otra carpeta `.git`.
7. Comprueba que también se copiaron los archivos ocultos `.env.example`, `.gitignore` y `.nvmrc`. Si no los ves en Mac, en Finder pulsa **Command + Shift + punto** para mostrar archivos ocultos.
8. Vuelve a GitHub Desktop. En la pestaña **Changes** verás los archivos nuevos o modificados.
9. En la parte inferior izquierda, en **Summary**, escribe `Instalar aplicación Alabanza`.
10. Haz clic en **Commit to main** (o en el nombre de la rama que corresponda) y después en **Push origin** para enviar los cambios a GitHub.

### 1.4 Comprueba que Netlify recibe los cambios

1. Vuelve a <https://app.netlify.com> y abre el sitio conectado al repositorio.
2. Entra en **Deploys**.
3. Debe aparecer un nuevo despliegue iniciado por el cambio de GitHub. Espera a que el estado indique **Published**.
4. Si el despliegue falla, abre el despliegue fallido y consulta **Deploy log**. No sigas a las pruebas hasta corregir el error.

El código ya incluye `netlify.toml`, donde se indican el comando de compilación `npm run build` y la carpeta de publicación `dist`.

---

## Parte 2. Registrar la aplicación web en Firebase

### 2.1 Abre el proyecto correcto

1. Entra a <https://console.firebase.google.com>.
2. Selecciona el proyecto que vas a usar para Alabanza.
3. Revisa el nombre que aparece en la parte superior. Asegúrate de no estar editando el proyecto de otra aplicación.

### 2.2 Registra una aplicación web

1. En el menú de Firebase, haz clic en el engranaje **⚙️ junto a “Project Overview”** y selecciona **Project settings** (Configuración del proyecto).
2. En la pestaña **General**, baja hasta **Your apps** (Tus aplicaciones).
3. Si ya aparece una aplicación con el icono web `</>`, haz clic en ella y busca la configuración del SDK. Puedes reutilizar sus valores si pertenece al proyecto correcto.
4. Si no hay aplicación web, haz clic en el icono **Web `</>`** para agregar una.
5. En **App nickname**, escribe `Alabanza web`.
6. Haz clic en **Register app** (Registrar aplicación). No necesitas configurar Firebase Hosting para usar Netlify.
7. En la pantalla de configuración del SDK, localiza el bloque `firebaseConfig`. Se verá parecido a este ejemplo:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "mi-proyecto.firebaseapp.com",
  projectId: "mi-proyecto",
  storageBucket: "...",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

8. Copia los valores reales de `apiKey`, `authDomain`, `projectId`, `messagingSenderId` y `appId`. No copies las palabras del ejemplo: son datos ficticios.
9. Al terminar, puedes volver a **Project settings → General → Your apps** para encontrar esta configuración cuando la necesites.

**No es necesario activar Storage ni copiar `storageBucket`**. Alabanza no utiliza Firebase Storage.

### 2.3 Activa el inicio de sesión por correo y Google

1. En el menú lateral, dentro de **Build**, selecciona **Authentication**.
2. Si es la primera vez que entras, haz clic en **Get started**.
3. Abre la pestaña **Sign-in method** (Método de acceso) o la sección **Providers**.
4. Selecciona **Email/Password**.
5. Activa la opción **Email/Password** y pulsa **Save**. No es necesario activar “Email link / passwordless sign-in”.
6. Vuelve a la lista de proveedores, selecciona **Google**, activa **Enable**, elige un **Project support email** (correo de soporte) y pulsa **Save**.

La pantalla de acceso de Alabanza presenta las dos opciones. Aunque Google esté habilitado, un integrante normal no podrá entrar a los datos hasta que el administrador le haya creado un perfil activo en Firestore.

### 2.4 Autoriza el dominio de Netlify en Firebase Authentication

1. Dentro de **Authentication**, abre **Settings** (Configuración).
2. Busca la sección **Authorized domains** (Dominios autorizados).
3. Haz clic en **Add domain** (Agregar dominio).
4. Entra a Netlify en otra pestaña, abre tu sitio y copia su dominio público, por ejemplo `alabanza-ejemplo.netlify.app`.
5. Pega únicamente el dominio, **sin `https://`, sin rutas y sin barras**, y guarda.
6. Si tienes un dominio propio, repite el proceso con ese dominio, por ejemplo `alabanza.tuiglesia.cl`.
7. Para desarrollo en tu computador, añade `localhost` si no aparece ya en la lista.

Esto permite que Firebase Authentication funcione desde el dominio donde se abrirá la aplicación.

---

## Parte 3. Preparar Cloud Firestore y publicar las reglas

### 3.1 Crea o abre la base de datos

1. En Firebase Console, ve al menú lateral **Build → Firestore Database**.
2. Si ya existe una base de datos para Alabanza, abre esa base y ve a la sección **Rules** (Reglas). No crees otra sin motivo.
3. Si todavía no existe, haz clic en **Create database** (Crear base de datos).
4. Elige la edición **Standard**, si se muestra esa opción, y continúa.
5. Selecciona el modo de seguridad de producción si se pregunta por el modo inicial. No dejes reglas públicas de prueba para una app con datos personales.
6. Selecciona la ubicación de la base de datos y confirma la creación. Elige con cuidado: la ubicación de una base ya creada no se puede cambiar fácilmente.

### 3.2 Publica las reglas de seguridad incluidas

**Este paso afecta a todos los datos protegidos por las reglas de esa base de datos.** Si el proyecto Firebase también lo usa otra aplicación, no pegues estas reglas encima de las existentes: usa un proyecto independiente o pide integrar ambas reglas primero.

1. En el ZIP descomprimido, abre el archivo `firestore.rules` con un editor de texto (por ejemplo Visual Studio Code o Bloc de notas).
2. Selecciona todo el texto del archivo y cópialo.
3. En Firebase Console abre **Build → Firestore Database → Rules**.
4. Antes de cambiar nada, copia el texto de las reglas que ya aparecen en esa pantalla y guárdalo en un archivo de respaldo fuera del repositorio.
5. Si has confirmado que esta base será exclusiva de Alabanza, reemplaza el contenido del editor por el texto de `firestore.rules`.
6. Pulsa **Publish** (Publicar) y espera la confirmación.

No reemplaces las reglas por una regla abierta como `allow read, write: if true;`. Las reglas incluidas restringen el acceso según el usuario autenticado y su perfil.

---

## Parte 4. Configurar las variables de Firebase en Netlify

Esta es una de las partes más importantes. Si los nombres o los valores no coinciden, Alabanza mostrará la pantalla **“Conecta tu espacio de trabajo”**.

### 4.1 Abre la pantalla exacta de variables

1. Abre <https://app.netlify.com> e inicia sesión.
2. En el listado de sitios, haz clic en el sitio de Alabanza.
3. Entra en **Project configuration** (Configuración del proyecto).
4. En el menú de configuración selecciona **Environment variables** (Variables de entorno). En algunas vistas puede estar dentro de la configuración del proyecto.
5. Haz clic en **Add a variable** (Agregar variable) y selecciona la opción para crear una variable manualmente.

### 4.2 Crea estas cinco variables, una por una

En cada variable, pega exactamente el nombre de la primera columna en **Key/Name** y pega el valor de Firebase correspondiente en **Value**. No agregues comillas ni espacios al inicio o final.

| Nombre que debes poner en Netlify | Valor que debes copiar desde `firebaseConfig` |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

Para cada variable:

1. En **Key** pega, por ejemplo, `VITE_FIREBASE_API_KEY`.
2. En **Value** pega el valor real de `apiKey` obtenido de Firebase.
3. Si la pantalla pregunta por **Scopes**, asegúrate de que incluya **Builds** porque Vite lee estas variables durante la compilación. Si permite todos los contextos de despliegue, usa esa opción para que estén disponibles en producción y en las vistas previas.
4. Pulsa **Create variable** o **Save**.
5. Repite hasta tener las cinco variables de la tabla.

No crees una variable llamada `firebaseConfig` ni pegues el bloque completo de JavaScript. Tampoco agregues `storageBucket`: no se usa.

### 4.3 Vuelve a desplegar el sitio

Los cambios de variables de entorno no se aplican a una versión ya compilada. Después de guardar las cinco variables:

1. En el panel del sitio de Netlify, abre **Deploys**.
2. Pulsa **Trigger deploy**.
3. Selecciona **Deploy site**. Si sigue leyendo valores antiguos, vuelve y utiliza **Clear cache and deploy site** si esa opción está disponible.
4. Espera hasta que el despliegue indique **Published**.
5. Haz clic en **Open production deploy** o abre la URL pública del sitio.

Si todo está bien, debe aparecer el formulario de inicio de sesión de Alabanza, no la pantalla de configuración inicial.

---

## Parte 5. Crear la primera cuenta Administrador

La primera persona administradora se autoriza una única vez desde Firebase Console. Esto evita que cualquier persona pueda registrarse sola y autoconcederse permisos.

### 5.1 Crea la cuenta en Firebase Authentication

Primero decide qué método usará esa cuenta:

**Opción A — Correo y contraseña**

1. En Firebase Console abre **Build → Authentication → Users** (Usuarios).
2. Pulsa **Add user** (Agregar usuario).
3. Escribe el correo del administrador en minúsculas, por ejemplo `admin@tuiglesia.cl`.
4. Escribe una contraseña temporal robusta y guárdala de forma segura solo para completar esta configuración.
5. Pulsa **Add user**.
6. Más adelante, cuando el inicio de sesión esté funcionando, entra con esa cuenta y cambia la contraseña si lo necesitas. No compartas la contraseña temporal con los integrantes.

**Opción B — Cuenta Google**

No hace falta crearla manualmente. Asegúrate de haber habilitado Google en el paso 2.3. Crea primero los documentos de autorización del siguiente apartado y después abre la aplicación y pulsa **Continuar con Google** utilizando ese correo.

### 5.2 Crea el perfil de la persona en Firestore

1. En Firebase Console abre **Build → Firestore Database → Data** (Datos).
2. Pulsa **Start collection** (Iniciar colección). Si ya hay datos, busca el botón para iniciar una colección nueva.
3. En **Collection ID**, escribe exactamente `people` y pulsa **Next**.
4. Cuando solicite el identificador del documento, selecciona **Custom ID** (ID personalizado) y escribe `admin-01`.
5. Añade estos campos. Usa el tipo indicado en cada fila:

| Field (nombre exacto) | Type (tipo) | Valor |
|---|---|---|
| `id` | string | `admin-01` |
| `firstName` | string | `Nombre` |
| `lastName` | string | `Administrador` |
| `email` | string | correo real del administrador, en minúsculas |
| `role` | string | `Administrador` |
| `status` | string | `Activo` |
| `instruments` | array | vacío (opcional) |
| `teams` | array | vacío (opcional) |

6. Pulsa **Save** (Guardar). Si la consola no te permite guardar un array vacío, omite `instruments` y `teams`; la aplicación los tratará como listas vacías.

### 5.3 Crea el documento de permisos

1. Permanece en **Firestore Database → Data**.
2. Pulsa **Start collection** y escribe exactamente `memberAccess` como ID de la colección.
3. Para **Document ID**, selecciona **Custom ID** y pega el correo real del administrador en minúsculas, por ejemplo `admin@tuiglesia.cl`. El ID debe ser el correo completo, sin espacios.
4. Crea estos campos:

| Field (nombre exacto) | Type (tipo) | Valor |
|---|---|---|
| `email` | string | el mismo correo real, en minúsculas |
| `personId` | string | `admin-01` |
| `role` | string | `Administrador` |
| `active` | boolean | `true` |

5. Pulsa **Save**.

Comprueba que `memberAccess.personId` sea exactamente igual al ID del documento de la persona (`people/admin-01`) y que el correo sea igual al correo usado para iniciar sesión. El campo `active` debe ser de tipo booleano y estar marcado como verdadero, no como texto.

### 5.4 Entra a la aplicación

1. Abre la URL pública de Alabanza en Netlify.
2. Para correo/contraseña, escribe el correo y la contraseña creados en Authentication. Para Google, pulsa **Continuar con Google** y selecciona el mismo correo registrado en `memberAccess`.
3. Si aparece **“Tu cuenta aún no tiene permisos”**, verifica que el documento `memberAccess` esté escrito correctamente, que el ID sea el correo exacto en minúsculas, y que `active` sea booleano `true`.
4. Si aparece un error al cargar datos, revisa si publicaste las reglas correctas en el proyecto Firebase correcto.

---

## Parte 6. Dar acceso a los demás integrantes

Una vez dentro con la cuenta Administrador, ya no necesitas crear los perfiles de los demás a mano en Firestore.

1. En la aplicación, abre **Personas y permisos**.
2. Pulsa **Nuevo integrante**.
3. Completa nombre, apellido, correo electrónico y teléfono si corresponde.
4. Selecciona su rol: **Administrador**, **Editor** o **Visor**. Asigna también sus instrumentos y equipos.
5. Pulsa **Guardar integrante**.
6. Busca al integrante en la lista y vuelve a abrir su ficha de edición.
7. En la zona **Acceso de la persona**, pulsa **Enviar enlace de acceso**.
8. La app creará la cuenta de autenticación si todavía no existe y enviará un correo de Firebase para establecer/restablecer la contraseña. La persona debe revisar la bandeja de entrada y spam.
9. Cuando abra la URL de Alabanza e inicie sesión con ese correo, la aplicación reconocerá el rol configurado.

Si cambias un correo existente, vuelve a comprobar que el documento de acceso corresponda al correo nuevo. Para bloquear a alguien, cambia su estado a **Inactivo** desde el panel de administración.

### Qué puede ver cada rol

- **Administrador:** administra toda la aplicación, los tipos de servicio, personas, permisos, canciones y servicios.
- **Editor:** prepara servicios y equipos, con los límites de edición definidos por la aplicación y las reglas.
- **Visor:** solo debe ver los servicios en que está convocado, la fecha, su posición, las canciones asociadas y sus propias respuestas de asistencia.

Prueba los roles con cuentas diferentes. No pruebes los permisos del Visor desde la sesión del administrador, porque la sesión administrativa tiene acceso más amplio.

---

## Parte 7. Uso de canciones y PDF sin Firebase Storage

Alabanza no necesita Firebase Storage ni un bucket para archivos.

- Si escribes la letra y los acordes en la aplicación, esos datos se guardan como texto en Firestore.
- Para abrir una vista imprimible, permite las ventanas emergentes del sitio si el navegador las bloquea. En la ventana que se abre, elige **Guardar como PDF** en el diálogo de impresión.
- Si ya tienes PDFs, súbelos a un servicio que ya utilices, como Google Drive o OneDrive, y pega el enlace compartido y la tonalidad en la ficha de la canción.
- Comprueba el acceso al enlace desde una cuenta distinta a la tuya. No guardes contraseñas o enlaces privados que solo funcionen con tu sesión personal.

Los enlaces de WhatsApp y correo para convocatorias abren mensajes preparados; el administrador debe pulsar enviar dentro de la aplicación externa. No se envían mensajes masivos automáticamente.

---

## Parte 8. (Opcional) Ejecutarla en tu computador antes de publicar

Solo necesitas esta parte si quieres probarla localmente. Si la vas a publicar directamente desde GitHub y Netlify, puedes omitirla.

1. Instala Node.js 20 o una versión compatible desde <https://nodejs.org/>.
2. Abre la carpeta del repositorio en tu computador.
3. Abre Terminal (Mac) o PowerShell (Windows) dentro de esa carpeta.
4. Copia `.env.example` a un archivo nuevo llamado `.env.local`.
   - En Mac/Linux puedes ejecutar: `cp .env.example .env.local`.
   - En Windows PowerShell puedes ejecutar: `Copy-Item .env.example .env.local`.
5. Abre `.env.local` con un editor de texto. Sustituye los valores de ejemplo con los cinco valores reales de la sección 2.2. Guarda el archivo.
6. En Terminal/PowerShell, ejecuta:

```bash
npm install
npm run dev
```

7. Abre la URL local que muestra Vite en la terminal (normalmente `http://localhost:5173`).
8. Para probar una compilación de producción en tu computador, detén el servidor y ejecuta `npm run build`. Debe crear una carpeta `dist`.

**No subas `.env.local` a GitHub.** Está excluido por `.gitignore`. Para el sitio publicado, configura las variables en Netlify tal como indica la Parte 4.

---

## Solución de problemas frecuentes

| Qué ves | Qué revisar |
|---|---|
| Aparece “Conecta tu espacio de trabajo” | Falta alguna variable de Netlify o tiene un nombre/valor incorrecto. Verifica las cinco variables y vuelve a desplegar. |
| Netlify muestra **Failed** en Deploys | Abre el despliegue y revisa **Deploy log**. Confirma que `package.json`, `index.html` y la carpeta `src` están en la raíz del repositorio. |
| Puedes iniciar sesión, pero dice “Tu cuenta aún no tiene permisos” | Revisa `memberAccess`, el ID con el correo en minúsculas, `personId`, `role` y `active: true`. |
| Sale “No se pudo cargar…” o “Missing or insufficient permissions” | Comprueba que las reglas publicadas sean las de Alabanza, que estén en el mismo proyecto que usa la app y que el perfil tenga el rol correcto. |
| El botón de Google falla | Comprueba que Google esté habilitado en Authentication → Sign-in method y que el dominio Netlify figure en Authentication → Settings → Authorized domains. |
| No llega el enlace de acceso | Revisa correo y spam, que Email/Password esté habilitado, que el dominio esté autorizado y que el correo en la ficha sea correcto. |
| Un PDF externo no se abre | Revisa que el enlace compartido funcione en una ventana privada o desde otra cuenta. La app no almacena ni repara PDFs externos. |

## Lista de comprobación antes de invitar a toda la banda

- [ ] El dominio Netlify abre el formulario de Alabanza.
- [ ] El administrador puede entrar y crear un tipo de servicio.
- [ ] El administrador puede crear una canción y abrir las vistas de letra/acordes.
- [ ] Se puede programar un servicio y asignar varias personas por lote.
- [ ] Llega el correo para definir/restablecer la contraseña de un nuevo integrante.
- [ ] Una cuenta Visor solo ve sus convocatorias, las canciones correspondientes y su respuesta.
- [ ] Al declinar, el Visor no puede enviar la respuesta sin motivo.
- [ ] El administrador ve la aceptación/declinación y el motivo.
- [ ] Los enlaces externos de PDF funcionan desde una segunda cuenta.
- [ ] Las reglas de Firestore fueron revisadas para no afectar datos de otra aplicación.

### Documentación oficial útil

- Firebase: registrar una aplicación web — <https://firebase.google.com/docs/web/setup>
- Firebase Authentication — <https://firebase.google.com/docs/auth/web/start>
- Cloud Firestore y reglas — <https://firebase.google.com/docs/firestore/security/get-started>
- Netlify: variables de entorno — <https://docs.netlify.com/build/environment-variables/get-started/>
