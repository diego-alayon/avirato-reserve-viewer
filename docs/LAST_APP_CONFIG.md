# Configuración Segura de Last.app API

## 🔒 Seguridad Primero

Este proyecto utiliza **variables de entorno** para gestionar las credenciales de Last.app de forma segura, previniendo:

- ❌ Exposición de tokens en localStorage (vulnerable a XSS)
- ❌ Tokens visibles en DevTools del navegador
- ❌ Credenciales incluidas accidentalmente en commits
- ✅ Configuración segura que NO se sube al repositorio

## 📋 Configuración Inicial

### 1. Crear archivo .env.local

En la raíz del proyecto, crea un archivo llamado `.env.local`:

```bash
touch .env.local
```

### 2. Obtener credenciales de Last.app

1. Accede al panel de desarrolladores de Last.app
2. Genera un **Bearer Token** con los permisos necesarios
3. Anota tu **Organization ID**
4. Anota tu **Location ID** (restaurante/local específico)

📖 Documentación: https://developers.last.app/docs

### 3. Configurar variables de entorno

Edita el archivo `.env.local` y agrega:

```env
# Last.app API Credentials
VITE_LASTAPP_TOKEN=tu_bearer_token_aqui
VITE_LASTAPP_ORGANIZATION_ID=tu_organization_id
VITE_LASTAPP_LOCATION_ID=tu_location_id
```

**Ejemplo:**
```env
VITE_LASTAPP_TOKEN=sk_live_abc123def456ghi789
VITE_LASTAPP_ORGANIZATION_ID=org_xyz789
VITE_LASTAPP_LOCATION_ID=loc_restaurant_001
```

### 4. Reiniciar el servidor de desarrollo

Detén el servidor (`Ctrl+C`) y vuelve a iniciarlo:

```bash
npm run dev
```

Las variables de entorno solo se cargan al inicio del servidor.

### 5. Validar configuración

1. Accede a http://localhost:8080
2. Navega a **Usuario → Configuración** (menú inferior izquierdo)
3. Verifica que las 3 variables estén marcadas como "Configurado"
4. Haz clic en **"Validar Conexión"** para probar que el token funciona

## 🛡️ Cómo funciona

### Variables de Entorno con Vite

Vite carga automáticamente las variables que comienzan con `VITE_` desde:
- `.env.local` (local, no se sube al repo)
- `.env` (configuración base)

En el código accedes a ellas con:
```typescript
import.meta.env.VITE_LASTAPP_TOKEN
```

### lastapp.ts

El servicio `LastAppService` carga las credenciales en el constructor:

```typescript
constructor() {
  this.loadFromEnvironment(); // Carga VITE_LASTAPP_* al iniciar
}
```

### Flujo de autenticación

1. **Inicio**: Variables de entorno → `lastAppService`
2. **Validación**: `validateConnection()` prueba el token con Last.app API
3. **Requests**: Todas las peticiones usan el token cargado
4. **Sin persistencia**: No se guarda NADA en localStorage

## 📦 Archivos importantes

| Archivo | Propósito | En Git? |
|---------|-----------|---------|
| `.env.local` | Credenciales locales | ❌ NO (.gitignore) |
| `.env.example` | Plantilla de ejemplo | ✅ Sí |
| `src/services/lastapp.ts` | Servicio API | ✅ Sí |
| `src/pages/Settings.tsx` | Página de configuración | ✅ Sí |

## 🚀 Deployment (Producción)

Para desplegar en producción (Vercel, Netlify, etc.):

### Vercel
1. Ve a **Project Settings → Environment Variables**
2. Agrega las mismas 3 variables:
   - `VITE_LASTAPP_TOKEN`
   - `VITE_LASTAPP_ORGANIZATION_ID`
   - `VITE_LASTAPP_LOCATION_ID`
3. Redeploy el proyecto

### Netlify
1. Ve a **Site settings → Build & deploy → Environment**
2. Agrega las variables
3. Trigger new deploy

### Otras plataformas
Busca la sección de "Environment Variables" y agrega las mismas variables.

## 🔐 Mejores Prácticas de Seguridad

### ✅ Hacer

- Usar `.env.local` para desarrollo
- Configurar variables en el servidor de producción
- Rotar tokens periódicamente
- Usar diferentes tokens para dev/staging/prod
- Revocar tokens comprometidos inmediatamente

### ❌ NO Hacer

- NO subir `.env.local` al repositorio
- NO compartir tokens por email/chat
- NO hacer hardcode de tokens en el código
- NO usar el mismo token en múltiples proyectos
- NO guardar tokens en localStorage/cookies

## 🆘 Troubleshooting

### Error: "Token no configurado"

**Causa:** La variable `VITE_LASTAPP_TOKEN` no está en `.env.local`

**Solución:**
1. Verifica que `.env.local` existe en la raíz
2. Confirma que la variable está correctamente escrita
3. Reinicia el servidor de desarrollo

### Error: "Token inválido o expirado"

**Causa:** El token de Last.app no es válido

**Solución:**
1. Verifica que copiaste el token completo
2. Genera un nuevo token en Last.app
3. Actualiza `.env.local` con el nuevo token
4. Reinicia el servidor

### Las variables no se cargan

**Causa:** El servidor no se reinició después de cambiar `.env.local`

**Solución:**
1. Detén el servidor (`Ctrl+C`)
2. Ejecuta `npm run dev` nuevamente
3. Las variables solo se cargan al inicio

### Badge "No configurado" en Settings

**Causa:** Variable vacía o con espacios

**Solución:**
```env
# ❌ Mal
VITE_LASTAPP_TOKEN=

# ❌ Mal (con espacios)
VITE_LASTAPP_TOKEN= tu_token

# ✅ Bien
VITE_LASTAPP_TOKEN=tu_token_sin_espacios
```

## 📚 Más Información

- **API Documentation:** https://developers.last.app/docs
- **Vite Environment Variables:** https://vitejs.dev/guide/env-and-mode.html
- **Security Best Practices:** https://owasp.org/www-project-api-security/

## 🤝 Soporte

Si tienes problemas con la configuración:

1. Revisa esta guía completamente
2. Verifica los logs del navegador (F12 → Console)
3. Consulta la página de Settings para ver el estado de configuración
4. Contacta al equipo de soporte de Last.app si el token no funciona

---

**Última actualización:** Enero 2026
