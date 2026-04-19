# EduQuiz — Description détaillée du projet

## 1. Vue d'ensemble

EduQuiz est une plateforme éducative web et mobile destinée aux élèves du primaire et du secondaire au Québec, utilisable hors cadre scolaire. Elle permet aux apprenants de consolider leurs acquis via des leçons structurées, des exercices interactifs et des quiz, dans un environnement entièrement bilingue français/anglais.

La plateforme s'adresse à trois profils d'utilisateurs :

- des apprenants adultes qui souhaitent réviser ou progresser de manière autonome;
- des élèves mineurs, obligatoirement rattachés à un compte parent vérifié;
- des parents qui supervisent les progrès de leurs enfants.

L'architecture, bien que limitée au grand public dans cette première version, est conçue dès le départ pour accueillir ultérieurement une extension scolaire B2B sans refonte du socle technique ni du modèle de données.

## 2. Objectifs produit

La plateforme poursuit cinq objectifs :

- **Structuration** : progression par niveau, matière, compétence, cours et leçon, alignée sur la Progression des Apprentissages du MEQ.
- **Activité** : exercices interactifs et quiz à la fin de chaque leçon.
- **Engagement** : système de points, badges, niveaux et objectifs hebdomadaires.
- **Autonomie** : expérience d'apprentissage fluide, personnalisable, utilisable sans intervention extérieure.
- **Confiance parentale** : mécanisme de consentement vérifiable et outils de supervision pour les parents d'enfants mineurs.

## 3. Périmètre

### 3.1 Territoire

La plateforme est limitée au Québec. Les contenus, la terminologie et la localisation linguistique sont alignés sur le contexte québécois. Le modèle de données est conçu pour permettre une extension canadienne ultérieure.

### 3.2 Langues

L'ensemble de l'application est disponible nativement en français et en anglais : interface, navigation, notifications, contenus système, messages d'erreur, courriels transactionnels et contenus pédagogiques.

### 3.3 Public cible

- Élèves du Primaire 3 au Secondaire 5, rattachés à un parent si mineurs.
- Apprenants adultes indépendants.
- Parents superviseurs.

Les rôles école (enseignant, admin école, super admin école) sont explicitement **hors périmètre** de cette première version.

## 4. Parcours utilisateur

### 4.1 Parcours apprenant adulte

1. Création de compte avec vérification de courriel.
2. Onboarding : choix du niveau scolaire, des matières, de la langue.
3. Accès au catalogue et choix d'une matière, d'un cours, d'une leçon.
4. Étude du contenu de la leçon.
5. Pratique via les exercices ou évaluation via le quiz.
6. Consultation de la progression et déblocage de récompenses.

### 4.2 Parcours apprenant mineur

1. Le parent crée d'abord son compte et génère un code de rattachement.
2. Le mineur crée son compte et saisit le code.
3. Le parent confirme le rattachement par courriel.
4. Le mineur accède au catalogue avec les paramètres de supervision définis par le parent.
5. Toute activité est visible par le parent.

### 4.3 Parcours parent

1. Création de compte avec vérification de courriel.
2. Rattachement d'un ou plusieurs enfants mineurs via code à 6 chiffres.
3. Consultation des progrès de chaque enfant.
4. Gestion des paramètres de supervision, du consentement et de la confidentialité.
5. Accès aux rapports hebdomadaires et mensuels.

## 5. Structure pédagogique

La hiérarchie de contenu est :

**Niveau scolaire → Matière → Compétence → Cours → Leçon → Activité**

L'entité **Compétence**, alignée sur la Progression des Apprentissages du MEQ, permet de suivre la maîtrise réelle d'une notion, indépendamment de la leçon qui la couvre. Une compétence peut être travaillée dans plusieurs leçons, et une leçon peut couvrir plusieurs compétences.

Une activité est de type Exercice ou Quiz.

## 6. Niveaux et matières

### 6.1 Niveaux

- Primaire 3 à Primaire 6.
- Secondaire 1 à Secondaire 5.

### 6.2 Matières (alignement Alloprof)

