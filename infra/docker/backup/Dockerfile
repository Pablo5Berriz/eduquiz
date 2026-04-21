# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
#  Image du service `backup` de la pile prod.
#
#  Contient :
#    - pg_dump (postgresql-client 16, aligné avec le serveur)
#    - mc (MinIO client, pour lister/répliquer les buckets)
#    - age (chiffrement symétrique des dumps)
#    - crond (busybox) pour la planification
#    - bash/coreutils pour les scripts
#
#  Les scripts sont copiés dans /usr/local/bin, la crontab dans /etc/crontabs.
# ─────────────────────────────────────────────────────────────────────────────

FROM alpine:3.20

RUN apk add --no-cache \
    bash \
    coreutils \
    curl \
    gzip \
    postgresql16-client \
    age \
    tzdata \
    ca-certificates \
    && update-ca-certificates

# MinIO client (mc) : binaire statique officiel.
ARG MC_VERSION=RELEASE.2025-01-17T23-25-50Z
RUN curl -fsSL "https://dl.min.io/client/mc/release/linux-amd64/archive/mc.${MC_VERSION}" \
    -o /usr/local/bin/mc \
    && chmod +x /usr/local/bin/mc

# Scripts + crontab.
COPY pg-backup.sh /usr/local/bin/pg-backup
COPY minio-replicate.sh /usr/local/bin/minio-replicate
COPY entrypoint.sh /usr/local/bin/entrypoint
COPY crontab /etc/crontabs/root

RUN chmod +x /usr/local/bin/pg-backup /usr/local/bin/minio-replicate /usr/local/bin/entrypoint

ENV TZ=America/Toronto

# Le backup tourne en root dans le container (pour lire/écrire les volumes),
# mais le container lui-même est isolé sur le réseau privé.
WORKDIR /var/backups/eduquiz

ENTRYPOINT ["/usr/local/bin/entrypoint"]
