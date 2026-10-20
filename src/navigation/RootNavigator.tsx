import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../hooks/useAppStore';
import { useTrackStore } from '../hooks/useTrackStore_updated';
import { C } from '../utils/theme';
import { RobotForm } from '../types/models';
import { PaywallOverlay } from '../components/PaywallOverlay';
import MainTabs from './MainTabs_updated';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen_updated';
import LessonScreen from '../screens/LessonScreen';
import GameLessonScreen from '../screens/GameLessonScreen';
import EvolutionScreen from '../screens/EvolutionScreen';
import TrackFlowScreen from '../screens/track/TrackFlowScreen_updated';
import TrackHomeScreen from '../screens/track/TrackHomeScreen_updated';

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
  if (!store.progress.hasOnboarded) return <OnboardingScreen />;
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={theme} linking={linking} documentTitle={{ formatter: () => 'MOAT' }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Lesson" component={LessonScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="GameLesson" component={GameLessonScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="TrackPhase" component={TrackHomeScreen} />
          <Stack.Screen name="TrackFlow" component={TrackFlowScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="Evolution" component={EvolutionScreen} options={{ presentation: 'modal' }} />
        </Stack.Navigator>
      </NavigationContainer>
      {store.showPaywall && <PaywallOverlay />}
    </View>
  );
}
