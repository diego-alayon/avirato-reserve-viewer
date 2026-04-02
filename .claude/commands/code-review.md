# Code Review Autónomo

Analiza los cambios de código para detectar bugs, problemas de seguridad y violaciones de convenciones.

## Pasos

### 1. Obtener los cambios

Ejecuta estos comandos para ver qué ha cambiado:

```bash
git diff HEAD~1 --name-only
```

Si no hay commits recientes, usa `git diff --staged` o `git diff`.

Lee cada archivo modificado completo para entender el contexto.

### 2. Análisis estático

Ejecuta en paralelo:

```bash
npx tsc --noEmit
npm run lint
```

### 3. Checklist de revisión

Para cada archivo modificado, revisa:

**Seguridad:**
- No hay API keys o secrets hardcodeados
- No hay `dangerouslySetInnerHTML` sin sanitizar
- Las URLs de API usan variables de entorno
- No hay `eval()` ni inyección de código

**TypeScript:**
- No hay `any` innecesarios
- No hay casteos inseguros (`as any`)
- Los tipos de retorno son correctos

**React:**
- Las dependencias de `useEffect`/`useCallback`/`useMemo` son correctas
- No hay re-renders innecesarios
- No hay memory leaks (listeners sin cleanup)
- No hay hooks dentro de condicionales o loops

**API / Services:**
- Todas las llamadas API tienen error handling
- Los errores 401 limpian el token
- El rate limiting se respeta

**Lógica de negocio:**
- Los cálculos de precios/pagos son correctos
- Las fechas se manejan correctamente
- Los filtros funcionan con datos edge-case (null, undefined, vacíos)

### 4. Output

Genera un reporte con este formato:

```
## Code Review Report

### CRITICAL (X issues)
- [archivo:línea] Descripción del bug y cómo arreglarlo

### WARNING (X issues)
- [archivo:línea] Descripción del problema

### INFO (X issues)
- [archivo:línea] Sugerencia

### Summary
- Files reviewed: X
- TypeScript errors: X
- Lint errors: X
- Critical: X | Warning: X | Info: X
```
