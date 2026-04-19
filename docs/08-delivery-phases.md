# Découpage en lots de livraison — EduQuiz Public

## Principes du découpage

Un lot est livrable quand il produit une valeur utilisable de bout en bout. Les dépendances suivent la règle : **données → authentification → contenu → interaction → suivi → administration**. Chaque lot dépend des précédents mais peut être enrichi après.

---

## Lot 0 — Fondations techniques

**Contenu** : monorepo Turborepo, setup Next.js + Expo + Expo Router, PostgreSQL dans LXC Proxmox, schéma Prisma de base, i18n FR/EN câblé, design system Tailwind + shadcn/ui + NativeWind, CI/CD GitHub Actions + déploiement SSH Proxmox, Docker Compose dev et prod.

**Écrans livrés** : 112 (splash mobile), 113 (premier lancement permissions), 114 (mise à jour disponible), 115 (modal cookies).

**Dépendances** : aucune.

**Valeur livrée** : socle technique fonctionnel, pas encore de valeur utilisateur.

---

## Lot 1 — Vitrine publique

**Contenu** : site marketing statique, pages légales, contact, blog.

**Écrans livrés** : 1-14 (les 14 écrans publics).

**Dépendances** : Lot 0.

**Valeur livrée** : présence en ligne, capture d'intérêt, conformité légale affichée.

---

## Lot 2 — Authentification compte libre adulte

**Contenu** : inscription, connexion, mot de passe oublié, vérification courriel, paramètres compte de base.

**Écrans livrés** : 15, 16, 17, 18, 19, 22, 23, 29, 30, 32, 33, 37, 38.

**Dépendances** : Lot 0, Lot 1.

**Valeur livrée** : un adulte peut créer un compte, se connecter, gérer ses infos. Pas encore de contenu.

---

## Lot 3 — Catalogue et consommation de contenu (lecture seule)

**Contenu** : navigation complète dans le catalogue, lecture de leçons, recherche.

**Écrans livrés** : 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52.

**Dépendances** : Lots 0, 2, et un catalogue initial peuplé (Math + Français Secondaire 1 au minimum).

**Valeur livrée** : un utilisateur libre peut apprendre. Premier lot qui a une vraie valeur pédagogique.

---

## Lot 4 — Onboarding et personnalisation

**Contenu** : guidage initial, choix de profil, tutoriel.

**Écrans livrés** : 24, 25, 26, 27, 31, 34, 35, 36, 121, 122.

**Dépendances** : Lot 2, Lot 3.

**Valeur livrée** : expérience d'entrée fluide et personnalisée.

---

## Lot 5 — Exercices et feedback

**Contenu** : les 6 types d'exercices, correction, recommandations.

**Écrans livrés** : 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 118.

**Dépendances** : Lot 3 (catalogue), modèle `Attempt` en base.

**Valeur livrée** : l'utilisateur peut pratiquer. Premier vrai moteur pédagogique actif.

---

## Lot 6 — Quiz

**Contenu** : moteur de quiz solo avec timer, résultats, comparaisons.

**Écrans livrés** : 70, 71, 72, 73, 74, 75, 76, 119.

