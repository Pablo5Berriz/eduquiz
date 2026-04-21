# Sécurité et conformité Loi 25 — EduQuiz

Ce document est le référentiel de conformité légale et technique d'EduQuiz
vis-à-vis de la _Loi modernisant des dispositions législatives en matière de
protection des renseignements personnels_ (Loi 25, Québec), de la _Loi sur la
protection des renseignements personnels et les documents électroniques_
(LPRPDÉ, fédéral) et, pour les usagers potentiels hors Canada, du COPPA
américain.

Il se veut opérationnel : chaque obligation est rattachée à un contrôle
technique ou organisationnel concret et à un emplacement dans le code ou la
documentation.

## Cadre légal applicable

**Loi 25 (Québec)** — obligatoire. EduQuiz héberge les données sur le territoire
québécois (Proxmox personnel, Montréal) et s'adresse à un public québécois. Les
articles 3.1 à 3.6 (gouvernance, incidents, évaluation de facteurs relatifs à la
vie privée), 7 à 19 (consentement), et 27 à 40 (droits des personnes concernées)
s'appliquent pleinement.

**LPRPDÉ (fédéral)** — obligatoire à titre subsidiaire pour les échanges
inter-provinciaux et les sous-traitants hors Québec (Stripe, Resend, Cloudflare,
Backblaze).

**COPPA (États-Unis)** — applicable si un utilisateur se connecte depuis les
États-Unis et déclare être de moins de 13 ans. La V1 ne cible pas le marché
américain mais implémente déjà le consentement parental vérifiable (§ Flux
Consentement) au niveau COPPA — aucun effort supplémentaire nécessaire si le
scope évolue.

## Responsable de la protection des renseignements personnels (RPRP)

La Loi 25 exige la désignation explicite d'un RPRP et la publication de son
contact. Chez EduQuiz :

- **RPRP désigné** : Solutions Infos (<solutionsinfos2023@gmail.com>)
- **Responsable projet** : Paul Quentin (<paulquentin4@gmail.com>)

Le contact RPRP est publié dans le footer de l'application, dans la politique de
confidentialité et dans les courriels d'accueil. Toute demande LAMP-Q (cf.
infra) peut être adressée directement à cette adresse ; l'outil `DataRequest`
interne sert d'alternative et crée la trace nécessaire.

## Inventaire des renseignements personnels

La Loi 25 impose de connaître précisément les données collectées, leur finalité,
leur durée de conservation et leur partage. L'inventaire à jour :

### Données d'identité (table `users`, `profiles`)

| Donnée               | Finalité                                 | Rétention                           |
| -------------------- | ---------------------------------------- | ----------------------------------- |
| Email                | Authentification, communications         | Jusqu'à suppression + 30 j de grâce |
| Hash de mot de passe | Authentification                         | Idem email                          |
| Prénom, nom          | Personnalisation de l'interface          | Idem email                          |
| Date de naissance    | Vérification âge + consentement parental | Idem email                          |
| Niveau scolaire      | Personnalisation pédagogique             | Idem email                          |
| Locale et province   | Affichage, restrictions géographiques    | Idem email                          |
| Avatar (URL MinIO)   | Affichage interface                      | Supprimé avec le compte             |

### Données d'usage (tables `attempts`, `attempt_answers`, `progress`, `streaks`)

Tentatives d'exercices et de quiz, réponses détaillées, maîtrise par compétence,
série quotidienne. Finalité : suivi pédagogique de l'apprenant et de son parent.
Rétention : pendant la vie du compte + 30 jours de grâce. Les agrégats
anonymisés (moyennes par matière, sans identifiant nominatif) peuvent être
conservés indéfiniment.

### Données de consentement et d'audit (tables `consent_records`, `audit_logs`)

IP, user-agent, horodatage, nature de l'événement. Finalité : traçabilité légale
(Loi 25 art. 8). Rétention : **7 ans minimum** (exigence Loi 25 pour prouver le
consentement), même après suppression du compte — les journaux sont anonymisés
(FK utilisateur mise à NULL) mais conservés. Les colonnes `audit_logs.actor_id`
et `consent_records.user_id` basculent en NULL au moment de la suppression ; les
payloads sont purgés des PII restants.

### Données de facturation (tables `subscriptions`, `payments`)

Identifiants Stripe (customer, subscription, payment intent), montant, statut,
URL de reçu. Finalité : gestion de l'abonnement et obligations comptables.
Rétention : **7 ans** (exigence fiscale Revenu Québec), après suppression du
compte, les enregistrements sont conservés sans lien nominatif.

