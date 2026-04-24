# Illustrations des matières — EduQuiz

Ce dossier contient les illustrations associées aux dix matières du
programme québécois affichées sur la vitrine publique (écran 3 et écrans
4 à 13). Les fichiers sont référencés depuis les dictionnaires i18n
`packages/i18n/src/locales/{fr,en}.json` via les clés `subjects.list.<key>.image`.

## État actuel — placeholders SVG

Les dix fichiers `.svg` livrés ici sont des **placeholders** produits en
interne par l'équipe EduQuiz (dégradés + typographie). Aucune attribution
externe requise : ce sont des illustrations originales.

Slugs couverts :

- `mathematiques.svg`
- `francais.svg`
- `anglais.svg`
- `sciences-technologie.svg`
- `histoire-quebec-canada.svg`
- `geographie.svg`
- `education-financiere.svg`
- `education-physique-sante.svg`
- `culture-citoyennete-quebecoise.svg`
- `monde-contemporain.svg`

Un placeholder générique `_fallback.svg` est également présent pour toute
matière qui serait ajoutée au catalogue avant que son illustration
dédiée n'existe.

## Remplacement par des photos libres de droits

Le script `scripts/download-subject-images.mjs` télécharge des photos
libres de droits (sources : Unsplash, Pexels, Wikimedia Commons) et les
convertit en `.webp` nommés d'après les slugs ci-dessus. Après exécution :

1. Les dix fichiers `.webp` remplacent les `.svg` dans ce dossier.
2. Les chemins dans `fr.json` / `en.json` sont mis à jour de `.svg` vers
   `.webp` (la commande `sed` est documentée dans le README du script).
3. Cette page d'attributions est complétée : source, auteur, licence,
   URL originale, date d'ajout.

Tant que les photos ne sont pas téléchargées, les placeholders SVG
s'affichent correctement sur toutes les pages (home, hub matières et
détail matière) grâce aux balises `<img>` natives — aucune configuration
Next.js supplémentaire n'est requise.

## Licence des fichiers de ce dossier

- `*.svg` (placeholders) : © EduQuiz, licence MIT (même licence que le
  dépôt).
- `*.webp` (photos) : licences individuelles à documenter ici lors de
  l'ajout.
