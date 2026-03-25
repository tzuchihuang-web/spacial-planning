'use client';

interface ModeSelectorProps {
  onModeSelect: (mode: 'A' | 'B') => void;
}

export function ModeSelector({ onModeSelect }: ModeSelectorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-card rounded-xl shadow-lg border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Spatial Planning Study
            </h1>
            <p className="text-muted-foreground text-sm">
              Facilitator Interface - Select experiment mode
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => onModeSelect('A')}
              className="w-full p-6 rounded-lg border-2 border-border bg-card hover:border-primary hover:bg-muted/50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <span className="text-xl font-bold">A</span>
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Mode A - Baseline</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Standard planning interface without guidance overlays
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onModeSelect('B')}
              className="w-full p-6 rounded-lg border-2 border-border bg-card hover:border-accent hover:bg-muted/50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <span className="text-xl font-bold">B</span>
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Mode B - Guided</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Planning with path visualization and POV walkthrough
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Research prototype for interior layout planning study
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
