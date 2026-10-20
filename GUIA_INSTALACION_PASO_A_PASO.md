# Guía de instalación limpia de Alabanza

Esta versión evita por completo las variables de entorno de Netlify. La configuración de Firebase se realiza en un único archivo del código: `src/firebase-config.js`. **No borres el proyecto Firebase ni sus datos existentes.**

## A. Obtener los cinco valores de Firebase

1. Abre https://console.firebase.google.com/ y selecciona el proyecto que ya usas para Alabanza.
2. En la esquina superior izquierda, pulsa el engranaje junto a **Project Overview / Descripción general del proyecto**.
3. Entra en **Project settings / Configuración del proyecto**.
4. En la pestaña **General**, baja a **Your apps / Tus aplicaciones**.
5. Selecciona la aplicación web que registraste para Alabanza. Si no aparece una aplicación web, pulsa el icono `</>` para registrar una, escribe `Alabanza Web` como apodo y completa el registro. No necesitas habilitar Firebase Hosting.
6. En **SDK setup and configuration**, selecciona **Config** (no npm). Firebase mostrará algo parecido a esto:

```js
const firebaseConfig = {
  apiKey: "valor",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

Copia solo los valores entre comillas de `apiKey`, `authDomain`, `projectId`, `messagingSenderId` y `appId`. No copies las comillas. No necesitas Firebase Storage para esta aplicación.

## B. Pegar los valores en el archivo exacto

1. Abre tu repositorio de GitHub conectado a Alabanza.
2. En la lista de carpetas, entra en **src**.
3. Abre **firebase-config.js** y pulsa el lápiz **Edit this file**. Si el archivo no existe, esta versión del código no se ha subido correctamente todavía.
4. Verás este bloque:

```js
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  messagingSenderId: '',
  appId: '',
}
```

5. Reemplaza cada par de comillas vacío con el valor que corresponde, manteniendo las comillas. Ejemplo ficticio de formato: `apiKey: 'AIza...'`. Usa tus valores reales; los del ejemplo son ilustrativos.
6. No cambies los nombres a la izquierda de los dos puntos. No pegues el bloque completo de Firebase dentro de este objeto: pega cada valor en el campo correspondiente.
7. Baja a **Commit changes**. Escribe un mensaje como `Configura Firebase para Alabanza` y vuelve a pulsar **Commit changes** para guardar.

Esta configuración web puede estar en el frontend. No pongas contraseñas, tokens de administración ni claves de cuentas de servicio. La seguridad de los datos debe estar en Firebase Authentication y en las reglas de Firestore.

## C. Asegurar que Netlify publique ese código

1. Abre https://app.netlify.com/ y selecciona el sitio de Alabanza.
2. Entra en **Project configuration → Build & deploy → Continuous deployment** (los nombres pueden variar ligeramente).
3. Confirma que el repositorio conectado sea el mismo que acabas de editar y que la rama de producción sea la rama donde guardaste `firebase-config.js`, por ejemplo `main`.
4. Abre **Deploys**. Busca el despliegue más reciente; debe corresponder al commit `Configura Firebase para Alabanza`.
5. Si el despliegue no comenzó automáticamente, pulsa **Trigger deploy → Deploy site**. No hace falta crear variables de entorno.
6. Espera el estado **Published** y abre el sitio. Recarga forzadamente con `Ctrl + Shift + R`.

Si la pantalla sigue diciendo configuración inicial, revisa que el último despliegue incluya el commit correcto y que los cinco valores del archivo no estén vacíos. Esta versión ya no lee variables `VITE_*` de Netlify.

## D. Verificar Firebase Authentication

1. En Firebase Console, abre **Build → Authentication → Sign-in method** (o pestaña **Sign-in method / Método de acceso**).
2. Activa **Email/Password** y guarda. Habilita Google solo si deseas utilizar acceso con Google.
3. En Authentication, abre **Settings → Authorized domains / Dominios autorizados**. Comprueba que esté el dominio público que Netlify asignó a tu sitio, sin `https://` ni rutas.
4. En **Authentication → Users**, verifica que el correo del administrador esté creado. Crear un perfil en Firestore no crea la cuenta de acceso.

## E. Verificar el perfil del administrador en Firestore

En **Build → Firestore Database → Data**, confirma que exista:

**Colección `people`, documento `admin-01`** (o el ID real que hayas usado), con al menos estos campos:

| Campo | Tipo en Firestore | Ejemplo de valor |
|---|---|---|
| `id` | string | `admin-01` |
| `firstName` | string | Tu nombre |
| `lastName` | string | Tu apellido |
| `email` | string | Tu correo de acceso en minúsculas |
| `role` | string | `Administrador` |
| `status` | string | `Activo` |

**Colección `memberAccess`, documento cuyo ID es el correo del administrador en minúsculas**, con estos campos:

| Campo | Tipo en Firestore | Ejemplo de valor |
|---|---|---|
| `email` | string | El mismo correo de acceso |
| `personId` | string | `admin-01` (el ID real del documento de `people`) |
| `role` | string | `Administrador` |
| `active` | boolean | `true` (booleano, no texto) |

El correo de `memberAccess`, el campo `email` y el correo de Firebase Authentication deben coincidir exactamente, en minúsculas. `personId` debe coincidir con el ID del perfil en `people`.

## F. Si todavía no funciona

No vuelvas a borrar ni recrear datos. Comprueba en este orden:

1. En GitHub, abre `src/firebase-config.js` y confirma que los cinco campos tienen valores.
2. En Netlify → Deploys, confirma que el último `Published` contiene el commit que acabas de guardar.
3. Si la pantalla inicial desaparece, pero falla el inicio de sesión, revisa Email/Password y el dominio autorizado en Authentication.
4. Si inicia sesión pero dice que no tiene permisos, revisa el documento `memberAccess` y su correspondencia con `people`.
5. Si aparece un error de permisos de Firestore, no abras las reglas de forma pública para “probar”. Revisa las reglas del proyecto y comparte el mensaje exacto del error sin credenciales.

## Nota sobre repositorios y proyectos

Si quieres hacer un reinicio de despliegue, puedes crear un repositorio GitHub y un sitio Netlify nuevos, pero conserva el mismo proyecto Firebase mientras no sepas si contiene datos útiles. No borres el proyecto, Authentication ni Firestore para corregir un problema de compilación.
