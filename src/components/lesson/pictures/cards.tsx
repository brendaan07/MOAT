// Healthcare and Finance pictures: devices whose screens count up, and icon cards with the result as a caption.
import React, { useEffect, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';
import { C, body, monoBold } from '../../../utils/theme';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import type { CardPicture, CardState, DevicePicture } from '../../../content/types';
import { lessonImage } from '../../../utils/lessonImages';
import { PictureState, resolve } from './motion';

/* ------------------------------------------------------------------ Healthcare and Finance pictures */
/** The caption inside a state: its text field, or the last piece of text in it. */
function caption(v: CardState | undefined): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) { for (let i = v.length - 1; i >= 0; i--) { const c = caption(v[i]); if (c) return c; } return null; }
  if (typeof v === 'object') return typeof v.text === 'string' ? v.text : null;
  return null;
}
/** An icon for the picture types whose JSON names none, so the card never falls back to an empty box. */
const TYPE_ICON: Partial<Record<CardPicture['type'], string>> = {
  balance: 'iv_stand', flowmeter: 'oxygen_flowmeter', transfusion: 'blood_bag', gcs_chart: 'clipboard',
  ward: 'hospital_bed', wards: 'hospital_bed', lamps: 'patient_monitor', dftable: 'clipboard',
  stays_pic: 'calendar', grid2: 'lab_tube',
};
const typeIcon = (type: CardPicture['type']) => (TYPE_ICON[type] ? `assets/images/healthcare/icons/${TYPE_ICON[type]}.png` : undefined);

function Caption({ text, state }: { text: string | null; state: PictureState }) {
  const fade = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  useEffect(() => {
    fade.setValue(0);
    if (!text) return;
    if (reduce) { fade.setValue(1); return; }
    Animated.timing(fade, { toValue: 1, duration: 300, delay: 950, useNativeDriver: true }).start();
  }, [text, state, fade, reduce]);
  if (!text) return null;
  return (
    <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }] }}>
      <Text style={[body(11, true), { color: '#4A527F' }]}>result</Text>
      <Text style={[monoBold(13), { color: state === 'nope' ? '#B3470E' : C.greenText }]}>{text}</Text>
    </Animated.View>
  );
}

/** A device whose own screen counts up: the device stays still while its screen strip steps from the start value to the reading. */
export function Device({ spec, state, pick }: { spec: DevicePicture; state: PictureState; pick: string | null }) {
  const dev = 'device' in spec.assets ? spec.assets.device : spec.assets;
  const size: number = dev.display_size_px ?? 150;
  const box = dev.screen_box_display_px;
  const key = state === 'go' ? 'correct' : state === 'nope' ? pick ?? '' : '';
  const strip = key ? dev.strips?.[key] : null;
  const frames: number = strip?.frames ?? 1;
  const step = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  useEffect(() => {
    step.setValue(0);
    if (!strip) return;
    if (reduce || frames < 2) { step.setValue(1); return; }
    Animated.timing(step, { toValue: 1, duration: 950, delay: 100, useNativeDriver: true,
      easing: (t: number) => Math.floor(t * (frames - 1)) / (frames - 1) }).start();
  }, [state, pick, strip, frames, step, reduce]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}>
      <View style={{ width: size, height: size }}>
        <Image source={lessonImage(dev.idle_frame)} style={{ width: size, height: size }} resizeMode="contain" />
        {strip ? (
          <View style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, overflow: 'hidden' }}>
            <Animated.Image source={lessonImage(strip.strip)} style={{ width: box.w, height: box.h * frames,
              transform: [{ translateY: step.interpolate({ inputRange: [0, 1], outputRange: [0, -(frames - 1) * box.h] }) }] }} />
          </View>
        ) : null}
      </View>
      <Caption text={caption(resolve(spec, state, pick))} state={state} />
    </View>
  );
}

/** The other Healthcare and Finance pictures: the picture's own icon, which pops on Check, and the result for the answer given.
 *  The canvas pages hold the full scene animation for these types (see docs/INTEGRATION_moat4new.md). */
export function StateCard({ spec, state, pick }: { spec: CardPicture; state: PictureState; pick: string | null }) {
  const a = spec.assets ?? {};
  const src = lessonImage(spec.icon_asset ?? a.pig ?? a.pile ?? a.note ?? a.bag?.empty ?? a.face ?? a.device?.idle_frame ?? typeIcon(spec.type));
  const pop = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  useEffect(() => {
    pop.setValue(0);
    if (state === 'idle' || reduce) return;
    Animated.sequence([Animated.timing(pop, { toValue: 1, duration: 180, useNativeDriver: true }), Animated.spring(pop, { toValue: 0, useNativeDriver: true, friction: 4 })]).start();
  }, [state, pick, pop, reduce]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
      {src ? (
        <Animated.Image source={src} style={{ width: 96, height: 96, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }} resizeMode="contain" />
      ) : (
        <View style={{ width: 96, height: 96, borderRadius: 16, borderWidth: 2.5, borderColor: C.navy, backgroundColor: C.editor }} />
      )}
      <Caption text={caption(resolve(spec, state, pick))} state={state} />
    </View>
  );
}
