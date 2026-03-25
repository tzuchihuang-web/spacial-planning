'use client';

import { useState } from 'react';
import { ModeSelector } from '@/components/ModeSelector';
import { RoomPlanner } from '@/components/RoomPlanner';
import type { ExperimentMode } from '@/types';

export default function Home() {
  const [mode, setMode] = useState<ExperimentMode>(null);

  const handleModeSelect = (selectedMode: 'A' | 'B') => {
    console.log(`[Research] Mode ${selectedMode} selected at ${new Date().toISOString()}`);
    setMode(selectedMode);
  };

  const handleReset = () => {
    console.log(`[Research] Session reset at ${new Date().toISOString()}`);
    setMode(null);
  };

  if (!mode) {
    return <ModeSelector onModeSelect={handleModeSelect} />;
  }

  return <RoomPlanner mode={mode} onReset={handleReset} />;
}
