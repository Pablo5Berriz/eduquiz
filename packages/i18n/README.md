# @eduquiz/i18n

Traductions FR/EN partagées pour l'ensemble du monorepo.

## Règles

- **Locale par défaut : FR**. Fallback automatique FR si une clé est manquante
  en EN.
- Détection navigateur au premier accès, bascule manuelle persistée côté
  utilisateur (cookie web, préférence stockée mobile).
- Clés structurées par domaine : `auth.login.title`, `lesson.start`, etc.
- Courriels transactionnels bilingues selon la préférence utilisateur.
- Contenus pédagogiques gérés séparément (colonnes `*Fr`/`*En` sur les entités
  de contenu), **pas** via ce paquet.

## Structure à venir

```
src/
  locales/
    fr.json   # texte UI français
    en.json   # texte UI anglais
  index.ts    # exports typés
```

## État actuel

Paquet scaffoldé (étape 0.1) avec les constantes `DEFAULT_LOCALE` et
`SUPPORTED_LOCALES`. Câblage `next-intl` et `i18next` à l'étape 0.4.
