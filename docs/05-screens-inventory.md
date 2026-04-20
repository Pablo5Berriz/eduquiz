# Inventaire des écrans — EduQuiz Public (Partie 1)

**Total : 122 écrans** regroupés en 14 zones fonctionnelles.

## Zone 1 — Écrans publics (non authentifiés) — 14 écrans

1. Accueil / Landing
2. À propos
3. Fonctionnalités
4. Tarifs
5. Pour les parents
6. Blog / Ressources
7. Article de blog
8. FAQ
9. Contact
10. Politique de confidentialité (Loi 25)
11. Conditions d'utilisation
12. Politique de consentement parental
13. Mentions légales
14. Pages techniques : 404, 500, maintenance (regroupées logiquement)

## Zone 2 — Authentification et onboarding — 14 écrans

15. Sélecteur de type de compte (adulte / parent / mineur)
16. Connexion
17. Mot de passe oublié
18. Réinitialisation de mot de passe
19. Inscription apprenant adulte
20. Inscription parent
21. Inscription mineur (avec demande de rattachement)
22. Vérification de courriel (écran d'attente)
23. Courriel vérifié
24. Onboarding étape 1 — niveau scolaire
25. Onboarding étape 2 — matières d'intérêt
26. Onboarding étape 3 — langue et préférences
27. Onboarding étape 4 — tutoriel interactif
28. Écran de consentement parental en attente

## Zone 3 — Compte et paramètres — 10 écrans

29. Profil utilisateur
30. Édition du profil
31. Avatar et personnalisation
32. Paramètres du compte (email, mot de passe)
33. Paramètres de langue
34. Paramètres de notifications
35. Paramètres de confidentialité
36. Paramètres d'accessibilité (taille police, contraste, dyslexie)
37. Export de mes données (Loi 25)
38. Suppression du compte avec confirmation

## Zone 4 — Navigation et contenu — 14 écrans

39. Tableau de bord personnel
40. Catalogue des matières
41. Détail d'une matière
42. Liste des cours filtrables
43. Détail d'un cours
44. Liste des leçons d'un cours
45. Détail et lecteur de leçon
46. Lecteur vidéo intégré (avec sous-titres FR/EN)
47. Lecteur audio intégré
48. Glossaire / mots-clés
49. Résumé de leçon
50. Recherche globale
51. Résultats de recherche
52. Favoris / marque-pages

## Zone 5 — Compétences MEQ — 4 écrans

53. Carte des compétences par matière
54. Détail d'une compétence
55. Mon niveau de maîtrise
56. Compétences à consolider (recommandations)

## Zone 6 — Exercices — 13 écrans

57. Écran de lancement d'exercice
58. Exercice QCM
59. Exercice Vrai/Faux
60. Exercice Texte à trous
61. Exercice Association
62. Exercice Remise en ordre
63. Exercice Réponse courte
64. Feedback immédiat
65. Pause / reprise d'exercice
66. Abandon avec confirmation
67. Résultat d'exercice
68. Correction détaillée
69. Recommandations post-exercice

## Zone 7 — Quiz — 7 écrans

70. Lancement de quiz
71. Question de quiz
72. Transition entre questions
73. Pause quiz
74. Résultat de quiz
75. Correction complète
76. Comparaison avec tentatives précédentes

## Zone 8 — Suivi et progression — 6 écrans

77. Ma progression globale
78. Progression par matière
79. Progression par compétence
80. Historique d'activités
81. Détail d'une tentative
82. Statistiques personnelles

## Zone 9 — Gamification — 6 écrans

83. Mon niveau et XP
84. Collection de badges
85. Détail d'un badge
86. Liste des trophées
87. Objectifs hebdomadaires
88. Animation de déblocage (overlay)

## Zone 10 — Dashboard parent — 9 écrans

89. Tableau de bord parent
90. Liste des enfants rattachés
91. Rattacher un nouvel enfant (génération de code)
92. Détail d'un enfant (progression)
93. Progression par matière de l'enfant
94. Historique d'activités de l'enfant
95. Rapport hebdomadaire ou mensuel
96. Paramètres de supervision par enfant
97. Révoquer un rattachement

## Zone 11 — Notifications et support — 4 écrans

98. Centre de notifications
99. Aide et base de connaissances
100.  Soumettre une demande de support
101.  Confirmation d'envoi

## Zone 12 — Paiement et abonnement — 10 écrans

102. Page de tarifs (connecté)
103. Choix du plan
104. Saisie des informations de paiement
105. Confirmation de commande
106. Paiement réussi
107. Paiement échoué
108. Mon abonnement
109. Historique de facturation
110. Changer de plan
111. Annuler l'abonnement

## Zone 13 — Écrans système — 6 écrans

112. Splash mobile
113. Premier lancement (demande de permissions)
114. Mise à jour disponible (mobile)
115. Modal cookies (web)
116. Bannière d'installation PWA
117. Mode hors ligne minimal (message d'information)

## Zone 14 — Modales transverses — 5 écrans

118. Confirmation d'action destructive
119. Modal de partage de résultat
120. Modal d'invitation (parent vers enfant)
121. Modal de changement de niveau
122. Overlay tutoriel contextuel

## Récapitulatif

| Zone                         | Nombre d'écrans |
| ---------------------------- | --------------- |
| 1. Publics                   | 14              |
| 2. Auth et onboarding        | 14              |
| 3. Compte et paramètres      | 10              |
| 4. Navigation et contenu     | 14              |
| 5. Compétences MEQ           | 4               |
| 6. Exercices                 | 13              |
| 7. Quiz                      | 7               |
| 8. Suivi et progression      | 6               |
| 9. Gamification              | 6               |
| 10. Dashboard parent         | 9               |
| 11. Notifications et support | 4               |
| 12. Paiement et abonnement   | 10              |
| 13. Écrans système           | 6               |
| 14. Modales transverses      | 5               |
| **Total**                    | **122**         |

## Principes transversaux applicables à tous les écrans

**Responsive** : chaque écran a une version mobile (320-480px), tablette
(768px), desktop (1024px+).

**États obligatoires pour chaque écran** : vide (empty state avec CTA),
chargement (skeleton screens), erreur (avec action de récupération), succès.

**Hiérarchie typographique** : titre principal (H1, 32px), titres de section
(H2, 24px), sous-titres (H3, 18px), corps (16px), secondaire (14px), métadonnées
(12px).

**Système de couleurs** : primaire (action CTA), secondaire (actions
alternatives), succès (vert), erreur (rouge), avertissement (jaune), info
(bleu). Mode sombre obligatoire.

**Accessibilité** : contraste AA minimum, focus visible au clavier, labels ARIA,
navigation logique.

**Bilinguisme** : tout texte a son pendant FR/EN, avec gestion des longueurs
différentes.

**Feedback utilisateur** : toute action déclenche un feedback (toast, changement
d'état, transition).

Les wireframes textuels détaillés sont dans `docs/06-wireframes.md`.
