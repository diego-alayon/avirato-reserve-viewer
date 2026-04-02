# Skill: Generador de Tests Unitarios

Genera tests unitarios automáticos para un archivo o módulo dado.

## Trigger

Ejecutar cuando el usuario pida `/test <archivo>` o `/test <módulo>`.

## Pasos

### 1. Analizar el archivo objetivo

Leer el archivo completo y extraer:
- Funciones/métodos exportados (API pública a testear)
- Dependencias externas (qué necesita mocks)
- Tipos de datos que maneja (para generar datos de prueba)
- Edge cases visibles (null checks, error handling, condicionales)

### 2. Determinar estrategia de testing

| Tipo de archivo | Estrategia |
|-----------------|------------|
| `utils/*.ts` | Tests puros: input → output. Sin mocks. |
| `services/*.ts` | Mock `fetch`, mock `localStorage`. Testear auth, error handling, data transformation. |
| `hooks/*.ts` | Usar `renderHook` de `@testing-library/react`. Mock de services. |
| `components/*.tsx` | Usar `render` de `@testing-library/react`. Testear rendering y user interactions. |
| `pages/*.tsx` | Tests de integración ligeros. Mock de hooks. Testear que la página renderiza. |

### 3. Generar tests

Crear el archivo de test en `__tests__/` al lado del archivo original:
- `src/services/avirato.ts` → `src/services/__tests__/avirato.test.ts`
- `src/utils/dateHelpers.ts` → `src/utils/__tests__/dateHelpers.test.ts`
- `src/hooks/useAvirato.ts` → `src/hooks/__tests__/useAvirato.test.ts`

### 4. Estructura de cada test

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('NombreModulo', () => {
  // Setup común
  beforeEach(() => { /* reset mocks */ });

  describe('nombreFuncion', () => {
    it('should [comportamiento esperado] when [condición]', () => {
      // Arrange - preparar datos
      // Act - ejecutar la función
      // Assert - verificar resultado
    });

    // Happy path
    it('handles normal input correctly', () => {});

    // Edge cases
    it('handles null/undefined input', () => {});
    it('handles empty arrays/strings', () => {});

    // Error cases
    it('throws on invalid input', () => {});
    it('handles API errors gracefully', () => {});
  });
});
```

### 5. Categorías de tests a generar

Para cada función exportada, generar mínimo:
1. **Happy path**: Caso normal con datos válidos
2. **Null/undefined**: Inputs nulos o faltantes
3. **Empty**: Arrays vacíos, strings vacíos, objetos vacíos
4. **Error**: Qué pasa cuando algo falla (network error, invalid response)
5. **Boundary**: Valores límite (0, -1, MAX_INT, fechas pasadas/futuras)

### 6. Ejecutar y validar

```bash
npm run test -- --run [archivo-test]
```

Si algún test falla:
- Verificar si el fallo revela un bug real → reportar como hallazgo
- Si el test está mal escrito → corregir el test

### 7. Output

```
## Test Generation Report

### File: src/services/avirato.ts
- Tests created: X
- Tests passing: X
- Tests failing: X
- Coverage: X%

### Bugs encontrados durante testing:
1. [Descripción del bug descubierto al escribir tests]

### Tests generados:
- describe('AviratoService.authenticate') - 4 tests
- describe('AviratoService.getReservations') - 6 tests
- ...
```
