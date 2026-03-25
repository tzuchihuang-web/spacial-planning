'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Canvas } from './Canvas';
import { POVView } from './POVView';
import { AddFurniturePanel } from './AddFurniturePanel';
import { getRoomData, getInitialFurniture, getGoals, createFurnitureFromTemplate, furnitureTemplates, isInFixedZone, isOutOfBounds, furnitureOverlaps, getRotatedDimensions } from '@/utils/roomData';
import { computeAllPaths } from '@/utils/pathComputation';
import { logFurnitureMoved, logFurnitureRotated, logFurnitureAdded, logFurnitureDeleted, logGoalSelected, logWalkthroughStarted, logWalkthroughCompleted, logWalkthroughCancelled, logViewChanged, logUndoAction } from '@/utils/researchLogger';
import type { StudyTask, ViewMode, ActiveTool, Furniture, Goal, PathState, UndoAction, Room } from '@/types';

interface RoomPlannerProps {
  task: StudyTask;
  onBack: () => void;
}

export function RoomPlanner({ task, onBack }: RoomPlannerProps) {
  const [room] = useState<Room>(() => getRoomData(task));
  const [furniture, setFurniture] = useState<Furniture[]>(() => getInitialFurniture(task));
  const [goals] = useState<Goal[]>(() => getGoals(task));
  const [pathStates, setPathStates] = useState<PathState[]>([]);
  
  const [currentView, setCurrentView] = useState<ViewMode>('top');
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  
  const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);
  const [walkthroughProgress, setWalkthroughProgress] = useState(0);
  const walkthroughStartTime = useRef<number>(0);
  
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Compute paths when furniture changes (Mode B only)
  useEffect(() => {
    if (task === 'B') {
      const newPaths = computeAllPaths(goals, furniture, room);
      setPathStates(newPaths);
    }
  }, [task, furniture, room, goals]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFurnitureId(null);
        setShowAddPanel(false);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedFurnitureId) {
          handleDeleteFurniture(selectedFurnitureId);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedFurnitureId) {
          handleRotateFurniture(selectedFurnitureId);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFurnitureId, undoStack]);

  const pushUndo = useCallback((action: UndoAction) => {
    setUndoStack(prev => [...prev.slice(-9), action]); // Keep last 10
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    
    logUndoAction(lastAction.type, lastAction.furnitureId);

    switch (lastAction.type) {
      case 'move':
      case 'rotate':
        if (lastAction.previousState) {
          setFurniture(prev => 
            prev.map(f => f.id === lastAction.furnitureId ? lastAction.previousState! : f)
          );
        }
        break;
      case 'add':
        setFurniture(prev => prev.filter(f => f.id !== lastAction.furnitureId));
        break;
      case 'delete':
        if (lastAction.previousState) {
          setFurniture(prev => [...prev, lastAction.previousState!]);
        }
        break;
    }
  }, [undoStack]);

  const handleFurnitureMove = useCallback((id: string, x: number, y: number) => {
    const item = furniture.find(f => f.id === id);
    if (!item) return;

    const dims = getRotatedDimensions(item);
    
    // Validate position
    if (isOutOfBounds(x, y, dims.width, dims.depth, room)) return;
    if (isInFixedZone(x, y, dims.width, dims.depth, room)) return;
    
    // Check overlap with other furniture
    const otherFurniture = furniture.filter(f => f.id !== id);
    const wouldOverlap = otherFurniture.some(f => {
      const fDims = getRotatedDimensions(f);
      return furnitureOverlaps(
        { x, y, width: dims.width, depth: dims.depth },
        { x: f.x, y: f.y, width: fDims.width, depth: fDims.depth }
      );
    });
    if (wouldOverlap) return;

    const previousState = { ...item };
    
    logFurnitureMoved(item, { x: item.x, y: item.y }, { x, y });
    
    pushUndo({
      type: 'move',
      furnitureId: id,
      previousState,
      newState: { ...item, x, y },
    });

    setFurniture(prev => prev.map(f => f.id === id ? { ...f, x, y } : f));
  }, [furniture, room, pushUndo]);

  const handleFurnitureSelect = useCallback((id: string | null) => {
    setSelectedFurnitureId(id);
  }, []);

  const handleRotateFurniture = useCallback((id: string) => {
    const item = furniture.find(f => f.id === id);
    if (!item) return;

    const previousState = { ...item };
    const newRotation = (item.rotation + 90) % 360;
    
    // Check if rotated furniture fits
    const newDims = newRotation === 90 || newRotation === 270 
      ? { width: item.depth, depth: item.width }
      : { width: item.width, depth: item.depth };
    
    if (isOutOfBounds(item.x, item.y, newDims.width, newDims.depth, room)) return;
    if (isInFixedZone(item.x, item.y, newDims.width, newDims.depth, room)) return;

    logFurnitureRotated(item, item.rotation, newRotation);

    pushUndo({
      type: 'rotate',
      furnitureId: id,
      previousState,
      newState: { ...item, rotation: newRotation },
    });

    setFurniture(prev => prev.map(f => 
      f.id === id ? { ...f, rotation: newRotation } : f
    ));
  }, [furniture, room, pushUndo]);

  const handleDeleteFurniture = useCallback((id: string) => {
    const item = furniture.find(f => f.id === id);
    if (!item) return;

    logFurnitureDeleted(item);

    pushUndo({
      type: 'delete',
      furnitureId: id,
      previousState: { ...item },
      newState: null,
    });

    setFurniture(prev => prev.filter(f => f.id !== id));
    setSelectedFurnitureId(null);
  }, [furniture, pushUndo]);

  const handleAddFurniture = useCallback((type: string) => {
    const template = furnitureTemplates.find(t => t.type === type);
    if (!template) return;

    // Find a valid position
    let x = 1;
    let y = 1;
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      if (
        !isOutOfBounds(x, y, template.width, template.depth, room) &&
        !isInFixedZone(x, y, template.width, template.depth, room)
      ) {
        const overlap = furniture.some(f => {
          const dims = getRotatedDimensions(f);
          return furnitureOverlaps(
            { x, y, width: template.width, depth: template.depth },
            { x: f.x, y: f.y, width: dims.width, depth: dims.depth },
            0.1
          );
        });
        if (!overlap) break;
      }
      x = Math.random() * (room.width - template.width - 0.5) + 0.25;
      y = Math.random() * (room.depth - template.depth - 0.5) + 0.25;
      attempts++;
    }

    const newFurniture = createFurnitureFromTemplate(template, x, y);
    
    logFurnitureAdded(newFurniture);

    pushUndo({
      type: 'add',
      furnitureId: newFurniture.id,
      previousState: null,
      newState: newFurniture,
    });

    setFurniture(prev => [...prev, newFurniture]);
    setSelectedFurnitureId(newFurniture.id);
    setShowAddPanel(false);
  }, [furniture, room, pushUndo]);

  const handleGoalSelect = useCallback((goalId: string | null) => {
    if (goalId) {
      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        logGoalSelected(goalId, goal.title);
      }
    }
    setSelectedGoalId(goalId);
  }, [goals]);

  const handleViewChange = useCallback((view: ViewMode) => {
    logViewChanged(currentView, view);
    setCurrentView(view);
    if (view !== 'pov') {
      setIsWalkthroughActive(false);
    }
  }, [currentView]);

  const handleWalkthroughStart = useCallback(() => {
    if (task !== 'B' || !selectedGoalId) return;
    
    const goal = goals.find(g => g.id === selectedGoalId);
    if (goal) {
      logWalkthroughStarted(selectedGoalId, goal.title);
    }
    
    walkthroughStartTime.current = Date.now();
    setCurrentView('pov');
    setIsWalkthroughActive(true);
    setWalkthroughProgress(0);
  }, [task, selectedGoalId, goals]);

  const handleWalkthroughEnd = useCallback(() => {
    const duration = Date.now() - walkthroughStartTime.current;
    
    if (walkthroughProgress >= 0.95 && selectedGoalId) {
      logWalkthroughCompleted(selectedGoalId, duration);
    } else if (selectedGoalId) {
      logWalkthroughCancelled(selectedGoalId, walkthroughProgress);
    }
    
    setIsWalkthroughActive(false);
    setCurrentView('top');
  }, [walkthroughProgress, selectedGoalId]);

  const handleWalkthroughProgress = useCallback((progress: number) => {
    setWalkthroughProgress(progress);
  }, []);

  const handleResetRoom = useCallback(() => {
    setFurniture(getInitialFurniture(task));
    setSelectedFurnitureId(null);
    setSelectedGoalId(null);
    setUndoStack([]);
  }, [task]);

  const handleToolChange = useCallback((tool: ActiveTool) => {
    setActiveTool(tool);
    if (tool === 'add') {
      setShowAddPanel(true);
    } else {
      setShowAddPanel(false);
    }
  }, []);

  const selectedFurniture = furniture.find(f => f.id === selectedFurnitureId) || null;
  const selectedPath = task === 'B' && selectedGoalId 
    ? pathStates.find(p => p.goalId === selectedGoalId) || null
    : null;

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <Sidebar
        task={task}
        goals={goals}
        pathStates={task === 'B' ? pathStates : []}
        selectedGoalId={selectedGoalId}
        activeTool={activeTool}
        currentView={currentView}
        selectedFurniture={selectedFurniture}
        undoCount={undoStack.length}
        onGoalSelect={handleGoalSelect}
        onToolChange={handleToolChange}
        onViewChange={handleViewChange}
        onWalkthroughStart={handleWalkthroughStart}
        onRotateFurniture={() => selectedFurnitureId && handleRotateFurniture(selectedFurnitureId)}
        onDeleteFurniture={() => selectedFurnitureId && handleDeleteFurniture(selectedFurnitureId)}
        onUndo={handleUndo}
        onResetRoom={handleResetRoom}
        onBack={onBack}
      />
      
      <main className="flex-1 relative">
        {currentView === 'pov' ? (
          <POVView
            room={room}
            furniture={furniture}
            pathState={selectedPath}
            isWalkthroughActive={isWalkthroughActive}
            walkthroughProgress={walkthroughProgress}
            onWalkthroughProgress={handleWalkthroughProgress}
            onWalkthroughEnd={handleWalkthroughEnd}
          />
        ) : (
          <Canvas
            room={room}
            furniture={furniture}
            pathState={selectedPath}
            selectedFurnitureId={selectedFurnitureId}
            activeTool={activeTool}
            currentView={currentView}
            onFurnitureMove={handleFurnitureMove}
            onFurnitureSelect={handleFurnitureSelect}
          />
        )}
        
        {/* Task indicator */}
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-card border border-border rounded-lg shadow-sm">
          <span className="text-sm text-muted-foreground">Studio </span>
          <span className="text-sm font-semibold text-foreground">{task}</span>
        </div>

        {/* Add Furniture Panel */}
        {showAddPanel && (
          <AddFurniturePanel
            onAddFurniture={handleAddFurniture}
            onClose={() => setShowAddPanel(false)}
          />
        )}
      </main>
    </div>
  );
}
