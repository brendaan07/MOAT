// The three bottom tabs: Learn, Workshop and Profile.
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../hooks/useAppStore';
import { C } from '../utils/theme';
import LearnScreen from '../screens/LearnScreen';
import TrackPathScreen from '../screens/track/TrackPathScreen';
import { hasTrack } from '../services/contentLoader';
import WorkshopScreen from '../screens/WorkshopScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type TabParamList = { Learn: undefined; Workshop: undefined; Profile: undefined };
const Tab = createBottomTabNavigator<TabParamList>();

/** Learners whose field and language have a project track get the track path on the Learn tab; everyone else gets the general path. */
export default function MainTabs() {
  const store = useAppStore();
  const learn = hasTrack(store.progress.studyArea, store.progress.language) ? TrackPathScreen : LearnScreen;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: C.navy,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.card },
        tabBarIcon: ({ color, size }) => {
          const name = route.name === 'Learn' ? 'book' : route.name === 'Workshop' ? 'construct' : 'person-circle';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Learn" component={learn} />
      <Tab.Screen name="Workshop" component={WorkshopScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
