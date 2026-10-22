// A lesson picture: picks the renderer for its type and shakes it on a wrong answer.
import React from 'react';
import { View } from 'react-native';
import type { Picture, PictureType } from '../../../content/types';
import { PictureState, Shake } from './motion';
import { Dots, RateBars, Steps, Tiles } from './charts';
import { Strands, Thermo } from './biology';
import { Battery, Circuit, Gauge } from './engineering';
import { Belt } from './Belt';
import { Device, StateCard } from './cards';

/** Every picture type the content may use, and what draws it. scripts/validate-content.mjs reads these keys and rejects
 *  any other type, so a new type needs an entry here (and its renderer) before content can use it. */
const RENDERERS: { [T in PictureType]: React.ComponentType<{ spec: Extract<Picture, { type: T }>; state: PictureState; pick: string | null }> } = {
  tiles: Tiles, ratebars: RateBars, dots: Dots, steps: Steps, strands: Strands, thermo: Thermo,
  circuit: Circuit, battery: Battery, gauge: Gauge, belt: Belt,
  // a device whose screen counts up through strip images
  calc: Device, till: Device, device: Device,
  // the picture's icon with the result as a caption
  balance: StateCard, change: StateCard, dftable: StateCard, drain: StateCard, flowmeter: StateCard, gcs_chart: StateCard,
  grid2: StateCard, labelcard: StateCard, lamps: StateCard, piggy: StateCard, stays_pic: StateCard, transfusion: StateCard,
  ward: StateCard, wards: StateCard,
};

/** Draws one picture. Each picture idles while the learner thinks, then acts out the option picked: the right answer
 *  ('go') or that wrong option's own consequence ('nope', with a shake). Reduce Motion holds it at its final state. */
export function LessonPicture({ spec, state, pick }: { spec: Picture; state: PictureState; pick: string | null }) {
  // Unknown types still get the icon card, so a content mistake never blanks a lesson; the validator catches them first.
  // Each renderer takes its own picture type; spec.type picked it, so it gets the matching spec.
  const P = (RENDERERS[spec.type] ?? StateCard) as React.ComponentType<{ spec: Picture; state: PictureState; pick: string | null }>;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={spec.label}>
      <Shake state={state} pick={pick}>
        <P spec={spec} state={state} pick={pick} />
      </Shake>
    </View>
  );
}
