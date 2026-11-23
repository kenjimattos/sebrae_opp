#!/usr/bin/env bash
# Deploy da PIPPA no servidor Sebrae (10.1.100.99). Roda DENTRO do servidor.
#
#   ./scripts/deploy.sh            # frontend + API
#   ./scripts/deploy.sh --front    # só o frontend (build + rsync)
#   ./scripts/deploy.sh --api      # só a API (build + restart)
#
# É o mesmo passo a passo do README (§Atualizar). O hook post-merge chama este
# arquivo, mas ele funciona sozinho: rode à mão quando quiser.
#
# Variáveis (todas opcionais):
#   DEPLOY_WEB_ROOT    destino do frontend       (/var/www/sebrae_opp/dist)
#   DEPLOY_SERVICE     unit systemd da API       (opp-api)
#   DEPLOY_HEALTH_URL  conferência pós-deploy    (http://localhost/api/health)
set -euo pipefail

WEB_ROOT="${DEPLOY_WEB_ROOT:-/var/www/sebrae_opp/dist}"
SERVICE="${DEPLOY_SERVICE:-opp-api}"
HEALTH_URL="${DEPLOY_HEALTH_URL:-http://localhost/api/health}"

front=1
api=1
case "${1:-}" in
  "") ;;
  --front) api=0 ;;
  --api) front=0 ;;
  *) echo "uso: $0 [--front | --api]" >&2; exit 2 ;;
esac

cd "$(dirname "${BASH_SOURCE[0]}")/.."

step() { printf '\n==> %s\n' "$*"; }

if [ "$front" = 1 ]; then
  step "Frontend: build"
  npm install
  npm run build
  step "Frontend: copiando dist/ para $WEB_ROOT"
  sudo rsync -a --delete dist/ "$WEB_ROOT/"
fi

if [ "$api" = 1 ]; then
  step "API: build"
  (cd server && npm install && npm run build)
  step "API: reiniciando $SERVICE"
  sudo systemctl restart "$SERVICE"
fi

# O deploy só conta como feito se a API responde com o banco no ar.
step "Verificando $HEALTH_URL"
for _ in $(seq 1 15); do
  body="$(curl -fsS "$HEALTH_URL" 2>/dev/null || true)"
  if printf '%s' "$body" | grep -q '"db":"up"'; then
    echo "ok: $body"
    exit 0
  fi
  sleep 1
done
echo "ERRO: a API não respondeu saudável em 15s (última resposta: ${body:-nenhuma})." >&2
echo "Olhe: sudo systemctl status $SERVICE · journalctl -u $SERVICE -n 50" >&2
exit 1
