# Stratégie de sauvegarde — EduQuiz

Document opérationnel qui fixe la cadence, la rétention, les objectifs de
reprise et la procédure de restauration des données EduQuiz en production.
S'applique à la V1 B2C (un seul environnement prod) et sera révisé si le volume
ou la criticité évoluent.

## Objectifs (V1)

- **RPO** (perte de données maximale acceptable) : 24 heures. Un incident majeur
  peut entraîner au pire la perte du dernier jour d'activité.
- **RTO** (temps de reprise cible) : 4 heures. Restauration complète et retour
  en ligne sur un nouvel hôte si l'original est irrécupérable.
- **Principe 3-2-1** respecté : trois copies (prod + dump local + dump
  off-site), deux supports distincts (SSD local chiffré LUKS + stockage B2), une
  copie hors-site (Backblaze B2 en Amérique du Nord).

## Périmètre

Quatre jeux de données sont protégés. Le **schéma PostgreSQL** (toutes les
tables applicatives : utilisateurs, familles, cours, tentatives, etc.) est
sauvegardé via `pg_dump --format=custom` quotidien, chiffré, externalisé. Les
**uploads utilisateurs** stockés dans MinIO (avatars, éventuelles pièces
jointes) sont répliqués quotidiennement vers un bucket B2 dédié.

Le **cache Redis** (sessions Auth.js, rate-limit counters) n'est volontairement
**pas** sauvegardé : reconstructible à tout moment, coût acceptable d'une
reconnexion forcée des utilisateurs après incident.

Les **secrets et configuration** (`.env.prod`, header LUKS, clé privée age) sont
sous la responsabilité directe de l'opérateur Paul : gestionnaire de mots de
passe 1Password/Bitwarden + copie physique chiffrée. Ils ne transitent jamais
par les scripts automatisés.

## Cadence et rotation

| Ressource       | Fréquence    | Rétention locale     | Rétention off-site (B2)           |
| --------------- | ------------ | -------------------- | --------------------------------- |
| PostgreSQL      | Quotidienne  | 7 jours              | 30 jours quotidiens + 12 mensuels |
| MinIO (uploads) | Quotidienne  | aucune (source)      | persistant (pas de suppression)   |
| Snapshot VM     | Hebdomadaire | 4 semaines (Proxmox) | —                                 |

Les suppressions de dumps B2 sont gérées par des **Lifecycle Rules** côté
Backblaze, configurées une seule fois à la main et documentées dans le runbook
(bucket `eduquiz-postgres-backup` : conserver le dump du 1ᵉʳ de chaque mois
pendant 365 jours, le reste 30 jours).

Les uploads MinIO ne sont **jamais supprimés** côté B2 : protection contre une
suppression malveillante ou accidentelle côté primaire (ransomware, erreur
humaine). Activer l'**Object Lock** en mode Compliance sur le bucket pour
renforcer l'immuabilité si nécessaire.

## Chiffrement

