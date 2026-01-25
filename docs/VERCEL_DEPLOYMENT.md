# Guía de Despliegue en Vercel

## URL de Producción
- **Aplicación:** https://avirato-reserve-viewer.vercel.app
- **Dashboard:** https://vercel.com/becomunicas-projects/avirato-reserve-viewer

## Rama de Despliegue
- **Rama:** `vercel-build-production`
- El proyecto está conectado a GitHub y despliega automáticamente en cada push a esta rama.

---

## Archivos de Configuración

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://apiv3.avirato.com/:path*" },
    { "source": "/lastapp/:path*", "destination": "https://api.last.app/:path*" },
    { "source": "/((?!api|lastapp).*)", "destination": "/index.html" }
  ]
}
```

### .vercelignore
```
node_modules
.git
.env.local
.env*.local
*.log
.DS_Store
dist
.npm-cache
.vercel
```

---

## Variables de Entorno Requeridas

Configurar en Vercel Dashboard > Settings > Environment Variables:

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `VITE_LASTAPP_TOKEN` | Token de autenticación de Last.app | Sí |
| `VITE_LASTAPP_ORGANIZATION_ID` | ID de la organización en Last.app | Sí |
| `VITE_LASTAPP_LOCATION_ID` | ID de la ubicación en Last.app | Sí |
| `VITE_AVIRATO_DEFAULT_EMAIL` | Email por defecto para login Avirato | No |
| `VITE_AVIRATO_DEFAULT_PASSWORD` | Password por defecto para login Avirato | No |

---

## Comandos de Despliegue

### Primer despliegue o nuevo equipo
```bash
# Instalar Vercel CLI
npm install -g vercel

# Autenticarse
vercel login

# Desplegar a producción
vercel --prod --yes
```

### Despliegues posteriores
```bash
# Despliegue automático via push
git push origin vercel-build-production

# O manualmente
vercel --prod --yes
```

---

## Errores Comunes y Soluciones

### 1. Error: "File size limit exceeded (100 MB)"

**Causa:** Archivos grandes siendo subidos (node_modules, .npm-cache, etc.)

**Solución:** Crear/actualizar `.vercelignore`:
```
node_modules
.npm-cache
.git
dist
```

### 2. Error: "The specified token is not valid"

**Causa:** No hay sesión activa de Vercel CLI

**Solución:**
```bash
vercel login
```

### 3. APIs no funcionan en producción (CORS)

**Causa:** Los proxies de Vite solo funcionan en desarrollo

**Solución:** Configurar rewrites en `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api-externa.com/:path*" }
  ]
}
```

### 4. Rutas SPA devuelven 404

**Causa:** Vercel no sabe que es una SPA

**Solución:** Agregar rewrite catch-all en `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Checklist Pre-Despliegue

- [ ] Build local exitoso: `npm run build`
- [ ] `.vercelignore` configurado correctamente
- [ ] `vercel.json` con rewrites para APIs externas
- [ ] Variables de entorno configuradas en Vercel Dashboard
- [ ] Rama `vercel-build-production` actualizada

---

## Estructura del Proyecto para Vercel

```
avirato-reserve-viewer/
├── .vercelignore          # Archivos a ignorar en upload
├── vercel.json            # Configuración de Vercel
├── package.json           # Scripts de build
├── vite.config.ts         # Configuración de Vite
├── dist/                  # Output del build (generado)
└── src/                   # Código fuente
```

---

## Notas Importantes

1. **Rewrites vs Proxies:** Los proxies de `vite.config.ts` solo funcionan en desarrollo. Para producción, usar rewrites en `vercel.json`.

2. **Variables VITE_:** Solo las variables que empiecen con `VITE_` serán expuestas al frontend.

3. **Cache de build:** Vercel cachea las dependencias. Si hay problemas, forzar redeploy sin cache desde el Dashboard.

4. **Despliegues automáticos:** Cada push a la rama conectada genera un nuevo despliegue automático.

---

## Historial de Despliegues

| Fecha | Commit | Descripción |
|-------|--------|-------------|
| 2026-01-25 | a9d0a77 | Deploy inicial con configuración de Vercel |
