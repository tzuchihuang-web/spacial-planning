// ============================================
// SPATIAL PLANNING STUDY PROTOTYPE - TYPES
// ============================================

export interface Room {
  id: string;
  name: string;
  width: number;  // meters
  depth: number;  // meters
  height: number; // meters
  doorway: {
    x: number;
    y: number;
    width: number;
    orientation: 'north' | 'south' | 'east' | 'west';
  };
  bathroom: FixedZone;
  kitchen: FixedZone;
}

export interface FixedZone {
  x: number;
  y: number;
  width: number;
  depth: number;
}

export type FurnitureType = 
  | 'bed' 
  | 'sofa' 
  | 'desk' 
  | 'chair' 
  | 'coffeeTable' 
  | 'shelf' 
  | 'dresser'
  | 'wardrobe'
  | 'nightstand'
  | 'armchair';

export interface Furniture {
  id: string;
  type: FurnitureType;
  label: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  rotation: number; // degrees: 0, 90, 180, 270
  color: string;
}

export interface FurnitureTemplate {
  type: FurnitureType;
  label: string;
  width: number;
  depth: number;
  height: number;
  color: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  pathStart: PathLocation;
  pathEnd: PathLocation;
}

export type PathLocation = 
  | 'bed' 
  | 'desk' 
  | 'bathroom' 
  | 'doorway' 
  | 'shelf' 
  | 'sofa'
  | 'kitchen';

export type PathStatus = 'green' | 'yellow' | 'red';

export interface PathState {
  goalId: string;
  status: PathStatus;
  waypoints: Point[];
  minClearance: number; // meters
  message: string;
  isVisible: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Point3D extends Point {
  z: number;
}

export type ViewMode = 'top' | '3d' | 'pov';

export type ActiveTool = 'select' | 'move' | 'rotate' | 'delete' | 'add';

export type StudyTask = 'A' | 'B';

export interface UndoAction {
  type: 'move' | 'rotate' | 'add' | 'delete';
  furnitureId: string;
  previousState: Furniture | null;
  newState: Furniture | null;
}

export interface PlannerState {
  task: StudyTask;
  currentView: ViewMode;
  selectedGoalId: string | null;
  activeTool: ActiveTool;
  furniture: Furniture[];
  room: Room;
  pathStates: PathState[];
  isWalkthroughActive: boolean;
  walkthroughProgress: number;
  walkthroughGoalId: string | null;
  selectedFurnitureId: string | null;
  undoStack: UndoAction[];
  showAddPanel: boolean;
}

// Research logging types
export interface ResearchEvent {
  timestamp: number;
  type: 
    | 'task_selected'
    | 'furniture_moved'
    | 'furniture_rotated'
    | 'furniture_added'
    | 'furniture_deleted'
    | 'goal_selected'
    | 'walkthrough_started'
    | 'walkthrough_completed'
    | 'walkthrough_cancelled'
    | 'view_changed'
    | 'undo_action';
  data: Record<string, unknown>;
}

// Camera state for 3D view
export interface CameraState {
  rotationX: number; // pitch
  rotationY: number; // yaw
  zoom: number;
  panX: number;
  panY: number;
}