### Cookies et cache (Redis)

`session_token` (HttpOnly, Secure, SameSite=Lax, TTL 30 j), compteurs de
rate-limit (`ratelimit:*`, TTL court). Redis n'est **jamais** sauvegardé ; perte
acceptable en cas d'incident, reconnexion forcée des utilisateurs.

## Finalités et limitation

Chaque donnée collectée a une finalité déclarée (cf. inventaire) et la Loi 25
interdit l'usage au-delà. Traduction opérationnelle :

- Les emails ne servent **pas** à des communications marketing sans opt-in
  explicite (`consent_records` avec `kind = MARKETING_OPTED_IN`). Ce flag est
  vérifié avant chaque envoi par Resend.
- Les données d'usage ne sont **pas** vendues, partagées ou utilisées pour
  entraîner un modèle tiers. Les analyses internes passent par des vues agrégées
  anonymisées.
- Les données pédagogiques d'un mineur ne sont accessibles qu'à lui-même, son
  parent vérifié (`parent_child_links.state = 'VERIFIED'`) et aux admins en cas
  de support. Cette règle est imposée par les politiques RLS PostgreSQL (cf.
  [`03-data-model.md`](./03-data-model.md)).

## Consentement parental vérifiable

La Loi 25 exige un consentement libre, éclairé et vérifiable pour la collecte et
l'utilisation des données d'un mineur de moins de 14 ans (Loi 25 art. 4.1).
EduQuiz généralise la règle à tous les mineurs (< 18 ans) pour alignement COPPA
et simplicité opérationnelle.

### Flux technique

Le flux détaillé (séquence Mermaid) est documenté dans
[`01-architecture.md`](./01-architecture.md) § "Flux de consentement parental".
Les contrôles clés :

1. Inscription d'un mineur → `users.role = LEARNER_MINOR`, aucune donnée
   pédagogique accessible tant que le lien parent n'est pas `VERIFIED`.
2. Génération d'un code à 6 chiffres (`parent_child_links.invitation_code`)
   valable 24 h, stocké sans hash (considéré éphémère).
3. Le mineur transmet le code au parent ; le parent reçoit un courriel signé de
   Resend avec un lien unique de confirmation.
4. Clic du lien → `parent_child_links.state = VERIFIED`, horodatage, IP et
   user-agent du parent capturés dans `consent_records` (kind =
   `PARENT_CONFIRMED`).
5. Le parent peut révoquer à tout moment (`state = REVOKED`) ; l'accès est
   immédiatement coupé par RLS.

### Registre immuable

Chaque événement du flux est consigné dans `consent_records` avec IP, user-
agent, horodatage, type d'événement (enum `ConsentEventKind`). La table est
**append-only** : un trigger PL/pgSQL bloque `UPDATE` et `DELETE`. C'est la
preuve légale que le consentement a bien été donné ; elle survit à la
suppression du compte (FK nullifiée mais ligne conservée 7 ans).

## Droits des personnes concernées (LAMP-Q)

La Loi 25 garantit cinq droits. Chaque droit est associé à une implémentation
concrète dans EduQuiz :

**Accès.** L'utilisateur (ou son parent vérifié s'il est mineur) peut demander
un export complet de ses données au format JSON ou PDF depuis son tableau de
bord. L'endpoint crée un `DataRequest(kind = EXPORT)`, un worker asynchrone (V2
; en V1, traitement dans la requête même jusqu'au seuil) génère l'archive, la
chiffre, la dépose dans MinIO avec une URL signée de 72 h. Délai max légal : 30
jours (la V1 vise quelques minutes).

**Rectification.** Directement via les écrans de profil. Les modifications sont
journalisées dans `audit_logs` (`PROFILE_UPDATED`). Les champs qui ne peuvent
pas être rectifiés en libre-service (p. ex. date de naissance invalide) passent
par le RPRP.

**Retrait du consentement.** Bouton "désabonnement marketing" dans les
préférences utilisateur → insertion
`consent_records(kind = MARKETING_OPTED_OUT)`. Révocation du lien parental
possible côté parent ou côté enfant (avec alerte au parent).

