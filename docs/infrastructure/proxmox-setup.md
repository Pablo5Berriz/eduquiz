# Déploiement EduQuiz sur Proxmox

Guide opérationnel pour provisionner et déployer la pile de production
EduQuiz sur un serveur Proxmox personnel. Le périmètre couvre uniquement la
**V1 B2C** (une seule instance, un seul domaine, charge modérée). Les
sections marquées _futur_ ne sont pas requises pour la mise en ligne initiale
mais sont listées pour préparer les évolutions.

## Architecture cible

Internet ▶ Cloudflare (DNS + proxy orange cloud + WAF gratuit) ▶ Box / NAT
(ouverture 443/tcp uniquement) ▶ VM Debian 12 sur Proxmox ▶ Docker Compose
stack (Traefik → web / postgres / redis / minio + backup).

Un seul port exposé à internet : `443`. Traefik redirige automatiquement tout
trafic HTTP vers HTTPS sur le même domaine. SSH depuis l'extérieur passe par
un VPN ou un saut via le LAN domestique (pas d'exposition publique du port
22).

## Pré-requis matériels et logiciels

**Serveur Proxmox**. Processeur x86_64 avec AES-NI (accélère LUKS), 16 Go de
RAM minimum, disque NVMe ≥ 256 Go pour la VM applicative, disque supplémentaire
≥ 500 Go pour les volumes de données (sera chiffré LUKS).

**VM cible.** Debian 12 (Bookworm), 6 vCPU, 12 Go RAM, 60 Go disque système
(ext4, non chiffré — le système est reproductible, seules les données
sensibles sont chiffrées), 200 Go disque data (chiffré LUKS, monté sous
`/var/lib/eduquiz/data`). Réseau pont avec IP statique dans le LAN.

**Comptes externes requis avant le déploiement.** Domaine enregistré et
délégué à Cloudflare (tier gratuit). Compte Backblaze B2 avec deux buckets
privés créés : `eduquiz-postgres-backup` et `eduquiz-minio-backup`, plus une
Application Key limitée à ces deux buckets. Compte Resend (ou Postmark /
SendGrid) avec domaine vérifié pour les emails transactionnels. Compte
Stripe en mode live (ou test pour la première mise en ligne).

## Préparation de la VM

Installer Debian 12 avec le strict minimum (pas de bureau, pas de serveur
web, uniquement `openssh-server`). Créer un utilisateur non-root `deploy` qui
aura le droit `sudo` sans mot de passe pour les opérations Docker
uniquement. Désactiver la connexion SSH par mot de passe, n'autoriser que les
clés publiques de l'opérateur.

Mettre à jour le système puis installer les outils de base.

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y \
    curl git ufw fail2ban unattended-upgrades \
    cryptsetup parted \
    ca-certificates gnupg
```

Activer les mises à jour automatiques de sécurité (fichier
`/etc/apt/apt.conf.d/50unattended-upgrades` réglé sur `Debian-security`
uniquement, redémarrage nocturne désactivé : on veut valider manuellement les
kernels en prod). Activer `ufw` avec la politique `deny` par défaut, autoriser
uniquement 22/tcp depuis le LAN et 80/tcp + 443/tcp depuis partout.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.1.0/24 to any port 22 proto tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Configurer `fail2ban` avec la jail `sshd` activée et un seuil strict (3
tentatives, ban 24 h).

## Chiffrement LUKS du disque data

Toutes les données persistantes (Postgres, Redis AOF, MinIO, dumps locaux)
sont stockées sur un volume LUKS2 déchiffré au boot par l'opérateur. Le
header LUKS est sauvegardé séparément (gestionnaire de mots de passe + clé
USB chiffrée) — sans lui, le disque est irrécupérable.

```bash
# Créer le conteneur LUKS sur le disque data (exemple : /dev/sdb).
sudo cryptsetup luksFormat --type luks2 /dev/sdb
sudo cryptsetup luksHeaderBackup /dev/sdb \
    --header-backup-file /root/eduquiz-luks-header.bin
# Sauvegarder ensuite /root/eduquiz-luks-header.bin hors du serveur.

sudo cryptsetup open /dev/sdb eduquiz-data
sudo mkfs.ext4 -L eduquiz-data /dev/mapper/eduquiz-data
sudo mkdir -p /var/lib/eduquiz/data
sudo mount /dev/mapper/eduquiz-data /var/lib/eduquiz/data
```

Le volume LUKS n'est **pas** monté automatiquement : un reboot exige la
saisie de la passphrase par l'opérateur. C'est un arbitrage V1 assumé entre
sécurité (vol physique) et automatisation (plus complexe avec
`systemd-cryptenroll` + TPM). Documenter la procédure dans le gestionnaire
de mots de passe opérateur.

## Installation de Docker

Suivre les instructions officielles Debian de `docs.docker.com/engine/install/debian`
pour installer `docker-ce`, `docker-ce-cli`, `containerd.io`, `docker-buildx-plugin`
et `docker-compose-plugin`. Ajouter l'utilisateur `deploy` au groupe
`docker`, puis valider l'installation avec `docker run --rm hello-world`.

## Déploiement initial de l'application

Cloner le dépôt dans le répertoire home de `deploy`, créer `.env.prod` à
partir de `.env.prod.example`, puis construire et démarrer la pile.

```bash
cd ~
git clone git@github.com:<org>/eduquiz.git
cd eduquiz
cp .env.prod.example .env.prod
# Éditer .env.prod : remplacer tous les __CHANGE_ME__ par des valeurs fortes
# (openssl rand -base64 32). Ne jamais committer ce fichier.

