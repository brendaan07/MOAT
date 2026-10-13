// App root: loads the fonts, then wraps the navigator in the safe-area, progress and track providers.
import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStoreProvider } from './src/hooks/useAppStore';
import { TrackStoreProvider } from './src/hooks/useTrackStore';
import RootNavigator from './src/navigation/RootNavigator';
import { C } from './src/utils/theme';

export default function App() {
  // Horizon is the MOAT wordmark font. Baloo 2 and Atkinson Hyperlegible are the canvas fonts (both SIL Open Font License, see assets/fonts).
  // Nothing renders until they are loaded, so text never flashes in a fallback font.
  const [fontsLoaded] = useFonts({
    'Horizon-Bold': require('./assets/fonts/Horizon.otf'),
    'Baloo2-ExtraBold': require('./assets/fonts/Baloo2-ExtraBold.ttf'),
    'AtkinsonHyperlegible-Regular': require('./assets/fonts/AtkinsonHyperlegible-Regular.ttf'),
    'AtkinsonHyperlegible-Bold': require('./assets/fonts/AtkinsonHyperlegible-Bold.ttf'),
  });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: C.cream }} />;
  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <TrackStoreProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </TrackStoreProvider>
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}
