// The streak, bolts and daily-minutes chips at the top of the path screens; tapping one opens an explanation bubble.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { C, body, heading } from '../utils/theme';
import { DAILY_GOAL_BONUS_BOLTS, DAILY_GOAL_MINUTES, TRACK_BOLTS_PER_QUESTION } from '../utils/rewards';
import { Card } from './ui';
import { BoltIcon, FlameIcon } from './icons';

export function StatChipsRow({ streak, bolts, minutes, goal = DAILY_GOAL_MINUTES }: { streak: number; bolts: number; minutes: number; goal?: number }) {
  const [open, setOpen] = useState<null | 'streak' | 'bolts' | 'time'>(null);
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    pop.setValue(0);
    if (open) Animated.spring(pop, { toValue: 1, friction: 7, tension: 160, useNativeDriver: true }).start();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (k: 'streak' | 'bolts' | 'time') => setOpen(open === k ? null : k);
  const left = Math.max(goal - minutes, 0);
  const bubble =
    open === 'streak'
      ? streak > 0
        ? { title: `${streak} day streak`, msg: `You've learned ${streak} days in a row. Do one lesson today to keep it going.` }
        : { title: 'No streak yet', msg: 'Finish a lesson today to start your streak.' }
      : open === 'bolts'
        ? { title: `${bolts} bolts`, msg: bolts > 0 ? `Every right answer in a lesson earns ${TRACK_BOLTS_PER_QUESTION} bolts. Keep learning to collect more.` : `Every right answer in a lesson earns ${TRACK_BOLTS_PER_QUESTION} bolts. Start a lesson to earn your first ones.` }
        : { title: `${minutes} of ${goal} minutes today`, msg: left > 0 ? `Learn ${left} more minutes to hit your daily goal and earn ${DAILY_GOAL_BONUS_BOLTS} bonus bolts.` : 'Daily goal reached. Nice work.' };
  const chip = (k: 'streak' | 'bolts' | 'time', label: string, content: React.ReactNode) => (
    <Pressable onPress={() => toggle(k)} accessibilityRole="button" accessibilityLabel={label} accessibilityHint="Shows more about this">
      <Card radius={22} shadow contentStyle={{ height: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {content}
      </Card>
    </Pressable>
  );
  return (
    <View style={{ zIndex: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {chip('streak', `${streak} day streak`, <><FlameIcon size={20} /><Text style={heading(18)}>{streak}</Text></>)}
        {chip('bolts', `${bolts} bolts`, <><BoltIcon size={22} /><Text style={heading(18)}>{bolts}</Text></>)}
        <View style={{ flex: 1 }} />
        {chip(
          'time',
          `${minutes} of ${goal} minutes today`,
          <>
            <Svg width={22} height={22} viewBox="0 0 22 22">
              <Circle cx={11} cy={11} r={9} stroke={C.locked} strokeWidth={4} fill="none" />
              <Circle cx={11} cy={11} r={9} stroke={C.navy} strokeWidth={4} fill="none" strokeDasharray={`${(2 * Math.PI * 9 * Math.min(minutes, goal)) / goal} 100`} transform="rotate(-90 11 11)" />
            </Svg>
            <Text style={heading(16)}>{minutes}/{goal} min</Text>
          </>,
        )}
      </View>
      {open && (
        <Animated.View style={{ position: 'absolute', top: 54, width: 262, zIndex: 21, ...(open === 'time' ? { right: 0 } : { left: open === 'bolts' ? 48 : 0 }), opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }}>
          <Pressable onPress={() => setOpen(null)}>
            <Card radius={18} shadow contentStyle={{ padding: 14, gap: 6 }}>
              <Text style={heading(20)}>{bubble.title}</Text>
              {open === 'time' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: C.locked, borderWidth: 2, borderColor: C.navy, overflow: 'hidden' }}>
                    <View style={{ width: `${(100 * Math.min(minutes, goal)) / goal}%`, height: '100%', backgroundColor: C.lime }} />
                  </View>
                  <Text style={[body(14, true), { color: C.muted }]}>{minutes} / {goal} min</Text>
                </View>
              )}
              <Text style={body(15)}>{bubble.msg}</Text>
            </Card>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
