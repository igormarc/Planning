# Lista de salida a producción — Alabanza

Esta lista debe completarse después de conectar las variables reales de Firebase y publicar las reglas en el proyecto correcto.

## Firebase y primer acceso

- [ ] Habilitar Email/Password en Firebase Authentication.
- [ ] Habilitar Google si se usará para el administrador.
- [ ] Autorizar el dominio de Netlify y el dominio personalizado en Firebase Authentication.
- [ ] Crear Firestore y revisar las reglas antes de publicarlas.
- [ ] Crear la primera cuenta de administrador y los documentos `people/{personId}` y `memberAccess/{correo-en-minúsculas}` siguiendo README.md.
- [ ] Añadir las cinco variables `VITE_FIREBASE_*` a Netlify y ejecutar un nuevo deploy.

## Pruebas funcionales con cuentas diferentes

- [ ] Administrador: crear un tipo de servicio y programar uno para una fecha.
- [ ] Administrador: crear una canción con letra/acordes y abrir ambas vistas imprimibles.
- [ ] Administrador: enlazar un PDF externo y guardar su tonalidad.
- [ ] Administrador: asignar varios integrantes por lote y abrir los mensajes preparados de WhatsApp/correo.
- [ ] Visor: iniciar sesión y comprobar que solo aparecen sus convocatorias y canciones asociadas.
- [ ] Visor: aceptar una convocatoria y comprobar que el administrador ve la respuesta.
- [ ] Visor: intentar declinar sin motivo y comprobar que no puede enviarlo; escribir motivo y confirmar que el administrador lo ve.
- [ ] Editor: probar la edición de un servicio y un equipo; verificar que no puede gestionar roles ni editar los detalles del repertorio.
- [ ] Probar desde un teléfono los formularios, las tablas desplazables y las vistas de letras/acordes.
- [ ] Confirmar que una sesión sin rol activo queda bloqueada y que los documentos de respuesta de otros integrantes no son legibles.

## Límites deliberados

- No se usa Firebase Storage. Los PDF que ya existen deben alojarse en Drive/OneDrive u otro repositorio accesible y guardarse como enlace + tonalidad.
- Los PDF generados desde letras/acordes se preparan al abrirlos y se pueden imprimir/guardar desde el dispositivo; no se almacenan en Firebase.
- WhatsApp y correo abren mensajes preparados. El administrador confirma el envío en la aplicación externa; no hay envío masivo automático ni cuota de mensajería de pago.
