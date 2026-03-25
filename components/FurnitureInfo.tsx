'use client';

import type { Furniture } from '@/types';
import { getRotatedDimensions } from '@/utils/roomData';

interface FurnitureInfoProps {
  furniture: Furniture;
  onRotate: () => void;
  onDelete: () => void;
}

export function FurnitureInfo({ furniture, onRotate, onDelete }: FurnitureInfoProps) {
  const dims = getRotatedDimensions(furniture);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: furniture.color }}
        >
          <span className="text-white text-xs font-bold">
            {furniture.label.charAt(0)}
          </span>
        </div>
        <div>
          <p className="font-medium">{furniture.label}</p>
          <p className="text-xs text-primary-foreground/60">
            {dims.width.toFixed(1)}m x {dims.depth.toFixed(1)}m
          </p>
        </div>
      </div>

      <div className="text-xs text-primary-foreground/70 space-y-1">
        <p>Position: ({furniture.x.toFixed(2)}, {furniture.y.toFixed(2)})</p>
        <p>Rotation: {furniture.rotation}°</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onRotate}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Rotate
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium bg-destructive/20 hover:bg-destructive/30 text-destructive-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
