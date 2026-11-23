#!/usr/bin/env bash
# Liga os hooks versionados em scripts/hooks/ ao .git/hooks/ (que não é versionado).
# Rode uma vez no servidor, depois do clone.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
chmod +x scripts/deploy.sh scripts/hooks/*
for hook in scripts/hooks/*; do
  ln -sf "../../$hook" ".git/hooks/$(basename "$hook")"
  echo "instalado: .git/hooks/$(basename "$hook")"
done
