'use client';

import { StudyTask } from '@/types';
import { goalsA, goalsB } from '@/utils/roomData';

interface TaskSelectorProps {
  onSelectTask: (task: StudyTask) => void;
}

export function TaskSelector({ onSelectTask }: TaskSelectorProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-foreground mb-3">
            Studio Layout Planning
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Design a comfortable living space by arranging furniture to meet specific goals.
            Select a studio to begin.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Studio A Card */}
          <div className="bg-card rounded-xl border border-border p-6 flex flex-col">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground text-sm font-medium rounded-full">
                Studio A
              </span>
            </div>
            
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              Work & Social Space
            </h2>
            
            <p className="text-muted-foreground mb-4 flex-grow">
              A compact studio focused on work-from-home comfort and creating 
              a welcoming space for visitors.
            </p>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-card-foreground mb-2">
                Design Goals:
              </h3>
              <ul className="space-y-2">
                {goalsA.map(goal => (
                  <li key={goal.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    <span>{goal.description}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onSelectTask('A')}
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Begin Studio A
            </button>
          </div>

          {/* Studio B Card */}
          <div className="bg-card rounded-xl border border-border p-6 flex flex-col">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground text-sm font-medium rounded-full">
                Studio B
              </span>
            </div>
            
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              Night Access & Workflow
            </h2>
            
            <p className="text-muted-foreground mb-4 flex-grow">
              A studio where smooth movement paths are essential - from bed to 
              bathroom at night, and efficient desk-to-shelf workflow.
            </p>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-card-foreground mb-2">
                Design Goals:
              </h3>
              <ul className="space-y-2">
                {goalsB.map(goal => (
                  <li key={goal.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    <span>{goal.description}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onSelectTask('B')}
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Begin Studio B
            </button>
          </div>
        </div>

        <p className="text-center text-muted-foreground text-sm mt-8">
          You can drag furniture to rearrange the layout. Use the tools to add, 
          rotate, or remove items.
        </p>
      </div>
    </div>
  );
}