**Effacement (droit à l'oubli).** L'utilisateur déclenche un
`DataRequest(kind = DELETION)`. Statut initial `AWAITING_GRACE_PERIOD` pendant
**30 jours** (réversibilité : l'utilisateur peut annuler). Au-delà, un job
quotidien exécute la purge : tables `users`, `profiles`, `accounts`, `sessions`,
`parent_child_links`, `attempts`, `attempt_answers`, `progress`, `streaks`,
`user_badges`, `notifications`, `subscriptions`, `payments` sont soit supprimées
(cascade), soit anonymisées (`consent_records.user_id`, `audit_logs.actor_id`
passent à NULL). Les journaux conservent la trace mais perdent le lien
nominatif. Délai max légal : 30 jours — notre délai réel est 30 j + 1 nuit.

**Portabilité.** Même endpoint que l'accès, format JSON structuré et
interopérable (schéma documenté dans `packages/types/src/export.ts`).
L'utilisateur peut importer les données dans un autre service ou les conserver
hors ligne.

Délai de réponse pour l'ensemble : **30 jours calendaires maximum** (Loi 25 art.
27.3). Les délais effectifs sont mesurés via `data_requests.created_at` vs
`data_requests.completed_at` ; un seuil d'alerte est fixé à 20 jours pour
laisser du tampon.

## Exigences techniques appliquées

### Chiffrement en transit

TLS 1.3 obligatoire de bout en bout. Cloudflare termine un premier TLS côté edge
en mode **Full (strict)**, Traefik termine le second sur la VM avec un
certificat Let's Encrypt renouvelé automatiquement (TLS-ALPN-01). HSTS
`max-age=31536000; includeSubDomains; preload` imposé par Traefik. Pas de
redirection HTTP→HTTPS permissive : toute requête HTTP est renvoyée vers HTTPS
avec `Strict-Transport-Security` immédiat.

### Chiffrement au repos

**Disque** : LUKS2 (cryptsetup) sur le volume dédié `eduquiz-data` (200 Go sur
le NVMe), header sauvegardé séparément dans le gestionnaire de mots de passe
opérateur et sur clé USB chiffrée. Sans la passphrase **et** le header, le
disque est irrécupérable. Reboot manuel : saisie de passphrase requise
(arbitrage V1 assumé vs. TPM automatisé, cf.
[`infrastructure/proxmox-setup.md`](./infrastructure/proxmox-setup.md)).

**Postgres** : pgcrypto disponible. La V1 stocke la date de naissance en clair ;
la colonne est dimensionnée pour accueillir un `pgp_sym_encrypt` ultérieur sans
migration destructrice.

**Sauvegardes** : chaque dump Postgres est chiffré avec
[`age`](https://age-encryption.org) avant upload B2. La clé privée n'est
**jamais** sur le serveur ; elle est détenue par Paul hors ligne. Un attaquant
qui obtient l'accès à B2 ne peut pas lire les dumps. Cf.
[`infrastructure/backup-strategy.md`](./infrastructure/backup-strategy.md).

### Secrets d'authentification

Mots de passe hashés en **Argon2id** (paramètres Auth.js v5 par défaut :
m=65536, t=3, p=4). Les tokens de session sont signés par une clé `AUTH_SECRET`
stockée dans `.env.prod` (hors Git, présente uniquement sur la VM et dans le
gestionnaire de mots de passe). Les tokens OAuth stockés dans `accounts`
(`refresh_token`, `access_token`) pourraient être chiffrés via pgcrypto en lot
ultérieur ; V1 s'appuie sur la protection LUKS + RLS.

### Rate-limit et anti-énumération

Redis supporte les compteurs glissants sur les surfaces d'authentification.
Règles V1 : `POST /api/auth/signin/*` limité à 5 requêtes / IP / minute avec
cooldown exponentiel (5s, 10s, 20s, 40s, puis ban 15 min). Les endpoints
`POST /api/parent/confirm` et `GET /api/auth/verify` sont limités à 3 tentatives
/ IP / heure pour éviter l'énumération de codes.

### Headers de sécurité

Traefik applique pour toute réponse :

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- CSP stricte (posée par Next.js middleware, restreint `img-src` à self +
  MinIO + avatars OAuth ; `script-src 'self' 'nonce-*'`).

### Gestion des incidents

La Loi 25 (art. 3.5) impose de consigner les incidents de sécurité dans un
registre et de notifier la CAI Québec si un risque sérieux de préjudice existe.
Table `incident_registers` dédiée avec colonnes : date de survenance, détection,
notification CAI, sévérité, résumé, cause racine, remédiation. Le registre est
mutable pendant l'investigation puis verrouillé (à prévoir via trigger en Phase
1).

Procédure de notification : seuil = divulgation non autorisée d'une donnée
personnelle identifiante. Délai CAI : **sans délai** après détection, et
documenté. Notification aux personnes concernées : dès que l'on peut les
identifier, par courriel, avec description de l'incident et des mesures prises.

## Sous-traitants et hébergeurs

La Loi 25 (art. 17.1) exige que chaque sous-traitant présente des garanties
équivalentes. Liste V1 :

| Sous-traitant | Rôle                            | Lieu            | Données transmises                     |
| ------------- | ------------------------------- | --------------- | -------------------------------------- |
| Cloudflare    | DNS + proxy + WAF               | Global CDN      | Métadonnées HTTP (IP, UA)              |
| Stripe        | Traitement paiements            | USA/Canada      | Email, montant, IP                     |
| Resend        | Envoi courriels transactionnels | USA (AWS)       | Email, prénom, contenu msg             |
| Backblaze B2  | Stockage off-site chiffré       | USA (région NA) | Dumps chiffrés + objets MinIO chiffrés |

Chaque sous-traitant dispose d'une politique de confidentialité et d'une clause
DPA (_Data Processing Addendum_) signée par EduQuiz. La politique de
confidentialité publique d'EduQuiz liste nommément ces sous-traitants (exigence
Loi 25 art. 8.1).

