# Backup — EduQuiz

Service cron qui tourne dans la pile de production (`docker-compose.prod.yml`).
Il effectue deux tâches automatiques :

- `pg-backup` (02:30 UTC-4) — dump PostgreSQL chiffré (age), poussé vers
  Backblaze B2 et conservé 7 jours en local.
- `minio-replicate` (03:15 UTC-4) — mirror du bucket MinIO vers Backblaze B2,
  sans suppression côté distant (protection ransomware).

Détails et procédure de restauration : voir
[`docs/infrastructure/backup-strategy.md`](../../../docs/infrastructure/backup-strategy.md).

## Développement / test local

```bash
# Build
docker build -t eduquiz/backup:local infra/docker/backup

# Invocation manuelle (exige les env vars)
docker run --rm --network eduquiz-internal \
    --env-file .env.prod \
    eduquiz/backup:local pg-backup
```

## Fichiers

- `Dockerfile` — image alpine minimale (pg_dump, mc, age, crond).
- `entrypoint.sh` — validation des env vars, alias mc, lancement crond.
- `crontab` — planification (modifier si changement de RPO).
- `pg-backup.sh` — dump chiffré + upload B2 + rotation locale.
- `minio-replicate.sh` — mirror MinIO → B2 (pas de suppression distante).
