'use client';

import type { StudyTask, Goal, PathState } from '@/types';

interface GoalsPanelProps {
  task: StudyTask;
  goals: Goal[];
  pathStates: PathState[];
  selectedGoalId: string | null;
  onGoalSelect: (goalId: string | null) => void;
  onWalkthroughStart: () => void;
}

function StatusIndicator({ status }: { status: 'green' | 'yellow' | 'red' }) {
  const colors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };
  
  const icons = {
    green: (
      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    yellow: (
      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    red: (
      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div className={`w-5 h-5 rounded-full ${colors[status]} flex items-center justify-center shrink-0`}>
      {icons[status]}
    </div>
  );
}

export function GoalsPanel({
  task,
  goals,
  pathStates,
  selectedGoalId,
  onGoalSelect,
  onWalkthroughStart,
}: GoalsPanelProps) {
  const selectedPath = pathStates.find(p => p.goalId === selectedGoalId);
  const showGuidance = task === 'B';

  return (
    <div className="space-y-2">
      {goals.map(goal => {
        const isSelected = selectedGoalId === goal.id;
        const pathState = pathStates.find(p => p.goalId === goal.id);
        
        return (
          <button
            key={goal.id}
            onClick={() => onGoalSelect(isSelected ? null : goal.id)}
            className={`w-full text-left p-3 rounded-lg transition-all ${
              isSelected
                ? 'bg-accent text-accent-foreground'
                : 'bg-primary-foreground/10 hover:bg-primary-foreground/15 text-primary-foreground'
            }`}
          >
            <div className="flex items-start gap-2">
              {showGuidance && pathState && (
                <StatusIndicator status={pathState.status} />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{goal.title}</div>
                <div className={`text-xs mt-0.5 ${
                  isSelected ? 'text-accent-foreground/80' : 'text-primary-foreground/60'
                }`}>
                  {goal.description}
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* Path details and walkthrough (Mode B only) */}
      {showGuidance && selectedGoalId && selectedPath && (
        <div className="mt-4 pt-4 border-t border-primary-foreground/10">
          <div className="flex items-center gap-2 mb-2">
            <StatusIndicator status={selectedPath.status} />
            <span className="text-sm font-medium">Path Status</span>
          </div>
          <p className="text-xs text-primary-foreground/70 mb-1">
            {selectedPath.message}
          </p>
          <p className="text-xs text-primary-foreground/50 mb-3">
            Min clearance: {Math.round(selectedPath.minClearance * 100)}cm
          </p>
          <button
            onClick={onWalkthroughStart}
            className="w-full py-2.5 px-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Start Walkthrough
          </button>
        </div>
      )}

      {!showGuidance && (
        <p className="text-xs text-primary-foreground/50 mt-3 italic">
          Arrange furniture to meet your design goals
        </p>
      )}
    </div>
  );
}
