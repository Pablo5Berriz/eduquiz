# Documentation EduQuiz

Index de la documentation produit, technique et opérationnelle du projet. Les
documents sont rangés en deux familles : les fondations produit/technique à la
racine de `docs/`, et les runbooks d'infrastructure dans
[`infrastructure/`](./infrastructure/).

## Fondations produit et technique

| Fichier                                                        | Contenu                                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`00-project-brief.md`](./00-project-brief.md)                 | Brief produit complet : vision, public, exclusions V1, plan tarifaire.            |
| [`01-architecture.md`](./01-architecture.md)                   | Architecture applicative, flux de requête, authentification, frontières sécurité. |
| [`02-stack-proxmox.md`](./02-stack-proxmox.md)                 | Correspondance cloud → self-hosted, découpage LXC/VM, coûts estimés.              |
| [`03-data-model.md`](./03-data-model.md)                       | Entités, ERD, choix (UUID v7, RLS, append-only), politiques et migrations.        |
| [`04-security-loi25.md`](./04-security-loi25.md)               | Cadre légal, inventaire des données, consentement parental, droits LAMP-Q.        |
| [`05-screens-inventory.md`](./05-screens-inventory.md)         | Inventaire des 122 écrans (web + mobile) avec statut.                             |
| [`06-wireframes.md`](./06-wireframes.md)                       | Wireframes textuels par surface.                                                  |
| [`07-moscow-priorities.md`](./07-moscow-priorities.md)         | Priorisation MoSCoW des fonctionnalités.                                          |
| [`08-delivery-phases.md`](./08-delivery-phases.md)             | Découpage en phases de livraison (Phase 0 → Phase 5).                             |
| [`09-implementation-status.md`](./09-implementation-status.md) | Statut réel livré vs préparé vs non commencé.                                     |

## Runbooks infrastructure

| Fichier                                                                    | Contenu                                                                               |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [`infrastructure/proxmox-setup.md`](./infrastructure/proxmox-setup.md)     | Déploiement pas-à-pas sur Proxmox (VM Debian, LUKS, Docker, Traefik, checklist).      |
| [`infrastructure/backup-strategy.md`](./infrastructure/backup-strategy.md) | Stratégie 3-2-1, RPO 24 h / RTO 4 h, rotation B2, procédures de restauration testées. |

## Artefacts techniques associés

Les documents ci-dessus pointent régulièrement vers :

- Le schéma Prisma :
  [`packages/db/prisma/schema.prisma`](../packages/db/prisma/schema.prisma)
- Les migrations :
  [`packages/db/prisma/migrations/`](../packages/db/prisma/migrations/)
- Les politiques RLS : [`packages/db/prisma/rls/`](../packages/db/prisma/rls/)
- Les Dockerfiles et compose files : [`infra/docker/`](../infra/docker/)
- Les workflows CI : [`.github/workflows/`](../.github/workflows/)
- Les variables d'environnement : [`.env.example`](../.env.example) et
  [`.env.prod.example`](../.env.prod.example)
- Le journal des versions : [`CHANGELOG.md`](../CHANGELOG.md)
- Le statut réel du projet :
  [`09-implementation-status.md`](./09-implementation-status.md)

## Règle de mise à jour

Chaque PR qui modifie du code dans un domaine couvert par un document doit
mettre à jour ce document dans la même PR. Le template
[`.github/pull_request_template.md`](../.github/pull_request_template.md) inclut
une ligne de checklist "Documentation mise à jour" qui vaut également pour ces
fichiers. Une divergence entre le code et la doc est traitée comme un bug
d'onboarding.

En cas de divergence entre une page historique et
[`09-implementation-status.md`](./09-implementation-status.md), le statut
d'implémentation prime.

Pour les sujets non couverts par un document existant (nouvelle surface métier,
nouvel outil d'infrastructure, décision transverse), créer un nouveau fichier
numéroté dans `docs/` ou un nouveau runbook dans `docs/infrastructure/` et
l'ajouter à cet index.
