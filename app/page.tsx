'use client';

import { useState } from 'react';
import { StudyTask } from '@/types';
import { TaskSelector } from '@/components/TaskSelector';
import { RoomPlanner } from '@/components/RoomPlanner';
import { logTaskSelected } from '@/utils/researchLogger';

export default function HomePage() {
  const [selectedTask, setSelectedTask] = useState<StudyTask | null>(null);

  const handleSelectTask = (task: StudyTask) => {
    logTaskSelected(task);
    setSelectedTask(task);
  };

  const handleBackToSelection = () => {
    setSelectedTask(null);
  };

  if (!selectedTask) {
    return <TaskSelector onSelectTask={handleSelectTask} />;
  }

  return (
    <RoomPlanner 
      task={selectedTask} 
      onBack={handleBackToSelection} 
    />
  );
}
