#!/usr/bin/env python3
"""
Gera o seed (mongosh) do indicador **Participação MPE em compras públicas**
(`mpe-compras-publicas`) da agenda "Inclusão produtiva" da OPP.

Fonte (cross-source PNCP × Receita Federal):
  1. **PNCP** — Portal Nacional de Contratações Públicas (Lei 14.133/2021), API de
     consulta pública sem auth: https://pncp.gov.br/api/consulta/v1
       - GET /contratacoes/publicacao  (filtra por `codigoMunicipioIbge`) → descobre os
         órgãos que compram em cada município + `valorTotalHomologado` (todas as esferas)
       - GET /contratos               (filtra por `cnpjOrgao`)            → `niFornecedor`
         (CNPJ), `valorGlobal`, `tipoPessoa`, `codigoPaisFornecedor`, `unidadeOrgao.codigoIbge`
  2. **Receita Federal** via basedosdados (BigQuery): `br_me_cnpj.empresas` (porte do CNPJ)
     + `br_me_cnpj.simples` (flag MEI). O PNCP **não traz o porte do fornecedor** → ele vem
     daqui. Pequeno negócio = `porte IN ('1','3')` (1=ME, 3=EPP; MEI ⊂ ME). Join por
     `SUBSTR(niFornecedor,1,8) = cnpj_basico`.

== Métrica ==
`numericValue` = **% do valor de contratos com fornecedor de pequeno porte**, na **esfera
municipal** (prefeitura + fundos/autarquias municipais — `orgaoEntidade.esferaId == 'M'`),
em um ano civil. Denominador = valor de contratos a fornecedores **PJ nacionais com porte
resolvível** na RFB; numerador = subconjunto com `porte IN ('1','3')`.
  - PF (`tipoPessoa != 'PJ'`), estrangeiros (`codigoPaisFornecedor != 'BRA'`) e CNPJs não
    encontrados na RFB ficam **fora** de numerador e denominador (reportados no breakdown).
  - `breakdown` guarda: valores por porte (MEI/ME/EPP/demais), nº de contratos e de
    fornecedores, os valores excluídos (PF/estrangeiro/desconhecido), nº de órgãos
    municipais, e — como **contexto** — `valorHomologadoTodasEsferas` (soma do
    `valorTotalHomologado` das contratações do município, todas as esferas/modalidades).

Escopo = **esfera municipal** (o que a política municipal controla). O total todas-as-esferas
entra só como contexto (não puxamos contratos de órgãos federais/estaduais sediados no
município — sweep caro e ruidoso; o homologado já dá o volume).

== SEM threshold (semáforo) ==
Não há faixa oficial de "bom/atenção/alerta" para participação de MPE em compras públicas.
Seguindo a regra do projeto (não inventar cortes — ver MAPEAMENTO §12 e o precedente
`ranking-redesim`/`mpe-eli-sebrae`), o indicador entra **sem `threshold`**. O corte
`higher-better 20/10` em src/data/indicators/thresholds.ts era inventado.

Cobertura: os 223 municípios da PB. Municípios sem contratos municipais (PJ) no ano entram
com `numericValue: null`. O PNCP cobre a partir de ~2021 (Lei 14.133) com adesão municipal
irregular → municípios pequenos podem ter pouco/zero registro.

> Requer a **API de consulta do PNCP estável**. Em jun/2026 ela estava instável (500/504
> intermitentes, timeouts do backend independentes do tamanho da janela). Rodar quando a
> API normalizar — este gerador NÃO contorna instabilidade (sem retry agressivo/split de
> janela): se a API falhar, ele falha e a gente roda de novo depois.

Saídas (idempotentes):
  - database/seed/indicador-mpe-compras-publicas.mongodb.js   (catálogo + valores)
  - database/data/mpe_compras_publicas_pb.json               (snapshot PNCP + porte)

Uso (rodar com o Python que tem google-cloud-bigquery — ex.: /tmp/bqvenv/bin/python):
  python3 database/scripts/gerar_seed_mpe_compras_publicas.py --project SEU_PROJETO_GCP
  python3 database/scripts/gerar_seed_mpe_compras_publicas.py --ano 2025
  python3 database/scripts/gerar_seed_mpe_compras_publicas.py --offline   # usa o snapshot
"""
from __future__ import annotations

import argparse
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "database" / "data"
SEED_DIR = REPO_ROOT / "database" / "seed"
MUNICIPIOS_SEED = SEED_DIR / "municipios.mongodb.js"
SNAPSHOT = DATA_DIR / "mpe_compras_publicas_pb.json"
SEED_FILE = SEED_DIR / "indicador-mpe-compras-publicas.mongodb.js"