- Mathématiques
- Français
- Anglais
- Sciences et technologies
- Chimie (Secondaire 4-5)
- Physique (Secondaire 4-5)
- Histoire
- Géographie
- Monde contemporain (Secondaire 5)
- Éducation financière (Secondaire 5)

Toutes les matières sont localisées FR/EN.

## 7. Structure du contenu

### 7.1 Entités principales

- User, ParentChildLink (états : pending, verified, revoked), ConsentRecord
- Subject, Skill, Course, Lesson, LessonSkillLink
- Activity, Exercise, Quiz, QuizQuestion, QuizAnswer
- Attempt (tentative horodatée, conservée sans écrasement)
- Result, Progress (par compétence)
- Reward, Badge
- AuditLog, ContentVersion

### 7.2 Règles

- Une leçon est liée à un cours et à une ou plusieurs compétences.
- Chaque tentative est horodatée, unique et conservée.
- Chaque élément est localisable FR/EN.
- Les contenus sont versionnés, publiables et archivables.

### 7.3 Contenu de leçon

Texte explicatif, images, audio, vidéo embarquée, exemples, résumé, objectifs pédagogiques, durée estimée, prérequis, mots-clés, compétences ciblées.

## 8. Exercices et quiz

### 8.1 Six types d'exercices retenus

- QCM (choix multiples, une ou plusieurs bonnes réponses)
- Vrai/Faux
- Texte à trous
- Association (relier deux colonnes)
- Remise en ordre
- Réponse courte (numérique ou mot-clé)

Les exercices offrent un retour immédiat et peuvent être notés ou non.

### 8.2 Quiz

Chaque leçon peut proposer un quiz associé. Le quiz contient des QCM, calcule un score, enregistre une tentative horodatée et alimente le système de récompenses.

## 9. Modes de jeu

**Mode solo uniquement** en Partie 1. L'utilisateur choisit niveau, matière, cours, leçon, puis lance les exercices ou le quiz. Les modes multi-joueurs sont reportés à la Partie 2.

## 10. Système de points et récompenses

Gamification incluant points par bonne réponse, bonus de rapidité et de série, badges de progression liés aux compétences, niveaux de joueur, trophées par matière, objectifs hebdomadaires et récompenses visuelles. Les récompenses encouragent l'apprentissage régulier, pas la compétition.

## 11. Consentement parental et mineurs

Mécanisme vérifiable et traçable :

1. Le parent crée son compte et vérifie son courriel.
2. Un code unique à 6 chiffres est généré, valable 24 h.
3. L'enfant saisit ce code; le rattachement passe à l'état `pending`.
4. Le parent confirme via un lien reçu par courriel; l'état passe à `verified`.
5. Chaque action est inscrite dans le journal `ConsentRecord` avec horodatage, IP, user-agent.

**Contrôles parentaux** : consentement explicite, supervision de l'activité, historique accessible, droit à l'effacement et à l'export des données.

**Conformité légale** : Loi 25 du Québec, LPRPDE fédérale, et COPPA pour usagers hors Canada. La Loi 25 impose la désignation d'un RPRP, la notification d'incident, et des politiques d'accès et de rectification accessibles.

## 12. Sécurité et protection des données

- Chaque requête vérifie rôle, identité et permissions réelles.
- Row Level Security Postgres pour cloisonner les données famille par famille.
- Journalisation immuable des connexions, consultations de résultats, actions sensibles et consentements.
- Chiffrement au repos (pgcrypto) et en transit (TLS 1.3).
- Sauvegardes quotidiennes automatiques avec externalisation.

## 13. Règles métier principales

- Un apprenant libre adulte accède à tous les contenus publics.
- Un mineur n'accède qu'après rattachement parental vérifié.
- Un parent ne voit que ses enfants rattachés.
- Chaque tentative est conservée et horodatée.
- Tous les contenus sont localisables FR/EN et versionnés.
- Les données mineures sont limitées au strict nécessaire.

## 14. Écrans de la Partie 1

Inventaire détaillé disponible dans `docs/05-screens-inventory.md`. Total : **122 écrans** regroupés en 14 zones fonctionnelles.

