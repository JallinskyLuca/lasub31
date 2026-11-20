# Panel privado de La Sub 31

La web se publica en `https://lasub31.netlify.app/`, los enlaces en `/links/` y el panel en `/sub31admin/`.

## Activación inicial

El panel necesita Netlify Functions y Blobs. Subir solamente la carpeta `web` con drag-and-drop no incluye este backend. A partir de esta versión, publicá desde la raíz del proyecto, donde están `package.json` y `netlify.toml`, mediante Netlify CLI o conectando un repositorio a Netlify. El usuario de GitHub no aparece en la URL pública.

1. En una terminal, dentro de la carpeta `Sub31`, ejecutá `npm ci` y `npm run admin:credentials`.
2. Elegí una contraseña única de al menos 16 caracteres, preferentemente generada con un gestor de contraseñas. El comando pide confirmación y no muestra ni guarda la contraseña. Imprime el hash y una clave de sesión nueva.
3. En el proyecto **existente** de Netlify, abrí las variables de entorno y cargá `ADMIN_ORIGIN`, `ADMIN_PASSWORD_HASH` y `ADMIN_SESSION_SECRET` con los valores del comando. Configuralas para **Production** y **Functions**, si tu plan permite elegir ámbitos. No las pongas en HTML, `netlify.toml`, Git ni chats. `ADMIN_ORIGIN` debe ser exactamente `https://lasub31.netlify.app`, sin barra final.
4. Para publicar sin Git, ejecutá `npx netlify-cli login` y después `npx netlify-cli link`. Elegí el sitio existente `lasub31`; no crees otro sitio por accidente. La CLI abre la autorización de tu cuenta.
5. Ejecutá `npm run build`, `npm test` y `npx netlify-cli deploy --prod`. La CLI actual ejecuta el build configurado y publica la web y las funciones.
6. Revisá en el log de despliegue que se hayan aplicado las reglas de rate limiting de `sub31-login` y `sub31-admin`. Netlify no necesariamente hace fallar el deploy si una regla es inválida.
7. Entrá a `https://lasub31.netlify.app/sub31admin/`, ingresá con tu contraseña y comprobá el guardado y el cierre de sesión en producción. No consideres activado el panel hasta completar esta comprobación real.

Alternativa con Git: configurá el proyecto Netlify con la raíz del repositorio como base, `npm run build` como comando, `web` como directorio público y `netlify/functions` como directorio de funciones. `netlify.toml` ya contiene esos valores.

## Uso diario

Elegí un partido, cargá el marcador desde el punto de vista de **La Sub 31** y escribí los goleadores. Podés modificar varios partidos antes de guardar. Las fechas y horas son de Argentina. Para reemplazar la tabla, elegí una foto JPG, PNG o WebP de hasta 2 MB y revisá la vista previa. Actualizá también el título, resumen, puesto y detalle cuando corresponda.

“Guardar y publicar cambios” actualiza los datos sin un deploy. La web los consulta al abrir o recargar; su caché puede demorar hasta 15 segundos. Una pestaña pública ya abierta no se actualiza sola. Los cambios sin guardar viven solo en la pestaña y se pierden al cerrarla. Se muestra un aviso antes de salir con cambios pendientes.

Se conservan las últimas diez versiones del fixture y la foto en el mismo guardado. El panel permite recuperarlas y descargar el fixture en JSON. Las copias dependen de la misma cuenta de Netlify: para una copia independiente, descargá periódicamente el JSON y guardá también la imagen de la tabla. El JSON contiene una referencia a la imagen, no sus bytes.

## Protección implementada

- Un solo administrador, sin registro público ni recuperación por correo. Contraseña verificada en el servidor con scrypt y comparación de tiempo constante.
- Sesión firmada de una hora, guardada como cookie `__Host-` con `HttpOnly`, `Secure` y `SameSite=Strict`; registro de sesión privado en Blobs. Cerrar sesión revoca ese registro. No hay tokens en localStorage.
- Escrituras con comprobación de origen exacto y token CSRF vinculado a la sesión. Las URLs alternativas, previews y solicitudes de otros sitios no pueden administrar el sitio.
- Límite de la plataforma por IP: cinco llamadas al login por tres minutos; adicionalmente, contador global atómico de 30 intentos por 15 minutos. No depende de la memoria temporal de una función. El contador global puede impedir temporalmente tu propio ingreso si alguien lo agota.
- Datos normalizados en el servidor. Fechas válidas, marcadores enteros de 0 a 99, longitudes acotadas y rechazo de etiquetas HTML. La web dibuja los textos con `textContent`.
- Solo se aceptan JPEG, PNG y WebP reales; se decodifican y vuelven a codificar como WebP, sin metadatos. Se limitan bytes, píxeles y dimensiones; se rechazan SVG, animaciones y archivos corruptos.
- Versiones y escrituras condicionales mediante ETag para evitar pisar cambios desde dos pestañas. Las imágenes tienen claves generadas por el servidor; ninguna entrada del formulario controla rutas de almacenamiento.
- Cabeceras contra inclusión en marcos, interpretación de MIME y política CSP restringida del panel. API administrativa sin caché ni CORS abierto. Sin secretos no se permite ingresar.

La página de ingreso y las rutas de API son públicas; únicamente el contenido del fixture y las fotos publicadas son de lectura pública. El historial, las sesiones y el guardado exigen autenticación. La ruta discreta no es una barrera de seguridad. No existe garantía de invulnerabilidad: mantené las dependencias y la cuenta Netlify actualizadas, activá 2FA en Netlify y cuidá tu equipo y contraseña.

## Cambiar contraseña o recuperar acceso

Volvé a ejecutar `npm run admin:credentials`, reemplazá el hash y el secreto de sesión en Netlify y redesplegá para asegurar que las funciones usen los nuevos valores. Eso invalida las sesiones anteriores. El código no incluye una contraseña predeterminada ni una puerta de recuperación pública.

## Datos y disponibilidad

`sub31-content` guarda el documento actual, diez versiones anteriores y sus imágenes; `sub31-auth` guarda sesiones y el contador de intentos. Son almacenes del sitio, persistentes entre deploys. No usan Supabase ni una base SQL. Blobs y Functions siguen sujetos a las cuotas y disponibilidad de Netlify.

Los datos iniciales se generan desde `web/club-data.js` durante el build. Después del primer guardado online, los datos de Blobs tienen prioridad: un nuevo deploy no los reemplaza. Si falla el servicio, la página conserva los datos estáticos y avisa que está mostrando un respaldo. Ese respaldo puede ser anterior al último guardado del panel.

## Verificación local

`npm run build` prepara los datos iniciales; luego `npm test` verifica autenticación, expiración, CSRF, origen, límites de intentos, validación de imágenes y resultados, conflictos, recuperación y revocación de sesión. También prueba el formulario con un navegador DOM simulado y almacenes en memoria. Esto no sustituye la comprobación final con Netlify Blobs, cookies HTTPS y reglas de rate limiting en el sitio publicado.

Documentación oficial: [Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/), [Functions](https://docs.netlify.com/build/functions/overview/), [rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/) y [Netlify CLI](https://cli.netlify.com/commands/deploy/).
