'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { getRotatedDimensions } from '@/utils/roomData';
import type { Room, Furniture, PathState, ViewMode, ActiveTool } from '@/types';

interface CanvasProps {
  room: Room;
  furniture: Furniture[];
  pathState: PathState | null;
  selectedFurnitureId: string | null;
  activeTool: ActiveTool;
  currentView: ViewMode;
  onFurnitureMove: (id: string, x: number, y: number) => void;
  onFurnitureSelect: (id: string | null) => void;
}

const SCALE = 100; // pixels per meter

export function Canvas({
  room,
  furniture,
  pathState,
  selectedFurnitureId,
  activeTool,
  currentView,
  onFurnitureMove,
  onFurnitureSelect,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // 3D view camera state - improved orbit camera
  const [camera, setCamera] = useState({ 
    rotationX: 45,  // tilt angle (degrees)
    rotationY: -45, // orbit angle (degrees)
    distance: 7,    // distance from center
  });
  const [isRotatingCamera, setIsRotatingCamera] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const roomWidth = room.width * SCALE;
  const roomDepth = room.depth * SCALE;

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setCanvasSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Convert screen coordinates to room coordinates
  const screenToRoom = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const offsetX = (canvasSize.width - roomWidth) / 2;
    const offsetY = (canvasSize.height - roomDepth) / 2;

    return {
      x: (screenX - rect.left - offsetX) / SCALE,
      y: (screenY - rect.top - offsetY) / SCALE,
    };
  }, [canvasSize.width, canvasSize.height, roomWidth, roomDepth]);

  // Find furniture at position
  const getFurnitureAtPosition = useCallback((roomX: number, roomY: number) => {
    for (let i = furniture.length - 1; i >= 0; i--) {
      const f = furniture[i];
      const dims = getRotatedDimensions(f);
      if (
        roomX >= f.x &&
        roomX <= f.x + dims.width &&
        roomY >= f.y &&
        roomY <= f.y + dims.depth
      ) {
        return f;
      }
    }
    return null;
  }, [furniture]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentView === '3d') {
      // Start camera rotation - only in 3D view
      if (e.button === 0) { // left click only
        setIsRotatingCamera(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
      return;
    }

    if (activeTool === 'select' || activeTool === 'move') {
      const { x, y } = screenToRoom(e.clientX, e.clientY);
      const item = getFurnitureAtPosition(x, y);

      if (item) {
        onFurnitureSelect(item.id);
        if (activeTool === 'move' || activeTool === 'select') {
          setIsDragging(true);
          setDragOffset({
            x: x - item.x,
            y: y - item.y,
          });
        }
      } else {
        onFurnitureSelect(null);
      }
    }
  }, [currentView, activeTool, screenToRoom, getFurnitureAtPosition, onFurnitureSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (currentView === '3d' && isRotatingCamera) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      
      setCamera(prev => ({
        ...prev,
        rotationY: prev.rotationY + deltaX * 0.5,
        rotationX: Math.max(-85, Math.min(85, prev.rotationX + deltaY * 0.5)),
      }));
      return;
    }

    if (!isDragging || !selectedFurnitureId) return;

    const { x, y } = screenToRoom(e.clientX, e.clientY);
    const item = furniture.find(f => f.id === selectedFurnitureId);
    if (!item) return;

    const dims = getRotatedDimensions(item);
    const newX = Math.max(0, Math.min(room.width - dims.width, x - dragOffset.x));
    const newY = Math.max(0, Math.min(room.depth - dims.depth, y - dragOffset.y));

    onFurnitureMove(selectedFurnitureId, newX, newY);
  }, [currentView, isRotatingCamera, isDragging, selectedFurnitureId, screenToRoom, furniture, room.width, room.depth, dragOffset, onFurnitureMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsRotatingCamera(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (currentView === '3d') {
      e.preventDefault();
      setCamera(prev => ({
        ...prev,
        distance: Math.max(3, Math.min(12, prev.distance + e.deltaY * 0.002)),
      }));
    }
  }, [currentView]);

  // Draw top-down view
  const drawTopDown = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = canvasSize;
    const offsetX = (width - roomWidth) / 2;
    const offsetY = (height - roomDepth) / 2;

    // Clear canvas
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= room.width; x += 0.5) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x * SCALE, offsetY);
      ctx.lineTo(offsetX + x * SCALE, offsetY + roomDepth);
      ctx.stroke();
    }
    for (let y = 0; y <= room.depth; y += 0.5) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + y * SCALE);
      ctx.lineTo(offsetX + roomWidth, offsetY + y * SCALE);
      ctx.stroke();
    }

    // Draw room floor
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(offsetX, offsetY, roomWidth, roomDepth);

    // Draw room walls
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.strokeRect(offsetX, offsetY, roomWidth, roomDepth);

    // Draw kitchen zone
    const kitchenX = offsetX + room.kitchen.x * SCALE;
    const kitchenY = offsetY + room.kitchen.y * SCALE;
    const kitchenW = room.kitchen.width * SCALE;
    const kitchenH = room.kitchen.depth * SCALE;
    
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(kitchenX, kitchenY, kitchenW, kitchenH);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(kitchenX, kitchenY, kitchenW, kitchenH);
    
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Kitchen', kitchenX + kitchenW / 2, kitchenY + kitchenH / 2);

    // Draw bathroom zone
    const bathroomX = offsetX + room.bathroom.x * SCALE;
    const bathroomY = offsetY + room.bathroom.y * SCALE;
    const bathroomW = room.bathroom.width * SCALE;
    const bathroomH = room.bathroom.depth * SCALE;
    
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(bathroomX, bathroomY, bathroomW, bathroomH);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(bathroomX, bathroomY, bathroomW, bathroomH);
    
    ctx.fillStyle = '#0369a1';
    ctx.fillText('Bathroom', bathroomX + bathroomW / 2, bathroomY + bathroomH / 2);

    // Draw doorway
    const doorX = offsetX + room.doorway.x * SCALE;
    const doorY = offsetY;
    const doorW = room.doorway.width * SCALE;

    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(doorX, doorY - 5, doorW, 16);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 10px Inter, system-ui, sans-serif';
    ctx.fillText('Door', doorX + doorW / 2, doorY + 3);

    // Draw path if visible
    if (pathState?.isVisible && pathState.waypoints.length > 1) {
      const pathColors = {
        green: '#22c55e',
        yellow: '#eab308',
        red: '#ef4444',
      };

      ctx.strokeStyle = pathColors[pathState.status];
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([12, 8]);

      ctx.beginPath();
      const startPoint = pathState.waypoints[0];
      ctx.moveTo(offsetX + startPoint.x * SCALE, offsetY + startPoint.y * SCALE);
      
      for (let i = 1; i < pathState.waypoints.length; i++) {
        const point = pathState.waypoints[i];
        ctx.lineTo(offsetX + point.x * SCALE, offsetY + point.y * SCALE);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw markers
      const start = pathState.waypoints[0];
      const end = pathState.waypoints[pathState.waypoints.length - 1];

      ctx.fillStyle = pathColors[pathState.status];
      ctx.beginPath();
      ctx.arc(offsetX + start.x * SCALE, offsetY + start.y * SCALE, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(
        offsetX + end.x * SCALE - 10,
        offsetY + end.y * SCALE - 10,
        20,
        20
      );
    }

    // Draw furniture
    furniture.forEach(item => {
      const dims = getRotatedDimensions(item);
      const x = offsetX + item.x * SCALE;
      const y = offsetY + item.y * SCALE;
      const w = dims.width * SCALE;
      const h = dims.depth * SCALE;

      ctx.save();
      
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(x + 4, y + 4, w, h);

      // Furniture body
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, w, h);

      // Selection highlight
      if (item.id === selectedFurnitureId) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 4;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
      }

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 3;
      ctx.fillText(item.label, x + w / 2, y + h / 2);
      ctx.shadowBlur = 0;

      // Rotation indicator
      if (item.rotation !== 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '9px Inter, system-ui, sans-serif';
        ctx.fillText(`${item.rotation}°`, x + w / 2, y + h / 2 + 14);
      }

      ctx.restore();
    });

    // Draw scale indicator
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Scale: 1 grid = 0.5m', offsetX, offsetY + roomDepth + 25);

  }, [room, furniture, pathState, selectedFurnitureId, canvasSize, roomWidth, roomDepth]);

  // Draw 3D view with proper perspective camera
  const draw3D = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = canvasSize;
    
    // Clear background
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    
    // Orbit camera - camera position based on rotation and distance
    const rotX = (camera.rotationX * Math.PI) / 180;
    const rotY = (camera.rotationY * Math.PI) / 180;
    const d = camera.distance;
    
    // Camera position in world space
    const camX = Math.sin(rotY) * Math.cos(rotX) * d;
    const camY = Math.sin(rotX) * d;
    const camZ = Math.cos(rotY) * Math.cos(rotX) * d;
    
    // Look at center of room
    const lookX = room.width / 2;
    const lookY = room.height / 2;
    const lookZ = room.depth / 2;
    
    // Simple perspective projection
    const project = (x: number, y: number, z: number): { x: number; y: number; depth: number } | null => {
      // Translate relative to camera
      let dx = x - camX;
      let dy = y - camY;
      let dz = z - camZ;
      
      // Simple projection: don't render if behind camera
      if (dz >= 0) return null;
      
      const scale = 400 / (-dz);
      return {
        x: centerX + dx * scale,
        y: centerY - dy * scale,
        depth: -dz,
      };
    };

    // Draw floor
    const floorCorners = [
      project(0, 0, 0),
      project(room.width, 0, 0),
      project(room.width, 0, room.depth),
      project(0, 0, room.depth),
    ].filter((p): p is { x: number; y: number; depth: number } => p !== null);

    if (floorCorners.length === 4) {
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(floorCorners[0].x, floorCorners[0].y);
      floorCorners.forEach(c => ctx.lineTo(c.x, c.y));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw walls
    const drawWall = (corners: ({ x: number; y: number; depth: number } | null)[], color: string) => {
      const validCorners = corners.filter((p): p is { x: number; y: number; depth: number } => p !== null);
      if (validCorners.length < 3) return;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(validCorners[0].x, validCorners[0].y);
      validCorners.forEach(c => ctx.lineTo(c.x, c.y));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    // Back wall
    drawWall([
      project(0, 0, room.depth),
      project(room.width, 0, room.depth),
      project(room.width, room.height, room.depth),
      project(0, room.height, room.depth),
    ], '#e2e8f0');

    // Right wall
    drawWall([
      project(room.width, 0, 0),
      project(room.width, 0, room.depth),
      project(room.width, room.height, room.depth),
      project(room.width, room.height, 0),
    ], '#d1d5db');

    // Draw fixed zones
    // Kitchen
    const kitchenBottomLeft = project(room.kitchen.x, 0, room.kitchen.y);
    const kitchenBottomRight = project(room.kitchen.x + room.kitchen.width, 0, room.kitchen.y);
    const kitchenTopRight = project(room.kitchen.x + room.kitchen.width, 0, room.kitchen.y + room.kitchen.depth);
    const kitchenTopLeft = project(room.kitchen.x, 0, room.kitchen.y + room.kitchen.depth);

    if (kitchenBottomLeft && kitchenBottomRight && kitchenTopRight && kitchenTopLeft) {
      ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
      ctx.beginPath();
      ctx.moveTo(kitchenBottomLeft.x, kitchenBottomLeft.y);
      ctx.lineTo(kitchenBottomRight.x, kitchenBottomRight.y);
      ctx.lineTo(kitchenTopRight.x, kitchenTopRight.y);
      ctx.lineTo(kitchenTopLeft.x, kitchenTopLeft.y);
      ctx.closePath();
      ctx.fill();
    }

    // Bathroom
    const bathroomBottomLeft = project(room.bathroom.x, 0, room.bathroom.y);
    const bathroomBottomRight = project(room.bathroom.x + room.bathroom.width, 0, room.bathroom.y);
    const bathroomTopRight = project(room.bathroom.x + room.bathroom.width, 0, room.bathroom.y + room.bathroom.depth);
    const bathroomTopLeft = project(room.bathroom.x, 0, room.bathroom.y + room.bathroom.depth);

    if (bathroomBottomLeft && bathroomBottomRight && bathroomTopRight && bathroomTopLeft) {
      ctx.fillStyle = 'rgba(96, 165, 250, 0.4)';
      ctx.beginPath();
      ctx.moveTo(bathroomBottomLeft.x, bathroomBottomLeft.y);
      ctx.lineTo(bathroomBottomRight.x, bathroomBottomRight.y);
      ctx.lineTo(bathroomTopRight.x, bathroomTopRight.y);
      ctx.lineTo(bathroomTopLeft.x, bathroomTopLeft.y);
      ctx.closePath();
      ctx.fill();
    }

    // Draw furniture as 3D boxes
    const furnitureWithDepth = furniture.map(item => {
      const center = project(item.x + getRotatedDimensions(item).width / 2, item.height / 2, item.y + getRotatedDimensions(item).depth / 2);
      return { item, center, depth: center?.depth ?? 0 };
    }).filter(f => f.center !== null && f.center !== undefined);

    // Sort by depth (painter's algorithm)
    furnitureWithDepth.sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));

    furnitureWithDepth.forEach(({ item }) => {
      const dims = getRotatedDimensions(item);
      const h = item.height;
      const isSelected = item.id === selectedFurnitureId;

      // Bottom corners
      const b00 = project(item.x, 0, item.y);
      const b10 = project(item.x + dims.width, 0, item.y);
      const b11 = project(item.x + dims.width, 0, item.y + dims.depth);
      const b01 = project(item.x, 0, item.y + dims.depth);

      // Top corners
      const t00 = project(item.x, h, item.y);
      const t10 = project(item.x + dims.width, h, item.y);
      const t11 = project(item.x + dims.width, h, item.y + dims.depth);
      const t01 = project(item.x, h, item.y + dims.depth);

      // Draw top face (most visible)
      if (t00 && t10 && t11 && t01) {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.moveTo(t00.x, t00.y);
        ctx.lineTo(t10.x, t10.y);
        ctx.lineTo(t11.x, t11.y);
        ctx.lineTo(t01.x, t01.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#3b82f6' : 'rgba(0,0,0,0.25)';
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.stroke();
      }

      // Draw front face
      if (b00 && b10 && t10 && t00) {
        ctx.fillStyle = adjustBrightness(item.color, -15);
        ctx.beginPath();
        ctx.moveTo(b00.x, b00.y);
        ctx.lineTo(b10.x, b10.y);
        ctx.lineTo(t10.x, t10.y);
        ctx.lineTo(t00.x, t00.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Draw right face
      if (b10 && b11 && t11 && t10) {
        ctx.fillStyle = adjustBrightness(item.color, -30);
        ctx.beginPath();
        ctx.moveTo(b10.x, b10.y);
        ctx.lineTo(b11.x, b11.y);
        ctx.lineTo(t11.x, t11.y);
        ctx.lineTo(t10.x, t10.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Label
      if (t01) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 3;
        ctx.fillText(item.label, t01.x, t01.y);
        ctx.shadowBlur = 0;
      }
    });

    // Instructions
    ctx.fillStyle = '#475569';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Drag to rotate | Scroll to zoom', width / 2, height - 15);

  }, [room, furniture, selectedFurnitureId, canvasSize, camera]);

  // Helper to adjust color brightness
  function adjustBrightness(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Main draw effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    if (currentView === '3d') {
      draw3D(ctx);
    } else {
      drawTopDown(ctx);
    }
  }, [currentView, drawTopDown, draw3D]);

  const getCursor = () => {
    if (currentView === '3d') return 'grab';
    if (isDragging) return 'grabbing';
    if (activeTool === 'select' || activeTool === 'move') return 'pointer';
    return 'default';
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-muted overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: getCursor() }}
      />
    </div>
  );
}
