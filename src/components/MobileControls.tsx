import React, { useState, useRef, useEffect } from 'react';
import { GameEngine } from '../game/GameEngine';

interface MobileControlsProps {
  engine: GameEngine | null;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ engine }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const [thumbPos, setThumbPos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    // Check if device supports touch
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (!isTouchDevice || !engine) return null;

  const handleJoystickTouch = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (!joystickRef.current || !engine) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        return;
      }
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const maxDist = rect.width / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }
    
    // Normalize to -1 to 1 (y is inverted because screen Y grows downwards but forward is +y in input logic)
    engine.virtualJoystickMove.x = dx / maxDist;
    engine.virtualJoystickMove.y = -(dy / maxDist);
    setThumbPos({ x: dx, y: dy });
  };

  const resetJoystick = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (engine) {
      engine.virtualJoystickMove.set(0, 0);
      setThumbPos({ x: 0, y: 0 });
    }
  };

  const handleJumpStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (engine) engine.virtualJumpPressed = true;
  };

  const handleJumpEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (engine) engine.virtualJumpPressed = false;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex justify-between items-end p-8 pb-32">
      {/* Joystick Area */}
      <div 
        ref={joystickRef}
        className="w-32 h-32 bg-white/10 border-2 border-white/20 rounded-full pointer-events-auto backdrop-blur-sm flex items-center justify-center touch-none select-none"
        onTouchStart={handleJoystickTouch}
        onTouchMove={handleJoystickTouch}
        onTouchEnd={resetJoystick}
        onTouchCancel={resetJoystick}
      >
        <div className="w-12 h-12 bg-white/40 rounded-full shadow-lg" style={{ transform: `translate(${thumbPos.x}px, ${thumbPos.y}px)` }}></div>
      </div>
      
      {/* Jump Button */}
      <button
        className="w-20 h-20 bg-white/10 border-2 border-white/20 rounded-full pointer-events-auto backdrop-blur-sm font-black text-white/70 text-lg shadow-lg active:bg-white/30 active:scale-95 transition-all touch-none select-none"
        onTouchStart={handleJumpStart}
        onTouchEnd={handleJumpEnd}
        onTouchCancel={handleJumpEnd}
      >
        JUMP
      </button>
    </div>
  );
};
