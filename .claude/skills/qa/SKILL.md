# Skill: QA Gate (Quality Assurance)

Gate de calidad completo que se ejecuta antes de deploy. Si falla, BLOQUEA el despliegue.

## Trigger

Ejecutar cuando el usuario pida `/qa` o antes de cualquier deploy a producción.

## Pasos

### 1. TypeScript strict check
```bash
npx tsc --noEmit
```
Si hay errores de tipo, listarlos todos y clasificar por severidad.

### 2. Linting
```bash
npm run lint
```
Reportar errores (no warnings) como bloqueantes.

### 3. Tests unitarios
```bash
npm run test
```
TODOS los tests deben pasar. Si alguno falla:
- Mostrar el test que falló y el error
- Analizar si el fallo indica un bug real o un test desactualizado
- Sugerir fix concreto

### 4. Cobertura de tests
```bash
npm run test:coverage
```
Verificar cobertura mínima:
- `src/services/`: >= 50% (capa crítica)
- `src/utils/`: >= 70% (funciones puras, fáciles de testear)
- `src/hooks/`: >= 30% (más difícil de testear)

### 5. Build de producción
```bash
npm run build
```
Si el build falla, es BLOQUEANTE. Analizar el error y sugerir fix.

### 6. Análisis de bundle (opcional)
Verificar que no se importan dependencias enormes innecesariamente.

### 7. Verificación de variables de entorno
Leer `.env.example` y verificar que todas las variables documentadas están referenciadas en el código.

### 8. Output

```
## QA Report

### Gate Status: ✅ PASS / ❌ FAIL

| Check              | Status | Details            |
|--------------------|--------|--------------------|
| TypeScript         | ✅/❌  | X errors           |
| Lint               | ✅/❌  | X errors           |
| Tests              | ✅/❌  | X passed, X failed |
| Coverage           | ✅/⚠️  | services: X%, utils: X%, hooks: X% |
| Build              | ✅/❌  | success / error details |
| Env vars           | ✅/⚠️  | X referenced, X missing |

### Blocking Issues
1. [issue description + suggested fix]

### Warnings (non-blocking)
1. [warning description]

### Recommendation
DEPLOY / DO NOT DEPLOY + reason
```

## Reglas

- Si hay CUALQUIER test fallando → **DO NOT DEPLOY**
- Si el build falla → **DO NOT DEPLOY**
- Si hay errores TypeScript critical → **DO NOT DEPLOY**
- Si solo hay warnings de cobertura → **DEPLOY con advertencia**
