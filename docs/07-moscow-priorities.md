# Priorisation MoSCoW — EduQuiz Public

> Les coches de ce document indiquent une priorité ou un rattachement de lot,
> pas un statut livré. Pour l'état réel du dépôt, voir
> [`09-implementation-status.md`](./09-implementation-status.md).

La priorisation vise un **premier lancement utilisable** permettant de tester le
marché, puis une extension progressive. MoSCoW répond à la question : « si je
devais couper, que garderais-je ? ».

## MUST — Indispensable au lancement V1

Sans ces éléments, le produit n'est ni légal, ni utile, ni testable sur le
marché.

| Catégorie                     | Écrans / fonctionnalités                   | Justification                                  |
| ----------------------------- | ------------------------------------------ | ---------------------------------------------- |
| Fondations                    | Lots 0, 1                                  | Technique et légal non négociables             |
| Auth adulte                   | Lot 2                                      | Porte d'entrée                                 |
| Consentement parental         | Lot 10                                     | Obligation Loi 25 pour les mineurs             |
| Catalogue lecture             | Lot 3                                      | Sans contenu consommable, pas de produit       |
| Exercices                     | Lot 5                                      | Cœur pédagogique actif                         |
| Quiz solo                     | Lot 6                                      | Boucle d'évaluation                            |
| Suivi élève de base           | Dashboard, historique, progression matière | Sans feedback, pas de rétention                |
| Admin contenu (minimal)       | Éditeur interne leçons, exercices, quiz    | Pour alimenter le catalogue sans redéploiement |
| Pages légales                 | Politiques, consentement cookies           | Conformité                                     |
| Export et suppression données | Écrans 37, 38                              | Obligation Loi 25                              |

**Total Must : environ 90 écrans.**

## SHOULD — Important pour une V1 compétitive

Fortement recommandé pour un produit complet, mais le produit peut vivre sans à
très court terme.

| Catégorie             | Écrans / fonctionnalités                 | Justification                                |
| --------------------- | ---------------------------------------- | -------------------------------------------- |
| Onboarding complet    | Lot 4                                    | Rétention dès la première session            |
| Compétences MEQ       | Carte, détail, maîtrise (reste du Lot 7) | Différenciateur fort vs concurrents          |
| Gamification          | Lot 8                                    | Engagement, mais pas strictement pédagogique |
| Notifications         | Lot 9                                    | Réengagement                                 |
| Supervision parent    | Lot 11                                   | Argument de vente familial, réassurance      |
| Paiement              | Lot 12                                   | Monétisation B2C                             |
| Accessibilité de base | Partie du Lot 20                         | Conformité WCAG AA, éthique                  |

**Total Should : environ 35 écrans.**

## COULD — Utile mais reportable

Agréables à avoir, enrichissent le produit, mais pas bloquants.

| Catégorie                      | Écrans / fonctionnalités      | Justification                             |
| ------------------------------ | ----------------------------- | ----------------------------------------- |
| Favoris et marque-pages        | Écran 52                      | Confort                                   |
| Recherche avancée              | Écrans 50-51                  | Navigation par catégorie suffit au départ |
| Partage de résultats           | Écran 119                     | Viralité, nécessite modération            |
| Calendrier de travail          | Non listé V1                  | Nice-to-have                              |
| Collection visuelle riche      | Animations Lot 8 avancées     | Peut démarrer en version texte            |
| PWA et installation            | Écran 116                     | Le web mobile classique fonctionne déjà   |
| Avatar et personnalisation     | Écran 31                      | Cosmétique                                |
| Rapports exportables détaillés | Fonctionnalité parent avancée | CSV simple suffit au début                |

**Total Could : environ 12 écrans.**

## WON'T (pour cette version) — Exclu volontairement

Décidés comme hors scope V1, à réévaluer en V2 ou jamais.

| Catégorie                                   | Fonctionnalités                  | Justification                                        |
| ------------------------------------------- | -------------------------------- | ---------------------------------------------------- |
| Mode groupe école temps réel                | Toute la partie école            | Reporté à la Partie 2 (B2B)                          |
| Mode groupe libre                           | Sessions multi-joueurs publiques | Exclu définitivement : risque pour les mineurs       |
| Boutique virtuelle de récompenses           | Échange de points                | Complexité sans valeur pédagogique prouvée           |
| 2FA                                         | Authentification à deux facteurs | Pas prioritaire pour un public mineur, ajout en V2   |
| Mode hors ligne complet                     | Synchronisation offline          | Complexe, l'app nécessite une connexion au lancement |
| Primaire 1-2                                | Non retenu dans le périmètre     | Lecture pas autonome, UX enfant spécifique           |
| Intelligence adaptative / recommandation IA | ML de parcours                   | V2+                                                  |
| Marketplace de contenus                     | Contenus créés par utilisateurs  | V2+                                                  |
| Extension hors Québec                       | Autres provinces                 | V2+                                                  |

---

## Tableau récapitulatif MoSCoW × Lots

| Lot                          |         Must          |    Should    | Could | Won't  |
| ---------------------------- | :-------------------: | :----------: | :---: | :----: |
| 0 — Fondations               |          ✅           |              |       |        |
| 1 — Vitrine                  |          ✅           |              |       |        |
| 2 — Auth adulte              |          ✅           |              |       |        |
| 3 — Catalogue lecture        |          ✅           |              |       |        |
| 4 — Onboarding               |                       |      ✅      |       |        |
| 5 — Exercices                |          ✅           |              |       |        |
| 6 — Quiz solo                |          ✅           |              |       |        |
| 7 — Suivi + compétences      |        partiel        |   partiel    |       |        |
| 8 — Gamification             |                       |      ✅      |       |        |
| 9 — Notifications            |                       |      ✅      |       |        |
| 10 — Consentement parental   |          ✅           |              |       |        |
| 11 — Supervision parent      |                       |      ✅      |       |        |
| 12 — Paiement                |                       |      ✅      |       |        |
| 13 — Admin contenu (interne) |       ✅ (min)        | ✅ (complet) |       |        |
| 14 — Ops plateforme          | partiel (RPRP Loi 25) |  ✅ (reste)  |       |        |
| 15 — Polish et accessibilité |        AA base        |      ✅      |  PWA  | 2FA V1 |

---

## Chemin critique recommandé pour la V1

**V1.0 (premier lancement testable)** — uniquement les Must :

Lots 0 → 1 → 2 → 10 → 13 (minimal) → 3 → 5 → 6 → 7 (partiel) → pages légales +
export données.

Cela donne un produit utilisable par des adultes et des mineurs accompagnés,
avec un catalogue sur 1 ou 2 matières, conforme à la Loi 25.

**V1.5** — ajout des Should prioritaires : Lots 4, 8, 9, 11, 15 (accessibilité).

**V2** — paiement complet (Lot 12), polish, PWA, Could.

**V3 (Partie 2)** — extension B2B école, développée dans une itération
ultérieure.
