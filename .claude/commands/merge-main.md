# Merge to Main

Ejecuta el proceso de merge de la rama actual a main:

1. Guarda el nombre de la rama actual
2. Cambia a la rama `main`
3. Hace pull de los últimos cambios de origin/main
4. Hace merge de la rama anterior a main
5. Hace push de main a origin

Ejecuta estos comandos en secuencia:

```bash
CURRENT_BRANCH=$(git branch --show-current)
git checkout main
git pull origin main
git merge $CURRENT_BRANCH -m "Merge branch '$CURRENT_BRANCH'"
git push origin main
```

Después muestra un resumen del merge completado.
