# QA Gate (Quality Assurance)

Gate de calidad completo. Si falla, BLOQUEA el despliegue.

## Pasos

### 1. Tests unitarios

```bash
npm run test
```

TODOS los tests deben pasar. Si alguno falla, muestra el error y sugiere un fix.

### 2. Linting

```bash
npm run lint
```

Reporta errores como bloqueantes.

### 3. TypeScript strict check

```bash
npx tsc --noEmit
```

Lista los errores de tipo y clasifícalos por severidad.

### 4. Build de producción

```bash
npm run build
```

Si falla, es BLOQUEANTE.

### 5. Cobertura de tests

```bash
npm run test:coverage
```

Verifica cobertura mínima:
- `src/services/`: >= 50%
- `src/utils/`: >= 70%
- `src/hooks/`: >= 30%

### 6. Output

Genera el reporte con este formato exacto:

```
## QA Report

### Gate Status: ✅ PASS / ❌ FAIL

| Check              | Status | Details            |
|--------------------|--------|--------------------|
| Tests              | ✅/❌  | X passed, X failed |
| Lint               | ✅/❌  | X errors           |
| TypeScript         | ✅/❌  | X errors           |
| Build              | ✅/❌  | success / error    |
| Coverage           | ✅/⚠️  | services: X%, utils: X%, hooks: X% |

### Blocking Issues
1. [descripción + fix sugerido]

### Recommendation
DEPLOY / DO NOT DEPLOY + razón
```

## Reglas

- Si hay tests fallando → DO NOT DEPLOY
- Si el build falla → DO NOT DEPLOY
- Si hay errores TypeScript critical → DO NOT DEPLOY
- Si solo hay warnings de cobertura → DEPLOY con advertencia
