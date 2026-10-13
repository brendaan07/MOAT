// The screen stack and the gates above it (splash, onboarding, paywall). RootStackParamList lists every route and its params.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../hooks/useAppStore';
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
  TrackFlow: { phase: number; lessonId: string | null };
  TrackPhase: { phase: number };
  Evolution: { form: RobotForm };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.cream } };

/** Splash for 1.5 seconds (and until saved progress has loaded), then onboarding or the main app. Lesson screens are full-screen modals with swipe-back off, so a swipe cannot abandon a lesson. */
export default function RootNavigator() {
  const store = useAppStore();
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1500);
    return () => clearTimeout(t);
  }, []);
  if (!splashDone || !store.hydrated) return <SplashScreen />;
  if (!store.progress.hasOnboarded) return <OnboardingScreen />;
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={theme}>
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
