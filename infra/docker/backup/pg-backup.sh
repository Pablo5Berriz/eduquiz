#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Backup PostgreSQL quotidien — EduQuiz.
#
#  Flux :
#    1. `pg_dump --format=custom` → dump binaire compressé (gain ~3x vs SQL).
#    2. Chiffrement symétrique avec `age -r $BACKUP_AGE_RECIPIENT`.
#    3. Upload vers Backblaze B2 (bucket ${B2_BUCKET_POSTGRES}).
#    4. Copie locale dans /var/backups/eduquiz/postgres/.
#    5. Rotation locale : garde ${BACKUP_RETENTION_DAYS} fichiers récents.
#
#  La clé de déchiffrement (X25519 ou passphrase) est conservée HORS DU
#  SERVEUR par l'opérateur. Ici on ne stocke QUE la clé publique (recipient).
#
#  En cas d'échec à n'importe quelle étape : exit code non nul → cron log
#  l'erreur → monitoring (étape future) peut pager.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
local_dir="/var/backups/eduquiz/postgres"
dump_file="${local_dir}/eduquiz-${timestamp}.dump"
encrypted_file="${dump_file}.age"

log() { printf '[pg-backup %s] %s\n' "${timestamp}" "$*" >&2; }

mkdir -p "${local_dir}"

# ── 1. Dump ─────────────────────────────────────────────────────────────────
log "pg_dump → ${dump_file}"
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    --host="${POSTGRES_HOST}" \
    --username="${POSTGRES_USER}" \
    --dbname="${POSTGRES_DB}" \
    --format=custom \
    --compress=9 \
    --no-owner \
    --no-privileges \
    --file="${dump_file}"

dump_size="$(stat -c%s "${dump_file}")"
log "Dump OK, taille = ${dump_size} octets"

# ── 2. Chiffrement ──────────────────────────────────────────────────────────
log "Chiffrement age → ${encrypted_file}"
age -r "${BACKUP_AGE_RECIPIENT}" -o "${encrypted_file}" "${dump_file}"

# Le dump clair est détruit immédiatement : on ne garde jamais de copie
# non chiffrée sur disque plus longtemps que nécessaire.
shred -u -n 1 "${dump_file}" 2>/dev/null || rm -f "${dump_file}"

enc_size="$(stat -c%s "${encrypted_file}")"
log "Chiffrement OK, taille = ${enc_size} octets"

# ── 3. Upload off-site (Backblaze B2) ───────────────────────────────────────
remote_path="offsite-b2/${B2_BUCKET_POSTGRES}/daily/$(basename "${encrypted_file}")"
log "Upload B2 → ${remote_path}"
mc cp --quiet "${encrypted_file}" "${remote_path}"
log "Upload OK"

# ── 4. Rotation locale ──────────────────────────────────────────────────────
retention="${BACKUP_RETENTION_DAYS:-7}"
log "Rotation locale : conservation des ${retention} derniers dumps"
# Liste triée antéchronologiquement, on supprime à partir de l'index
# ${retention}+1.
cd "${local_dir}"
to_delete=$(ls -1t *.age 2>/dev/null | tail -n +$((retention + 1)) || true)
if [[ -n "${to_delete}" ]]; then
    while IFS= read -r f; do
        log "  suppression : ${f}"
        rm -f "${f}"
    done <<< "${to_delete}"
else
    log "  rien à supprimer"
fi

log "Terminé avec succès"
