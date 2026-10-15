// The screen stack and the gates above it (splash, onboarding, paywall). RootStackParamList lists every route and its params, and `linking` maps them to web URLs.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../hooks/useAppStore';
import { useTrackStore } from '../hooks/useTrackStore';
import { C } from '../utils/theme';
import { RobotForm } from '../types/models';
import { PaywallOverlay } from '../components/PaywallOverlay';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LessonScreen from '../screens/lesson/LessonScreen';
import GameLessonScreen from '../screens/GameLessonScreen';
import EvolutionScreen from '../screens/EvolutionScreen';
import TrackFlowScreen from '../screens/track/TrackFlowScreen';
import TrackPhaseScreen from '../screens/track/TrackPhaseScreen';

export type RootStackParamList = {
  Main: undefined;
  Lesson: { lessonId: string };
  GameLesson: { lessonId: string };
  /** No lessonId means the phase's checkpoint. */
  TrackFlow: { phase: number; lessonId?: string };
  TrackPhase: { phase: number };
  Evolution: { form: RobotForm };
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
      Lesson: 'lesson/:lessonId',
      GameLesson: 'game/:lessonId',
      TrackPhase: { path: 'phase/:phase', parse: { phase: Number } },
      TrackFlow: { path: 'phase/:phase/play/:lessonId?', parse: { phase: Number } },
      Evolution: 'evolution/:form',
    },
  },
};

/** Splash for 1.5 seconds (and until saved progress has loaded), then onboarding or the main app. Lesson screens are full-screen modals with swipe-back off, so a swipe cannot abandon a lesson. */
export default function RootNavigator() {
  const store = useAppStore();
  const track = useTrackStore();
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1500);
    return () => clearTimeout(t);
  }, []);
  if (!splashDone || !store.hydrated || !track.hydrated) return <SplashScreen />;
  if (!store.progress.hasOnboarded) return <OnboardingScreen />;
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={theme} linking={linking} documentTitle={{ formatter: () => 'MOAT' }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Lesson" component={LessonScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="GameLesson" component={GameLessonScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="TrackPhase" component={TrackPhaseScreen} />
          <Stack.Screen name="TrackFlow" component={TrackFlowScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="Evolution" component={EvolutionScreen} options={{ presentation: 'modal' }} />
        </Stack.Navigator>
      </NavigationContainer>
      {store.showPaywall && <PaywallOverlay />}
    </View>
  );
}
