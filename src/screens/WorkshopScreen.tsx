import React from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { BundleImage, Card } from '../components/ui';
import { C, heading } from '../utils/theme';
import { robotImage } from '../types/models';

/** The Workshop tab: the learner's robot, Blob, on the world backdrop. */
export default function WorkshopScreen() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.cream }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={heading(30)} accessibilityRole="header">Workshop</Text>
        <Card fill="transparent" radius={20} contentStyle={{ paddingVertical: 16, alignItems: 'center', gap: 8 }}>
          <BundleImage name="world_backdrop.jpg" resizeMode="cover" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <BundleImage name={robotImage('hearts')} style={{ height: 200, width: 200 }} />
          <Text style={heading(22)}>Blob</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
