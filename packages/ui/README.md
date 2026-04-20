# @eduquiz/ui

Composants UI partagés entre `@eduquiz/web` et `@eduquiz/mobile`.

## Principes

- Web : composants shadcn/ui copiés directement dans le paquet (pas de
  dépendance npm shadcn, approche officielle).
- Mobile : composants équivalents avec NativeWind.
- API partagée autant que possible (mêmes props, mêmes tokens de design).
- Accessibilité WCAG 2.1 AA par défaut.

## État actuel

Paquet scaffoldé (étape 0.1). Les premiers composants arriveront avec l'étape
0.4 (init shadcn/ui).
