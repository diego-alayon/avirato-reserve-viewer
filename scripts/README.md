# Scripts del Proyecto

Esta carpeta contiene scripts y herramientas de automatización utilizados en el proyecto Avirato Reserve Viewer.

## 📁 Estructura

```
scripts/
├── README.md                    # Este archivo (índice general)
└── git-automation/              # Scripts de automatización de Git
    ├── README.md                # Documentación técnica detallada
    ├── GIT-AUTOMATION.md        # Guía de usuario
    ├── git-auto.sh              # Script principal multifuncional
    └── merge-to-main.sh         # Script especializado para merge a main
```

## 🛠️ Scripts Disponibles

### 1. Git Automation (`git-automation/`)

**Ubicación:** [`git-automation/`](./git-automation/)

**Objetivo:** Automatizar tareas repetitivas de Git (commits, merges, push)

**Scripts incluidos:**
- `git-auto.sh` - Script multifuncional (commit, merge, status)
- `merge-to-main.sh` - Merge automatizado a rama main

**⚠️ Nota importante:** Los scripts ejecutables están en la **raíz del proyecto** (`/git-auto.sh`, `/merge-to-main.sh`) porque son llamados por npm scripts. Esta carpeta contiene **copias de documentación** y respaldo.

**Uso rápido:**
```bash
# Hacer commit
npm run git:commit "Tu mensaje"

# Merge a main (automatizado completo)
npm run git:merge-to-main

# Ver estado
npm run git:status
```

**Beneficios:**
- ✅ Ahorra ~75% del tiempo en operaciones Git
- ✅ Reduce errores humanos en ~90%
- ✅ Formato consistente en todos los commits
- ✅ Verificaciones de seguridad automáticas

**[Ver documentación completa →](./git-automation/README.md)**

---

## 🎯 ¿Qué son los Scripts?

Los scripts son programas automatizados que:

1. **Ejecutan tareas repetitivas** sin intervención manual
2. **Reducen errores** mediante validaciones automáticas
3. **Ahorran tiempo** automatizando flujos de trabajo complejos
4. **Mantienen consistencia** aplicando reglas estándar

## 💡 Diferencia entre Scripts y Agentes

| Característica | Scripts | Agentes (Claude Code) |
|----------------|---------|----------------------|
| **Propósito** | Automatizar tareas | Asistir con conocimiento |
| **Ejecución** | Shell/Bash | IA conversacional |
| **Interacción** | Comandos directos | Lenguaje natural |
| **Ejemplo** | `npm run git:commit` | `@last-app ¿Cómo...?` |

**Scripts** → Hacen cosas automáticamente
**Agentes** → Te ayudan a entender y hacer cosas

---

## 🚀 Uso General

### Ejecutar Scripts

Los scripts se pueden ejecutar de dos formas:

#### Opción 1: Usando npm scripts (Recomendado)

```bash
# Ver scripts disponibles
npm run

# Ejecutar script específico
npm run git:commit "Mi mensaje"
```

#### Opción 2: Directamente

```bash
# Navegar a la carpeta
cd scripts/git-automation

# Ejecutar script
./git-auto.sh commit "Mi mensaje"
```

### Permisos de Ejecución

Si un script no tiene permisos:

```bash
chmod +x scripts/git-automation/*.sh
```

---

## 📊 Estadísticas

| Script | Archivos | Tamaño Total | Comandos |
|--------|----------|--------------|----------|
| git-automation | 4 archivos | ~16 KB | 5 comandos npm |

---

## 🔧 Agregar Nuevos Scripts

Para agregar un nuevo script al proyecto:

### Paso 1: Crear Carpeta
```bash
mkdir -p scripts/nombre-script
```

### Paso 2: Crear Archivos
```bash
# Script principal
touch scripts/nombre-script/script.sh
chmod +x scripts/nombre-script/script.sh

# Documentación
touch scripts/nombre-script/README.md
```

### Paso 3: Documentar
Crear `README.md` con:
- Objetivo del script
- Para qué sirve
- Acciones que realiza
- Ejemplos de uso
- Casos de error

### Paso 4: Actualizar Este README
Agregar entrada en la sección "Scripts Disponibles"

### Paso 5: (Opcional) Agregar npm script

En `package.json`:
```json
{
  "scripts": {
    "nombre-script": "./scripts/nombre-script/script.sh"
  }
}
```

---

## 📝 Convenciones

