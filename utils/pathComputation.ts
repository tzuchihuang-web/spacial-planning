import { Furniture, Room, Goal, PathState } from '@/types';

interface Point {
  x: number;
  y: number;
}

// Get the center point for path start/end locations
export function getLocationPoint(
  location: 'bed' | 'desk' | 'bathroom' | 'doorway' | 'shelf',
  furniture: Furniture[],
  room: Room
): Point {
  if (location === 'doorway') {
    return {
      x: room.doorway.x + room.doorway.width / 2,
      y: room.doorway.y + 0.5,
    };
  }

  if (location === 'bathroom') {
    return {
      x: room.bathroom.x + room.bathroom.width / 2,
      y: room.bathroom.y + room.bathroom.depth / 2,
    };
  }

  const item = furniture.find(f => f.type === location);
  if (item) {
    return {
      x: item.x + item.width / 2,
      y: item.y + item.depth / 2,
    };
  }

  // Fallback to center of room
  return { x: room.width / 2, y: room.depth / 2 };
}

// Check if a point is inside a furniture item (with padding)
function isPointInFurniture(point: Point, furniture: Furniture, padding: number = 0.3): boolean {
  return (
    point.x >= furniture.x - padding &&
    point.x <= furniture.x + furniture.width + padding &&
    point.y >= furniture.y - padding &&
    point.y <= furniture.y + furniture.depth + padding
  );
}

// Check if a line segment intersects with furniture
function lineIntersectsFurniture(
  start: Point,
  end: Point,
  furniture: Furniture,
  padding: number = 0.4
): boolean {
  // Check multiple points along the line
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    };
    if (isPointInFurniture(point, furniture, padding)) {
      return true;
    }
  }
  return false;
}

// Calculate path clearance level
function calculateClearance(
  waypoints: Point[],
  furniture: Furniture[],
  excludeTypes: string[]
): 'green' | 'yellow' | 'red' {
  const relevantFurniture = furniture.filter(f => !excludeTypes.includes(f.type));
  
  let minClearance = Infinity;
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    
    for (const item of relevantFurniture) {
      // Check if path directly intersects
      if (lineIntersectsFurniture(start, end, item, 0.2)) {
        return 'red';
      }
      
      // Calculate minimum distance to furniture
      const steps = 10;
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const point = {
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        };
        
        // Distance to furniture edges
        const dx = Math.max(item.x - point.x, 0, point.x - (item.x + item.width));
        const dy = Math.max(item.y - point.y, 0, point.y - (item.y + item.depth));
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        minClearance = Math.min(minClearance, distance);
      }
    }
  }
  
  if (minClearance < 0.5) {
    return 'red';
  } else if (minClearance < 1.2) {
    return 'yellow';
  }
  return 'green';
}

// Generate waypoints for a path (simple direct path with optional midpoint)
function generateWaypoints(start: Point, end: Point, furniture: Furniture[]): Point[] {
  const waypoints: Point[] = [start];
  
  // Check if direct path is blocked
  const directBlocked = furniture.some(f => 
    lineIntersectsFurniture(start, end, f, 0.3)
  );
  
  if (directBlocked) {
    // Try to find a midpoint that avoids furniture
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Try different offset positions
    const offsets = [
      { x: 0, y: -2 },
      { x: 0, y: 2 },
      { x: -2, y: 0 },
      { x: 2, y: 0 },
      { x: -1.5, y: -1.5 },
      { x: 1.5, y: -1.5 },
      { x: -1.5, y: 1.5 },
      { x: 1.5, y: 1.5 },
    ];
    
    for (const offset of offsets) {
      const midpoint = { x: midX + offset.x, y: midY + offset.y };
      const firstHalfBlocked = furniture.some(f => 
        lineIntersectsFurniture(start, midpoint, f, 0.2)
      );
      const secondHalfBlocked = furniture.some(f => 
        lineIntersectsFurniture(midpoint, end, f, 0.2)
      );
      
      if (!firstHalfBlocked && !secondHalfBlocked) {
        waypoints.push(midpoint);
        break;
      }
    }
  }
  
  waypoints.push(end);
  return waypoints;
}

// Get message based on path color
function getPathMessage(color: 'green' | 'yellow' | 'red'): string {
  switch (color) {
    case 'green':
      return 'Clear path with good clearance';
    case 'yellow':
      return 'Path is tight - consider adjusting furniture';
    case 'red':
      return 'Path blocked - furniture is in the way';
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
    t => t !== 'doorway' && t !== 'bathroom'
  );
  
  const waypoints = generateWaypoints(startPoint, endPoint, furniture);
  const color = calculateClearance(waypoints, furniture, excludeTypes);
  const message = getPathMessage(color);
  
  return {
    color,
    waypoints,
    message,
    isVisible: true,
  };
}

// Calculate path length for walkthrough timing
export function calculatePathLength(waypoints: Point[]): number {
  let length = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1].x - waypoints[i].x;
    const dy = waypoints[i + 1].y - waypoints[i].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

// Get position along path at given progress (0-1)
export function getPositionAlongPath(waypoints: Point[], progress: number): Point & { angle: number } {
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
      const segmentProgress = (targetDistance - currentDistance) / segmentLength;
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