## 15. Stack technique

Détail complet dans `docs/02-stack-proxmox.md`. Résumé :

- Monorepo Turborepo + pnpm, TypeScript strict.
- Web : Next.js 14 App Router + Tailwind + shadcn/ui.
- Mobile : Expo SDK 50+ avec Expo Router + NativeWind.
- Backend : PostgreSQL 16 + Prisma + Auth.js v5 + Row Level Security.
- Hébergement : Proxmox personnel avec Docker, Traefik, Cloudflare en front.
- Stockage : MinIO S3-compatible.
- Emails : Resend API (externe).
- CI/CD : GitHub Actions + déploiement SSH.

## 16. Sources de contenu pédagogique

### 16.1 Rédactionnel

- **Progression des Apprentissages du MEQ** : référentiel officiel public, source de vérité pour la structure.
- **École ouverte** (MEQ + Université de Montréal) : contenus primaire et secondaire.
- **Répertoires de révision publics d'Alloprof** : alignement terminologique.
- **OER Commons**, **MERLOT**, **OpenStax** : ressources éducatives libres sous Creative Commons.

### 16.2 APIs gratuites

- **Open Trivia Database** : API JSON gratuite sans clé, licence CC BY-SA 4.0, 4 000+ QCM.
- **Free Dictionary API** : définitions et phonétique pour exercices de vocabulaire.
- **Numbers API** : faits mathématiques.

### 16.3 Génération assistée

- **Anthropic Claude API** : génération d'exercices et de quiz à partir de plans de leçon, avec révision humaine systématique.

### 16.4 Médias

- Unsplash, Pexels, Openclipart, SVGRepo, Freesound.
- Embed YouTube pour les vidéos pédagogiques existantes.

### 16.5 Gouvernance

Chaque ressource est associée à sa source et sa licence dans un registre interne. Toute production IA est relue par un humain avant publication. L'alignement MEQ est vérifié leçon par leçon.

## 17. Conformité légale (Partie 1)

- **Loi 25 du Québec** : désignation d'un RPRP, registre des incidents, politique de confidentialité accessible, mécanismes d'accès, rectification et suppression opérationnels.
- **LPRPDE** : consentement éclairé, finalité explicite, sécurité proportionnelle.
- **COPPA** : applicable aux utilisateurs hors Canada de moins de 13 ans.
- **Accessibilité** : cible WCAG 2.1 niveau AA.

Un budget de 3 000 à 5 000 $ CAD est à prévoir pour consultation juridique et rédaction des politiques avant lancement public.

## 18. Modèle économique

- **Freemium** : accès à un sous-ensemble de leçons et d'exercices gratuitement.
- **Plan Individuel** : accès complet pour un apprenant adulte.
- **Plan Famille** : jusqu'à 4 enfants rattachés à un parent, accès complet pour tous.

La tarification exacte est à déterminer selon l'étude de marché. Les coûts d'infrastructure à faible volume sont maîtrisés grâce à l'hébergement Proxmox personnel, ce qui permet une marge brute confortable dès les premiers clients payants.

## 19. Conditions de succès du lancement

- Un catalogue initial minimal viable sur 2 matières (Mathématiques et Français) et 2 niveaux (Secondaire 1 et 2), soit environ 60 leçons et 600 activités.
- Le mécanisme de consentement parental opérationnel et validé juridiquement.
- Les politiques de confidentialité, de consentement et les CGU rédigées.
- Les pages d'accès, rectification, suppression et export fonctionnelles (Loi 25).
- Une couverture d'accessibilité WCAG AA vérifiée sur les parcours critiques.
- Un déploiement mobile passant la revue Apple et Google.

## 20. Extensibilité vers la Partie 2 (école)

Le modèle de données et l'architecture sont conçus pour permettre l'ajout futur des rôles école (enseignant, admin école, super admin école) et des fonctionnalités associées (classes, assignations, sessions temps réel) sans refonte. La Partie 2 sera développée dans une itération ultérieure après validation du marché grand public.