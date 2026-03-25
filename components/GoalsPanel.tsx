'use client';

import clsx from 'clsx';
import type { Goal, PathState } from '@/types';

interface GoalsPanelProps {
  mode: 'A' | 'B';
  goals: Goal[];
  selectedGoal: string | null;
  pathState: PathState | null;
  onGoalSelect: (goalId: string | null) => void;
  onWalkthroughStart: () => void;
}

export function GoalsPanel({
  mode,
  goals,
  selectedGoal,
  pathState,
  onGoalSelect,
  onWalkthroughStart,
}: GoalsPanelProps) {
  return (
    <div className="space-y-2">
      {goals.map(goal => {
        const isSelected = selectedGoal === goal.id;
        
        return (
          <button
            key={goal.id}
            onClick={() => onGoalSelect(isSelected ? null : goal.id)}
            className={clsx(
              'w-full text-left p-3 rounded-lg transition-all',
              isSelected
                ? 'bg-accent text-accent-foreground'
                : 'bg-primary-foreground/10 hover:bg-primary-foreground/15 text-primary-foreground'
            )}
          >
            <div className="font-medium text-sm">{goal.title}</div>
            <div className={clsx(
              'text-xs mt-0.5',
              isSelected ? 'text-accent-foreground/80' : 'text-primary-foreground/60'
            )}>
              {goal.description}
            </div>
          </button>
        );
      })}

      {/* Path status indicator (Mode B only) */}
      {mode === 'B' && selectedGoal && pathState && (
        <div className="mt-4 pt-4 border-t border-primary-foreground/10">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={clsx(
                'w-3 h-3 rounded-full',
                pathState.color === 'green' && 'bg-green-500',
                pathState.color === 'yellow' && 'bg-yellow-500',
                pathState.color === 'red' && 'bg-red-500'
              )}
            />
            <span className="text-sm font-medium">Path Status</span>
          </div>
          <p className="text-xs text-primary-foreground/70 mb-3">
            {pathState.message}
          </p>
          <button
            onClick={onWalkthroughStart}
            className="w-full py-2 px-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-medium transition-colors"
          >
            Start Walkthrough
          </button>
        </div>
      )}

      {mode === 'A' && (
        <p className="text-xs text-primary-foreground/50 mt-3 italic">
          Arrange furniture to meet your design goals
        </p>
      )}
    </div>
  );
}