PNCP_BASE = "https://pncp.gov.br/api/consulta/v1"
# Modalidades usadas na DESCOBERTA de órgãos (Pregão-e, Dispensa, Inexigibilidade,
# Concorrência-e, Credenciamento). Um órgão municipal aparece em ao menos uma delas; os
# contratos são puxados por órgão, independentemente da modalidade.
MODALIDADES_DESCOBERTA = [6, 8, 9, 4, 12]
ESFERA_MUNICIPAL = "M"
TAM_PAGINA = 50
CONF_BAIXA_VALOR = 100_000.0   # denominador PJ < R$100k → confiabilidade baixa
CONF_BAIXA_N = 5               # ou < 5 contratos PJ

INDICATOR_ID = "mpe-compras-publicas"
ORDER = 6                       # 6ª posição na agenda inclusao (ver catalog.ts)
AGENDA = "inclusao"
LABEL = "Participação dos pequenos negócios em compras públicas municipais (% do valor)"
DESCRIPTION = (
    "Percentual do valor dos contratos públicos da esfera municipal (prefeitura, fundos e "
    "autarquias) firmados com fornecedores de pequeno porte (ME/EPP, incluindo MEI), no ano. "
    "Fonte cruzada: contratos do PNCP × porte do fornecedor na Receita Federal — o PNCP não "
    "publica o porte do fornecedor."
)
SOURCE = (
    "PNCP (Portal Nacional de Contratações Públicas, Lei 14.133/2021) — contratos da esfera "
    "municipal × porte do CNPJ na Receita Federal (basedosdados br_me_cnpj). Pequeno negócio "
    "= porte ME/EPP (MEI incluso)"
)
SOURCE_DATASET = "pncp_contratos_x_rfb_cnpj"

_SSL = ssl.create_default_context()
_SSL.check_hostname = False
_SSL.verify_mode = ssl.CERT_NONE


# ----------------------------------------------------------------------------- util HTTP
def _get_json(url: str, tries: int = 3, timeout: int = 60) -> dict | None:
    """GET com retry/backoff simples. None em 204/400 (sem conteúdo). RuntimeError no fim
    das tentativas — NÃO contorna instabilidade do servidor; se cair, a rodada falha."""
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"Accept": "*/*", "User-Agent": "opp-seed/1.0"})
            with urllib.request.urlopen(req, context=_SSL, timeout=timeout) as r:
                if r.getcode() == 204:
                    return None
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code in (204, 400):  # sem resultados
                return None
            last = e
        except Exception as e:  # noqa: BLE001
            last = e
        time.sleep(1.5 * (i + 1))
    raise RuntimeError(f"PNCP falhou após {tries} tentativas: {url}\n  {last}")


def _paginate(path: str, params: dict, di: str, df: str, max_paginas: int = 500) -> list[dict]:
    """Itera todas as páginas de um endpoint do PNCP numa janela [di, df]."""
    out: list[dict] = []
    pagina = 1
    while pagina <= max_paginas:
        p = dict(params, dataInicial=di, dataFinal=df, pagina=pagina, tamanhoPagina=TAM_PAGINA)
        url = f"{PNCP_BASE}{path}?" + urllib.parse.urlencode(p)
        d = _get_json(url)
        if not d:
            break
        data = d.get("data") or []
        out.extend(data)
        total_pag = d.get("totalPaginas") or 1
        if pagina >= total_pag or not data:
            break
        pagina += 1
        time.sleep(0.12)
    return out


# ----------------------------------------------------------------------------- municípios
def municipios_canonicos() -> list[str]:
    text = MUNICIPIOS_SEED.read_text(encoding="utf-8")
    codes = sorted(set(re.findall(r'"_id":\s*"(\d{7})"', text)))
    if len(codes) < 200:
        sys.exit(f"Esperava 223 municípios em {MUNICIPIOS_SEED}, achei {len(codes)}.")
    return codes


# ----------------------------------------------------------------------------- PNCP fetch
def _descobrir_orgaos(ibge: str, ano: int) -> tuple[dict[str, dict], float]:
    """Para um município: {cnpjOrgao -> {razaoSocial, esfera}} e o valor homologado total
    (todas as esferas/modalidades) das contratações publicadas no ano."""
    orgaos: dict[str, dict] = {}
    homologado_total = 0.0
    di, df = f"{ano}0101", f"{ano}1231"
    for mod in MODALIDADES_DESCOBERTA:
        rows = _paginate("/contratacoes/publicacao", {
            "codigoModalidadeContratacao": mod, "codigoMunicipioIbge": ibge,
        }, di, df)
        for r in rows:
            oe = r.get("orgaoEntidade") or {}
            cnpj = oe.get("cnpj")
            if cnpj:
                orgaos[cnpj] = {"razaoSocial": oe.get("razaoSocial"), "esfera": oe.get("esferaId")}
            v = r.get("valorTotalHomologado")
            if isinstance(v, (int, float)):
                homologado_total += v
    return orgaos, homologado_total


