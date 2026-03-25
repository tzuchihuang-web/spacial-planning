import { Room, Furniture, Goal, FurnitureTemplate, StudyTask } from '@/types';

// ============================================
// FURNITURE TEMPLATES - Realistic proportions (meters)
// ============================================

export const furnitureTemplates: FurnitureTemplate[] = [
  { type: 'bed', label: 'Bed', width: 2.0, depth: 1.5, height: 0.5, color: '#8B7355' },
  { type: 'desk', label: 'Desk', width: 1.2, depth: 0.6, height: 0.75, color: '#A0522D' },
  { type: 'chair', label: 'Chair', width: 0.5, depth: 0.5, height: 0.9, color: '#4A4A4A' },
  { type: 'sofa', label: 'Sofa', width: 1.8, depth: 0.85, height: 0.85, color: '#5D6D7E' },
  { type: 'coffeeTable', label: 'Coffee Table', width: 1.0, depth: 0.5, height: 0.45, color: '#8B4513' },
  { type: 'shelf', label: 'Bookshelf', width: 0.8, depth: 0.35, height: 1.8, color: '#CD853F' },
  { type: 'dresser', label: 'Dresser', width: 1.0, depth: 0.5, height: 0.8, color: '#6B4423' },
  { type: 'wardrobe', label: 'Wardrobe', width: 1.2, depth: 0.6, height: 2.0, color: '#8B6914' },
  { type: 'nightstand', label: 'Nightstand', width: 0.45, depth: 0.4, height: 0.55, color: '#A0522D' },
  { type: 'armchair', label: 'Armchair', width: 0.8, depth: 0.8, height: 0.9, color: '#708090' },
];

// ============================================
// STUDIO A - Work from home + visitor comfort
// Room: 4.5m x 4.0m (realistic small studio)
// ============================================

export const roomA: Room = {
  id: 'studio-a',
  name: 'Studio A',
  width: 4.5,
  depth: 4.0,
  height: 2.7,
  doorway: {
    x: 1.5,
    y: 0,
    width: 0.9,
    orientation: 'north',
  },
  bathroom: {
    x: 3.3,
    y: 2.8,
    width: 1.2,
    depth: 1.2,
  },
  kitchen: {
    x: 0,
    y: 0,
    width: 1.2,
    depth: 0.6,
  },
};

export const furnitureA: Furniture[] = [
  {
    id: 'bed-a',
    type: 'bed',
    label: 'Bed',
    x: 0.2,
    y: 2.3,
    width: 2.0,
    depth: 1.5,
    height: 0.5,
    rotation: 0,
    color: '#8B7355',
  },
  {
    id: 'desk-a',
    type: 'desk',
    label: 'Desk',
    x: 2.5,
    y: 0.8,
    width: 1.2,
    depth: 0.6,
    height: 0.75,
    rotation: 0,
    color: '#A0522D',
  },
  {
    id: 'chair-a',
    type: 'chair',
    label: 'Chair',
    x: 2.85,
    y: 1.5,
    width: 0.5,
    depth: 0.5,
    height: 0.9,
    rotation: 0,
    color: '#4A4A4A',
  },
  {
    id: 'sofa-a',
    type: 'sofa',
    label: 'Sofa',
    x: 0.2,
    y: 0.8,
    width: 1.8,
    depth: 0.85,
    height: 0.85,
    rotation: 90,
    color: '#5D6D7E',
  },
  {
    id: 'coffeetable-a',
    type: 'coffeeTable',
    label: 'Coffee Table',
    x: 1.3,
    y: 1.2,
    width: 1.0,
    depth: 0.5,
    height: 0.45,
    rotation: 0,
    color: '#8B4513',
  },
  {
    id: 'shelf-a',
    type: 'shelf',
    label: 'Bookshelf',
    x: 4.0,
    y: 1.0,
    width: 0.35,
    depth: 0.8,
    height: 1.8,
    rotation: 90,
    color: '#CD853F',
  },
];

// Goals for Studio A - displayed but no path guidance
export const goalsA: Goal[] = [
  {
    id: 'goal-a1',
    title: 'Workspace',
    description: 'Create a comfortable desk area for working from home',
    pathStart: 'doorway',
    pathEnd: 'desk',
  },
  {
    id: 'goal-a2',
    title: 'Social Space',
    description: 'Arrange furniture so friends can move around comfortably when visiting',
    pathStart: 'doorway',
    pathEnd: 'sofa',
  },
];

// ============================================
// STUDIO B - Night bathroom access + work flow
// Room: 4.2m x 4.2m (slightly different layout)
// ============================================

export const roomB: Room = {
  id: 'studio-b',
  name: 'Studio B',
  width: 4.2,
  depth: 4.2,
  height: 2.7,
  doorway: {
    x: 1.5,
    y: 0,
    width: 0.9,
    orientation: 'north',
  },
  bathroom: {
    x: 3.0,
    y: 3.0,
    width: 1.2,
    depth: 1.2,
  },
  kitchen: {
    x: 0,
    y: 0,
    width: 1.2,
    depth: 0.6,
  },
};

