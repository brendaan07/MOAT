// Blob in a sky-blue circle, at the top of the results screens.
import React from 'react';
import { View } from 'react-native';
import { RobotFace } from '../../../components/track/RobotFace';
import { BORDER, C } from '../../../utils/theme';

/** Blob with a mood in a circle; `dark` drops the shadow and outlines it in cream for the navy screens. */
export const Hero = ({ mood, size, dark = false }: { mood: 'hearts' | 'surprised' | 'wink'; size: number; dark?: boolean }) => {
  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: dark ? 0 : 4, height: size, borderRadius: size / 2, backgroundColor: dark ? 'transparent' : C.navy }} />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.sky, borderWidth: BORDER, borderColor: dark ? C.cream : C.navy }} />
      <View style={{ position: 'absolute', left: size * 0.04, top: -size * 0.08 }}>
        <RobotFace mood={mood} width={size * 0.92} height={size * 1.1} />
      </View>
    </View>
  );
};
