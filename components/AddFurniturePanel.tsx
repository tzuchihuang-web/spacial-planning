'use client';

import { furnitureTemplates } from '@/utils/roomData';

interface AddFurniturePanelProps {
  onAddFurniture: (type: string) => void;
  onClose: () => void;
}

export function AddFurniturePanel({ onAddFurniture, onClose }: AddFurniturePanelProps) {
  return (
    <div className="absolute left-80 top-4 bg-card border border-border rounded-xl shadow-lg p-4 w-64">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-card-foreground">Add Furniture</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {furnitureTemplates.map(template => (
          <button
            key={template.type}
            onClick={() => onAddFurniture(template.type)}
            className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ backgroundColor: template.color }}
            >
              <span className="text-white text-xs font-bold">
                {template.label.charAt(0)}
              </span>
            </div>
            <span className="text-xs text-card-foreground font-medium text-center">
              {template.label}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {template.width}x{template.depth}m
            </span>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Click to add furniture to the room
      </p>
    </div>
  );
}
