export interface Room {
  id: string;
  name: string;
  width: number;
  depth: number;
  height: number;
  doorway: {
    x: number;
    y: number;
    width: number;
    orientation: 'north' | 'south' | 'east' | 'west';
  };
  bathroom: {
    x: number;
    y: number;
    width: number;
    depth: number;
  };
}

export interface Furniture {
  id: string;
  type: 'bed' | 'sofa' | 'desk' | 'chair' | 'table' | 'shelf' | 'dresser';
  label: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation: number;
  color: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  pathStart: 'bed' | 'desk' | 'bathroom' | 'doorway';
  pathEnd: 'bathroom' | 'shelf' | 'doorway' | 'desk' | 'bed';
}

export interface PathState {
  color: 'green' | 'yellow' | 'red';
  waypoints: Array<{ x: number; y: number }>;
  message: string;
  isVisible: boolean;
}

export interface ModeState {
  mode: 'A' | 'B';
  currentView: 'top' | 'pov';
  selectedGoal: string | null;
  activeTool: 'select' | 'place' | 'route';
  furniture: Furniture[];
  room: Room;
  pathState: PathState | null;
  isWalkthroughActive: boolean;
  walkthroughProgress: number;
  selectedFurnitureId: string | null;
}

export type ExperimentMode = 'A' | 'B' | null;