# Lier les volumes Docker aux répertoires LUKS (fait une seule fois).
sudo mkdir -p /var/lib/eduquiz/data/{postgres,redis,minio,traefik-acme,backup-tmp}
sudo chown -R 999:999 /var/lib/eduquiz/data/postgres   # uid postgres alpine
sudo chown -R 999:999 /var/lib/eduquiz/data/redis
sudo chown -R 1000:1000 /var/lib/eduquiz/data/minio    # uid minio

# Construction et démarrage.
docker compose --env-file .env.prod \
    -f infra/docker/docker-compose.prod.yml build

docker compose --env-file .env.prod \
    -f infra/docker/docker-compose.prod.yml up -d
```

Les volumes Docker nommés (`eduquiz-postgres-prod`, etc.) seront créés dans
`/var/lib/docker/volumes/` par défaut. Pour forcer le stockage sur le
volume LUKS, utiliser un override qui remplace `driver: local` par un bind
mount vers `/var/lib/eduquiz/data/*`. Cet override (`docker-compose.override.yml`
local, non commité) est documenté dans un futur `deployments/proxmox/` —
pour la V1, la procédure simple est de **déplacer** `/var/lib/docker` vers
`/var/lib/eduquiz/docker` via une entrée `data-root` dans `/etc/docker/daemon.json`
avant le premier démarrage.

## Migrations Prisma

Les migrations ne sont **pas** exécutées par le container `web` au démarrage
(trop risqué de coupler disponibilité et cohérence du schéma). On les lance
manuellement depuis un container one-shot après chaque déploiement qui
contient de nouvelles migrations.

```bash
# Depuis la VM, monorepo cloné :
docker compose --env-file .env.prod \
    -f infra/docker/docker-compose.prod.yml \
    run --rm --entrypoint "" web \
    sh -c "pnpm --filter @eduquiz/db run db:migrate:deploy"
```

La commande `db:migrate:deploy` (à câbler côté `packages/db`) applique les
migrations en mode production sans prompt interactif. Documenter la sortie
dans le journal de déploiement.

## DNS et certificats

Configurer chez Cloudflare un enregistrement A pour `eduquiz.ca` (et `www`
ou sous-domaines au besoin) pointant vers l'IP publique de la box. Activer
le proxy orange cloud. Dans l'onglet SSL/TLS, choisir **Full (strict)** pour
que Cloudflare valide le certificat Let's Encrypt généré par Traefik.

Au premier démarrage, Traefik demande automatiquement le certificat via le
challenge TLS-ALPN-01 (uniquement sur le port 443). Surveiller les logs :

```bash
docker logs eduquiz-traefik -f
```

Un certificat valide doit apparaître dans `/acme/acme.json` (volume
`eduquiz-traefik-acme`) sous 30 secondes. En cas d'échec, vérifier que
Cloudflare est bien en **Full (strict)** et pas en **Flexible** (ce mode
termine TLS côté Cloudflare uniquement, incompatible avec la validation
Let's Encrypt en aval).

## Checklist de mise en route

- [ ] `curl -fsSI https://eduquiz.ca/api/health` retourne `200` et
      `{"status":"ok"}`.
- [ ] `docker compose ps` liste 6 services `running (healthy)` : traefik,
      web, postgres, redis, minio, backup.
- [ ] `docker logs eduquiz-traefik` ne montre aucune erreur ACME.
- [ ] Test de connexion depuis un navigateur externe : badge TLS valide,
      pas d'avertissement mixed content.
- [ ] `docker exec eduquiz-backup pg-backup` produit un fichier `.age` dans
      `/var/backups/eduquiz/postgres/` et un objet dans le bucket B2.
- [ ] `docker exec eduquiz-backup minio-replicate` complète sans erreur.
- [ ] Reboot de la VM : après déchiffrement LUKS manuel et `compose up -d`,
      l'application remonte en moins de 2 minutes.

## Mises à jour applicatives

Pour une mise à jour sans downtime (à faible volume V1, un downtime court
est acceptable) :

```bash
cd ~/eduquiz
git fetch --all --prune
git checkout <tag-ou-commit>

docker compose --env-file .env.prod \
    -f infra/docker/docker-compose.prod.yml build web

# Appliquer les migrations avant de basculer l'image.
docker compose --env-file .env.prod \
    -f infra/docker/docker-compose.prod.yml \
    run --rm --entrypoint "" web \
    sh -c "pnpm --filter @eduquiz/db run db:migrate:deploy"

docker compose --env-file .env.prod \
    -f infra/docker/docker-compose.prod.yml up -d web
```

Le rollback se fait en repointant sur le commit précédent et en relançant le
build. Les migrations doivent toujours être **rétrocompatibles** (phase 1 :
ajout colonne nullable → code lit/écrit les deux variantes → phase 2 :
suppression de l'ancienne) pour que ce rollback soit sûr.

## Sujets reportés au Lot suivant ou _futur_

Monitoring actif (Prometheus + Loki + Grafana + alerting Uptime Kuma),
PgBouncer pour pooler les connexions Prisma, réplica Postgres en lecture,
auto-scaling du service `web`, déchiffrement LUKS automatisé via TPM,
renforcement des images Docker avec signatures Cosign / SBOM. Aucun de ces
sujets ne bloque la mise en ligne V1 : ils s'ajouteront quand la charge ou
les contraintes le justifieront.

## Références

- Compose file : [`infra/docker/docker-compose.prod.yml`](../../infra/docker/docker-compose.prod.yml)
- Dockerfile web : [`infra/docker/web.Dockerfile`](../../infra/docker/web.Dockerfile)
- Variables : [`.env.prod.example`](../../.env.prod.example)
- Stratégie backup : [`backup-strategy.md`](./backup-strategy.md)
- Choix stack initial : [`docs/02-stack-proxmox.md`](../02-stack-proxmox.md)
