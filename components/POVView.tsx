'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { Room, Furniture, PathState } from '@/types';
import { getPositionAlongPath, calculatePathLength } from '@/utils/pathComputation';

interface POVViewProps {
  room: Room;
  furniture: Furniture[];
  pathState: PathState | null;
  isWalkthroughActive: boolean;
  walkthroughProgress: number;
  onWalkthroughProgress: (progress: number) => void;
  onWalkthroughEnd: () => void;
}

const WALKTHROUGH_SPEED = 0.005; // Progress per frame (adjust for speed)

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
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation loop for walkthrough
  useEffect(() => {
    if (!isWalkthroughActive || !pathState?.waypoints.length) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = () => {
      const newProgress = walkthroughProgress + WALKTHROUGH_SPEED;
      
      if (newProgress >= 1) {
        onWalkthroughProgress(1);
        setTimeout(() => {
          console.log('[Research] Walkthrough completed');
          onWalkthroughEnd();
        }, 500);
        return;
      }

      onWalkthroughProgress(newProgress);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isWalkthroughActive, walkthroughProgress, pathState, onWalkthroughProgress, onWalkthroughEnd]);

  // Draw POV scene
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const container = containerRef.current;
    if (!canvas || !ctx || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // Get camera position
    let cameraX = room.width / 2;
    let cameraY = 1;
    let cameraAngle = Math.PI / 2; // Facing into the room

    if (pathState?.waypoints.length && isWalkthroughActive) {
      const pos = getPositionAlongPath(pathState.waypoints, walkthroughProgress);
      cameraX = pos.x;
      cameraY = pos.y;
      cameraAngle = pos.angle;
    }

    // Clear and draw sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height / 2);
    skyGradient.addColorStop(0, '#e0e7ff');
    skyGradient.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height / 2);

    // Draw floor
    const floorGradient = ctx.createLinearGradient(0, height / 2, 0, height);
    floorGradient.addColorStop(0, '#d4d4d8');
    floorGradient.addColorStop(1, '#a1a1aa');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, height / 2, width, height / 2);

    // Draw floor grid lines for depth perception
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const y = height / 2 + (i / 20) * (height / 2);
      const perspective = 1 - (i / 20) * 0.8;
      ctx.globalAlpha = perspective;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Draw walls (simple perspective)
    const wallHeight = height * 0.4;
    const horizonY = height / 2;

    // Left wall
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(0, horizonY - wallHeight);
    ctx.lineTo(width * 0.2, horizonY - wallHeight * 0.6);
    ctx.lineTo(width * 0.2, horizonY + wallHeight * 0.6);
    ctx.lineTo(0, horizonY + wallHeight);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#9ca3af';
    ctx.stroke();

    // Right wall
    ctx.fillStyle = '#d1d5db';
    ctx.beginPath();
    ctx.moveTo(width, horizonY - wallHeight);
    ctx.lineTo(width * 0.8, horizonY - wallHeight * 0.6);
    ctx.lineTo(width * 0.8, horizonY + wallHeight * 0.6);
    ctx.lineTo(width, horizonY + wallHeight);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#9ca3af';
    ctx.stroke();

    // Back wall
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(width * 0.2, horizonY - wallHeight * 0.6, width * 0.6, wallHeight * 1.2);
    ctx.strokeStyle = '#9ca3af';
    ctx.strokeRect(width * 0.2, horizonY - wallHeight * 0.6, width * 0.6, wallHeight * 1.2);

    // Draw furniture as simple 3D boxes based on distance from camera
    const sortedFurniture = [...furniture].sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.x + a.width/2 - cameraX, 2) + Math.pow(a.y + a.depth/2 - cameraY, 2));
      const distB = Math.sqrt(Math.pow(b.x + b.width/2 - cameraX, 2) + Math.pow(b.y + b.depth/2 - cameraY, 2));
      return distB - distA; // Draw far items first
    });

    sortedFurniture.forEach(item => {
      const dx = (item.x + item.width / 2) - cameraX;
      const dy = (item.y + item.depth / 2) - cameraY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 0.5) return; // Too close to render

      // Calculate screen position based on angle from camera
      const angleToItem = Math.atan2(dy, dx);
      const angleDiff = angleToItem - cameraAngle;
      
      // Only render items in front of camera (roughly 120 degree FOV)
      if (Math.abs(angleDiff) > Math.PI * 0.6) return;

      const screenX = width / 2 + (angleDiff / (Math.PI * 0.6)) * (width / 2);
      const scale = Math.max(0.1, 1 / (distance * 0.3));
      const itemWidth = item.width * 40 * scale;
      const itemHeight = item.depth * 30 * scale;
      const screenY = horizonY + (1 - scale) * (height / 4);

      // Draw furniture as colored rectangle with label
      ctx.fillStyle = item.color;
      ctx.fillRect(screenX - itemWidth / 2, screenY - itemHeight, itemWidth, itemHeight);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX - itemWidth / 2, screenY - itemHeight, itemWidth, itemHeight);

      // Draw label if close enough
      if (scale > 0.3) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(12 * scale)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.fillText(item.label, screenX, screenY - itemHeight / 2);
        ctx.shadowBlur = 0;
      }
    });

    // Draw path indicator on floor if path exists
    if (pathState?.isVisible && pathState.waypoints.length > 1) {
      const pathColors = {
        green: '#22c55e',
        yellow: '#eab308',
        red: '#ef4444',
      };

      ctx.strokeStyle = pathColors[pathState.color];
      ctx.lineWidth = 6;
      ctx.setLineDash([15, 10]);
      ctx.globalAlpha = 0.6;

      ctx.beginPath();
      let started = false;

      pathState.waypoints.forEach((point, idx) => {
        const dx = point.x - cameraX;
        const dy = point.y - cameraY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angleToPoint = Math.atan2(dy, dx);
        const angleDiff = angleToPoint - cameraAngle;

        if (Math.abs(angleDiff) < Math.PI * 0.6 && distance > 0.5) {
          const screenX = width / 2 + (angleDiff / (Math.PI * 0.6)) * (width / 2);
          const scale = Math.max(0.1, 1 / (distance * 0.3));
          const screenY = horizonY + (1 - scale) * (height / 3);

          if (!started) {
            ctx.moveTo(screenX, screenY);
            started = true;
          } else {
            ctx.lineTo(screenX, screenY);
          }
        }
      });

      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Draw status indicator
    if (pathState) {
      const statusColors = {
        green: { bg: '#dcfce7', text: '#166534' },
        yellow: { bg: '#fef9c3', text: '#854d0e' },
        red: { bg: '#fee2e2', text: '#991b1b' },
      };
      const colors = statusColors[pathState.color];

      ctx.fillStyle = colors.bg;
      ctx.beginPath();
      ctx.roundRect(width / 2 - 120, 20, 240, 36, 8);
      ctx.fill();

      ctx.fillStyle = colors.text;
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pathState.message, width / 2, 38);
    }

    // Progress bar during walkthrough
    if (isWalkthroughActive) {
      const barWidth = 200;
      const barHeight = 6;
      const barX = width / 2 - barWidth / 2;
      const barY = height - 40;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth, barHeight, 3);
      ctx.fill();

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth * walkthroughProgress, barHeight, 3);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Walking path...', width / 2, barY + 20);
    }

  }, [room, furniture, pathState, isWalkthroughActive, walkthroughProgress]);

  const handleBackToDesign = useCallback(() => {
    onWalkthroughEnd();
  }, [onWalkthroughEnd]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#f1f5f9]">
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* Back button */}
      <button
        onClick={handleBackToDesign}
        className="absolute bottom-6 left-6 px-4 py-2 bg-card text-card-foreground rounded-lg shadow-md hover:bg-muted transition-colors text-sm font-medium flex items-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Design
      </button>

      {/* View info */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-sm">
        <span className="text-sm font-medium text-foreground">
          {isWalkthroughActive ? 'Walkthrough Mode' : 'First-Person View'}
        </span>
      </div>
    </div>
  );
}
