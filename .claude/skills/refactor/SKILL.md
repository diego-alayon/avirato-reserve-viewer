# Refactor

Safely refactor code while maintaining functionality.

## Steps

1. Identify the scope of the refactor
2. Read all affected files and their dependents
3. Run `npm run build` to establish baseline (no errors)
4. Apply refactoring changes
5. Run `npm run build` again to verify no regressions
6. Run `npm run lint` to check code style
7. Summarize changes made and why
