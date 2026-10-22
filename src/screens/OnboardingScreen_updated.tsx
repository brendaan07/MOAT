import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from '../components/SafeAreaView';
import { useAppStore } from '../hooks/useAppStore';
import { BundleImage, Card, ChunkyButton } from '../components/ui';
import { BORDER, C, body, heading } from '../utils/theme';
import { STUDY_AREAS, canonicalArea } from '../utils/studyAreas';
import { TRACK_LANGUAGES } from '../services/contentLoader_updated';

const EDUCATION = ['Primary school', 'Secondary school', 'Diploma or vocational', "Bachelor's degree", "Master's degree", 'Doctorate', 'Prefer not to say'];
const LANGUAGES = [
  { name: 'Python', caption: 'Every subject · most popular' },
  { name: 'R', caption: 'Biology research · statistics' },
  { name: 'SQL', caption: 'Business · working with data' },
  { name: 'JavaScript', caption: 'Web & app building' },
  { name: 'MATLAB', caption: 'Engineering · physics & maths' },
  { name: 'Java', caption: 'Engineering · enterprise software' },
];
/** The first area shown selected for a new learner. */
const BIO = 'Biology research';

const StepLabel = ({ text }: { text: string }) => (
  <Text style={[body(13, true), { color: C.muted, letterSpacing: 2, textAlign: 'center' }]}>{text}</Text>
);
const Title = ({ text }: { text: string }) => (
  <Text style={[heading(20), { textAlign: 'center' }]} accessibilityRole="header">{text}</Text>
);

/** Age slider drawn like the design: navy-outlined track, lime fill, round lime thumb. Works with VoiceOver too. */
function AgeSlider({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  const track = useRef<View>(null);
  const geo = useRef({ x: 0, w: 1 });
  const measure = () => track.current?.measureInWindow((x, _y, w) => { geo.current = { x, w: Math.max(w, 1) }; });
  const toValue = (pageX: number) => {
    const t = Math.max(0, Math.min(1, (pageX - geo.current.x) / geo.current.w));
    return Math.round(min + t * (max - min));
  };
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => { measure(); onChange(toValue(e.nativeEvent.pageX)); },
        onPanResponderMove: (e) => onChange(toValue(e.nativeEvent.pageX)),
      }),
    [onChange], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const t = (value - min) / (max - min);
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Age"
      accessibilityValue={{ text: label }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.max(min, Math.min(max, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
      style={{ alignSelf: 'stretch', height: 44, justifyContent: 'center' }}
      {...responder.panHandlers}
    >
      <View ref={track} onLayout={measure} style={{ height: 14, borderRadius: 7, borderWidth: BORDER, borderColor: C.navy, backgroundColor: C.card, overflow: 'hidden' }}>
        <View style={{ width: `${t * 100}%`, height: '100%', backgroundColor: C.lime }} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: `${t * 100}%`, marginLeft: -20, width: 40, height: 40 }}>
        <View style={{ position: 'absolute', top: 3, width: 40, height: 40, borderRadius: 20, backgroundColor: C.navy }} />
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.lime, borderWidth: BORDER, borderColor: C.navy }} />
      </View>
    </View>
  );
}

