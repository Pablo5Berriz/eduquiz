#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Réplication MinIO → Backblaze B2.
#
#  Utilise `mc mirror` pour copier incrémentalement le contenu du bucket
#  applicatif MinIO vers un bucket Backblaze B2 dédié. Le mode `--overwrite`
#  n'est PAS activé : une fois un objet copié off-site, il est immuable
#  côté B2 (Object Lock activable au niveau bucket pour durcir).
#
#  Ce script ne traite que les uploads utilisateurs (avatars, pièces
#  jointes, etc.). Les dumps Postgres sont gérés par pg-backup.sh avec une
#  politique de rétention séparée.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"

log() { printf '[minio-replicate %s] %s\n' "${timestamp}" "$*" >&2; }

# Source : bucket applicatif MinIO (nom fourni par l'env via S3_BUCKET).
# On liste ce que l'app utilise réellement ; pour la V1 c'est `eduquiz` (un
# seul bucket). Si plusieurs buckets apparaissent plus tard, itérer ici.
src_bucket="${S3_BUCKET:-eduquiz}"
src="local-minio/${src_bucket}"
dst="offsite-b2/${B2_BUCKET_MINIO}"

log "Vérification que le bucket source existe : ${src}"
if ! mc ls "${src}" >/dev/null 2>&1; then
    log "AVERTISSEMENT : bucket source ${src} introuvable — rien à répliquer"
    exit 0
fi

log "Mirror ${src} → ${dst}"
# --preserve : conserve les métadonnées et tags.
# --quiet    : réduit le bruit (cron log).
# Pas de --remove : on ne supprime JAMAIS côté off-site, même si un objet
# disparaît localement (protection contre ransomware / suppression
# accidentelle).
mc mirror --preserve --quiet "${src}" "${dst}"

log "Réplication OK"
