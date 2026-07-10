# EduQuiz — Cadrage officiel du MVP B2C

Ce document verrouille le périmètre du MVP B2C d'EduQuiz. Toute décision
produit, technique ou UX doit être évaluée contre ce cadrage avant
implémentation.

## 1. Décision produit officielle

Le MVP EduQuiz est une application web responsive B2C centrée sur une boucle
pédagogique simple, fiable et mesurable :

- leçon ;
- exercice ;
- quiz solo ;
- correction ;
- progression par compétence.

Le MVP ne cherche pas à livrer un mode école, une plateforme multijoueur, une
application mobile complète, une marketplace ou un système de monétisation
avancé. L'objectif est de valider qu'un apprenant peut réviser efficacement et
reprendre sa progression dans un cadre sécurisé.

## 2. Proposition de valeur MVP

> Réviser le programme québécois avec des leçons simples, des exercices courts,
> des quiz solo, une correction claire et une progression visible par
> compétence.

Cette promesse prime sur les fonctionnalités secondaires. EduQuiz n'est pas un
jeu de quiz généraliste : le produit doit rester aligné sur la révision, la
compréhension des erreurs et la progression pédagogique.

## 3. Utilisateurs inclus dans le MVP

Les utilisateurs inclus dans le MVP sont uniquement :

- apprenant adulte ;
- apprenant mineur, seulement si le socle technique existant le prévoit déjà ;
- parent, uniquement pour le consentement et une supervision minimale ;
- admin contenu ;
- super admin.

Le parcours prioritaire reste l'apprenant adulte en mode libre B2C. Le flux
mineur/parent ne doit pas être surdéveloppé avant validation de la boucle
pédagogique principale.

## 4. Utilisateurs exclus du MVP

Les utilisateurs et contextes suivants sont explicitement exclus du MVP :

- école ;
- établissement scolaire ;
- enseignant ;
- élève école ;
- classe ;
- administrateur scolaire ;
- district scolaire.

Ces profils relèvent d'une phase future B2B et ne doivent pas être mélangés aux
relations B2C du MVP.

## 5. Fonctionnalités incluses

Le MVP inclut :

- authentification ;
- catalogue pédagogique publié ;
- niveau scolaire ;
- matière ;
- compétence ;
- cours ;
- leçon ;
- exercice ;
- quiz solo ;
- correction ;
- tentative immuable ;
- progression par compétence ;
- reprise d'apprentissage ;
- admin contenu minimal ;
- audit logs ;
- export et suppression des données si déjà prévus dans le projet ;
- tests critiques.

Les fonctionnalités incluses doivent servir directement le parcours : apprendre,
pratiquer, évaluer, corriger et reprendre.

## 6. Fonctionnalités exclues

Les fonctionnalités suivantes sont explicitement hors MVP :

- mode école ;
- classes ;
- enseignants ;
- assignations ;
- quiz de groupe ;
- multijoueur ;
- affrontements publics ;
- leaderboards publics ;
- classement temps réel ;
- chat ;
- avatars sociaux ;
- mobile Expo complet ;
- Stripe ;
- abonnements ;
- IA adaptative ;
- marketplace ;
- SSO école ;
- import CSV.

Ces éléments peuvent rester documentés comme évolutions futures, mais ils ne
doivent pas être développés, activés ou introduits implicitement dans le MVP.

## 7. Structure pédagogique cible

La structure pédagogique cible du MVP est :

```text
Niveau scolaire
→ Matière
→ Compétence
→ Cours
→ Leçon
→ Activité
→ Question
→ Réponse
```

Règles structurelles :

- une compétence appartient à un niveau et une matière ;
- une leçon peut couvrir plusieurs compétences ;
- une activité peut être un exercice ou un quiz ;
- un quiz doit utiliser du contenu publié ;
- une tentative terminée est immuable ;
- la progression est calculée après tentative terminée.

La compétence est une entité centrale du MVP. Le score seul ne suffit pas pour
mesurer l'apprentissage.

## 8. Règles métier MVP

Les règles métier minimales du MVP sont :

- un apprenant ne voit que les contenus publiés ;
- un apprenant ne voit que les contenus compatibles avec son niveau ;
- un quiz doit avoir au moins une question active ;
- une question QCM doit avoir au moins une bonne réponse ;
- le score est calculé côté serveur ;
- une tentative terminée ne peut pas être modifiée ;
- les réponses utilisateur ne modifient jamais les questions originales ;
- les brouillons sont invisibles aux apprenants ;
- un parent ne voit qu'un enfant lié avec consentement valide ;
- un admin contenu ne doit pas accéder inutilement aux données privées.

Toute logique de score, de correction, de progression ou de permission doit être
contrôlée côté serveur. Le client ne doit jamais être une source de vérité pour
les résultats.

## 9. Parcours critique MVP

Le parcours cible du MVP est :

```text
connexion
→ choix niveau
→ choix matière
→ ouverture leçon publiée
→ exercice court
→ quiz solo
→ correction
→ progression compétence
→ reprise ultérieure
```

Ce parcours doit fonctionner sans aide, sur desktop et en viewport mobile web.
Chaque étape doit avoir des erreurs compréhensibles et des états vides
utilisables.

## 10. Critères de sortie MVP

Le MVP est validé seulement si :

- le parcours critique fonctionne de bout en bout ;
- le score est calculé côté serveur ;
- les tentatives sont immuables ;
- les brouillons sont invisibles ;
- les permissions critiques sont testées ;
- le parcours Playwright passe en desktop ;
- le parcours Playwright passe en viewport mobile ;
- la documentation du périmètre est cohérente avec le code.

Une fonctionnalité partiellement visible mais non testée ne doit pas être
considérée comme livrée.

## 11. Risques majeurs

Les risques majeurs à surveiller sont :

- scope creep ;
- contenu pédagogique insuffisant ;
- permissions incomplètes ;
- RLS contournée ;
- parent/mineur développé trop tôt ;
- UX trop complexe ;
- divergence entre documentation et code ;
- tests insuffisants.

Ces risques doivent être traités comme des critères de revue avant chaque
nouvelle tâche importante.

## 12. Décisions techniques verrouillées

Les décisions techniques du MVP sont :

- garder Next.js ;
- garder TypeScript strict ;
- garder PostgreSQL ;
- garder Prisma ;
- garder Auth.js ;
- garder Tailwind CSS ;
- garder Vitest et Playwright ;
- ne pas ajouter NestJS ;
- ne pas migrer vers Firebase ;
- ne pas ajouter Supabase sans décision explicite ;
- ne pas développer Expo complet maintenant.

L'architecture doit rester simple, sécurisée, maintenable et cohérente avec le
monorepo existant.

## 13. Règle de gouvernance

Toute nouvelle tâche de développement doit être refusée, modifiée ou repoussée
si elle ne sert pas directement le MVP B2C défini dans ce document.