def _contratos_do_orgao(cnpj_orgao: str, ano: int) -> list[dict]:
    """Contratos publicados no ano para um órgão (janela ≤365d → 1 chamada paginada)."""
    rows = _paginate("/contratos", {"cnpjOrgao": cnpj_orgao}, f"{ano}0101", f"{ano}1231")
    out = []
    for r in rows:
        uo = r.get("unidadeOrgao") or {}
        out.append({
            "ibge": uo.get("codigoIbge"),
            "orgaoCnpj": cnpj_orgao,
            "ni": r.get("niFornecedor"),
            "tipoPessoa": r.get("tipoPessoa"),
            "pais": r.get("codigoPaisFornecedor"),
            "valor": r.get("valorGlobal"),
        })
    return out


def _porte_por_cnpj(cnpjs8: list[str], project: str | None) -> dict[str, dict]:
    """Join de porte (e flag MEI) na RFB via BigQuery. {cnpj_basico -> {porte, mei}}."""
    from google.cloud import bigquery  # import tardio (só no modo online)

    client = bigquery.Client(project=project) if project else bigquery.Client()
    q = """
    WITH emp AS (
      SELECT cnpj_basico, porte FROM `basedosdados.br_me_cnpj.empresas`
      WHERE data = (SELECT MAX(data) FROM `basedosdados.br_me_cnpj.empresas`)
        AND cnpj_basico IN UNNEST(@b)
    ), sn AS (
      SELECT cnpj_basico, MAX(opcao_mei) AS opcao_mei
      FROM `basedosdados.br_me_cnpj.simples`
      WHERE cnpj_basico IN UNNEST(@b) GROUP BY cnpj_basico
    )
    SELECT emp.cnpj_basico AS cnpj, emp.porte AS porte, sn.opcao_mei AS mei
    FROM emp LEFT JOIN sn USING (cnpj_basico)
    """
    out: dict[str, dict] = {}
    CHUNK = 5000
    uniq = sorted(set(cnpjs8))
    for i in range(0, len(uniq), CHUNK):
        lote = uniq[i:i + CHUNK]
        cfg = bigquery.QueryJobConfig(
            query_parameters=[bigquery.ArrayQueryParameter("b", "STRING", lote)]
        )
        for r in client.query(q, job_config=cfg).result():
            out[r["cnpj"]] = {"porte": r["porte"], "mei": bool(r["mei"]) if r["mei"] is not None else False}
        print(f"  [bq] porte resolvido {min(i + CHUNK, len(uniq))}/{len(uniq)}", file=sys.stderr)
    return out


def fetch(ano: int, project: str | None) -> dict:
    codes = municipios_canonicos()
    descoberta: dict[str, dict] = {}
    contratos: list[dict] = []
    print(f"[online] varrendo PNCP — {len(codes)} municípios, ano {ano}…", file=sys.stderr)
    for n, ibge in enumerate(codes, 1):
        orgaos, homologado = _descobrir_orgaos(ibge, ano)
        municipais = {c: o for c, o in orgaos.items() if o.get("esfera") == ESFERA_MUNICIPAL}
        descoberta[ibge] = {
            "nOrgaos": len(orgaos), "nOrgaosMunicipais": len(municipais),
            "homologadoTodasEsferas": round(homologado, 2),
        }
        for cnpj in municipais:
            contratos.extend(_contratos_do_orgao(cnpj, ano))
        if n % 20 == 0 or n == len(codes):
            print(f"  {n}/{len(codes)} municípios — {len(contratos)} contratos municipais até aqui",
                  file=sys.stderr)

    # join de porte: CNPJs PJ nacionais
    cnpjs8 = [str(c["ni"])[:8] for c in contratos
              if c.get("tipoPessoa") == "PJ" and c.get("pais") in ("BRA", None) and c.get("ni")]
    print(f"[online] {len(contratos)} contratos; {len(set(cnpjs8))} CNPJs distintos p/ porte.", file=sys.stderr)
    porte = _porte_por_cnpj(cnpjs8, project) if cnpjs8 else {}

    return {
        "fetchedAt": datetime.now().strftime("%Y-%m-%d"),
        "ano": ano,
        "pncpBase": PNCP_BASE,
        "modalidadesDescoberta": MODALIDADES_DESCOBERTA,
        "descoberta": descoberta,
        "contratos": contratos,
        "porte": porte,
    }


