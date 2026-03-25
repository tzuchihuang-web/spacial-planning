'use client';

import { ToolButtons } from './ToolButtons';
import { RoomSettings } from './RoomSettings';
import { GoalsPanel } from './GoalsPanel';
import { ViewToggle } from './ViewToggle';
import type { Room, Goal, PathState } from '@/types';

interface SidebarProps {
  mode: 'A' | 'B';
  goals: Goal[];
  selectedGoal: string | null;
  activeTool: 'select' | 'place' | 'route';
  currentView: 'top' | 'pov';
  room: Room;
  pathState: PathState | null;
  onGoalSelect: (goalId: string | null) => void;
  onToolChange: (tool: 'select' | 'place' | 'route') => void;
  onViewChange: (view: 'top' | 'pov') => void;
  onWalkthroughStart: () => void;
  onResetRoom: () => void;
  onReset: () => void;
  onRoomDimensionChange: (dimension: 'width' | 'depth' | 'height', value: number) => void;
}

export function Sidebar({
  mode,
  goals,
  selectedGoal,
  activeTool,
  currentView,
  room,
  pathState,
  onGoalSelect,
  onToolChange,
  onViewChange,
  onWalkthroughStart,
  onResetRoom,
  onReset,
  onRoomDimensionChange,
}: SidebarProps) {
  return (
    <aside className="w-72 bg-primary text-primary-foreground flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-primary-foreground/10">
        <h1 className="text-lg font-semibold">Room Planner</h1>
        <p className="text-sm text-primary-foreground/70 mt-0.5">
          Interior Layout Tool
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Tools section */}
        <div className="p-5 border-b border-primary-foreground/10">
          <h2 className="text-xs font-medium uppercase tracking-wider text-primary-foreground/60 mb-3">
            Tools
          </h2>
          <ToolButtons activeTool={activeTool} onToolChange={onToolChange} />
        </div>

        {/* View toggle */}
        <div className="p-5 border-b border-primary-foreground/10">
          <h2 className="text-xs font-medium uppercase tracking-wider text-primary-foreground/60 mb-3">
            View
          </h2>
          <ViewToggle currentView={currentView} onViewChange={onViewChange} />
        </div>

        {/* Room settings */}
        <div className="p-5 border-b border-primary-foreground/10">
          <h2 className="text-xs font-medium uppercase tracking-wider text-primary-foreground/60 mb-3">
            Room Dimensions
          </h2>
          <RoomSettings room={room} onDimensionChange={onRoomDimensionChange} />
        </div>

        {/* Goals panel */}
        <div className="p-5 border-b border-primary-foreground/10">
          <h2 className="text-xs font-medium uppercase tracking-wider text-primary-foreground/60 mb-3">
            Design Goals
          </h2>
          <GoalsPanel
            mode={mode}
            goals={goals}
            selectedGoal={selectedGoal}
            pathState={pathState}
            onGoalSelect={onGoalSelect}
            onWalkthroughStart={onWalkthroughStart}
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-5 border-t border-primary-foreground/10 space-y-2">
        <button
          onClick={onResetRoom}
          className="w-full py-2 px-4 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-sm font-medium"
        >
          Reset Room
        </button>
        <button
          onClick={onReset}
          className="w-full py-2 px-4 rounded-lg bg-primary-foreground/5 hover:bg-primary-foreground/10 transition-colors text-sm text-primary-foreground/70"
        >
          Exit to Mode Select
        </button>
      </div>
    </aside>
  );
}
