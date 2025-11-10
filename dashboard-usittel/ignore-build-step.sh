#!/bin/bash

# Este script le dice a Vercel cuándo NO debe hacer build
# Retorna exit code 0 = hacer build
# Retorna exit code 1 = NO hacer build (ignorar)

# Obtener el último mensaje de commit
COMMIT_MESSAGE=$(git log -1 --pretty=%B)

echo "🔍 Verificando commit: $COMMIT_MESSAGE"

# Ignorar commits automáticos de GitHub Actions (monitoreo)
if [[ "$COMMIT_MESSAGE" == *"[skip ci]"* ]] || \
   [[ "$COMMIT_MESSAGE" == *"chore: Update monitoring logs"* ]] || \
   [[ "$COMMIT_MESSAGE" == *"Monitoreo automático"* ]]; then
  echo "⏭️  Commit ignorado - No hacer build"
  exit 1
fi

# Para todos los demás commits, hacer build
echo "✅ Hacer build"
exit 0
