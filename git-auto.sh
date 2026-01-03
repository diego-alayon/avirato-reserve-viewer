#!/bin/bash

# Git Automation Script - Commits and Merges
# Usage: ./git-auto.sh [command] [options]

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

# Function to show current git status
show_status() {
    print_info "Estado actual del repositorio:"
    echo ""
    git status
    echo ""
}

# Function to commit changes
do_commit() {
    local commit_message="$1"

    show_status

    # Check if there are changes to commit
    if git diff-index --quiet HEAD --; then
        print_warning "No hay cambios para commitear."
        return 0
    fi

    # If no message provided, ask for it
    if [ -z "$commit_message" ]; then
        echo ""
        print_info "Ingresa el mensaje del commit:"
        read -r commit_message
    fi

    if [ -z "$commit_message" ]; then
        print_error "El mensaje del commit no puede estar vacío."
        return 1
    fi

    # Add all changes
    print_info "Agregando archivos al staging area..."
    git add .

    # Commit with message
    print_info "Creando commit..."
    git commit -m "$commit_message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

    print_success "Commit creado exitosamente!"

    # Ask if user wants to push
    echo ""
    print_info "¿Deseas hacer push al remoto? (s/n)"
    read -r push_response

    if [[ "$push_response" == "s" || "$push_response" == "S" || "$push_response" == "y" || "$push_response" == "Y" ]]; then
        current_branch=$(git branch --show-current)
        print_info "Haciendo push a origin/$current_branch..."
        git push origin "$current_branch"
        print_success "Push completado!"
    fi
}

# Function to merge branches
do_merge() {
    local target_branch="$1"
    local source_branch=$(git branch --show-current)

    # If no target branch provided, ask for it
    if [ -z "$target_branch" ]; then
        echo ""
        print_info "Ramas disponibles:"
        git branch -a
        echo ""
        print_info "Ingresa la rama destino para hacer merge (ejemplo: main):"
        read -r target_branch
    fi

    if [ -z "$target_branch" ]; then
        print_error "La rama destino no puede estar vacía."
        return 1
    fi

    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "Tienes cambios sin commitear."
        print_info "¿Deseas commitear los cambios antes de hacer merge? (s/n)"
        read -r commit_response

        if [[ "$commit_response" == "s" || "$commit_response" == "S" ]]; then
            do_commit
        else
            print_error "No se puede hacer merge con cambios sin commitear. Abortando."
            return 1
        fi
    fi

    print_info "Cambiando a la rama $target_branch..."
    git checkout "$target_branch"

    print_info "Actualizando rama $target_branch desde remoto..."
    git pull origin "$target_branch" || true

    print_info "Haciendo merge de $source_branch en $target_branch..."
    if git merge "$source_branch" --no-ff -m "Merge branch '$source_branch' into $target_branch

🤖 Generated with [Claude Code](https://claude.com/claude-code)"; then
        print_success "Merge completado exitosamente!"

        # Ask if user wants to push
        echo ""
        print_info "¿Deseas hacer push al remoto? (s/n)"
        read -r push_response

        if [[ "$push_response" == "s" || "$push_response" == "S" ]]; then
            print_info "Haciendo push a origin/$target_branch..."
            git push origin "$target_branch"
            print_success "Push completado!"
        fi

        # Ask if user wants to return to source branch
        echo ""
        print_info "¿Deseas regresar a la rama $source_branch? (s/n)"
        read -r return_response

        if [[ "$return_response" == "s" || "$return_response" == "S" ]]; then
            git checkout "$source_branch"
            print_success "De vuelta en la rama $source_branch"
        fi
    else
        print_error "Error en el merge. Por favor resuelve los conflictos manualmente."
        return 1
    fi
}

# Function to commit and merge in one command
do_commit_and_merge() {
    local commit_message="$1"
    local target_branch="$2"

    # Do commit first
    do_commit "$commit_message"

    # Then do merge
    do_merge "$target_branch"
}

# Function to show help
show_help() {
    echo ""
    echo "Git Automation Script - Serra Nature"
    echo "====================================="
    echo ""
    echo "Uso: ./git-auto.sh [comando] [opciones]"
    echo ""
    echo "Comandos:"
    echo "  commit [mensaje]              - Commitear todos los cambios"
    echo "  merge [rama-destino]          - Hacer merge a otra rama"
    echo "  commit-merge [mensaje] [rama] - Commitear y hacer merge"
    echo "  status                        - Ver estado del repositorio"
    echo "  help                          - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./git-auto.sh commit \"Add new feature\""
    echo "  ./git-auto.sh merge main"
    echo "  ./git-auto.sh commit-merge \"Fix bug\" main"
    echo "  ./git-auto.sh status"
    echo ""
}

# Main script logic
main() {
    local command="$1"
    shift || true

    case "$command" in
        commit)
            do_commit "$1"
            ;;
        merge)
            do_merge "$1"
            ;;
        commit-merge)
            do_commit_and_merge "$1" "$2"
            ;;
        status)
            show_status
            ;;
        help|--help|-h|"")
            show_help
            ;;
        *)
            print_error "Comando desconocido: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
