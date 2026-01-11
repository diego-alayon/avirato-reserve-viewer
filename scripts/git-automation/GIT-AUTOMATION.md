# Git Automation Scripts

Scripts automatizados para facilitar commits y merges en el proyecto Serra Nature.

## Características

- ✅ Commits automáticos con formato estándar
- ✅ Merges seguros con verificaciones
- ✅ **Merge automático a main** (nuevo)
- ✅ Push automático opcional
- ✅ Interfaz interactiva
- ✅ Mensajes de commit con firma de Claude Code
- ✅ Manejo de conflictos

## Scripts Disponibles

1. **git-auto.sh** - Script general para commits y merges
2. **merge-to-main.sh** - Script dedicado para merge a rama main (recomendado)

## Uso

### Opción 1: Usando npm scripts (Recomendado)

```bash
# Hacer commit
npm run git:commit

# Hacer commit con mensaje
npm run git:commit "Add new feature"

# Ver estado del repositorio
npm run git:status

# Hacer merge a otra rama
npm run git:merge

# Hacer merge a rama específica
npm run git:merge main

# Commit y merge en un solo comando
npm run git:commit-merge "Fix bug" main

# Merge a main (automatizado) ⭐ NUEVO
npm run git:merge-to-main

# Ver ayuda
npm run git:help
```

### Opción 2: Ejecutando el script directamente

```bash
# Hacer commit
./git-auto.sh commit

# Hacer commit con mensaje
./git-auto.sh commit "Add new feature"

# Hacer merge
./git-auto.sh merge main

# Commit y merge
./git-auto.sh commit-merge "Fix bug" main

# Ver estado
./git-auto.sh status

# Merge a main (automatizado)
./merge-to-main.sh
```

## Comandos Disponibles

### `merge-to-main` ⭐ NUEVO - Script Dedicado

**Archivo:** `merge-to-main.sh`

Script automatizado específicamente diseñado para hacer merge de tu rama actual a `main`.

**Características:**
- ✅ Verifica que no haya cambios sin commitear
- ✅ Muestra los commits que se van a mergear
- ✅ Pide confirmación antes de proceder
- ✅ Actualiza main con últimos cambios del remoto
- ✅ Hace merge con estrategia `--no-ff`
- ✅ Push automático a main
- ✅ Regresa a tu rama original
- ✅ Opción de actualizar tu rama con los cambios de main

**Uso:**
```bash
npm run git:merge-to-main
```

**Proceso que ejecuta:**
1. Valida que no estés en main
2. Verifica que no haya cambios sin commitear
3. Muestra commits a mergear
4. Pide confirmación
5. Obtiene últimos cambios del remoto
6. Cambia a main y actualiza
7. Hace merge de tu rama
8. Push a origin/main
9. Regresa a tu rama original
10. (Opcional) Actualiza tu rama con main

**Ejemplo:**
```bash
# Estando en la rama last-app-api-integration
npm run git:merge-to-main
# El script hará todo el proceso automáticamente
```

---

### `commit [mensaje]`
Commitea todos los cambios en el staging area.

- Si no proporcionas un mensaje, te lo pedirá interactivamente
- Agrega automáticamente todos los archivos (`git add .`)
- Incluye firma de Claude Code en el mensaje
- Ofrece opción de hacer push al remoto

**Ejemplo:**
```bash
npm run git:commit "Update operator names mapping"
```

### `merge [rama-destino]`
Hace merge de la rama actual a otra rama.

- Verifica que no haya cambios sin commitear
- Actualiza la rama destino antes del merge
- Hace merge con estrategia `--no-ff` (crea commit de merge)
- Ofrece opción de hacer push
- Ofrece opción de regresar a la rama original

**Ejemplo:**
```bash
npm run git:merge main
```

### `commit-merge [mensaje] [rama]`
Combina commit y merge en un solo comando.

**Ejemplo:**
```bash
npm run git:commit-merge "Add debugging logs" main
```

### `status`
Muestra el estado actual del repositorio.

**Ejemplo:**
```bash
npm run git:status
```

## Flujo de Trabajo Típico

### Escenario 1: Merge rápido a main (RECOMENDADO) ⭐

```bash
# 1. Asegúrate de que todos tus cambios estén commiteados
npm run git:status

# 2. Si hay cambios, commitéalos
npm run git:commit "Your commit message"

# 3. Merge a main con un solo comando
npm run git:merge-to-main

# El script hará:
# ✓ Verificación de estado
# ✓ Muestra de commits a mergear
# ✓ Confirmación
# ✓ Merge a main
# ✓ Push automático
# ✓ Regreso a tu rama
```

### Escenario 2: Commit y push a la rama actual

```bash
# 1. Ver cambios
npm run git:status

# 2. Hacer commit
npm run git:commit "Add new feature"

# 3. Cuando pregunte si deseas hacer push, responde: s
```

### Escenario 3: Commit y merge a main (usando git-auto.sh)

```bash
# 1. Asegúrate de estar en tu rama de trabajo
git branch

# 2. Commit y merge a main
npm run git:commit-merge "Implement user authentication" main

# 3. El script hará:
#    - Commit de tus cambios
#    - Cambio a rama main
#    - Pull de cambios remotos
#    - Merge de tu rama
#    - (Opcional) Push a remoto
#    - (Opcional) Regresar a tu rama
```

### Escenario 4: Solo merge (si ya hiciste commit)

```bash
# Si ya tienes commits en tu rama y solo quieres hacer merge
npm run git:merge main
```

## Formato de Commits

Todos los commits incluyen automáticamente:

```
Tu mensaje de commit

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Seguridad

El script incluye varias verificaciones de seguridad:

- ✅ No permite merge con cambios sin commitear
- ✅ Actualiza la rama destino antes de hacer merge
- ✅ Solicita confirmación antes de hacer push
- ✅ Usa merge `--no-ff` para mantener el historial
- ✅ Maneja errores y conflictos de merge

## Solución de Problemas

### Error: "Permission denied"

```bash
chmod +x git-auto.sh
```

### Error en merge por conflictos

Si el merge falla por conflictos:
1. El script te avisará
2. Resuelve los conflictos manualmente
3. Ejecuta `git add .` y `git commit`
4. Continúa con tu flujo de trabajo

### Cancelar operación

Presiona `Ctrl+C` en cualquier momento para cancelar.

## Notas

- El script siempre hace `git add .` antes de commitear
- Los merges usan estrategia `--no-ff` para crear un commit de merge explícito
- Puedes usar el script de forma interactiva (sin argumentos) para que te guíe paso a paso
