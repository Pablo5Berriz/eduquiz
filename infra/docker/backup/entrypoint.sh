#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Entrypoint du service `backup`.
#
#  1. Vérifie que les variables critiques sont définies (échec fast si
#     l'opérateur a oublié un secret — mieux que découvrir à 3 h du matin).
#  2. Configure les alias `mc` pour MinIO local et Backblaze B2.
#  3. Lance crond en avant-plan (PID 1).
#
#  Les scripts (pg-backup, minio-replicate) sont invoqués par cron selon
#  la crontab embarquée dans l'image.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

log() { printf '[backup-init] %s\n' "$*" >&2; }

# ── 1. Validation des variables requises ────────────────────────────────────
required_vars=(
    POSTGRES_HOST
    POSTGRES_USER
    POSTGRES_PASSWORD
    POSTGRES_DB
    MINIO_ENDPOINT
    MINIO_ACCESS_KEY
    MINIO_SECRET_KEY
    B2_ENDPOINT
    B2_ACCESS_KEY
    B2_SECRET_KEY
    B2_BUCKET_POSTGRES
    B2_BUCKET_MINIO
    BACKUP_AGE_RECIPIENT
)

for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        log "ERREUR : variable requise non définie : ${var}"
        exit 1
    fi
done

# ── 2. Configuration mc (alias MinIO local + Backblaze B2) ──────────────────
# Les alias sont stockés dans $HOME/.mc/config.json, persistant pour la vie
# du container (volume tmpfs ou layer).
mc alias set local-minio "${MINIO_ENDPOINT}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}" >/dev/null
mc alias set offsite-b2  "${B2_ENDPOINT}"  "${B2_ACCESS_KEY}"  "${B2_SECRET_KEY}"  >/dev/null

log "Alias mc configurés (local-minio, offsite-b2)"
log "Cible Postgres : ${POSTGRES_HOST}:5432/${POSTGRES_DB}"
log "Rétention locale : ${BACKUP_RETENTION_DAYS:-7} jours"

# ── 3. Export des variables pour cron (cron n'hérite pas de l'env du shell) ─
# On génère un /etc/environment lisible par crond busybox.
{
    echo "POSTGRES_HOST=${POSTGRES_HOST}"
    echo "POSTGRES_USER=${POSTGRES_USER}"
    echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}"
    echo "POSTGRES_DB=${POSTGRES_DB}"
    echo "MINIO_ENDPOINT=${MINIO_ENDPOINT}"
    echo "MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}"
    echo "MINIO_SECRET_KEY=${MINIO_SECRET_KEY}"
    echo "B2_ENDPOINT=${B2_ENDPOINT}"
    echo "B2_ACCESS_KEY=${B2_ACCESS_KEY}"
    echo "B2_SECRET_KEY=${B2_SECRET_KEY}"
    echo "B2_BUCKET_POSTGRES=${B2_BUCKET_POSTGRES}"
    echo "B2_BUCKET_MINIO=${B2_BUCKET_MINIO}"
    echo "BACKUP_AGE_RECIPIENT=${BACKUP_AGE_RECIPIENT}"
    echo "BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}"
    echo "PATH=/usr/local/bin:/usr/bin:/bin"
    echo "TZ=${TZ:-America/Toronto}"
} > /etc/environment

# ── 4. Lance crond au premier plan ──────────────────────────────────────────
log "Démarrage de crond (fréquences : voir /etc/crontabs/root)"
exec crond -f -l 8 -L /dev/stderr
