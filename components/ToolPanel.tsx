'use client';

import type { ActiveTool } from '@/types';

interface ToolPanelProps {
  activeTool: ActiveTool;
  undoCount: number;
  onToolChange: (tool: ActiveTool) => void;
  onUndo: () => void;
  onReset: () => void;
}

const tools: { id: ActiveTool; label: string; icon: React.ReactNode }[] = [
  {
    id: 'select',
    label: 'Select',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
  },
  {
    id: 'move',
    label: 'Move',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
  },
  {
    id: 'add',
    label: 'Add',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
];

export function ToolPanel({
  activeTool,
  undoCount,
  onToolChange,
  onUndo,
  onReset,
}: ToolPanelProps) {
  return (
    <div className="space-y-3">
      {/* Main tools */}
      <div className="grid grid-cols-3 gap-2">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-colors ${
              activeTool === tool.id
                ? 'bg-accent text-accent-foreground'
                : 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
            }`}
          >
            {tool.icon}
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onUndo}
          disabled={undoCount === 0}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            undoCount > 0
              ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20'
              : 'bg-primary-foreground/5 text-primary-foreground/40 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Undo
          {undoCount > 0 && (
            <span className="text-xs text-primary-foreground/60">({undoCount})</span>
          )}
        </button>
        <button
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>
      </div>
    </div>
  );
}
