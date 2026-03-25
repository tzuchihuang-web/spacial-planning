'use client';

import { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Canvas } from './Canvas';
import { POVView } from './POVView';
import { getRoomData, getInitialFurniture, getGoals } from '@/utils/roomData';
import { computePath } from '@/utils/pathComputation';
import type { ModeState, Furniture, Goal, PathState } from '@/types';

interface RoomPlannerProps {
  mode: 'A' | 'B';
  onReset: () => void;
}

export function RoomPlanner({ mode, onReset }: RoomPlannerProps) {
  const [state, setState] = useState<ModeState>(() => ({
    mode,
    currentView: 'top',
    selectedGoal: null,
    activeTool: 'select',
    furniture: getInitialFurniture(mode),
    room: getRoomData(mode),
    pathState: null,
    isWalkthroughActive: false,
    walkthroughProgress: 0,
    selectedFurnitureId: null,
  }));

  const goals = getGoals(mode);

  // Recompute path when furniture changes (Mode B only)
  useEffect(() => {
    if (mode === 'B' && state.selectedGoal) {
      const goal = goals.find(g => g.id === state.selectedGoal);
      if (goal) {
        const newPath = computePath(goal, state.furniture, state.room);
        setState(prev => ({ ...prev, pathState: newPath }));
      }
    }
  }, [mode, state.furniture, state.selectedGoal, state.room, goals]);

  const handleFurnitureMove = useCallback((id: string, x: number, y: number) => {
    console.log(`[Research] Furniture moved: ${id} to (${x.toFixed(2)}, ${y.toFixed(2)})`);
    setState(prev => ({
      ...prev,
      furniture: prev.furniture.map(f =>
        f.id === id ? { ...f, x, y } : f
      ),
    }));
  }, []);

  const handleFurnitureSelect = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      selectedFurnitureId: id,
    }));
  }, []);

  const handleGoalSelect = useCallback((goalId: string | null) => {
    console.log(`[Research] Goal selected: ${goalId}`);
    
    if (mode === 'B' && goalId) {
      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        const newPath = computePath(goal, state.furniture, state.room);
        setState(prev => ({
          ...prev,
          selectedGoal: goalId,
          pathState: newPath,
        }));
        return;
      }
    }

    setState(prev => ({
      ...prev,
      selectedGoal: goalId,
      pathState: goalId ? prev.pathState : null,
    }));
  }, [mode, goals, state.furniture, state.room]);

  const handleToolChange = useCallback((tool: 'select' | 'place' | 'route') => {
    setState(prev => ({ ...prev, activeTool: tool }));
  }, []);

  const handleViewChange = useCallback((view: 'top' | 'pov') => {
    console.log(`[Research] View changed to: ${view}`);
    setState(prev => ({
      ...prev,
      currentView: view,
      isWalkthroughActive: view === 'pov' && mode === 'B' && !!prev.pathState,
      walkthroughProgress: 0,
    }));
  }, [mode]);

  const handleWalkthroughStart = useCallback(() => {
    if (mode === 'B' && state.pathState) {
      console.log(`[Research] Walkthrough started`);
      setState(prev => ({
        ...prev,
        currentView: 'pov',
        isWalkthroughActive: true,
        walkthroughProgress: 0,
      }));
    }
  }, [mode, state.pathState]);

  const handleWalkthroughEnd = useCallback(() => {
    console.log(`[Research] Walkthrough ended`);
    setState(prev => ({
      ...prev,
      isWalkthroughActive: false,
      currentView: 'top',
    }));
  }, []);

  const handleWalkthroughProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, walkthroughProgress: progress }));
  }, []);

  const handleResetRoom = useCallback(() => {
    console.log(`[Research] Room reset`);
    setState(prev => ({
      ...prev,
      furniture: getInitialFurniture(mode),
      selectedGoal: null,
      pathState: null,
      selectedFurnitureId: null,
    }));
  }, [mode]);

  const handleRoomDimensionChange = useCallback((dimension: 'width' | 'depth' | 'height', value: number) => {
    setState(prev => ({
      ...prev,
      room: {
        ...prev.room,
        [dimension]: value,
      },
    }));
  }, []);

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <Sidebar
        mode={mode}
        goals={goals}
        selectedGoal={state.selectedGoal}
        activeTool={state.activeTool}
        currentView={state.currentView}
        room={state.room}
        pathState={state.pathState}
        onGoalSelect={handleGoalSelect}
        onToolChange={handleToolChange}
        onViewChange={handleViewChange}
        onWalkthroughStart={handleWalkthroughStart}
        onResetRoom={handleResetRoom}
        onReset={onReset}
        onRoomDimensionChange={handleRoomDimensionChange}
      />
      
      <main className="flex-1 relative">
        {state.currentView === 'top' ? (
          <Canvas
            room={state.room}
            furniture={state.furniture}
            pathState={mode === 'B' ? state.pathState : null}
            selectedFurnitureId={state.selectedFurnitureId}
            activeTool={state.activeTool}
            onFurnitureMove={handleFurnitureMove}
            onFurnitureSelect={handleFurnitureSelect}
          />
        ) : (
          <POVView
            room={state.room}
            furniture={state.furniture}
            pathState={state.pathState}
            isWalkthroughActive={state.isWalkthroughActive}
            walkthroughProgress={state.walkthroughProgress}
            onWalkthroughProgress={handleWalkthroughProgress}
            onWalkthroughEnd={handleWalkthroughEnd}
          />
        )}
        
        {/* Mode indicator */}
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-card border border-border rounded-lg shadow-sm">
          <span className="text-sm font-medium text-muted-foreground">Mode </span>
          <span className="text-sm font-bold text-foreground">{mode}</span>
        </div>
      </main>
    </div>
  );
}
