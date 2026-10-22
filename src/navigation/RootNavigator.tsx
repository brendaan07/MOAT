import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../hooks/useAppStore';
import { useTrackStore } from '../hooks/useTrackStore_updated';
import { hasTrack } from '../services/contentLoader_updated';
import { C } from '../utils/theme';
import MainTabs from './MainTabs_updated';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen_updated';
import TrackFlowScreen from '../screens/track/TrackFlowScreen_updated';
import TrackHomeScreen from '../screens/track/TrackHomeScreen_updated';

export type RootStackParamList = {
  Main: undefined;
  /** No lessonId means the phase's checkpoint. */
  TrackFlow: { phase: number; lessonId?: string };
  TrackPhase: { phase: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.cream } };

/** Web URLs for each screen, so the browser's back button, refresh and shared links work. Phase numbers come back from the URL as strings, so they are parsed.
 *  Main sits under every deep link, so closing a linked lesson lands on the Learn tab. Each screen checks its own lock, so a URL cannot skip ahead. */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    initialRouteName: 'Main',
    screens: {
      Main: { screens: { Learn: '', Workshop: 'workshop', Profile: 'profile' } },
      TrackPhase: { path: 'phase/:phase', parse: { phase: Number } },
      TrackFlow: { path: 'phase/:phase/play/:lessonId?', parse: { phase: Number } },
    },
  },
};

/** RootView in MOATApp.swift: splash for 1.5 seconds, then onboarding or the main app. */
export default function RootNavigator() {
  const store = useAppStore();
  const track = useTrackStore();
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1500);
    return () => clearTimeout(t);
  }, []);
  if (!splashDone || !store.hydrated || !track.hydrated) return <SplashScreen />;
  // A saved field and language with no track (for example Engineering + R from an older version) picks again.
  if (!store.progress.hasOnboarded || !hasTrack(store.progress.studyArea, store.progress.language)) return <OnboardingScreen />;
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={theme} linking={linking} documentTitle={{ formatter: () => 'MOAT' }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="TrackPhase" component={TrackHomeScreen} />
          <Stack.Screen name="TrackFlow" component={TrackFlowScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
