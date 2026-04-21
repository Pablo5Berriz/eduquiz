/**
 * Babel config Expo SDK 52.
 *
 * `babel-preset-expo` couvre React Native + Hermes + Reanimated. Le
 * plugin de Reanimated doit rester en DERNIER dans la liste `plugins`
 * pour que ses transformations soient appliquées en tout fin de
 * pipeline.
 */
module.exports = function babel(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-reanimated/plugin doit toujours rester en dernier.
      'react-native-reanimated/plugin',
    ],
  };
};
