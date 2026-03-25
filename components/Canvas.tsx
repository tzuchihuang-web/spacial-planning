'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { Room, Furniture, PathState } from '@/types';

interface CanvasProps {
  room: Room;
  furniture: Furniture[];
  pathState: PathState | null;
  selectedFurnitureId: string | null;
  activeTool: 'select' | 'place' | 'route';
  onFurnitureMove: (id: string, x: number, y: number) => void;
  onFurnitureSelect: (id: string | null) => void;
}

const GRID_SIZE = 1; // 1 unit per grid cell
const SCALE = 45; // pixels per unit
const PADDING = 60; // canvas padding

export function Canvas({
  room,
  furniture,
  pathState,
  selectedFurnitureId,
  activeTool,
  onFurnitureMove,
  onFurnitureSelect,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Calculate canvas size based on room dimensions
  const roomWidth = room.width * SCALE;
  const roomHeight = room.depth * SCALE;

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
    const offsetY = (canvasSize.height - roomHeight) / 2;

    return {
      x: (screenX - rect.left - offsetX) / SCALE,
      y: (screenY - rect.top - offsetY) / SCALE,
    };
  }, [canvasSize.width, canvasSize.height, roomWidth, roomHeight]);

  // Find furniture at position
  const getFurnitureAtPosition = useCallback((roomX: number, roomY: number) => {
    // Check in reverse order (top items first)
    for (let i = furniture.length - 1; i >= 0; i--) {
      const f = furniture[i];
      if (
        roomX >= f.x &&
        roomX <= f.x + f.width &&
        roomY >= f.y &&
        roomY <= f.y + f.depth
      ) {
        return f;
      }
    }
    return null;
  }, [furniture]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'select') return;

    const { x, y } = screenToRoom(e.clientX, e.clientY);
    const item = getFurnitureAtPosition(x, y);

    if (item) {
      onFurnitureSelect(item.id);
      setIsDragging(true);
      setDragOffset({
        x: x - item.x,
        y: y - item.y,
      });
    } else {
      onFurnitureSelect(null);
    }
  }, [activeTool, screenToRoom, getFurnitureAtPosition, onFurnitureSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedFurnitureId) return;

    const { x, y } = screenToRoom(e.clientX, e.clientY);
    const newX = Math.max(0, Math.min(room.width - 1, x - dragOffset.x));
    const newY = Math.max(0, Math.min(room.depth - 1, y - dragOffset.y));

    onFurnitureMove(selectedFurnitureId, newX, newY);
  }, [isDragging, selectedFurnitureId, screenToRoom, room.width, room.depth, dragOffset, onFurnitureMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { width, height } = canvasSize;
    const offsetX = (width - roomWidth) / 2;
    const offsetY = (height - roomHeight) / 2;

    // Clear canvas
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= room.width; x++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x * SCALE, offsetY);
      ctx.lineTo(offsetX + x * SCALE, offsetY + roomHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= room.depth; y++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + y * SCALE);
      ctx.lineTo(offsetX + roomWidth, offsetY + y * SCALE);
      ctx.stroke();
    }

    // Draw room floor
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(offsetX, offsetY, roomWidth, roomHeight);

    // Draw room walls (outline)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.strokeRect(offsetX, offsetY, roomWidth, roomHeight);

    // Draw bathroom
    const bathroomX = offsetX + room.bathroom.x * SCALE;
    const bathroomY = offsetY + room.bathroom.y * SCALE;
    const bathroomW = room.bathroom.width * SCALE;
    const bathroomH = room.bathroom.depth * SCALE;
    
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(bathroomX, bathroomY, bathroomW, bathroomH);
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2;
    ctx.strokeRect(bathroomX, bathroomY, bathroomW, bathroomH);
    
    // Bathroom label
    ctx.fillStyle = '#0369a1';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bathroom', bathroomX + bathroomW / 2, bathroomY + bathroomH / 2 + 4);

    // Draw doorway
    const doorX = offsetX + room.doorway.x * SCALE;
    const doorY = offsetY + room.doorway.y * SCALE;
    const doorW = room.doorway.width * SCALE;
    const doorH = 8;

    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(doorX, doorY - doorH / 2, doorW, doorH);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(doorX, doorY - doorH / 2, doorW, doorH);

    // Draw path if visible (Mode B)
    if (pathState?.isVisible && pathState.waypoints.length > 1) {
      const pathColors = {
        green: '#22c55e',
        yellow: '#eab308',
        red: '#ef4444',
      };

      ctx.strokeStyle = pathColors[pathState.color];
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([10, 6]);

      ctx.beginPath();
      const startPoint = pathState.waypoints[0];
      ctx.moveTo(offsetX + startPoint.x * SCALE, offsetY + startPoint.y * SCALE);
      
      for (let i = 1; i < pathState.waypoints.length; i++) {
        const point = pathState.waypoints[i];
        ctx.lineTo(offsetX + point.x * SCALE, offsetY + point.y * SCALE);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw start and end markers
      const start = pathState.waypoints[0];
      const end = pathState.waypoints[pathState.waypoints.length - 1];

      // Start marker (circle)
      ctx.fillStyle = pathColors[pathState.color];
      ctx.beginPath();
      ctx.arc(offsetX + start.x * SCALE, offsetY + start.y * SCALE, 8, 0, Math.PI * 2);
      ctx.fill();

      // End marker (square)
      ctx.fillRect(
        offsetX + end.x * SCALE - 8,
        offsetY + end.y * SCALE - 8,
        16,
        16
      );
    }

    // Draw furniture
    furniture.forEach(item => {
      const x = offsetX + item.x * SCALE;
      const y = offsetY + item.y * SCALE;
      const w = item.width * SCALE;
      const h = item.depth * SCALE;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(x + 3, y + 3, w, h);

      // Furniture body
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, w, h);

      // Selection highlight
      if (item.id === selectedFurnitureId) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      } else {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
      }

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Text shadow for readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;
      ctx.fillText(item.label, x + w / 2, y + h / 2);
      ctx.shadowBlur = 0;
    });

    // Draw path status callout (Mode B)
    if (pathState?.isVisible && pathState.waypoints.length > 1) {
      const midIdx = Math.floor(pathState.waypoints.length / 2);
      const midPoint = pathState.waypoints[midIdx];
      const calloutX = offsetX + midPoint.x * SCALE;
      const calloutY = offsetY + midPoint.y * SCALE - 30;

      const bgColors = {
        green: '#dcfce7',
        yellow: '#fef9c3',
        red: '#fee2e2',
      };
      const textColors = {
        green: '#166534',
        yellow: '#854d0e',
        red: '#991b1b',
      };

      ctx.fillStyle = bgColors[pathState.color];
      const textWidth = ctx.measureText(pathState.message).width;
      const padding = 8;
      
      // Callout background
      ctx.beginPath();
      ctx.roundRect(
        calloutX - textWidth / 2 - padding,
        calloutY - 12,
        textWidth + padding * 2,
        24,
        4
      );
      ctx.fill();

      // Callout text
      ctx.fillStyle = textColors[pathState.color];
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pathState.message, calloutX, calloutY);
    }

  }, [room, furniture, pathState, selectedFurnitureId, canvasSize, roomWidth, roomHeight]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-[#f1f5f9] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={activeTool === 'select' ? 'cursor-pointer' : 'cursor-default'}
      />
    </div>
  );
}
