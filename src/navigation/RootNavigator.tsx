// The root stack and its web URLs: splash, login, onboarding, then the tabs and the track screens.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../hooks/useAppStore';
import { useTrackStore } from '../hooks/useTrackStore';
import { hasTrack } from '../content/tracks';
import { C } from '../utils/theme';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import TrackFlowScreen from '../screens/track/TrackFlowScreen';
import TrackPhaseScreen from '../screens/track/TrackPhaseScreen';

/** The root stack's screens and their params. */
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

/** The splash for at least 1.5 seconds, then login (no saved session), onboarding (also for a saved pair with no track) or the main app. */
export default function RootNavigator() {
  const auth = useAuth();
  const store = useAppStore();
  const track = useTrackStore();
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1500);
    return () => clearTimeout(t);
  }, []);
  if (!splashDone || !auth.hydrated || !store.hydrated || !track.hydrated) return <SplashScreen />;
  // Logging out clears the session, which brings this screen back.
  if (!auth.session) return <AuthScreen />;
  // A saved field and language with no track (for example Engineering + R from an older version) picks again.
  if (!store.progress.hasOnboarded || !hasTrack(store.progress.studyArea, store.progress.language)) return <OnboardingScreen />;
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={theme} linking={linking} documentTitle={{ formatter: () => 'MOAT' }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="TrackPhase" component={TrackPhaseScreen} />
          <Stack.Screen name="TrackFlow" component={TrackFlowScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
