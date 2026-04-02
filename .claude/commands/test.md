# Generador de Tests Unitarios

Genera tests unitarios automáticos para el archivo o módulo indicado: $ARGUMENTS

Si no se especifica archivo, pregunta cuál testear.

## Pasos

### 1. Analizar el archivo objetivo

Lee el archivo completo y extrae:
- Funciones/métodos exportados
- Dependencias externas que necesitan mocks
- Tipos de datos que maneja
- Edge cases visibles (null checks, error handling, condicionales)

### 2. Estrategia según tipo de archivo

| Tipo | Estrategia |
|------|------------|
| `utils/*.ts` | Tests puros: input → output. Sin mocks. |
| `services/*.ts` | Mock `fetch` y `localStorage`. Testear auth, errors, transformaciones. |
| `hooks/*.ts` | Usar `renderHook` de `@testing-library/react`. Mock de services. |
| `components/*.tsx` | Usar `render` de `@testing-library/react`. Testear rendering e interacciones. |
| `pages/*.tsx` | Tests de integración ligeros. Mock de hooks. |

### 3. Crear archivo de test

Ubicación: `__tests__/` junto al archivo original.
Ejemplo: `src/services/avirato.ts` → `src/services/__tests__/avirato.test.ts`

### 4. Para cada función exportada, generar mínimo:

1. **Happy path**: Caso normal con datos válidos
2. **Null/undefined**: Inputs nulos o faltantes
3. **Empty**: Arrays vacíos, strings vacíos
4. **Error**: Network errors, respuestas inválidas
5. **Boundary**: Valores límite (0, -1, fechas extremas)

### 5. Ejecutar y validar

```bash
npm run test
```

Si algún test falla, determina si revela un bug real o si el test está mal → corrige lo que corresponda.

### 6. Output

```
## Test Generation Report

### File: [archivo]
- Tests created: X
- Tests passing: X
- Tests failing: X

### Bugs encontrados:
1. [bugs descubiertos al escribir tests]
```
