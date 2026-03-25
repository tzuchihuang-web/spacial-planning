import { Furniture, Room, Goal, PathState, Point, PathLocation, PathStatus } from '@/types';
import { getRotatedDimensions } from './roomData';

// ============================================
// PATH COMPUTATION UTILITIES
// ============================================

// Clearance thresholds (meters)
const CLEARANCE_GREEN = 0.9;   // Comfortable walking space
const CLEARANCE_YELLOW = 0.6;  // Navigable but tight
const CLEARANCE_RED = 0.4;     // Blocked or impassable

// Get the center point for a path location
export function getLocationPoint(
  location: PathLocation,
  furniture: Furniture[],
  room: Room
): Point {
  switch (location) {
    case 'doorway':
      return {
        x: room.doorway.x + room.doorway.width / 2,
        y: 0.3, // Just inside the door
      };
    case 'bathroom':
      return {
        x: room.bathroom.x + room.bathroom.width / 2,
        y: room.bathroom.y - 0.2, // Just outside bathroom
      };
    case 'kitchen':
      return {
        x: room.kitchen.x + room.kitchen.width / 2,
        y: room.kitchen.y + room.kitchen.depth + 0.3,
      };
    default: {
      const item = furniture.find(f => f.type === location);
      if (item) {
        const dims = getRotatedDimensions(item);
        // Return a point at the front/accessible side of furniture
        return {
          x: item.x + dims.width / 2,
          y: item.y + dims.depth + 0.3, // Standing in front
        };
      }
      // Fallback to center of room
      return { x: room.width / 2, y: room.depth / 2 };
    }
  }
}

// Check if a point is inside furniture bounds
function isPointInFurniture(
  point: Point,
  furniture: Furniture,
  padding: number = 0
): boolean {
  const dims = getRotatedDimensions(furniture);
  return (
    point.x >= furniture.x - padding &&
    point.x <= furniture.x + dims.width + padding &&
    point.y >= furniture.y - padding &&
    point.y <= furniture.y + dims.depth + padding
  );
}

// Check if a point is inside a fixed zone
function isPointInFixedZone(
  point: Point,
  room: Room,
  padding: number = 0
): boolean {
  // Check bathroom
  const inBathroom =
    point.x >= room.bathroom.x - padding &&
    point.x <= room.bathroom.x + room.bathroom.width + padding &&
    point.y >= room.bathroom.y - padding &&
    point.y <= room.bathroom.y + room.bathroom.depth + padding;

  // Check kitchen
  const inKitchen =
    point.x >= room.kitchen.x - padding &&
    point.x <= room.kitchen.x + room.kitchen.width + padding &&
    point.y >= room.kitchen.y - padding &&
    point.y <= room.kitchen.y + room.kitchen.depth + padding;

  return inBathroom || inKitchen;
}

// Calculate distance from point to nearest furniture edge
function distanceToFurniture(point: Point, furniture: Furniture): number {
  const dims = getRotatedDimensions(furniture);
  const dx = Math.max(furniture.x - point.x, 0, point.x - (furniture.x + dims.width));
  const dy = Math.max(furniture.y - point.y, 0, point.y - (furniture.y + dims.depth));
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate minimum clearance along a line segment
function calculateSegmentClearance(
  start: Point,
  end: Point,
  furniture: Furniture[],
  room: Room,
  excludeTypes: string[],
  samples: number = 20
): number {
  const relevantFurniture = furniture.filter(f => !excludeTypes.includes(f.type));
  let minClearance = Infinity;

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const point: Point = {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    };

    // Check distance to each furniture piece
    for (const item of relevantFurniture) {
      const dist = distanceToFurniture(point, item);
      minClearance = Math.min(minClearance, dist);
    }

    // Check distance to walls
    const wallClearances = [
      point.x,                    // left wall
      room.width - point.x,      // right wall
      point.y,                    // top wall (north)
      room.depth - point.y,      // bottom wall (south)
    ];
    minClearance = Math.min(minClearance, ...wallClearances);

    // Check distance to fixed zones
    const bathroomClearances = [
      Math.abs(point.x - room.bathroom.x),
      Math.abs(point.x - (room.bathroom.x + room.bathroom.width)),
      Math.abs(point.y - room.bathroom.y),
      Math.abs(point.y - (room.bathroom.y + room.bathroom.depth)),
    ];
    
    if (
      point.x > room.bathroom.x &&
      point.x < room.bathroom.x + room.bathroom.width &&
      point.y > room.bathroom.y &&
      point.y < room.bathroom.y + room.bathroom.depth
    ) {
      minClearance = Math.min(minClearance, Math.min(...bathroomClearances));
    }
  }

  return minClearance;
}

