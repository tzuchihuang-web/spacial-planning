import { Room, Furniture, Goal } from '@/types';

// Studio Cell A - Used in Mode A (baseline)
export const roomA: Room = {
  id: 'studio-a',
  name: 'Studio Cell A',
  width: 12,
  depth: 10,
  height: 9,
  doorway: {
    x: 5,
    y: 0,
    width: 2,
    orientation: 'north',
  },
  bathroom: {
    x: 9,
    y: 7,
    width: 3,
    depth: 3,
  },
};

// Studio Cell B - Used in Mode B (guided)
export const roomB: Room = {
  id: 'studio-b',
  name: 'Studio Cell B',
  width: 11,
  depth: 11,
  height: 9,
  doorway: {
    x: 4,
    y: 0,
    width: 2,
    orientation: 'north',
  },
  bathroom: {
    x: 8,
    y: 7,
    width: 3,
    depth: 4,
  },
};

// Initial furniture for Studio A
export const furnitureA: Furniture[] = [
  {
    id: 'bed-a',
    type: 'bed',
    label: 'Bed',
    x: 1,
    y: 6,
    width: 4,
    depth: 3,
    rotation: 0,
    color: '#8B7355',
  },
  {
    id: 'sofa-a',
    type: 'sofa',
    label: 'Sofa',
    x: 0,
    y: 2,
    width: 1.5,
    depth: 3,
    rotation: 0,
    color: '#5D6D7E',
  },
  {
    id: 'desk-a',
    type: 'desk',
    label: 'Desk',
    x: 6,
    y: 3,
    width: 3,
    depth: 1.5,
    rotation: 0,
    color: '#A0522D',
  },
  {
    id: 'chair-a',
    type: 'chair',
    label: 'Chair',
    x: 7,
    y: 4.5,
    width: 1,
    depth: 1,
    rotation: 0,
    color: '#4A4A4A',
  },
  {
    id: 'table-a',
    type: 'table',
    label: 'Coffee Table',
    x: 2,
    y: 2.5,
    width: 2,
    depth: 1,
    rotation: 0,
    color: '#8B4513',
  },
  {
    id: 'shelf-a',
    type: 'shelf',
    label: 'Shelf',
    x: 6,
    y: 8,
    width: 2,
    depth: 1,
    rotation: 0,
    color: '#CD853F',
  },
];

// Initial furniture for Studio B
export const furnitureB: Furniture[] = [
  {
    id: 'bed-b',
    type: 'bed',
    label: 'Bed',
    x: 0,
    y: 7,
    width: 4,
    depth: 3,
    rotation: 0,
    color: '#8B7355',
  },
  {
    id: 'sofa-b',
    type: 'sofa',
    label: 'Sofa',
    x: 0,
    y: 3,
    width: 1.5,
    depth: 3,
    rotation: 0,
    color: '#5D6D7E',
  },
  {
    id: 'desk-b',
    type: 'desk',
    label: 'Desk',
    x: 5,
    y: 2,
    width: 3,
    depth: 1.5,
    rotation: 0,
    color: '#A0522D',
  },
  {
    id: 'chair-b',
    type: 'chair',
    label: 'Chair',
    x: 6,
    y: 3.5,
    width: 1,
    depth: 1,
    rotation: 0,
    color: '#4A4A4A',
  },
  {
    id: 'dresser-b',
    type: 'dresser',
    label: 'Dresser',
    x: 5,
    y: 8,
    width: 2,
    depth: 1.5,
    rotation: 0,
    color: '#6B4423',
  },
  {
    id: 'shelf-b',
    type: 'shelf',
    label: 'Shelf',
    x: 2,
    y: 0.5,
    width: 2,
    depth: 0.8,
    rotation: 0,
    color: '#CD853F',
  },
];

// Goals for Mode A (display only, no path guidance)
export const goalsA: Goal[] = [
  {
    id: 'goal-a1',
    title: 'Morning Routine',
    description: 'Easy path from bed to bathroom',
    pathStart: 'bed',
    pathEnd: 'bathroom',
  },
  {
    id: 'goal-a2',
    title: 'Work Setup',
    description: 'Comfortable desk access from doorway',
    pathStart: 'doorway',
    pathEnd: 'desk',
  },
  {
    id: 'goal-a3',
    title: 'Night Access',
    description: 'Clear path from bed to exit',
    pathStart: 'bed',
    pathEnd: 'doorway',
  },
];

// Goals for Mode B (with path visualization)
export const goalsB: Goal[] = [
  {
    id: 'goal-b1',
    title: 'Morning Routine',
    description: 'Easy path from bed to bathroom',
    pathStart: 'bed',
    pathEnd: 'bathroom',
  },
  {
    id: 'goal-b2',
    title: 'Work Flow',
    description: 'Quick access from desk to shelf',
    pathStart: 'desk',
    pathEnd: 'shelf',
  },
  {
    id: 'goal-b3',
    title: 'Emergency Exit',
    description: 'Clear path from bed to doorway',
    pathStart: 'bed',
    pathEnd: 'doorway',
  },
];

export function getRoomData(mode: 'A' | 'B') {
  return mode === 'A' ? roomA : roomB;
}

export function getInitialFurniture(mode: 'A' | 'B') {
  return mode === 'A' 
    ? furnitureA.map(f => ({ ...f })) 
    : furnitureB.map(f => ({ ...f }));
}

export function getGoals(mode: 'A' | 'B') {
  return mode === 'A' ? goalsA : goalsB;
}
