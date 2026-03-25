'use client';

import clsx from 'clsx';

interface ToolButtonsProps {
  activeTool: 'select' | 'place' | 'route';
  onToolChange: (tool: 'select' | 'place' | 'route') => void;
}

const tools = [
  { id: 'select' as const, label: 'Select', icon: SelectIcon },
  { id: 'place' as const, label: 'Place', icon: PlaceIcon },
  { id: 'route' as const, label: 'Route', icon: RouteIcon },
];

export function ToolButtons({ activeTool, onToolChange }: ToolButtonsProps) {
  return (
    <div className="flex gap-2">
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          className={clsx(
            'flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-all',
            activeTool === tool.id
              ? 'bg-accent text-accent-foreground'
              : 'bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground'
          )}
        >
          <tool.icon className="w-5 h-5" />
          <span className="text-xs font-medium">{tool.label}</span>
        </button>
      ))}
    </div>
  );
}

function SelectIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  );
}

function PlaceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function RouteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M6 9v3c0 3 3 6 6 6h3" />
    </svg>
  );
}
