# Instrucciones para Claude Code

## Auto-commit al iniciar sesión

**IMPORTANTE**: Al inicio de cada conversación en este proyecto, DEBES ejecutar automáticamente los siguientes pasos SIN que el usuario lo solicite:

1. Verificar si hay cambios pendientes con `git status`
2. Si hay cambios (staged, unstaged o untracked):
   - Agregar todos los cambios: `git add .`
   - Crear un commit con un mensaje descriptivo basado en los archivos modificados
   - Hacer push a la rama actual: `git push origin <rama-actual>`
3. Informar al usuario del resultado

### Formato del commit

```
<tipo>: <descripción breve>

<detalles de los cambios si es necesario>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Tipos válidos: feat, fix, docs, style, refactor, test, chore

## Comandos disponibles

- `npm run dev` - Servidor de desarrollo (puerto 8080)
- `npm run build` - Build de producción
- `npm run lint` - Linting
- `npm run test` - Tests unitarios (vitest)
- `npm run test:watch` - Tests en modo watch
- `npm run test:coverage` - Tests con reporte de cobertura
- `npm run qa` - QA completo: lint + build + test
- `vercel --prod --yes` - Desplegar a producción en Vercel

## Skills de QA (Claude Code)

- `/code-review` - Análisis de código: seguridad, types, React patterns, API handling
- `/qa` - Gate de calidad completo antes de deploy (bloquea si falla)
- `/test <archivo>` - Genera tests unitarios automáticos para un archivo

## Pre-Deploy

**IMPORTANTE**: Antes de cualquier deploy a producción, ejecutar `/qa` o como mínimo `npm run qa`.
Si los tests fallan → NO desplegar.

## Despliegue en Vercel

**URL de producción:** https://avirato-reserve-viewer.vercel.app

Para desplegar, consultar la documentación completa en: `docs/VERCEL_DEPLOYMENT.md`

### Checklist rápido de despliegue:
1. Verificar build local: `npm run build`
2. Commit y push a rama `vercel-build-production`
3. Vercel despliega automáticamente

### Archivos clave:
- `vercel.json` - Configuración de build y rewrites
- `.vercelignore` - Archivos a excluir del upload

## Contexto del proyecto

Este es un dashboard de gestión de reservas hoteleras integrado con Avirato PMS y Last.app.
