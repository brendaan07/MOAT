// The bottom tabs: Learn, Workshop and Profile.
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
import TrackPathScreen from '../screens/track/TrackPathScreen_updated';
import WorkshopScreen from '../screens/WorkshopScreen';
import ProfileScreen from '../screens/ProfileScreen';

type TabParamList = { Learn: undefined; Workshop: undefined; Profile: undefined };
const Tab = createBottomTabNavigator<TabParamList>();

/** The three tabs at the bottom (MainTabView_updated.swift). Learn is the track path: every learner has a track (plan 2b.3). */
export default function MainTabs() {
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
      <Tab.Screen name="Learn" component={TrackPathScreen} />
      <Tab.Screen name="Workshop" component={WorkshopScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
