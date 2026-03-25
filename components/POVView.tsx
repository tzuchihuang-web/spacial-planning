'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { getRotatedDimensions } from '@/utils/roomData';
import { getPositionAlongPath, calculatePathLength } from '@/utils/pathComputation';
import type { Room, Furniture, PathState } from '@/types';

interface POVViewProps {
  room: Room;
  furniture: Furniture[];
  pathState: PathState | null;
  isWalkthroughActive: boolean;
  walkthroughProgress: number;
  onWalkthroughProgress: (progress: number) => void;
  onWalkthroughEnd: () => void;
}

// Human eye level height (1.7m from floor)
const EYE_HEIGHT = 1.7;
const WALKING_SPEED = 1.5; // m/s
const FOV = Math.PI * 0.55; // 100 degree field of view

export function POVView({
  room,
  furniture,
  pathState,
  isWalkthroughActive,
  walkthroughProgress,
  onWalkthroughProgress,
  onWalkthroughEnd,
}: POVViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Handle resize
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

  // Animation loop for walkthrough
  useEffect(() => {
    if (!isWalkthroughActive || !pathState?.waypoints.length) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const pathLength = calculatePathLength(pathState.waypoints);
    const duration = (pathLength / WALKING_SPEED) * 1000; // milliseconds

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastTimeRef.current;
      const progressIncrement = elapsed / duration;
      const newProgress = Math.min(1, walkthroughProgress + progressIncrement);

      lastTimeRef.current = timestamp;
      onWalkthroughProgress(newProgress);

      if (newProgress >= 1) {
        setTimeout(() => onWalkthroughEnd(), 500);
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimeRef.current = 0;
    };
  }, [isWalkthroughActive, pathState, onWalkthroughProgress, onWalkthroughEnd, walkthroughProgress]);

  // Draw POV scene
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { width, height } = canvasSize;
    canvas.width = width;
    canvas.height = height;

    // Camera position
    let cameraX = room.width / 2;
    let cameraY = 0.5;
    let cameraAngle = Math.PI / 2; // Facing into room

    if (pathState?.waypoints.length && isWalkthroughActive) {
      const pos = getPositionAlongPath(pathState.waypoints, walkthroughProgress);
      cameraX = pos.x;
      cameraY = pos.y;
      cameraAngle = pos.angle;
    }

    const horizonY = height * 0.45;

    // Clear and draw ceiling
    const ceilingGradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    ceilingGradient.addColorStop(0, '#f8fafc');
    ceilingGradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = ceilingGradient;
    ctx.fillRect(0, 0, width, horizonY);

    // Draw floor with perspective
    const floorGradient = ctx.createLinearGradient(0, horizonY, 0, height);
    floorGradient.addColorStop(0, '#cbd5e1');
    floorGradient.addColorStop(1, '#94a3b8');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // Floor grid for depth perception
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 15; i++) {
      const t = i / 15;
      const y = horizonY + t * t * (height - horizonY);
      ctx.globalAlpha = 0.4 * (1 - t);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Vertical lines with perspective
      const spread = width * 0.5 * t;
      for (let j = -5; j <= 5; j++) {
        const x = width / 2 + j * spread * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, 2 * (1 - t), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Helper: project 3D point to screen
    const projectToScreen = (worldX: number, worldY: number, worldZ: number) => {
      // Transform relative to camera
      const dx = worldX - cameraX;
      const dy = worldY - cameraY;

      // Rotate by camera angle
      const rotatedX = dx * Math.cos(-cameraAngle) - dy * Math.sin(-cameraAngle);
      const rotatedY = dx * Math.sin(-cameraAngle) + dy * Math.cos(-cameraAngle);

      // Only render if in front
      if (rotatedY <= 0.1) return null;

      // Project to screen
      const screenX = width / 2 + (rotatedX / rotatedY) * (width / (2 * Math.tan(FOV / 2)));
      const screenY = horizonY + ((EYE_HEIGHT - worldZ) / rotatedY) * (height / 2);

      return { x: screenX, y: screenY, depth: rotatedY };
    };

    // Draw walls
    const drawWall = (x1: number, y1: number, x2: number, y2: number, color: string) => {
      const wallHeight = room.height;
      
      const p1Bottom = projectToScreen(x1, y1, 0);
      const p2Bottom = projectToScreen(x2, y2, 0);
      const p1Top = projectToScreen(x1, y1, wallHeight);
      const p2Top = projectToScreen(x2, y2, wallHeight);

      if (!p1Bottom || !p2Bottom || !p1Top || !p2Top) return;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(p1Bottom.x, p1Bottom.y);
      ctx.lineTo(p2Bottom.x, p2Bottom.y);
      ctx.lineTo(p2Top.x, p2Top.y);
      ctx.lineTo(p1Top.x, p1Top.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    // Room walls
    drawWall(0, 0, room.width, 0, '#f1f5f9'); // Front wall (with door)
    drawWall(0, 0, 0, room.depth, '#e2e8f0'); // Left wall
    drawWall(room.width, 0, room.width, room.depth, '#d1d5db'); // Right wall
    drawWall(0, room.depth, room.width, room.depth, '#f3f4f6'); // Back wall

    // Draw fixed zones on floor
    const drawZone = (zone: { x: number; y: number; width: number; depth: number }, color: string, label: string) => {
      const corners = [
        projectToScreen(zone.x, zone.y, 0),
        projectToScreen(zone.x + zone.width, zone.y, 0),
        projectToScreen(zone.x + zone.width, zone.y + zone.depth, 0),
        projectToScreen(zone.x, zone.y + zone.depth, 0),
      ].filter(Boolean);

      if (corners.length < 4) return;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(corners[0]!.x, corners[0]!.y);
      corners.forEach(c => c && ctx.lineTo(c.x, c.y));
      ctx.closePath();
      ctx.fill();

      // Label
      const center = projectToScreen(zone.x + zone.width / 2, zone.y + zone.depth / 2, 0);
      if (center && center.depth < 8) {
        ctx.fillStyle = '#334155';
        ctx.font = `${Math.max(10, 14 / center.depth * 2)}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(label, center.x, center.y);
      }
    };

    drawZone(room.kitchen, 'rgba(254, 243, 199, 0.7)', 'Kitchen');
    drawZone(room.bathroom, 'rgba(224, 242, 254, 0.7)', 'Bathroom');

    // Sort furniture by depth (back to front)
    const sortedFurniture = [...furniture]
      .map(item => {
        const dims = getRotatedDimensions(item);
        const centerX = item.x + dims.width / 2;
        const centerY = item.y + dims.depth / 2;
        const dx = centerX - cameraX;
        const dy = centerY - cameraY;
        const rotatedY = dx * Math.sin(-cameraAngle) + dy * Math.cos(-cameraAngle);
        return { item, depth: rotatedY };
      })
      .filter(f => f.depth > 0.3)
      .sort((a, b) => b.depth - a.depth);

    // Draw furniture
    sortedFurniture.forEach(({ item }) => {
      const dims = getRotatedDimensions(item);
      const h = item.height;

      // Get all 8 corners of the box
      const corners = {
        bottomFrontLeft: projectToScreen(item.x, item.y, 0),
        bottomFrontRight: projectToScreen(item.x + dims.width, item.y, 0),
        bottomBackLeft: projectToScreen(item.x, item.y + dims.depth, 0),
        bottomBackRight: projectToScreen(item.x + dims.width, item.y + dims.depth, 0),
        topFrontLeft: projectToScreen(item.x, item.y, h),
        topFrontRight: projectToScreen(item.x + dims.width, item.y, h),
        topBackLeft: projectToScreen(item.x, item.y + dims.depth, h),
        topBackRight: projectToScreen(item.x + dims.width, item.y + dims.depth, h),
      };

      // Skip if not visible
      const visibleCorners = Object.values(corners).filter(Boolean);
      if (visibleCorners.length < 4) return;

      // Draw top face
      if (corners.topFrontLeft && corners.topFrontRight && corners.topBackRight && corners.topBackLeft) {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.moveTo(corners.topFrontLeft.x, corners.topFrontLeft.y);
        ctx.lineTo(corners.topFrontRight.x, corners.topFrontRight.y);
        ctx.lineTo(corners.topBackRight.x, corners.topBackRight.y);
        ctx.lineTo(corners.topBackLeft.x, corners.topBackLeft.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw front face
      if (corners.bottomFrontLeft && corners.bottomFrontRight && corners.topFrontRight && corners.topFrontLeft) {
        ctx.fillStyle = adjustBrightness(item.color, -15);
        ctx.beginPath();
        ctx.moveTo(corners.bottomFrontLeft.x, corners.bottomFrontLeft.y);
        ctx.lineTo(corners.bottomFrontRight.x, corners.bottomFrontRight.y);
        ctx.lineTo(corners.topFrontRight.x, corners.topFrontRight.y);
        ctx.lineTo(corners.topFrontLeft.x, corners.topFrontLeft.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Draw side faces
      if (corners.bottomFrontRight && corners.bottomBackRight && corners.topBackRight && corners.topFrontRight) {
        ctx.fillStyle = adjustBrightness(item.color, -25);
        ctx.beginPath();
        ctx.moveTo(corners.bottomFrontRight.x, corners.bottomFrontRight.y);
        ctx.lineTo(corners.bottomBackRight.x, corners.bottomBackRight.y);
        ctx.lineTo(corners.topBackRight.x, corners.topBackRight.y);
        ctx.lineTo(corners.topFrontRight.x, corners.topFrontRight.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      if (corners.bottomFrontLeft && corners.bottomBackLeft && corners.topBackLeft && corners.topFrontLeft) {
        ctx.fillStyle = adjustBrightness(item.color, -20);
        ctx.beginPath();
        ctx.moveTo(corners.bottomFrontLeft.x, corners.bottomFrontLeft.y);
        ctx.lineTo(corners.bottomBackLeft.x, corners.bottomBackLeft.y);
        ctx.lineTo(corners.topBackLeft.x, corners.topBackLeft.y);
        ctx.lineTo(corners.topFrontLeft.x, corners.topFrontLeft.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Draw label on top
      const labelPos = projectToScreen(item.x + dims.width / 2, item.y + dims.depth / 2, h);
      if (labelPos && labelPos.depth < 6) {
        const fontSize = Math.max(10, Math.min(16, 24 / labelPos.depth));
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(item.label, labelPos.x, labelPos.y);
        ctx.shadowBlur = 0;
      }
    });

    // Draw path preview on floor
    if (pathState?.isVisible && pathState.waypoints.length > 1) {
      const pathColors = {
        green: '#22c55e',
        yellow: '#eab308',
        red: '#ef4444',
      };

      ctx.strokeStyle = pathColors[pathState.status];
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 8]);
      ctx.globalAlpha = 0.7;

      ctx.beginPath();
      let started = false;

      pathState.waypoints.forEach(point => {
        const projected = projectToScreen(point.x, point.y, 0.05);
        if (projected) {
          if (!started) {
            ctx.moveTo(projected.x, projected.y);
            started = true;
          } else {
            ctx.lineTo(projected.x, projected.y);
          }
        }
      });

      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Status bar
    if (pathState) {
      const statusColors = {
        green: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
        yellow: { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
        red: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
      };
      const colors = statusColors[pathState.status];

      ctx.fillStyle = colors.bg;
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(width / 2 - 140, 16, 280, 40, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.text;
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pathState.message, width / 2, 36);
    }

    // Progress bar during walkthrough
    if (isWalkthroughActive) {
      const barWidth = 240;
      const barHeight = 8;
      const barX = width / 2 - barWidth / 2;
      const barY = height - 50;

      // Background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth, barHeight, 4);
      ctx.fill();

      // Progress
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth * walkthroughProgress, barHeight, 4);
      ctx.fill();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      ctx.fillText(`Walking path... ${Math.round(walkthroughProgress * 100)}%`, width / 2, barY + 24);
      ctx.shadowBlur = 0;
    }

  }, [room, furniture, pathState, isWalkthroughActive, walkthroughProgress, canvasSize]);

  function adjustBrightness(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  const handleBackToDesign = useCallback(() => {
    onWalkthroughEnd();
  }, [onWalkthroughEnd]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-muted">
      <canvas ref={canvasRef} className="w-full h-full" />
      
      <button
        onClick={handleBackToDesign}
        className="absolute bottom-6 left-6 px-4 py-2.5 bg-card text-card-foreground rounded-lg shadow-lg hover:bg-muted transition-colors text-sm font-medium flex items-center gap-2 border border-border"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Design
      </button>

      <div className="absolute top-4 left-4 px-3 py-2 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-sm">
        <span className="text-sm font-medium text-foreground">
          {isWalkthroughActive ? 'Walking Through Path' : 'First-Person View'}
        </span>
        <p className="text-xs text-muted-foreground mt-0.5">
          Eye level: {EYE_HEIGHT}m
        </p>
      </div>
    </div>
  );
}