# ----------------------------------------------------------------------------- agregação
def build_values(snapshot: dict) -> tuple[list[dict], dict]:
    ano = snapshot["ano"]
    porte = snapshot["porte"]
    descoberta = snapshot["descoberta"]
    codes = municipios_canonicos()
    code_set = set(codes)

    # acumuladores por município
    agg = {c: {
        "valorPJ": 0.0, "valorMPE": 0.0, "valorMEI": 0.0, "valorME": 0.0, "valorEPP": 0.0,
        "valorDemais": 0.0, "valorPF": 0.0, "valorEstrangeiro": 0.0, "valorDesconhecido": 0.0,
        "nContratos": 0, "nContratosPJ": 0, "fornecedores": set(), "fornecedoresMPE": set(),
    } for c in codes}

    for c in snapshot["contratos"]:
        ibge = c.get("ibge")
        if ibge not in code_set:
            continue  # contrato de unidade fora dos 223 (defensivo)
        v = c.get("valor")
        if not isinstance(v, (int, float)) or v <= 0:
            continue
        a = agg[ibge]
        a["nContratos"] += 1
        tp, pais, ni = c.get("tipoPessoa"), c.get("pais"), c.get("ni")
        if tp != "PJ" or not ni:
            a["valorPF"] += v
            continue
        if pais not in ("BRA", None):
            a["valorEstrangeiro"] += v
            continue
        info = porte.get(str(ni)[:8])
        if not info:
            a["valorDesconhecido"] += v
            continue
        # PJ nacional com porte resolvido → entra no denominador
        a["valorPJ"] += v
        a["nContratosPJ"] += 1
        a["fornecedores"].add(str(ni)[:8])
        p = info.get("porte")
        if p in ("1", "3"):  # pequeno negócio (ME/EPP; MEI ⊂ ME)
            a["valorMPE"] += v
            a["fornecedoresMPE"].add(str(ni)[:8])
            if info.get("mei"):
                a["valorMEI"] += v
            elif p == "1":
                a["valorME"] += v
            else:
                a["valorEPP"] += v
        else:
            a["valorDemais"] += v

    valores: list[dict] = []
    pb = {"valorPJ": 0.0, "valorMPE": 0.0, "comDados": 0}
    for code in codes:
        a = agg[code]
        d = descoberta.get(code, {})
        base = a["valorPJ"]
        pb["valorPJ"] += base
        pb["valorMPE"] += a["valorMPE"]
        common_bd = {
            "ano": ano,
            "nOrgaosMunicipais": d.get("nOrgaosMunicipais", 0),
            "nContratos": a["nContratos"], "nContratosPJ": a["nContratosPJ"],
            "valorPJ": round(base, 2), "valorMPE": round(a["valorMPE"], 2),
            "porPorte": {"MEI": round(a["valorMEI"], 2), "ME": round(a["valorME"], 2),
                         "EPP": round(a["valorEPP"], 2), "demais": round(a["valorDemais"], 2)},
            "valorExcluido": {"pf": round(a["valorPF"], 2), "estrangeiro": round(a["valorEstrangeiro"], 2),
                              "porteDesconhecido": round(a["valorDesconhecido"], 2)},
            "nFornecedoresPJ": len(a["fornecedores"]), "nFornecedoresMPE": len(a["fornecedoresMPE"]),
            "valorHomologadoTodasEsferas": d.get("homologadoTodasEsferas", 0.0),
            "escopo": "esfera municipal (orgaoEntidade.esferaId='M')",
        }
        if base <= 0:
            valores.append({
                "municipalityId": code, "indicatorId": INDICATOR_ID,
                "rawValue": "—", "numericValue": None, "referenceYear": str(ano),
                "source": SOURCE, "isFictional": False,
                "breakdown": dict(common_bd, semContratosMunicipais=True),
            })
            continue
        pb["comDados"] += 1
        pct = a["valorMPE"] / base * 100.0
        conf = "baixa" if (base < CONF_BAIXA_VALOR or a["nContratosPJ"] < CONF_BAIXA_N) else "normal"
        valores.append({
            "municipalityId": code, "indicatorId": INDICATOR_ID,
            "rawValue": f"{pct:.1f}%", "numericValue": round(pct, 1), "referenceYear": str(ano),
            "source": SOURCE, "isFictional": False,
            "breakdown": dict(common_bd, confiabilidade=conf),
        })

    meta = {"ano": ano, "pb": pb}
    return valores, meta


