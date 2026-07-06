#!/usr/bin/env bash
# =============================================================================
# aplicar_seeds.sh — aplica os seeds .mongodb.js no banco DadosOPP via mongosh,
# lendo a conexão do database/.env (bloco OPP). Idempotente (os seeds usam upsert).
#
# Uso:
#   database/scripts/aplicar_seeds.sh indicador-idsc indicador-cobertura-atencao-basica
#   database/scripts/aplicar_seeds.sh indicador-idsc.mongodb.js   # sufixo opcional
#   database/scripts/aplicar_seeds.sh --all                       # todos os seeds
#
# Lê do database/.env (mesmas variáveis dos geradores *_lake.py --write-mongo):
#   OPP_MONGO_USER / OPP_MONGO_PASS  (obrigatórios)
#   OPP_MONGO_HOST (def 127.0.0.1) / OPP_MONGO_PORT (def 27017)
#   OPP_MONGO_DB   (def DadosOPP)   / OPP_AUTH_DB   (def = OPP_MONGO_DB)
#
# Usa os FLAGS do mongosh (não a URI) para a senha não precisar de URL-encode.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_DIR="$(dirname "$SCRIPT_DIR")"
SEED_DIR="$DATABASE_DIR/seed"
ENV_FILE="$DATABASE_DIR/.env"

usage() {
  # imprime o bloco de comentário do topo (da linha 3 até o separador '# ====').
  awk 'NR>=3 { if (/^# ={5,}/) exit; sub(/^# ?/, ""); print }' "${BASH_SOURCE[0]}"
  exit "${1:-0}"
}

[[ $# -eq 0 || "${1:-}" == "-h" || "${1:-}" == "--help" ]] && usage 0

command -v mongosh >/dev/null 2>&1 || {
  echo "erro: 'mongosh' não está no PATH. Instale o mongosh ou use o NoSQLBooster." >&2
  exit 1
}

if [[ -f "$ENV_FILE" ]]; then
  set -a; source "$ENV_FILE"; set +a
else
  echo "erro: $ENV_FILE não encontrado — copie de .env.example e preencha o bloco OPP." >&2
  exit 1
fi

# Defaults do script (':=' trata variável vazia como ausente, igual aos geradores).
: "${OPP_MONGO_HOST:=127.0.0.1}"
: "${OPP_MONGO_PORT:=27017}"
: "${OPP_MONGO_DB:=DadosOPP}"
: "${OPP_AUTH_DB:=$OPP_MONGO_DB}"

if [[ -z "${OPP_MONGO_USER:-}" || -z "${OPP_MONGO_PASS:-}" ]]; then
  echo "erro: OPP_MONGO_USER / OPP_MONGO_PASS vazios no $ENV_FILE." >&2
  exit 1
fi

# --all = todos os seeds (municipios e agendas primeiro, depois os indicadores).
if [[ "${1:-}" == "--all" ]]; then
  set --
  for base in municipios agendas; do
    [[ -f "$SEED_DIR/$base.mongodb.js" ]] && set -- "$@" "$base"
  done
  while IFS= read -r f; do set -- "$@" "$(basename "$f")"; done \
    < <(find "$SEED_DIR" -maxdepth 1 -name 'indicador-*.mongodb.js' | sort)
fi

run() {
  local name="$1"
  local base file
  base="$(basename "$name")"; base="${base%.mongodb.js}"; base="${base%.js}"
  file="$SEED_DIR/$base.mongodb.js"
  if [[ ! -f "$file" ]]; then
    echo "erro: seed não encontrado: $file" >&2
    return 1
  fi
  echo ">> $base.mongodb.js  ->  $OPP_MONGO_DB @ $OPP_MONGO_HOST:$OPP_MONGO_PORT"
  mongosh --host "$OPP_MONGO_HOST" --port "$OPP_MONGO_PORT" \
    -u "$OPP_MONGO_USER" -p "$OPP_MONGO_PASS" \
    --authenticationDatabase "$OPP_AUTH_DB" \
    --quiet \
    "$OPP_MONGO_DB" \
    "$file"
}

for name in "$@"; do
  run "$name"
done

echo "OK — $# seed(s) aplicado(s) em $OPP_MONGO_DB."
