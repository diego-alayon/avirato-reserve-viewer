# Hook: Pre-Deploy Gate

## Trigger

Este hook DEBE ejecutarse automáticamente antes de cualquier comando de deploy:
- `vercel --prod`
- `vercel --prod --yes`
- Push a la rama `vercel-build-production`

## Acción

Ejecutar el skill `/qa` completo. Si el resultado es **DO NOT DEPLOY**, BLOQUEAR el deploy y mostrar los issues al usuario.

## Secuencia

```
1. npm run test          → Si falla → STOP
2. npm run lint          → Si falla → STOP
3. npm run build         → Si falla → STOP
4. Mostrar resumen QA
5. Pedir confirmación del usuario
6. Proceder con deploy
```

## Override

Si el usuario dice explícitamente "deploy sin QA" o "force deploy", permitir pero con advertencia clara de los riesgos.
