import { ResearchEvent, StudyTask, Furniture, Point } from '@/types';

// ============================================
// RESEARCH LOGGING UTILITIES
// Console logging for study data collection
// ============================================

const LOG_PREFIX = '[RESEARCH]';

function formatTimestamp(): string {
  return new Date().toISOString();
}

function log(event: ResearchEvent): void {
  console.log(
    `${LOG_PREFIX} [${formatTimestamp()}] ${event.type}`,
    JSON.stringify(event.data, null, 2)
  );
}

export function logTaskSelected(task: StudyTask): void {
  log({
    timestamp: Date.now(),
    type: 'task_selected',
    data: { task, taskName: task === 'A' ? 'Studio A' : 'Studio B' },
  });
}

export function logFurnitureMoved(
  furniture: Furniture,
  fromPosition: Point,
  toPosition: Point
): void {
  log({
    timestamp: Date.now(),
    type: 'furniture_moved',
    data: {
      furnitureId: furniture.id,
      furnitureType: furniture.type,
      from: fromPosition,
      to: toPosition,
      distance: Math.sqrt(
        (toPosition.x - fromPosition.x) ** 2 + (toPosition.y - fromPosition.y) ** 2
      ),
    },
  });
}

export function logFurnitureRotated(
  furniture: Furniture,
  fromRotation: number,
  toRotation: number
): void {
  log({
    timestamp: Date.now(),
    type: 'furniture_rotated',
    data: {
      furnitureId: furniture.id,
      furnitureType: furniture.type,
      fromRotation,
      toRotation,
    },
  });
}

export function logFurnitureAdded(furniture: Furniture): void {
  log({
    timestamp: Date.now(),
    type: 'furniture_added',
    data: {
      furnitureId: furniture.id,
      furnitureType: furniture.type,
      position: { x: furniture.x, y: furniture.y },
    },
  });
}

export function logFurnitureDeleted(furniture: Furniture): void {
  log({
    timestamp: Date.now(),
    type: 'furniture_deleted',
    data: {
      furnitureId: furniture.id,
      furnitureType: furniture.type,
      position: { x: furniture.x, y: furniture.y },
    },
  });
}

export function logGoalSelected(goalId: string, goalTitle: string): void {
  log({
    timestamp: Date.now(),
    type: 'goal_selected',
    data: { goalId, goalTitle },
  });
}

export function logWalkthroughStarted(goalId: string, goalTitle: string): void {
  log({
    timestamp: Date.now(),
    type: 'walkthrough_started',
    data: { goalId, goalTitle },
  });
}

export function logWalkthroughCompleted(goalId: string, durationMs: number): void {
  log({
    timestamp: Date.now(),
    type: 'walkthrough_completed',
    data: { goalId, durationMs },
  });
}

export function logWalkthroughCancelled(goalId: string, progress: number): void {
  log({
    timestamp: Date.now(),
    type: 'walkthrough_cancelled',
    data: { goalId, progressPercent: Math.round(progress * 100) },
  });
}

export function logViewChanged(fromView: string, toView: string): void {
  log({
    timestamp: Date.now(),
    type: 'view_changed',
    data: { fromView, toView },
  });
}

export function logUndoAction(actionType: string, furnitureId: string): void {
  log({
    timestamp: Date.now(),
    type: 'undo_action',
    data: { actionType, furnitureId },
  });
}
