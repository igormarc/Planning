# Lista de comprobación antes del lanzamiento

## Configuración
- [ ] `src/firebase-config.js` contiene los cinco valores reales de la app web Firebase.
- [ ] El correo administrador existe en Firebase Authentication.
- [ ] Existe el documento de perfil en `people` y un documento `memberAccess` cuyo ID es el correo en minúsculas.
- [ ] Los campos `personId`, `role` y `active` coinciden con el perfil.
- [ ] Authentication tiene habilitado Email/Password y el dominio de Netlify está autorizado en los dominios autorizados.
- [ ] Las reglas de Firestore han sido revisadas para el proyecto concreto antes de publicarse.

## Despliegue
- [ ] GitHub contiene el archivo `src/firebase-config.js` actualizado.
- [ ] Netlify está conectado al repositorio y a la rama correctos.
- [ ] El último despliegue terminó en estado `Published`.
- [ ] El sitio ya no muestra la pantalla de configuración inicial.

## Pruebas funcionales
- [ ] El administrador puede iniciar sesión.
- [ ] Un usuario sin perfil activo no puede consultar datos de la aplicación.
- [ ] Un Visor solo consulta los servicios y canciones que tiene asignados.
- [ ] Las respuestas de convocatoria se guardan y una declinación requiere motivo.
- [ ] Crear/editar canciones y servicios persiste tras recargar la página.
- [ ] La interfaz se revisó en un teléfono.

No marques una prueba como completada hasta probarla en el sitio desplegado.