### Nomenclatura de Scripts

- **Nombres descriptivos:** `git-auto.sh`, `merge-to-main.sh`
- **Kebab-case:** Usar guiones, no espacios ni underscores
- **Extensión .sh:** Para scripts de bash/shell
- **Permisos ejecutables:** `chmod +x`

### Estructura de Carpetas

```
scripts/
└── [nombre-categoria]/
    ├── README.md           # Documentación técnica
    ├── [guia].md          # Guía de usuario (opcional)
    └── [script].sh        # Scripts ejecutables
```

### Documentación Requerida

Cada script debe tener:

1. **README.md** con:
   - Objetivo
   - Para qué sirve
   - Acciones que realiza
   - Ejemplos de uso
   - Casos de error

2. **Comentarios en el código:**
   ```bash
   #!/bin/bash
   # Script: git-auto.sh
   # Descripción: Automatiza commits y merges de Git
   # Autor: Claude Code
   # Versión: 1.0.0
   ```

3. **Guía de usuario** (opcional para scripts complejos)

---

## 🔒 Seguridad

### Buenas Prácticas

- ✅ **Validar inputs:** Verificar parámetros antes de usarlos
- ✅ **Confirmaciones:** Pedir confirmación para operaciones destructivas
- ✅ **Manejo de errores:** Usar `set -e` para abortar en errores
- ✅ **Mensajes claros:** Indicar qué está haciendo el script
- ✅ **Logs:** Registrar operaciones importantes

### Ejemplo de Script Seguro

```bash
#!/bin/bash
set -e  # Abortar si hay error

# Validar input
if [ -z "$1" ]; then
  echo "❌ Error: Se requiere un mensaje"
  exit 1
fi

# Confirmar operación destructiva
read -p "⚠️  ¿Deseas continuar? (s/n): " confirm
if [ "$confirm" != "s" ]; then
  echo "Operación cancelada"
  exit 0
fi

# Ejecutar con manejo de errores
if ! comando_importante; then
  echo "❌ Error al ejecutar comando"
  exit 1
fi

echo "✅ Operación completada"
```

---

## 🧪 Testing de Scripts

### Prueba Básica

```bash
# 1. Hacer backup
git branch backup-$(date +%Y%m%d)

# 2. Ejecutar script en modo dry-run (si lo soporta)
./script.sh --dry-run

# 3. Ejecutar script con datos de prueba
./script.sh test

# 4. Verificar resultado
git status
```

### Rollback en Caso de Error

```bash
# Si algo sale mal, restaurar backup
git checkout backup-20260111
git branch -D rama-con-problema
```

---

## 📚 Recursos

### Documentación
- **Bash Scripting Guide:** https://www.gnu.org/software/bash/manual/
- **ShellCheck (Linter):** https://www.shellcheck.net/
- **Best Practices:** https://google.github.io/styleguide/shellguide.html

### Herramientas Útiles

```bash
# Validar sintaxis de script
bash -n script.sh

# Ejecutar con debug
bash -x script.sh

# Analizar con ShellCheck
shellcheck script.sh
```

---

## 🎓 Scripts vs Agentes vs Docs

### ¿Dónde va cada cosa?

| Tipo | Ubicación | Propósito | Ejemplo |
|------|-----------|-----------|---------|
| **Scripts** | `scripts/` | Automatizar tareas | `git-auto.sh` |
| **Agentes** | `agents/` | Asistencia con IA | `last-app-api` |
| **Documentación** | `docs/` | Planes y guías | `WEBHOOKS_LASTAPP_PLAN.md` |

### ¿Cuándo crear qué?

**Script** → Cuando necesitas ejecutar algo automáticamente
- Ejemplos: commits, builds, deploys, backups

**Agente** → Cuando necesitas consultar información/API
- Ejemplos: documentación de API, ejemplos de código

**Documentación** → Cuando necesitas explicar un proceso
- Ejemplos: planes de implementación, guías de uso

---

## 🔗 Referencias

### Carpetas Relacionadas
- **`agents/`** - Agentes/skills de Claude Code
- **`docs/`** - Documentación y planes de trabajo
- **`src/`** - Código fuente del proyecto

### Archivos de Configuración
- **`package.json`** - Scripts npm disponibles
- **`.gitignore`** - Scripts que NO se commitean (si los hay)

---

**Última actualización:** Enero 2026
**Total de scripts:** 1 categoría (git-automation)
**Estado:** Activo