function Choice({ label, caption, selected, onPress, minHeight = 48, disabled = false }: { label: string; caption?: string; selected: boolean; onPress: () => void; minHeight?: number; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ selected, disabled }} style={{ flex: 1, opacity: disabled ? 0.45 : 1 }}>
      <Card fill={selected ? C.lime : C.card} radius={14} shadow={!disabled} contentStyle={{ minHeight, paddingHorizontal: caption ? 36 : 28, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[caption ? heading(18) : body(15, true), { textAlign: 'center' }]}>{label}</Text>
        {caption ? <Text style={[body(12, true), { color: C.muted, textAlign: 'center' }]}>{caption}</Text> : null}
        {selected && <Ionicons name="checkmark" size={16} color={C.navy} style={{ position: 'absolute', right: caption ? 14 : 10 }} />}
      </Card>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const store = useAppStore();
  const [name, setName] = useState('');
  const [age, setAge] = useState(18);
  const [education, setEducation] = useState('Secondary school');
  const [studyArea, setStudyArea] = useState(BIO);
  const [language, setLanguage] = useState('R');
  const [step, setStep] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const ageLabel = age >= 70 ? '70+' : String(age);
  /** The languages this field has a track in: shown first and selectable on step 2; the rest are greyed out. */
  const trackLangs = TRACK_LANGUAGES[studyArea] ?? [];
  /** "Python, R and SQL": the track languages as one phrase. */
  const langList = trackLangs.length > 1 ? `${trackLangs.slice(0, -1).join(', ')} and ${trackLangs[trackLangs.length - 1]}` : trackLangs.join('');
  const ordered = [...LANGUAGES].sort((a, b) => Number(trackLangs.includes(b.name)) - Number(trackLangs.includes(a.name)));
  const fieldLine = `${studyArea}: project lessons in ${langList}.`;

  useEffect(() => {
    const p = store.progress;
    setName(p.name);
    setAge(p.age);
    setEducation(p.education);
    const area = canonicalArea(p.studyArea);
    setStudyArea(STUDY_AREAS.includes(area) ? area : BIO);
    // A learner whose saved pair has no track (RootNavigator sends them here) picks their language again.
    const stale = p.hasOnboarded && !(TRACK_LANGUAGES[area] ?? []).includes(p.language);
    setLanguage(stale ? '' : STUDY_AREAS.includes(area) ? p.language : 'R');
    if (stale) setStep(2);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToLanguages = () => {
    if (!trackLangs.includes(language)) setLanguage(trackLangs[0] ?? '');
    setStep(2);
  };

  if (step === 2) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.cream }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
          <Pressable onPress={() => setStep(1)} accessibilityRole="button" accessibilityLabel="Back" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={24} color={C.navy} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}>
          <StepLabel text="STEP 2 OF 2" />
          <Text style={[heading(24), { textAlign: 'center' }]} accessibilityRole="header">Pick a language</Text>
          <Text style={[body(14, true), { color: C.muted, textAlign: 'center', marginBottom: 6 }]}>{fieldLine}</Text>
          {ordered.map((l) => (
            <View key={l.name} style={{ flexDirection: 'row' }}>
              <Choice
                label={l.name}
                caption={trackLangs.includes(l.name) ? `${studyArea} · project lessons` : `Not available for ${studyArea} yet`}
                selected={language === l.name}
                disabled={!trackLangs.includes(l.name)}
                onPress={() => setLanguage(l.name)}
                minHeight={74}
              />
            </View>
          ))}
          <Text style={[body(13, true), { color: C.muted, textAlign: 'center', marginTop: 4 }]}>
            {trackLangs.length === 1
              ? `${studyArea} lessons are written in ${langList}. More languages are coming later.`
              : trackLangs.includes(language)
                ? `You'll build ${studyArea.toLowerCase()} projects in ${language}, one step at a time.`
                : 'Pick a language to start.'}
          </Text>
        </ScrollView>
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <ChunkyButton title="Let's go" enabled={trackLangs.includes(language)} onPress={() => store.finishOnboarding(name, age, education, studyArea, language)} />
        </View>
      </SafeAreaView>
    );
  }

  const rows: string[][] = [];
  for (let i = 0; i < STUDY_AREAS.length; i += 2) rows.push(STUDY_AREAS.slice(i, i + 2));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.cream }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <BundleImage name="blob_excited" style={{ width: 64, height: 72 }} />
            <View style={{ flex: 1 }}>
              <Card radius={18} shadow contentStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={body(15, true)}>Tell me about you so I can tailor your lessons!</Text>
              </Card>
              <View style={{ position: 'absolute', left: -7, top: 22, width: 14, height: 14, backgroundColor: C.card, borderLeftWidth: BORDER, borderBottomWidth: BORDER, borderColor: C.navy, transform: [{ rotate: '45deg' }] }} />
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <StepLabel text="STEP 1 OF 2" />
            <Title text="What's your name?" />
            <Card radius={14} shadow style={{ marginTop: 6 }} contentStyle={{ minHeight: 52, justifyContent: 'center', paddingHorizontal: 16 }}>
              <TextInput
                value={name}
                onChangeText={(t) => setName(t.slice(0, 30))}
                placeholder="Your first name (optional)"
                placeholderTextColor={C.muted}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                accessibilityLabel="Your first name"
                style={[body(16, true), { textAlign: 'center', paddingVertical: 12 }]}
              />
            </Card>
          </View>

          <View style={{ gap: 10, alignItems: 'center' }}>
            <Title text="How old are you?" />
            <Card radius={12} contentStyle={{ minWidth: 64, height: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={heading(24)}>{ageLabel}</Text>
            </Card>
            <AgeSlider value={age} min={10} max={70} onChange={setAge} label={ageLabel} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch' }}>
              {['10', '30', '50', '70+'].map((t) => (
                <Text key={t} style={[body(12), { color: C.muted }]}>{t}</Text>
              ))}
            </View>
            {age < 13 && <Text style={[body(13, true), { textAlign: 'center' }]}>Under 13? A parent will need to help you set up.</Text>}
          </View>

          <View style={{ gap: 10 }}>
            <Title text="Highest education level" />
            <Pressable onPress={() => setMenuOpen(true)} accessibilityRole="button" accessibilityLabel={`Highest education level, ${education}`}>
              <Card radius={14} shadow contentStyle={{ minHeight: 52, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={body(16, true)}>{education}</Text>
                <Ionicons name="chevron-down" size={18} color={C.navy} style={{ position: 'absolute', right: 16 }} />
              </Card>
            </Pressable>
          </View>

          <View style={{ gap: 12 }}>
            <Title text="Main area of study" />
            {rows.map((r) => (
              <View key={r[0]} style={{ flexDirection: 'row', gap: 10 }}>
                {r.map((a) => (
                  <Choice key={a} label={a} selected={studyArea === a} onPress={() => setStudyArea(a)} />
                ))}
                {r.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            ))}
            <Text style={[body(13), { color: C.muted, textAlign: 'center' }]}>Not sure or not specific? Pick General.</Text>
          </View>
        </ScrollView>
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <ChunkyButton title="Next" onPress={goToLanguages} />
        </View>
      </KeyboardAvoidingView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(27,36,114,0.35)', justifyContent: 'center', padding: 32 }} onPress={() => setMenuOpen(false)}>
          <Card radius={16} shadow contentStyle={{ paddingVertical: 6 }}>
            <FlatList
              data={EDUCATION}
              keyExtractor={(i) => i}
              renderItem={({ item }) => (
                <Pressable onPress={() => { setEducation(item); setMenuOpen(false); }} accessibilityRole="button" accessibilityState={{ selected: item === education }} style={{ minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={body(16, item === education)}>{item}</Text>
                  {item === education && <Ionicons name="checkmark" size={16} color={C.navy} />}
                </Pressable>
              )}
            />
          </Card>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
