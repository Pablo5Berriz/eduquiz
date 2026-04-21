import { DEFAULT_LOCALE, getMessages, t } from '@eduquiz/i18n';
import { StyleSheet, Text, View } from 'react-native';

import type { JSX } from 'react';

/**
 * Écran d'accueil mobile.
 *
 * Placeholder bilingue (locale figée à FR). Le routing réel et les
 * écrans seront implémentés aux étapes 1.x et 2.x du plan.
 */
export default function HomeScreen(): JSX.Element {
  const messages = getMessages(DEFAULT_LOCALE);

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>{t(messages, 'common.appName')}</Text>
      <Text style={styles.heading}>{t(messages, 'home.heroTitle')}</Text>
      <Text style={styles.subtitle}>{t(messages, 'home.heroSubtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
    backgroundColor: '#ffffff',
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#475569',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#475569',
    lineHeight: 24,
  },
});