// Check if line segment intersects with furniture
function lineIntersectsFurniture(
  start: Point,
  end: Point,
  furniture: Furniture,
  padding: number = 0.1
): boolean {
  const samples = 20;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const point: Point = {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    };
    if (isPointInFurniture(point, furniture, padding)) {
      return true;
    }
  }
  return false;
}

// Generate waypoints for a path using A* like approach
function generateWaypoints(
  start: Point,
  end: Point,
  furniture: Furniture[],
  room: Room,
  excludeTypes: string[]
): Point[] {
  const relevantFurniture = furniture.filter(f => !excludeTypes.includes(f.type));
  const waypoints: Point[] = [start];

  // Check if direct path is clear
  let directBlocked = false;
  for (const item of relevantFurniture) {
    if (lineIntersectsFurniture(start, end, item, 0.15)) {
      directBlocked = true;
      break;
    }
  }

  if (directBlocked) {
    // Try to find intermediate waypoints
    const candidates: Point[] = [];
    
    // Generate candidate waypoints around furniture
    for (const item of relevantFurniture) {
      const dims = getRotatedDimensions(item);
      const margin = 0.4;
      candidates.push(
        { x: item.x - margin, y: item.y + dims.depth / 2 },           // left
        { x: item.x + dims.width + margin, y: item.y + dims.depth / 2 }, // right
        { x: item.x + dims.width / 2, y: item.y - margin },           // top
        { x: item.x + dims.width / 2, y: item.y + dims.depth + margin }, // bottom
      );
    }

    // Add room center and midpoint as candidates
    candidates.push(
      { x: room.width / 2, y: room.depth / 2 },
      { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    );

    // Filter valid candidates (not in furniture, not out of bounds)
    const validCandidates = candidates.filter(p => {
      if (p.x < 0.3 || p.x > room.width - 0.3 || p.y < 0.3 || p.y > room.depth - 0.3) {
        return false;
      }
      for (const item of relevantFurniture) {
        if (isPointInFurniture(p, item, 0.2)) {
          return false;
        }
      }
      if (isPointInFixedZone(p, room, 0.1)) {
        return false;
      }
      return true;
    });

    // Find best intermediate point
    let bestPoint: Point | null = null;
    let bestScore = Infinity;

    for (const candidate of validCandidates) {
      const toCandidate = !relevantFurniture.some(f => 
        lineIntersectsFurniture(start, candidate, f, 0.1)
      );
      const fromCandidate = !relevantFurniture.some(f => 
        lineIntersectsFurniture(candidate, end, f, 0.1)
      );

      if (toCandidate && fromCandidate) {
        const dist = 
          Math.sqrt((candidate.x - start.x) ** 2 + (candidate.y - start.y) ** 2) +
          Math.sqrt((end.x - candidate.x) ** 2 + (end.y - candidate.y) ** 2);
        
        if (dist < bestScore) {
          bestScore = dist;
          bestPoint = candidate;
        }
      }
    }

    if (bestPoint) {
      waypoints.push(bestPoint);
    }
  }

  waypoints.push(end);
  return waypoints;
}

// Determine path status based on clearance
function getStatusFromClearance(clearance: number): PathStatus {
  if (clearance >= CLEARANCE_GREEN) return 'green';
  if (clearance >= CLEARANCE_YELLOW) return 'yellow';
  return 'red';
}

// Get status message
function getStatusMessage(status: PathStatus, clearance: number): string {
  const clearanceCm = Math.round(clearance * 100);
  switch (status) {
    case 'green':
      return `Clear path (${clearanceCm}cm clearance)`;
    case 'yellow':
      return `Tight path (${clearanceCm}cm clearance) - consider adjusting`;
    case 'red':
      return `Path blocked (${clearanceCm}cm clearance) - furniture in the way`;
  }
}

// Main function to compute path for a goal
export function computePath(
  goal: Goal,
  furniture: Furniture[],
  room: Room
): PathState {
  const startPoint = getLocationPoint(goal.pathStart, furniture, room);
  const endPoint = getLocationPoint(goal.pathEnd, furniture, room);

  // Exclude start/end furniture types from collision detection
  const excludeTypes = [goal.pathStart, goal.pathEnd].filter(
    t => !['doorway', 'bathroom', 'kitchen'].includes(t)
  );

  const waypoints = generateWaypoints(startPoint, endPoint, furniture, room, excludeTypes);

  // Calculate minimum clearance along entire path
  let minClearance = Infinity;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segmentClearance = calculateSegmentClearance(
      waypoints[i],
      waypoints[i + 1],
      furniture,
      room,
      excludeTypes
    );
    minClearance = Math.min(minClearance, segmentClearance);
  }

  // Check for direct collisions
  for (let i = 0; i < waypoints.length - 1; i++) {
    for (const item of furniture) {
      if (excludeTypes.includes(item.type)) continue;
      if (lineIntersectsFurniture(waypoints[i], waypoints[i + 1], item, 0.05)) {
        minClearance = 0;
        break;
      }
    }
  }

  const status = getStatusFromClearance(minClearance);
  const message = getStatusMessage(status, minClearance);

  return {
    goalId: goal.id,
    status,
    waypoints,
    minClearance,
    message,
    isVisible: true,
  };
}

