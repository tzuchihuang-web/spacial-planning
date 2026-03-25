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
  
  // 3D view camera state
  const [camera, setCamera] = useState({ rotationY: -30, zoom: 1 });
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
      // Start camera rotation
      setIsRotatingCamera(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
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
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setCamera(prev => ({
        ...prev,
        rotationY: prev.rotationY + deltaX * 0.5,
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
        zoom: Math.max(0.5, Math.min(2, prev.zoom - e.deltaY * 0.001)),
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

  // Draw 3D isometric view
  const draw3D = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = canvasSize;
    
    // Clear
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = SCALE * 0.7 * camera.zoom;
    const angle = (camera.rotationY * Math.PI) / 180;
    const tilt = 0.5; // Isometric tilt

    // Transform function for 3D projection
    const project = (x: number, y: number, z: number) => {
      const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
      const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);
      return {
        x: centerX + rotatedX * scale,
        y: centerY + rotatedY * scale * tilt - z * scale * 0.8,
      };
    };

    // Draw floor
    const floorCorners = [
      project(0, 0, 0),
      project(room.width, 0, 0),
      project(room.width, room.depth, 0),
      project(0, room.depth, 0),
    ];

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(floorCorners[0].x, floorCorners[0].y);
    floorCorners.forEach(c => ctx.lineTo(c.x, c.y));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw grid on floor
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= room.width; x += 0.5) {
      const start = project(x, 0, 0);
      const end = project(x, room.depth, 0);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
    for (let y = 0; y <= room.depth; y += 0.5) {
      const start = project(0, y, 0);
      const end = project(room.width, y, 0);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    // Draw walls (back two)
    const wallHeight = room.height;
    
    // Back wall
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    const bw1 = project(0, room.depth, 0);
    const bw2 = project(room.width, room.depth, 0);
    const bw3 = project(room.width, room.depth, wallHeight);
    const bw4 = project(0, room.depth, wallHeight);
    ctx.moveTo(bw1.x, bw1.y);
    ctx.lineTo(bw2.x, bw2.y);
    ctx.lineTo(bw3.x, bw3.y);
    ctx.lineTo(bw4.x, bw4.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Left wall
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    const lw1 = project(0, 0, 0);
    const lw2 = project(0, room.depth, 0);
    const lw3 = project(0, room.depth, wallHeight);
    const lw4 = project(0, 0, wallHeight);
    ctx.moveTo(lw1.x, lw1.y);
    ctx.lineTo(lw2.x, lw2.y);
    ctx.lineTo(lw3.x, lw3.y);
    ctx.lineTo(lw4.x, lw4.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw fixed zones
    // Kitchen
    ctx.fillStyle = 'rgba(254, 243, 199, 0.7)';
    ctx.beginPath();
    const k1 = project(room.kitchen.x, room.kitchen.y, 0);
    const k2 = project(room.kitchen.x + room.kitchen.width, room.kitchen.y, 0);
    const k3 = project(room.kitchen.x + room.kitchen.width, room.kitchen.y + room.kitchen.depth, 0);
    const k4 = project(room.kitchen.x, room.kitchen.y + room.kitchen.depth, 0);
    ctx.moveTo(k1.x, k1.y);
    ctx.lineTo(k2.x, k2.y);
    ctx.lineTo(k3.x, k3.y);
    ctx.lineTo(k4.x, k4.y);
    ctx.closePath();
    ctx.fill();

    // Bathroom
    ctx.fillStyle = 'rgba(224, 242, 254, 0.7)';
    ctx.beginPath();
    const b1 = project(room.bathroom.x, room.bathroom.y, 0);
    const b2 = project(room.bathroom.x + room.bathroom.width, room.bathroom.y, 0);
    const b3 = project(room.bathroom.x + room.bathroom.width, room.bathroom.y + room.bathroom.depth, 0);
    const b4 = project(room.bathroom.x, room.bathroom.y + room.bathroom.depth, 0);
    ctx.moveTo(b1.x, b1.y);
    ctx.lineTo(b2.x, b2.y);
    ctx.lineTo(b3.x, b3.y);
    ctx.lineTo(b4.x, b4.y);
    ctx.closePath();
    ctx.fill();

    // Draw furniture as 3D boxes
    // Sort by distance (back to front)
    const sortedFurniture = [...furniture].sort((a, b) => {
      const distA = a.x * Math.sin(angle) + a.y * Math.cos(angle);
      const distB = b.x * Math.sin(angle) + b.y * Math.cos(angle);
      return distA - distB;
    });

    sortedFurniture.forEach(item => {
      const dims = getRotatedDimensions(item);
      const h = item.height;
      const isSelected = item.id === selectedFurnitureId;

      // Box corners (bottom)
      const corners = [
        project(item.x, item.y, 0),
        project(item.x + dims.width, item.y, 0),
        project(item.x + dims.width, item.y + dims.depth, 0),
        project(item.x, item.y + dims.depth, 0),
      ];
      // Box corners (top)
      const topCorners = [
        project(item.x, item.y, h),
        project(item.x + dims.width, item.y, h),
        project(item.x + dims.width, item.y + dims.depth, h),
        project(item.x, item.y + dims.depth, h),
      ];

      // Draw top face
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.moveTo(topCorners[0].x, topCorners[0].y);
      topCorners.forEach(c => ctx.lineTo(c.x, c.y));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#3b82f6' : 'rgba(0,0,0,0.3)';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.stroke();

      // Draw front faces
      // Right face
      ctx.fillStyle = adjustBrightness(item.color, -20);
      ctx.beginPath();
      ctx.moveTo(corners[1].x, corners[1].y);
      ctx.lineTo(corners[2].x, corners[2].y);
      ctx.lineTo(topCorners[2].x, topCorners[2].y);
      ctx.lineTo(topCorners[1].x, topCorners[1].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Front face
      ctx.fillStyle = adjustBrightness(item.color, -10);
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      ctx.lineTo(corners[1].x, corners[1].y);
      ctx.lineTo(topCorners[1].x, topCorners[1].y);
      ctx.lineTo(topCorners[0].x, topCorners[0].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Label on top
      const labelPos = project(item.x + dims.width / 2, item.y + dims.depth / 2, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 2;
      ctx.fillText(item.label, labelPos.x, labelPos.y);
      ctx.shadowBlur = 0;
    });

    // Instructions
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Drag to rotate view | Scroll to zoom', width / 2, height - 20);

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
