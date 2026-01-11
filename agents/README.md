# Agentes del Proyecto

Esta carpeta contiene agentes especializados (skills) utilizados en el desarrollo del proyecto Avirato Reserve Viewer.

## 📁 Estructura

Cada agente está en su propia carpeta con la siguiente estructura:

```
agents/
├── README.md                    # Este archivo (índice general)
└── [nombre-agente]/
    ├── README.md                # Documentación del agente
    ├── skill.json               # Configuración del agente
    ├── instructions.md          # Instrucciones de comportamiento
    ├── docs/                    # Documentación técnica
    └── examples/                # Ejemplos de código
```

## 🤖 Agentes Disponibles

### 1. Last.app API Assistant (`last-app-api`)

**Objetivo:** Asistente especializado en la integración con Last.app API v2.0.0

**Carpeta:** [`last-app-api/`](./last-app-api/)

**Capacidades:**
- ✅ Responder preguntas sobre la API de Last.app
- ✅ Proporcionar ejemplos de código TypeScript
- ✅ Guiar implementaciones paso a paso
- ✅ Debuggear errores de integración

**Triggers:**
- `@last-app`
- `/last-app`

**Documentación incluida:**
- 13 documentos técnicos completos
- 4 ejemplos de código funcionales
- Tipos TypeScript completos
- Guías de rate limiting, webhooks, autenticación

**[Ver documentación completa →](./last-app-api/README.md)**

---

## 🎯 ¿Qué son los Agentes?

Los agentes (también llamados "skills" o "habilidades") son asistentes especializados que:

1. **Tienen conocimiento específico** sobre un dominio o API
2. **Proporcionan ayuda contextual** durante el desarrollo
3. **Generan código** basado en mejores prácticas
4. **Resuelven problemas** comunes de forma proactiva

## 💡 Cómo Usar los Agentes

### En Claude Code

Los agentes se invocan usando `@` o `/` seguido del nombre:

```bash
# Invocar agente de Last.app
@last-app ¿Cómo crear un cliente?

# O usando slash command
/last-app Dame ejemplo de reserva
```

### En Desarrollo

Los agentes son útiles para:

- **Consultar documentación** sin salir del editor
- **Obtener ejemplos de código** específicos para tu caso
- **Debuggear errores** con contexto de la API
- **Aprender patrones** y mejores prácticas

## 📚 Casos de Uso Comunes

### Consultar API
```
@last-app ¿Qué parámetros requiere el endpoint de crear clientes?
```

### Obtener Ejemplo
```
@last-app Dame un ejemplo completo de crear una reserva con validación
```

### Debuggear Error
```
@last-app Estoy recibiendo error 400: "organizationId is required"
¿Qué estoy haciendo mal?
```

### Entender Conceptos
```
@last-app Explícame cómo funcionan los webhooks de Last.app
```

## 🔧 Agregar Nuevos Agentes

Para agregar un nuevo agente al proyecto:

### Paso 1: Crear Estructura
```bash
mkdir -p agents/nombre-agente/{docs,examples}
```

### Paso 2: Crear Archivos Base
- `skill.json` - Configuración del agente
- `instructions.md` - Instrucciones de comportamiento
- `README.md` - Documentación del agente

### Paso 3: Agregar Contenido
- Documentación en `docs/`
- Ejemplos en `examples/`

### Paso 4: Actualizar Este README
Agregar entrada en la sección "Agentes Disponibles"

## 📊 Estadísticas

| Agente | Docs | Ejemplos | Tamaño |
|--------|------|----------|--------|
| last-app-api | 13 archivos | 4 ejemplos | ~80KB |

## 🔗 Ubicación Original

Los agentes en esta carpeta son copias de:
- **Ubicación original:** `/Users/diegoandres/.claude/skills/`
- **Motivo de la copia:** Centralizar documentación en el proyecto
- **Sincronización:** Manual cuando se actualicen los agentes originales

## 📝 Notas Importantes

1. **No editar archivos directamente aquí** - Estos son copias de referencia
2. **Actualizar documentación** cuando cambien los agentes originales
3. **Mantener sincronizados** - Revisar periódicamente si hay actualizaciones
4. **Commitear a git** - Esta carpeta debe estar versionada

## 🎓 Recursos Adicionales

### Documentación de Claude Code
- **Skills/Agents Guide:** Ver documentación oficial de Claude Code
- **Creating Custom Skills:** Cómo crear tus propios agentes

### Documentación de APIs
- **Last.app API:** https://developers.last.app/docs
- **Avirato API:** Documentación interna del proyecto

---

## 🔗 Carpetas Relacionadas

### Scripts (`../scripts/`)
Automatización de tareas con shell scripts (Bash)
- **Git Automation:** Scripts para commits y merges automáticos
- **Diferencia:** Scripts ejecutan tareas, agentes asisten con conocimiento

### Documentación (`../docs/`)
Planes de trabajo y guías de implementación
- **Webhooks Plan:** Guía para implementar webhooks de Last.app
- **Diferencia:** Documentación explica procesos futuros, agentes ayudan en el presente

### Comparación Rápida

| | Agentes | Scripts | Docs |
|---|---------|---------|------|
| **Ubicación** | `agents/` | `scripts/` | `docs/` |
| **Propósito** | Asistir con IA | Automatizar | Documentar |
| **Uso** | `@last-app` | `npm run` | Lectura |
| **Ejemplo** | Consultar API | Git commit | Plan webhooks |

---

**Última actualización:** Enero 2026
**Total de agentes:** 1
**Estado:** Activo
