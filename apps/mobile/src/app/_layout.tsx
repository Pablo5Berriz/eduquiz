import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import type { JSX } from 'react';

/**
 * Layout racine Expo Router.
 *
 * Active la barre d'état adaptative (clair/sombre selon le système) et
 * démarre une pile de navigation Stack sans en-tête visible. Les écrans
 * définiront eux-mêmes leur header via `<Stack.Screen options>`.
 */
export default function RootLayout(): JSX.Element {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
