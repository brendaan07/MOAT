// The phase's project card: its parts, ticked as the learner finishes them.
import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '../ui';
import { CheckIcon } from '../icons';
import { PhasePicture } from './phasePictures';
import { C, body, heading, monoBold } from '../../utils/theme';
import type { TrackPhase } from '../../content/types';

interface LiveOutput {
  label: string;
  text: string;
  color: string;
}

/** A lime circle with a tick, for a finished part. */
export function DoneTick({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.lime, borderWidth: 2, borderColor: C.navy, alignItems: 'center', justifyContent: 'center' }}>
      <CheckIcon size={size * 0.55} />
    </View>
  );
}

const DashedDot = ({ size = 20 }: { size?: number }) => <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderStyle: 'dashed', borderColor: C.grey }} />;

/** The phase's project with its parts, done ones ticked up to `part`. */
export function ProjectCard({ phase, part, live }: { phase: TrackPhase; part: number; live?: LiveOutput }) {
  return (
    <Card radius={20} shadow contentStyle={{ padding: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.navy }}>
        <Text style={[heading(17), { color: C.cream, flex: 1 }]} numberOfLines={2}>{phase.project}</Text>
        <Text style={[body(13, true), { color: C.lavender }]}>{part > 4 ? 'Built' : `Part ${part} of 4`}</Text>
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ width: 18, height: 8, borderRadius: 4, backgroundColor: i < part ? C.lime : i === part ? C.sky : C.muted }} />
          ))}
        </View>
      </View>
      <View style={{ paddingHorizontal: 12, paddingTop: 6 }}>
        <PhasePicture kind={phase.picture} compact />
      </View>
      <View style={{ paddingTop: 4 }}>
        {phase.parts.map((row, i) => {
          const n = i + 1;
          const isLive = n === part && !!live;
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 34, paddingHorizontal: 12, paddingVertical: 2, borderTopWidth: 1.5, borderTopColor: C.locked, backgroundColor: isLive ? C.hintBlue : 'transparent' }}>
              {n < part ? <DoneTick /> : isLive ? <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.sky, borderWidth: 2, borderColor: C.navy }} /> : <DashedDot />}
              <Text style={[body(14, true), { color: n <= part ? C.navy : C.lockedText, flexShrink: 1 }]}>{row[0]}</Text>
              <View style={{ flex: 1 }} />
              {n < part && <Text style={monoBold(14)}>{row[1]}</Text>}
              {isLive && live && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                  <Text style={[body(12, true), { color: C.muted }]}>{live.label}</Text>
                  <View style={{ maxWidth: 170, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: C.screen }} accessibilityLiveRegion="polite">
                    <Text style={[monoBold(live.text.length <= 10 ? 15 : 13), { color: live.color }]}>{live.text}</Text>
                  </View>
                </View>
              )}
              {n > part || (n === part && !live) ? (
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: C.grey }}>
                  <Text style={[body(13, true), { color: C.lockedText }]}>Part {n}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Card>
  );
}
