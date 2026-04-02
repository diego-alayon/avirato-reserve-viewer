# Skill: Code Review Autónomo

Analiza los cambios de código para detectar bugs, problemas de seguridad y violaciones de convenciones antes de merge/deploy.

## Trigger

Ejecutar cuando el usuario pida `/code-review` o antes de crear un PR.

## Pasos

### 1. Obtener los cambios
```bash
git diff HEAD~1 --name-only          # Archivos modificados
git diff HEAD~1 -- '*.ts' '*.tsx'    # Diff completo de código TS/TSX
```

Si no hay commits recientes, usar `git diff --staged` o `git diff`.

### 2. Análisis estático
Ejecutar en paralelo:
```bash
npx tsc --noEmit                     # Type checking
npm run lint                         # ESLint
```

### 3. Checklist de revisión

Para **cada archivo modificado**, verificar:

#### Seguridad
- [ ] No hay API keys o secrets hardcodeados
- [ ] No hay `dangerouslySetInnerHTML` sin sanitizar
- [ ] Las URLs de API usan variables de entorno, no strings hardcodeados
- [ ] No hay `eval()`, `Function()`, o inyección de código
- [ ] Los datos de usuario se validan antes de usarse

#### TypeScript
- [ ] No hay `any` innecesarios (buscar con `grep -n ': any'`)
- [ ] No hay casteos inseguros (`as any`, `as unknown as X`)
- [ ] Las interfaces están completas (no faltan campos opcionales que deberían ser obligatorios)
- [ ] Los tipos de retorno están correctos

#### React
- [ ] Los arrays en `useEffect`/`useCallback`/`useMemo` tienen las dependencias correctas
- [ ] No hay re-renders innecesarios (objetos/arrays nuevos en cada render)
- [ ] No hay memory leaks (listeners sin cleanup, subscriptions sin unsubscribe)
- [ ] Los estados se actualizan de forma inmutable
- [ ] No hay llamadas a hooks dentro de condicionales o loops

#### API / Services
- [ ] Todas las llamadas API tienen error handling
- [ ] Los errores 401 limpian el token y redirigen al login
- [ ] Los errores de red se manejan con mensajes útiles al usuario
- [ ] El rate limiting se respeta (Last.app: 1500/10min, 15/s)
- [ ] Las respuestas se validan antes de acceder a sus propiedades

#### Lógica de negocio
- [ ] Los cálculos de precios/pagos son correctos (billing_total, is_fully_paid)
- [ ] Las fechas se manejan correctamente (timezones, formatos)
- [ ] Los filtros y ordenamientos funcionan con datos edge-case (null, undefined, vacíos)
- [ ] No hay condiciones de carrera en operaciones async paralelas

### 4. Output

Generar un reporte con:
- **CRITICAL**: Bugs que romperían producción
- **WARNING**: Problemas potenciales que deberían revisarse
- **INFO**: Sugerencias de mejora no urgentes

Formato:
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