Chaque dump Postgres est chiffré avec [`age`](https://age-encryption.org) avant
upload (`age -r $BACKUP_AGE_RECIPIENT`). La clé **publique** (recipient) est
stockée dans `.env.prod` sur le serveur. La clé **privée** correspondante n'est
**jamais** sur le serveur — elle est détenue par Paul dans son gestionnaire de
mots de passe avec une copie physique chiffrée hors ligne.

Conséquence opérationnelle : restaurer un dump exige la présence physique (ou à
distance via outil sécurisé) de la personne qui détient la clé privée. C'est une
friction assumée en V1 pour éviter tout vol simultané des données et de la clé.

Les données en transit vers B2 passent en HTTPS (certificat Backblaze). L'Object
Lock B2 empêche la suppression même avec les credentials compromis.

## Implémentation technique

Le service Docker `backup` (image `eduquiz/backup:prod`, définie dans
[`infra/docker/backup/`](../../infra/docker/backup/)) exécute deux scripts via
cron interne :

`pg-backup.sh` (02:30 Toronto, quotidien) dump la base via
`pg_dump --format=custom --compress=9`, chiffre le fichier avec `age`, le pousse
vers `offsite-b2/$B2_BUCKET_POSTGRES/daily/`, copie localement dans
`/var/backups/eduquiz/postgres/`, et purge les dumps locaux au-delà de la
rétention configurée (`BACKUP_RETENTION_DAYS`, défaut 7).

`minio-replicate.sh` (03:15 Toronto, quotidien) synchronise le bucket applicatif
MinIO vers `offsite-b2/$B2_BUCKET_MINIO` via `mc mirror --preserve`, sans
l'option `--remove` (aucune suppression côté distant).

Les logs partent sur le stderr du container (visibles via
`docker logs eduquiz-backup`). Un échec se traduit par une sortie non nulle du
cron, qui sera captée par le futur monitoring (Uptime Kuma + alerte email) au
lot d'observabilité.

## Procédure de restauration

### Restauration PostgreSQL depuis un dump B2

Ce scénario couvre une corruption logique (mauvaise migration, effacement
accidentel), une compromission de la base, ou un hardware failure du disque
primaire.

Récupérer le dump chiffré depuis Backblaze B2 (via `mc cp offsite-b2/...` ou la
console web). Transférer la clé privée `age` depuis le gestionnaire de mots de
passe sur la machine de restauration (jamais sur le serveur en fonctionnement).
Déchiffrer puis restaurer :

```bash
# Sur la machine de restauration (hors serveur prod)
age -d -i ~/age-key.txt \
    -o eduquiz-20260421T063000Z.dump \
    eduquiz-20260421T063000Z.dump.age

# Recréer la base cible (vide) si nécessaire
psql "postgresql://eduquiz:...@<host>:5432/postgres" \
    -c "DROP DATABASE IF EXISTS eduquiz; CREATE DATABASE eduquiz OWNER eduquiz;"

# Restaurer
pg_restore \
    --host=<host> \
    --username=eduquiz \
    --dbname=eduquiz \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --jobs=4 \
    eduquiz-20260421T063000Z.dump
```

Après restauration : vérifier que les extensions `pgcrypto` et `citext` sont
présentes (le script d'init de Postgres les crée au premier démarrage d'un
volume vierge ; pour un volume réutilisé il faut les recréer manuellement).

### Restauration partielle MinIO

Les buckets B2 miroirs étant immuables, on peut récupérer n'importe quel fichier
individuellement via
`mc cp offsite-b2/$B2_BUCKET_MINIO/<path> local-minio/$S3_BUCKET/<path>`. Pour
une restauration complète d'un bucket effacé,
`mc mirror offsite-b2/$B2_BUCKET_MINIO local-minio/$S3_BUCKET` (direction
inversée du script de sauvegarde).

### Restauration complète de l'environnement

Si la VM Proxmox est perdue : provisionner une nouvelle VM Debian 12 en suivant
[`proxmox-setup.md`](./proxmox-setup.md), restaurer le volume LUKS depuis le
backup de header + une copie du disque (snapshot Proxmox), puis lancer la pile.
Si le volume LUKS lui-même est perdu, repartir d'un volume vierge, appliquer la
restauration PostgreSQL décrite ci-dessus, puis la restauration MinIO.

## Test trimestriel de restauration

Non optionnel. Chaque trimestre, Paul effectue un test de restauration complet
sur une VM jetable (non prod) et consigne dans un journal :

- date du test ;
- version du dump restauré ;
- durée totale (téléchargement + déchiffrement + `pg_restore`) ;
- problèmes rencontrés ;
- actions correctives.

Un test qui échoue est un **incident majeur** : la sauvegarde existait mais
n'était pas restaurable, ce qui équivaut à ne pas en avoir. Corriger la cause
avant de refermer l'incident.

Date du prochain test prévu : **2026-07-21** (3 mois après la mise en ligne
initiale prévue).

## Points de vigilance

Les dumps `pg_dump` ne sont pas des sauvegardes incrémentales : après une
transaction massive, chaque dump embarque l'état complet. Si la base dépasse 50
Go compressés, basculer sur `pgBackRest` avec WAL archiving (PITR point-in-time
recovery, rétention 7 jours en incrémental + full hebdo). Ce bascule est prévu
au lot d'observabilité si le volume le justifie.

Les tests de restauration doivent se faire **hors** du serveur prod pour ne pas
risquer d'écraser les données vivantes en cas d'erreur de manipulation.

Le montant mensuel Backblaze B2 à surveiller : avec un trafic initial estimé à
quelques Go de dumps par mois + quelques centaines de Mo d'uploads, la facture
devrait rester sous 1 USD/mois la première année. Placer une alerte de coût à 5
USD/mois pour détecter une fuite (dumps non purgés, etc.).

## Références

- Compose prod :
  [`infra/docker/docker-compose.prod.yml`](../../infra/docker/docker-compose.prod.yml)
- Scripts backup : [`infra/docker/backup/`](../../infra/docker/backup/)
- Variables : [`.env.prod.example`](../../.env.prod.example)
- Guide déploiement : [`proxmox-setup.md`](./proxmox-setup.md)
- Choix stack initial (section Sauvegardes) :
  [`docs/02-stack-proxmox.md`](../02-stack-proxmox.md)
