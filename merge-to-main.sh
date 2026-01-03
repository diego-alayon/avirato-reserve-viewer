#!/bin/bash

# Merge to Main Script - Serra Nature
# Automatically merges current branch to main with safety checks

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
TARGET_BRANCH="main"

print_header "Merge to Main - Serra Nature"

print_info "Rama actual: $CURRENT_BRANCH"
print_info "Rama destino: $TARGET_BRANCH"
echo ""

# Check if already on main
if [ "$CURRENT_BRANCH" = "$TARGET_BRANCH" ]; then
    print_error "Ya estás en la rama $TARGET_BRANCH. No se puede hacer merge."
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_error "Tienes cambios sin commitear en la rama $CURRENT_BRANCH"
    echo ""
    git status --short
    echo ""
    print_warning "Por favor, commitea o descarta los cambios antes de hacer merge."
    print_info "Puedes usar: npm run git:commit \"tu mensaje\""
    exit 1
fi

print_success "No hay cambios sin commitear"

# Show commits that will be merged
echo ""
print_info "Commits que se van a mergear:"
echo ""
git log $TARGET_BRANCH..$CURRENT_BRANCH --oneline --decorate
echo ""

# Ask for confirmation
print_warning "¿Estás seguro de que quieres hacer merge de '$CURRENT_BRANCH' a '$TARGET_BRANCH'? (s/n)"
read -r confirmation

if [[ "$confirmation" != "s" && "$confirmation" != "S" && "$confirmation" != "y" && "$confirmation" != "Y" ]]; then
    print_info "Merge cancelado."
    exit 0
fi

echo ""
print_header "Iniciando proceso de merge"

# Step 1: Fetch latest changes
print_info "Paso 1/6: Obteniendo últimos cambios del remoto..."
git fetch origin

# Step 2: Switch to target branch
print_info "Paso 2/6: Cambiando a rama $TARGET_BRANCH..."
git checkout $TARGET_BRANCH

# Step 3: Pull latest changes from target branch
print_info "Paso 3/6: Actualizando rama $TARGET_BRANCH..."
git pull origin $TARGET_BRANCH

# Step 4: Merge source branch into target
print_info "Paso 4/6: Haciendo merge de $CURRENT_BRANCH en $TARGET_BRANCH..."
if git merge $CURRENT_BRANCH --no-ff -m "Merge branch '$CURRENT_BRANCH' into $TARGET_BRANCH

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"; then
    print_success "Merge completado exitosamente!"
else
    print_error "Error en el merge. Hay conflictos que deben resolverse manualmente."
    echo ""
    print_info "Para resolver los conflictos:"
    print_info "1. Resuelve los conflictos en los archivos marcados"
    print_info "2. git add <archivos-resueltos>"
    print_info "3. git commit"
    print_info "4. Ejecuta este script nuevamente o haz push manualmente"
    echo ""
    exit 1
fi

# Step 5: Push to remote
print_info "Paso 5/6: Haciendo push a origin/$TARGET_BRANCH..."
if git push origin $TARGET_BRANCH; then
    print_success "Push completado exitosamente!"
else
    print_error "Error al hacer push. Revisa los errores arriba."
    exit 1
fi

# Step 6: Return to original branch
print_info "Paso 6/6: Regresando a rama $CURRENT_BRANCH..."
git checkout $CURRENT_BRANCH

# Optional: Update current branch with latest main
echo ""
print_warning "¿Deseas actualizar $CURRENT_BRANCH con los cambios de $TARGET_BRANCH? (s/n)"
read -r update_response

if [[ "$update_response" == "s" || "$update_response" == "S" || "$update_response" == "y" || "$update_response" == "Y" ]]; then
    print_info "Actualizando $CURRENT_BRANCH con cambios de $TARGET_BRANCH..."
    git merge $TARGET_BRANCH
    print_success "Rama $CURRENT_BRANCH actualizada!"
fi

echo ""
print_header "Proceso Completado"

print_success "Merge exitoso de '$CURRENT_BRANCH' a '$TARGET_BRANCH'"
print_success "Cambios pusheados al remoto"
print_success "De vuelta en rama '$CURRENT_BRANCH'"

echo ""
print_info "Resumen:"
git log -1 --oneline $TARGET_BRANCH
echo ""
