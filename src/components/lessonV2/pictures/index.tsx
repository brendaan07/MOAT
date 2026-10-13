// Draws one picture of a question from its JSON description; still pictures and moving pictures share this one entry point.
import React from 'react';
import type { V2Pic } from '../types';
import { PicState } from './motion';
import { Bars, Machine, Message, PhScale, Readout, Rows, Strip, Tubes } from './static';
import { Belt } from './Belt';
import { Circuit } from './Circuit';
import { Battery, Clock24, Drip, Gauge, Monitor, Syringe, Wristband } from './health';
import { BpBars, Curve } from './charts';

/** `solved` and `state` tell the picture whether to act out the right answer or shake. */
export function Picture({ p, solved, state }: { p: V2Pic; solved: boolean; state: PicState }) {
  switch (p.type) {
    case 'strip': return <Strip text={p.text} hi={p.hi} size={p.size} />;
    case 'readout': return <Readout label={p.label} value={p.value} known={p.known} solved={solved} />;
    case 'rows': return <Rows items={p.items} solved={solved} />;
    case 'bars': return <Bars vals={p.vals} cutoff={p.cutoff} hide={p.hide} labels={p.labels} cmax={p.cmax} />;
    case 'tubes': return <Tubes vols={p.vols} cap={p.cap} />;
    case 'ph': return <PhScale marks={p.marks} />;
    case 'machine': return <Machine input={p.input} name={p.name} solved={solved} />;
    case 'msg': return <Message who={p.who} text={p.text} />;
  }
  const a = { args: p.args ?? [], kw: p.kw ?? {} };
  switch (p.type) {
    case 'belt': return <Belt p={a} state={state} />;
    case 'circuit': return <Circuit p={a} state={state} />;
    case 'battery': return <Battery p={a} state={state} />;
    case 'drip': return <Drip p={a} state={state} />;
    case 'gauge': return <Gauge p={a} state={state} />;
    case 'clock24': return <Clock24 p={a} state={state} />;
    case 'wristband': return <Wristband p={a} state={state} />;
    case 'syringe': return <Syringe p={a} state={state} />;
    case 'monitor': return <Monitor p={a} state={state} />;
    case 'bpbars': return <BpBars p={a} state={state} />;
    case 'curve': return <Curve p={a} state={state} />;
  }
}
