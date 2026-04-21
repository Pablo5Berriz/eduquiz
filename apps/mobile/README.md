# @eduquiz/mobile

Application mobile d'EduQuiz basée sur Expo SDK 52 avec Expo Router v4. Cible
iOS et Android, parcours apprenant et parent. Partage un maximum de code avec
`@eduquiz/web` via les paquets partagés (`@eduquiz/ui`, `@eduquiz/types`,
`@eduquiz/utils`, `@eduquiz/i18n`).

## Stack

- Expo SDK 52, React Native 0.76, New Architecture activée.
- Expo Router v4 (file-based routing sous `src/app/`).
- Réanimated, Gesture Handler, Safe Area Context.
- i18n via `@eduquiz/i18n` (FR par défaut, EN secondaire).
- TanStack Query et Zustand (identiques au web) — ajoutés aux étapes suivantes.
- Build et distribution via EAS Build — configuration à l'étape 2.x.

## Scripts

```bash
pnpm --filter @eduquiz/mobile start       # expo start (choix iOS/Android/web)
pnpm --filter @eduquiz/mobile ios         # lancer le simulateur iOS
pnpm --filter @eduquiz/mobile android     # lancer l'émulateur Android
pnpm --filter @eduquiz/mobile web         # mode web (Metro)
pnpm --filter @eduquiz/mobile lint        # eslint ., max-warnings=0
pnpm --filter @eduquiz/mobile typecheck   # tsc --noEmit
```

## Structure

```
apps/mobile/
  src/app/
    _layout.tsx          # Layout racine (Stack navigator, StatusBar)
    index.tsx            # Écran d'accueil placeholder bilingue
  app.json               # Config Expo (scheme, iOS/Android bundle, New Arch)
  babel.config.js        # babel-preset-expo + reanimated/plugin (en dernier)
  metro.config.js        # Support monorepo pnpm (watchFolders, symlinks)
  tsconfig.json          # Hérite de @eduquiz/config/tsconfig-expo
  eslint.config.js       # base + react + prettier
```

## Monorepo pnpm

`metro.config.js` est explicitement configuré pour suivre les symlinks créés par
pnpm vers les paquets `@eduquiz/*`. Sans cette étape, Metro ne sait pas résoudre
les imports workspace et le build échoue.