// Calculate total path length
export function calculatePathLength(waypoints: Point[]): number {
  let length = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1].x - waypoints[i].x;
    const dy = waypoints[i + 1].y - waypoints[i].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

// Get position and angle along path at given progress (0-1)
export function getPositionAlongPath(
  waypoints: Point[],
  progress: number
): Point & { angle: number } {
  if (waypoints.length < 2) {
    return { x: waypoints[0]?.x || 0, y: waypoints[0]?.y || 0, angle: 0 };
  }

  const totalLength = calculatePathLength(waypoints);
  const targetDistance = totalLength * Math.min(1, Math.max(0, progress));

  let currentDistance = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1].x - waypoints[i].x;
    const dy = waypoints[i + 1].y - waypoints[i].y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    if (currentDistance + segmentLength >= targetDistance) {
      const segmentProgress = segmentLength > 0 
        ? (targetDistance - currentDistance) / segmentLength 
        : 0;
      const angle = Math.atan2(dy, dx);
      return {
        x: waypoints[i].x + dx * segmentProgress,
        y: waypoints[i].y + dy * segmentProgress,
        angle,
      };
    }

    currentDistance += segmentLength;
  }

  // Return end point
  const lastIdx = waypoints.length - 1;
  const dx = waypoints[lastIdx].x - waypoints[lastIdx - 1].x;
  const dy = waypoints[lastIdx].y - waypoints[lastIdx - 1].y;
  return {
    x: waypoints[lastIdx].x,
    y: waypoints[lastIdx].y,
    angle: Math.atan2(dy, dx),
  };
}

// Compute all paths for a task
export function computeAllPaths(
  goals: Goal[],
  furniture: Furniture[],
  room: Room
): PathState[] {
  return goals.map(goal => computePath(goal, furniture, room));
}