**Dépendances** : Lot 5 (même moteur d'activité, mais chronométré et global).

**Valeur livrée** : évaluation complète post-leçon, boucle d'apprentissage fermée en solo.

---

## Lot 7 — Suivi élève et compétences

**Contenu** : dashboard personnel enrichi, progression, modèle compétences MEQ.

**Écrans livrés** : 53, 54, 55, 56, 77, 78, 79, 80, 81, 82.

**Dépendances** : Lot 5, Lot 6 (les Attempts doivent exister pour alimenter les stats).

**Valeur livrée** : l'élève voit ses progrès. Différenciateur fort vs un simple quiz générique.

---

## Lot 8 — Gamification

**Contenu** : points, badges, niveaux, objectifs, classement personnel.

**Écrans livrés** : 83, 84, 85, 86, 87, 88.

**Dépendances** : Lot 7 (stats de base), moteur de règles de récompenses.

**Valeur livrée** : engagement et rétention.

---

## Lot 9 — Notifications et centre utilisateur

**Contenu** : notifications in-app et push, support.

**Écrans livrés** : 34 (paramètres notifs), 98, 99, 100, 101.

**Dépendances** : Lot 2, infrastructure de notifications (Resend + push Expo).

**Valeur livrée** : réengagement, rétention, canal de communication.

---

## Lot 10 — Inscription mineur et consentement parental

**Contenu** : inscription parent, rattachement vérifié, consentement Loi 25.

**Écrans livrés** : 20, 21, 28, 89, 90, 91, 97, 120.

**Dépendances** : Lot 2 (auth), Lot 9 (notifications courriel pour le code), validation juridique Loi 25.

**Valeur livrée** : ouverture légale du produit aux mineurs. Porte d'entrée vers le volume utilisateur.

---

## Lot 11 — Supervision parentale

**Contenu** : vue parent sur les enfants rattachés.

**Écrans livrés** : 92, 93, 94, 95, 96.

**Dépendances** : Lot 7 (stats élève), Lot 10 (rattachement).

**Valeur livrée** : argument de vente fort pour les parents, rétention familiale.

---

## Lot 12 — Paiement et abonnement

**Contenu** : Stripe Checkout + Stripe Tax, plans B2C, gestion abonnement.

**Écrans livrés** : 102, 103, 104, 105, 106, 107, 108, 109, 110, 111.

**Dépendances** : Lot 2, Lot 10 (si vente du plan Famille).

**Valeur livrée** : monétisation B2C.

---

## Lot 13 — Admin contenu interne

**Contenu** : back-office réservé à l'équipe pour gérer le catalogue (pas d'écran utilisateur final).

**Écrans livrés** : aucun (outil interne, accessible via URL protégée).

**Dépendances** : Lots 3, 5, 6. Peut être livré en parallèle.

**Valeur livrée** : autonomie pour enrichir la plateforme sans redéploiement. Critique pour alimenter le contenu.

---

## Lot 14 — Opérations plateforme et Loi 25

**Contenu** : outils RPRP, gestion des consentements, traitement des demandes d'accès et suppression.

**Écrans livrés** : aucun côté utilisateur (outils internes).

**Dépendances** : Lots 2, 10, 12.

**Valeur livrée** : conformité Loi 25 opérationnelle, RPRP outillé.

---

## Lot 15 — Accessibilité et polish

**Contenu** : accessibilité avancée, PWA, mode hors ligne minimal, améliorations transverses.

**Écrans livrés** : 116 (bannière PWA), 117 (hors ligne), améliorations sur tous les écrans existants.

**Dépendances** : tous les lots précédents.

**Valeur livrée** : robustesse, conformité WCAG AA, rétention mobile.

---

## Graphe de dépendances

```
Lot 0 (Fondations)
  ├── Lot 1 (Vitrine)
  └── Lot 2 (Auth adulte)
        ├── Lot 3 (Catalogue) ──┬── Lot 4 (Onboarding)
        │                        ├── Lot 5 (Exercices)
        │                        │       └── Lot 6 (Quiz)
        │                        │             └── Lot 7 (Suivi/compétences)
        │                        │                   └── Lot 8 (Gamification)
        │                        └── Lot 13 (Admin contenu — parallèle)
        ├── Lot 9 (Notifications)
        │     └── Lot 10 (Consentement parental)
        │           └── Lot 11 (Supervision parent)
        └── Lot 12 (Paiement)

Lot 14 (Ops / Loi 25) dépend de 2, 10, 12
Lot 15 (Polish) dépend de tous
```

---

## Ordre d'exécution recommandé

**Sprint 1 (V1.0 minimal — chemin critique)** :
Lot 0 → Lot 1 → Lot 2 → Lot 13 (minimal, interne) → Lot 3 → Lot 5 → Lot 6 → Lot 7 (partiel) → Lot 10 → Lot 14.

**Sprint 2 (V1.5 compétitive)** :
Lot 4 → Lot 8 → Lot 9 → Lot 11 → Lot 15 (accessibilité).

**Sprint 3 (V2 monétisation et polish)** :
Lot 12 → Lot 15 (PWA, hors ligne).

**Partie 2 (B2B école)** : développée dans une itération ultérieure, hors scope actuel.