Pour les données transmises à Backblaze et Resend (hors Québec), l'évaluation de
facteurs relatifs à la vie privée (ÉFVP Loi 25 art. 3.3) conclut que le
transfert est nécessaire (pas d'équivalent québécois raisonnable), les données
sont chiffrées côté client avant envoi (cas de Backblaze), et la clause DPA
offre un niveau de protection comparable. L'ÉFVP est documentée dans un document
interne (à classer dans `docs/legal/efvp-*.md` en Phase 1).

## Politique de confidentialité et CGU

Deux documents publics, versionnés, affichés à l'inscription :

- **Politique de confidentialité** : inventaire des données, finalités,
  rétention, droits, contact RPRP, sous-traitants. Versionnée avec incrément
  majeur à chaque changement matériel et notification utilisateur.
- **Conditions générales d'utilisation** : règles d'usage, limitations,
  responsabilités.

L'acceptation génère une ligne dans `consent_records` (kind = `TERMS_ACCEPTED`
ou `PRIVACY_ACCEPTED`) avec le champ `document_ref` pointant sur la version
précise (`privacy-v2.0`, `terms-v1.3`, etc.). En cas de changement matériel,
réacceptation forcée au prochain login.

## Audits internes

Chaque trimestre, Paul réalise deux audits :

1. **Test de restauration** (couplé à la sauvegarde, cf.
   [backup-strategy.md](./infrastructure/backup-strategy.md)) — vérifie que les
   données sont restaurables.
2. **Revue des droits** — échantillon de 5 comptes pour vérifier que les
   politiques RLS produisent bien le filtrage attendu (un mineur ne voit pas les
   données d'un autre mineur, un parent non-vérifié ne voit rien).

La prochaine revue des droits est planifiée pour **2026-07-21** (même date que
le test de restauration, simplifie le suivi).

## Checklist de conformité (opérateur)

À valider avant chaque mise en production majeure :

- [ ] `.env.prod` ne contient aucune valeur `__CHANGE_ME__`.
- [ ] Le certificat TLS est valide (badge navigateur vert) et Cloudflare en Full
      (strict).
- [ ] Les politiques RLS sont appliquées (requête test avec
      `SET LOCAL app.current_user_id` à un UUID inexistant renvoie 0 rangée sur
      toutes les tables sensibles).
- [ ] Le dernier dump Postgres existe dans B2, horodaté < 24 h, chiffré en
      `.age`.
- [ ] La politique de confidentialité publiée référence la version courante des
      sous-traitants.
- [ ] L'endpoint `POST /api/auth/signin/*` applique le rate-limit (test de
      charge : 10 requêtes → 5 OK, 5 `429 Too Many Requests`).
- [ ] Les écrans d'inscription mineur affichent le mode "en attente de
      validation parentale" tant que `parent_child_links.state != 'VERIFIED'`.
- [ ] Le contact RPRP est présent dans le footer et dans les courriels de
      bienvenue.

## Références

- Loi 25 : <https://www.cai.gouv.qc.ca/documents/CAI_Guide_PME_2023.pdf>
- Architecture et RLS : [`01-architecture.md`](./01-architecture.md)
- Modèle de données : [`03-data-model.md`](./03-data-model.md)
- Sauvegardes chiffrées :
  [`infrastructure/backup-strategy.md`](./infrastructure/backup-strategy.md)
- Déploiement durci :
  [`infrastructure/proxmox-setup.md`](./infrastructure/proxmox-setup.md)
