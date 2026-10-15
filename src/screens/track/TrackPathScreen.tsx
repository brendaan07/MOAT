// The Learn home for a project track (Biology research, Engineering or Healthcare): the climbing path of lessons and checkpoints.
// Tapping an open node opens that phase's page.
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../../hooks/useAppStore';
import { useScrollToCurrent } from '../../hooks/useScrollToCurrent';
import { useTrackStore } from '../../hooks/useTrackStore';
import { Card } from '../../components/ui';
import { PathNode } from '../../components/path/PathNode';
import { PathScreenLayout } from '../../components/path/PathScreenLayout';
import { PhaseBanner } from '../../components/path/PhaseBanner';
import { C, body, heading } from '../../utils/theme';
import { TrackPhase, moodImage } from '../../types/models';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Node = { id: string; kind: 'lesson' | 'checkpoint'; title: string; phase: TrackPhase; step: number };
type Row = { id: string; banner: TrackPhase } | { id: string; node: Node };

export default function TrackPathScreen() {
  const app = useAppStore();
  const track = useTrackStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const trackData = track.track;

  // The path is drawn bottom-up, so the rows are built in order and then reversed.
  const rows = useMemo(() => {
    const out: Row[] = [];
    let step = 0;
    for (const phase of trackData?.phases ?? []) {
      out.push({ id: `banner-${phase.number}`, banner: phase });
      for (const l of phase.lessons) out.push({ id: l.id, node: { id: l.id, kind: 'lesson', title: `Part ${l.part} · ${l.title}`, phase, step: step++ } });
      if (phase.checkpoint.questions.length) out.push({ id: phase.checkpoint.id, node: { id: phase.checkpoint.id, kind: 'checkpoint', title: `Checkpoint · ${phase.checkpoint.name}`, phase, step: step++ } });
    }
    return out.reverse();
  }, [trackData]);

  /** The node the play button sits on: the next unfinished lesson, else the checkpoint, else the first lesson under 5 stars. */
  const currentID = useMemo(() => {
    const phase = track.cycleOneComplete ? null : track.currentPhase;
    if (!phase) return null;
    const next = track.nextLesson(phase);
    if (next) return next.id;
    if (track.stars(phase.checkpoint.id) < phase.checkpoint.questions.length) return phase.checkpoint.id;
    return phase.lessons.find((l) => track.stars(l.id) < l.questions.length)?.id ?? null;
  }, [track]);

  const { scrollRef, scrollToCurrent, onCurrentLayout } = useScrollToCurrent(currentID);

  const openPhase = (phase: TrackPhase) => navigation.navigate('TrackPhase', { phase: phase.number });

  const banner = (phase: TrackPhase) => {
    const open = track.phaseUnlocked(phase);
    const done = phase.lessons.filter((l) => track.isFinished(l.id)).length + (track.isFinished(phase.checkpoint.id) ? 1 : 0);
    const total = phase.lessons.length + (phase.checkpoint.questions.length ? 1 : 0);
    return (
      <PhaseBanner
        key={`banner-${phase.number}`}
        unlocked={open}
        eyebrow={`Phase ${phase.number} · ${phase.area}`}
        title={phase.project}
        progressLabel={`${done} of ${total}`}
        lockedLabel="5 stars to open"
        lockedIcon="lock-closed"
        onPress={() => open && openPhase(phase)}
        accessibilityLabel={`Phase ${phase.number}, ${phase.project}, ${open ? `${done} of ${total} done` : 'locked'}`}
      />
    );
  };

  const nodeRow = (n: Node) => {
    const lesson = n.phase.lessons.find((l) => l.id === n.id);
    const finished = track.isFinished(n.id);
    const isCurrent = n.id === currentID;
    const open = lesson ? track.lessonUnlocked(lesson, n.phase) : track.checkpointUnlocked(n.phase);
    const stars = track.stars(n.id);
    const state = isCurrent ? 'start' : finished ? `done, ${stars} stars` : open ? 'open' : 'locked';
    const form = app.progress.currentForm;
    return (
      <PathNode
        key={n.id}
        step={n.step}
        isCurrent={isCurrent}
        fill={isCurrent ? C.sky : finished ? C.lime : n.kind === 'checkpoint' && open ? C.sun : C.locked}
        icon={isCurrent ? 'play' : finished ? 'checkmark' : n.kind === 'checkpoint' ? 'star' : 'lock-closed'}
        iconColor={open || finished ? C.navy : C.lockedText}
        phaseLocked={!track.phaseUnlocked(n.phase)}
        title={n.title}
        accessibilityLabel={`${n.title}, ${state}`}
        onPress={() => (open || finished) && openPhase(n.phase)}
        robotName={moodImage(form, form === 'blob' ? 'excited' : 'closed')}
        onCurrentLayout={onCurrentLayout}
        badge={
          finished && !isCurrent ? (
            <View style={{ position: 'absolute', bottom: -10, paddingHorizontal: 7, height: 20, borderRadius: 10, backgroundColor: stars >= 5 ? C.sun : C.card, borderWidth: 2, borderColor: C.navy, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Ionicons name="star" size={10} color={C.navy} />
              <Text style={body(11, true)}>{stars}</Text>
            </View>
          ) : undefined
        }
      />
    );
  };

  const didNotLoad = !trackData && (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Card radius={20} contentStyle={{ padding: 20 }}>
        <Text style={body(15)}>Your track's lessons didn't load. Check that its track file is in assets/content.</Text>
      </Card>
    </View>
  );

  return (
    <PathScreenLayout scrollRef={scrollRef} onContentSizeChange={() => scrollToCurrent(false)} streak={app.displayStreak} bolts={app.progress.bolts} minutes={track.minutesToday} emptyState={didNotLoad || undefined}>
      {trackData && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
          <Card fill={C.premiumBand} radius={20} shadow contentStyle={{ minHeight: 64, paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'center' }}>
            <Text style={[body(13, true), { color: C.premiumText }]}>Cycle 2 · {trackData.cycle2.area}</Text>
            <Text style={[heading(20), { color: C.cream }]}>{trackData.cycle2.project}</Text>
          </Card>
        </View>
      )}
      {rows.map((r) => ('banner' in r ? banner(r.banner) : nodeRow(r.node)))}
    </PathScreenLayout>
  );
}