# ----------------------------------------------------------------------------- emit
HEADER = """// ARQUIVO GERADO por database/scripts/gerar_seed_mpe_compras_publicas.py — NÃO editar à mão.
// Idempotente: rodar de novo atualiza (upsert), não duplica.
// No NoSQLBooster: selecione o banco da OPP na conexão e execute este script.
// Para mirar um banco específico, troque a linha abaixo por:
//   const database = db.getSiblingDB('opp')
const database = db
"""


def js(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def emit(values: list[dict], ano: int) -> Path:
    indicator = {
        "_id": INDICATOR_ID,
        "label": LABEL,
        # sem `threshold`: não há faixa oficial p/ participação MPE em compras (não inventamos cortes).
        "referenceYear": str(ano),
        "description": DESCRIPTION,
        "source": SOURCE,
        "sourceDataset": SOURCE_DATASET,
        "placements": [{"section": "agenda", "agendaId": AGENDA, "order": ORDER}],
    }
    lines = [HEADER, ""]
    lines.append(f"// --- 1) Catálogo: o indicador {INDICATOR_ID} (agenda {AGENDA}) ---")
    lines.append("// Cross-source PNCP (contratos da esfera municipal) × Receita Federal (porte do CNPJ).")
    lines.append("// Pequeno negócio = porte ME/EPP (MEI incluso). SEM threshold (sem faixa oficial).")
    lines.append(f"const indicators = [\n  {js(indicator)},\n]")
    lines.append("database.indicators.bulkWrite(indicators.map(i => ({ updateOne: {")
    lines.append("  filter: { _id: i._id }, update: { $set: i }, upsert: true,")
    lines.append("} })), { ordered: false })")
    lines.append(f"print(`indicators({INDICATOR_ID}) -> ok (${{indicators.length}} docs)`)")
    lines.append("")
    lines.append(f"// --- 2) Valores por município ({len(values)} docs), ano {ano} ---")
    lines.append("const values = [")
    for v in values:
        lines.append(f"  {js(v)},")
    lines.append("]")
    lines.append("const now = new Date()")
    lines.append("const ops = values.map(v => ({ updateOne: {")
    lines.append("  filter: { municipalityId: v.municipalityId, indicatorId: v.indicatorId, referenceYear: v.referenceYear },")
    lines.append("  update: { $set: Object.assign({}, v, { updatedAt: now }) },")
    lines.append("  upsert: true,")
    lines.append("} }))")
    lines.append("const res = database.indicatorValues.bulkWrite(ops, { ordered: false })")
    lines.append(f"print(`indicatorValues({INDICATOR_ID}) -> upserted=${{res.upsertedCount}} modified=${{res.modifiedCount}} matched=${{res.matchedCount}}`)")
    SEED_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return SEED_FILE


def main() -> None:
    ap = argparse.ArgumentParser(description=f"Gera o seed do indicador {INDICATOR_ID} (PNCP × RFB).")
    ap.add_argument("--offline", action="store_true", help="usa o snapshot salvo, sem rede")
    ap.add_argument("--ano", type=int, default=datetime.now().year - 1, help="ano civil (padrão: ano anterior)")
    ap.add_argument("--project", help="projeto GCP de faturamento para a consulta BigQuery")
    args = ap.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)

    if args.offline:
        if not SNAPSHOT.exists():
            sys.exit(f"Snapshot não encontrado: {SNAPSHOT}. Rode online uma vez primeiro.")
        snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        print(f"[offline] snapshot {snapshot.get('fetchedAt')} — ano {snapshot['ano']}, "
              f"{len(snapshot['contratos'])} contratos.", file=sys.stderr)
    else:
        project = args.project or os.environ.get("GCP_BILLING_PROJECT")
        snapshot = fetch(args.ano, project)
        SNAPSHOT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"[online] snapshot salvo em {SNAPSHOT}", file=sys.stderr)

    values, meta = build_values(snapshot)
    out = emit(values, meta["ano"])

    pb = meta["pb"]
    pct_pb = pb["valorMPE"] / pb["valorPJ"] * 100 if pb["valorPJ"] else 0
    com = [v for v in values if v["numericValue"] is not None]
    media = sum(v["numericValue"] for v in com) / len(com) if com else 0
    print(f"{INDICATOR_ID}: {len(com)}/223 municípios com participação calculável; "
          f"média (simples) = {media:.1f}%.")
    print(f"Cross-check PB (esfera municipal): MPE R$ {pb['valorMPE']:,.0f} de "
          f"R$ {pb['valorPJ']:,.0f} a PJ = {pct_pb:.1f}%.")
    print(f"OK — seed em {out}")


if __name__ == "__main__":
    main()
