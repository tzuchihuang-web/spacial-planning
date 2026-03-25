'use client';

import { ToolPanel } from './ToolPanel';
import { GoalsPanel } from './GoalsPanel';
import { FurnitureInfo } from './FurnitureInfo';
import type { StudyTask, ViewMode, ActiveTool, Goal, PathState, Furniture } from '@/types';

interface SidebarProps {
  task: StudyTask;
  goals: Goal[];
  pathStates: PathState[];
  selectedGoalId: string | null;
  activeTool: ActiveTool;
  currentView: ViewMode;
  selectedFurniture: Furniture | null;
  undoCount: number;
  onGoalSelect: (goalId: string | null) => void;
  onToolChange: (tool: ActiveTool) => void;
  onViewChange: (view: ViewMode) => void;
  onWalkthroughStart: () => void;
  onRotateFurniture: () => void;
  onDeleteFurniture: () => void;
  onUndo: () => void;
  onResetRoom: () => void;
  onBack: () => void;
}

export function Sidebar({
  task,
  goals,
  pathStates,
  selectedGoalId,
  activeTool,
  currentView,
  selectedFurniture,
  undoCount,
  onGoalSelect,
  onToolChange,
  onViewChange,
  onWalkthroughStart,
  onRotateFurniture,
  onDeleteFurniture,
  onUndo,
  onResetRoom,
  onBack,
}: SidebarProps) {
  return (
    <aside className="w-72 bg-primary text-primary-foreground flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-primary-foreground/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Studio {task}</h1>
            <p className="text-sm text-primary-foreground/70 mt-0.5">
              Layout Planner
            </p>
          </div>
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            title="Back to selection"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* View toggle */}
        <div className="p-5 border-b border-primary-foreground/10">
          <h2 className="text-xs font-medium uppercase tracking-wider text-primary-foreground/60 mb-3">
            View
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => onViewChange('top')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'top'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
              }`}
            >
              Top Down
            </button>
            <button
              onClick={() => onViewChange('3d')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                currentView === '3d'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
              }`}
            >
              3D View
            </button>
          </div>
        </div>

        {/* Tools section */}
        <div className="p-5 border-b border-primary-foreground/10">
          <h2 className="text-xs font-medium uppercase tracking-wider text-primary-foreground/60 mb-3">
            Tools
          </h2>
          <ToolPanel
            activeTool={activeTool}
            undoCount={undoCount}
            onToolChange={onToolChange}
            onUndo={onUndo}
            onReset={onResetRoom}
          />
        </div>

        {/* Selected furniture info */}
        {selectedFurniture && (
          <div className="p-5 border-b border-primary-foreground/10">
            <h2 className="text-xs font-medium uppercase tracking-wider text-primary-foreground/60 mb-3">
              Selected
            </h2>
            <FurnitureInfo
              furniture={selectedFurniture}
              onRotate={onRotateFurniture}
              onDelete={onDeleteFurniture}
            />
          </div>
        )}

        {/* Goals panel */}
        <div className="p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-primary-foreground/60 mb-3">
            Design Goals
          </h2>
          <GoalsPanel
            task={task}
            goals={goals}
            pathStates={pathStates}
            selectedGoalId={selectedGoalId}
            onGoalSelect={onGoalSelect}
            onWalkthroughStart={onWalkthroughStart}
          />
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="p-4 border-t border-primary-foreground/10 text-xs text-primary-foreground/50">
        <p className="mb-1"><kbd className="px-1.5 py-0.5 bg-primary-foreground/10 rounded">R</kbd> Rotate</p>
        <p className="mb-1"><kbd className="px-1.5 py-0.5 bg-primary-foreground/10 rounded">Del</kbd> Delete</p>
        <p><kbd className="px-1.5 py-0.5 bg-primary-foreground/10 rounded">Ctrl+Z</kbd> Undo</p>
      </div>
    </aside>
  );
}