export const furnitureB: Furniture[] = [
  {
    id: 'bed-b',
    type: 'bed',
    label: 'Bed',
    x: 0.2,
    y: 2.5,
    width: 2.0,
    depth: 1.5,
    height: 0.5,
    rotation: 0,
    color: '#8B7355',
  },
  {
    id: 'desk-b',
    type: 'desk',
    label: 'Desk',
    x: 2.8,
    y: 0.8,
    width: 1.2,
    depth: 0.6,
    height: 0.75,
    rotation: 0,
    color: '#A0522D',
  },
  {
    id: 'chair-b',
    type: 'chair',
    label: 'Chair',
    x: 3.15,
    y: 1.5,
    width: 0.5,
    depth: 0.5,
    height: 0.9,
    rotation: 0,
    color: '#4A4A4A',
  },
  {
    id: 'shelf-b',
    type: 'shelf',
    label: 'Bookshelf',
    x: 2.5,
    y: 2.0,
    width: 0.8,
    depth: 0.35,
    height: 1.8,
    rotation: 0,
    color: '#CD853F',
  },
  {
    id: 'nightstand-b',
    type: 'nightstand',
    label: 'Nightstand',
    x: 2.3,
    y: 2.8,
    width: 0.45,
    depth: 0.4,
    height: 0.55,
    rotation: 0,
    color: '#A0522D',
  },
];

// Goals for Studio B - with path visualization
export const goalsB: Goal[] = [
  {
    id: 'goal-b1',
    title: 'Night Path',
    description: 'Design a clear path from bed to bathroom for nighttime access',
    pathStart: 'bed',
    pathEnd: 'bathroom',
  },
  {
    id: 'goal-b2',
    title: 'Work Flow',
    description: 'Arrange desk and shelves so movement between them feels smooth',
    pathStart: 'desk',
    pathEnd: 'shelf',
  },
];

// ============================================
// DATA ACCESS FUNCTIONS
// ============================================

export function getRoomData(task: StudyTask): Room {
  return task === 'A' ? { ...roomA } : { ...roomB };
}

export function getInitialFurniture(task: StudyTask): Furniture[] {
  const source = task === 'A' ? furnitureA : furnitureB;
  return source.map(f => ({ ...f }));
}

export function getGoals(task: StudyTask): Goal[] {
  return task === 'A' ? [...goalsA] : [...goalsB];
}

export function getFurnitureTemplate(type: string): FurnitureTemplate | undefined {
  return furnitureTemplates.find(t => t.type === type);
}

export function createFurnitureFromTemplate(
  template: FurnitureTemplate,
  x: number,
  y: number
): Furniture {
  return {
    id: `${template.type}-${Date.now()}`,
    type: template.type,
    label: template.label,
    x,
    y,
    width: template.width,
    depth: template.depth,
    height: template.height,
    rotation: 0,
    color: template.color,
  };
}

// Check if position is inside a fixed zone
export function isInFixedZone(
  x: number,
  y: number,
  width: number,
  depth: number,
  room: Room
): boolean {
  const padding = 0.05; // small buffer
  
  // Check bathroom
  const inBathroom = !(
    x + width <= room.bathroom.x - padding ||
    x >= room.bathroom.x + room.bathroom.width + padding ||
    y + depth <= room.bathroom.y - padding ||
    y >= room.bathroom.y + room.bathroom.depth + padding
  );
  
  // Check kitchen
  const inKitchen = !(
    x + width <= room.kitchen.x - padding ||
    x >= room.kitchen.x + room.kitchen.width + padding ||
    y + depth <= room.kitchen.y - padding ||
    y >= room.kitchen.y + room.kitchen.depth + padding
  );
  
  return inBathroom || inKitchen;
}

// Check if position is out of room bounds
export function isOutOfBounds(
  x: number,
  y: number,
  width: number,
  depth: number,
  room: Room
): boolean {
  return x < 0 || y < 0 || x + width > room.width || y + depth > room.depth;
}

// Check if furniture overlaps with another
export function furnitureOverlaps(
  f1: { x: number; y: number; width: number; depth: number },
  f2: { x: number; y: number; width: number; depth: number },
  padding: number = 0.05
): boolean {
  return !(
    f1.x + f1.width + padding <= f2.x ||
    f1.x >= f2.x + f2.width + padding ||
    f1.y + f1.depth + padding <= f2.y ||
    f1.y >= f2.y + f2.depth + padding
  );
}

// Get effective dimensions considering rotation
export function getRotatedDimensions(furniture: Furniture): { width: number; depth: number } {
  if (furniture.rotation === 90 || furniture.rotation === 270) {
    return { width: furniture.depth, depth: furniture.width };
  }
  return { width: furniture.width, depth: furniture.depth };
}
