// The frame shared by both Learn screens: the world backdrop, a scrolling path, and the streak, bolts and minutes chips floating on top.
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from '../SafeAreaView';
import { FullScreenPicture } from '../ui';
import { StatChipsRow } from '../StatChipsRow';

export function PathScreenLayout({ scrollRef, onContentSizeChange, streak, bolts, minutes, emptyState, children }: {
  scrollRef: React.RefObject<ScrollView | null>;
  onContentSizeChange: () => void;
  streak: number;
  bolts: number;
  minutes: number;
  /** Shown instead of the path when the lessons did not load. */
  emptyState?: React.ReactNode;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <FullScreenPicture name="world_backdrop.jpg" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {emptyState ?? (
          <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 70, paddingBottom: 30 }} onContentSizeChange={onContentSizeChange}>
            {children}
          </ScrollView>
        )}
        <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 20 }}>
          <StatChipsRow streak={streak} bolts={bolts} minutes={minutes} />
        </View>
      </SafeAreaView>
    </View>
  );
}
