'use client';

import clsx from 'clsx';

interface ViewToggleProps {
  currentView: 'top' | 'pov';
  onViewChange: (view: 'top' | 'pov') => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onViewChange('top')}
        className={clsx(
          'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all text-sm font-medium',
          currentView === 'top'
            ? 'bg-accent text-accent-foreground'
            : 'bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground'
        )}
      >
        <TopViewIcon className="w-4 h-4" />
        Top View
      </button>
      <button
        onClick={() => onViewChange('pov')}
        className={clsx(
          'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all text-sm font-medium',
          currentView === 'pov'
            ? 'bg-accent text-accent-foreground'
            : 'bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground'
        )}
      >
        <POVIcon className="w-4 h-4" />
        POV
      </button>
    </div>
  );
}

function TopViewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 3v18" />
    </svg>
  );
}

function POVIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
