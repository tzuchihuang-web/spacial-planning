'use client';

import type { Room } from '@/types';

interface RoomSettingsProps {
  room: Room;
  onDimensionChange: (dimension: 'width' | 'depth' | 'height', value: number) => void;
}

export function RoomSettings({ room, onDimensionChange }: RoomSettingsProps) {
  return (
    <div className="space-y-4">
      <DimensionSlider
        label="Width"
        value={room.width}
        min={8}
        max={20}
        onChange={(v) => onDimensionChange('width', v)}
      />
      <DimensionSlider
        label="Depth"
        value={room.depth}
        min={8}
        max={20}
        onChange={(v) => onDimensionChange('depth', v)}
      />
      <DimensionSlider
        label="Height"
        value={room.height}
        min={8}
        max={12}
        onChange={(v) => onDimensionChange('height', v)}
      />
    </div>
  );
}

interface DimensionSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function DimensionSlider({ label, value, min, max, onChange }: DimensionSliderProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-primary-foreground/80">{label}</span>
        <span className="text-sm font-medium">{value} ft</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-primary-foreground/20 rounded-lg appearance-none cursor-pointer accent-accent"
      />
    </div>
  );
}
