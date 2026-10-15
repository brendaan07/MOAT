// A checkpoint question on the navy exam layout: picks the layout for its style (plan, code, predict, debug or build).
import React from 'react';
import { TrackPhase } from '../../../types/models';
import { LiveOutput } from '../../../components/track/ProjectCard';
import { BuildQuestion } from './BuildQuestion';
import { CodeOrderQuestion } from './CodeOrderQuestion';
import { DebugQuestion } from './DebugQuestion';
import { QuestionView } from './parts';
import { PlanQuestion } from './PlanQuestion';
import { PredictQuestion } from './PredictQuestion';

export function CheckpointQuestionBody({ view, phase, live }: { view: QuestionView; phase: TrackPhase; live: LiveOutput }) {
  switch (view.q.style ?? 'predict') {
    case 'plan': return <PlanQuestion view={view} phase={phase} />;
    case 'code': return <CodeOrderQuestion view={view} phase={phase} />;
    case 'debug': return <DebugQuestion view={view} phase={phase} live={live} />;
    case 'build': return <BuildQuestion view={view} />;
    default: return <PredictQuestion view={view} phase={phase} />;
  }
}
