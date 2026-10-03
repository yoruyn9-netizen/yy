import React, { useState, useRef } from 'react';
import { Flashlight, Camera, Lock, ChevronUp } from 'lucide-react';
import { Wallpaper } from './Wallpaper';

interface LockScreenProps {
  time: string;
  onUnlock: () => void;
  projectTitle: string;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  time,
  onUnlock,
  projectTitle,
}) => {
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const startYRef = useRef(0);

  const dateString = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const triggerUnlockAnimation = () => {
    setIsUnlocking(true);
    setTimeout(() => {
      onUnlock();
      setIsUnlocking(false);
      setDragY(0);
    }, 380);
  };

  // Full-screen smooth pointer tracking with pointer capture
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks on flashlight or camera buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    setIsDragging(true);
    startYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isUnlocking) return;
    const delta = startYRef.current - e.clientY;
    if (delta > 0) {
      // 1:1 pixel dragging with slight rubber-banding at extreme top
      setDragY(delta);
    } else {
      setDragY(0);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (dragY > 70) {
      triggerUnlockAnimation();
    } else {
      setDragY(0);
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: isUnlocking
          ? 'translateY(-105%) scale(0.96)'
          : isDragging
          ? `translateY(-${dragY}px)`
          : 'translateY(0)',
        opacity: isUnlocking ? 0 : isDragging ? Math.max(0.1, 1 - dragY / 320) : 1,
        transition: isDragging
          ? 'none'
          : 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.35s ease',
        touchAction: 'none',
      }}
      className="absolute inset-0 z-40 flex flex-col justify-between p-6 pt-14 select-none overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <Wallpaper />

      {/* Flashlight screen illumination if turned on */}
      {isFlashlightOn && (
        <div className="absolute inset-0 bg-white/35 backdrop-blur-xs pointer-events-none z-10 animate-fadeIn" />
      )}

      {/* Top Header: Padlock icon & Date / Huge iOS Clock */}
      <div className="flex flex-col items-center pt-2 space-y-1 relative z-20 text-white pointer-events-none">
        <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
          <Lock className="w-3.5 h-3.5" />
          <span>Terkunci</span>
        </div>

        <div className="text-[13px] font-medium uppercase tracking-wider text-white/80 pt-1">
          {dateString}
        </div>

        <div className="text-[76px] font-extralight tracking-tighter leading-none text-white drop-shadow-md font-sans">
          {time}
        </div>
      </div>

      {/* Middle Notification Cards Stack */}
      <div className="relative z-20 my-auto space-y-2.5 max-w-[340px] mx-auto w-full px-1 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-2xl border border-white/15 rounded-3xl p-3.5 text-white shadow-xl flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0a84ff] to-[#60a5fa] flex items-center justify-center text-white shrink-0 shadow-sm">
            <span className="font-bold text-xs font-mono">VS</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/95">Vesper Sandbox</span>
              <span className="text-[10px] text-white/50">Sekarang</span>
            </div>
            <p className="text-[11.5px] text-white/75 leading-snug mt-0.5 truncate">
              {projectTitle ? `Aplikasi "${projectTitle}" berjalan lancar.` : 'Sandbox web siap dijalankan.'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Shortcuts & Swipe up bar */}
      <div className="relative z-20 flex flex-col items-center space-y-4 pb-2">
        {/* Flashlight & Camera Circular Glass Buttons */}
        <div className="w-full flex items-center justify-between px-3">
          {/* Flashlight button */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsFlashlightOn(!isFlashlightOn);
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all active:scale-90 shadow-lg pointer-events-auto ${
              isFlashlightOn
                ? 'bg-white text-black border-white ring-2 ring-white/50 shadow-[0_0_20px_rgba(255,255,255,0.7)]'
                : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
            }`}
            title="Senter"
          >
            <Flashlight className="w-5 h-5" />
          </button>

          {/* Swipe indicator text - Tapping unlocks immediately */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              triggerUnlockAnimation();
            }}
            className="cursor-pointer flex flex-col items-center gap-1 group pointer-events-auto py-1 px-3"
          >
            <span className="text-[11px] font-medium tracking-tight text-white/80 group-hover:text-white transition-colors">
              Gesek ke atas untuk membuka
            </span>
            <ChevronUp className="w-4 h-4 text-white/60 group-hover:text-white transition-colors animate-bounce" />
          </div>

          {/* Camera shortcut button */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsCameraActive(!isCameraActive);
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all active:scale-90 shadow-lg pointer-events-auto ${
              isCameraActive
                ? 'bg-white text-black border-white'
                : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
            }`}
            title="Kamera"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Home Indicator bar */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            triggerUnlockAnimation();
          }}
          className="w-36 h-1 bg-white/70 hover:bg-white rounded-full transition-all cursor-pointer shadow-sm hover:h-1.5 pointer-events-auto"
        />
      </div>

      {/* Simulated Camera Viewfinder Modal */}
      {isCameraActive && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col justify-between p-6 animate-fadeIn pointer-events-auto">
          <div className="flex items-center justify-between text-white text-xs pt-8">
            <span className="font-mono text-yellow-400">RAW 48MP</span>
            <button
              onClick={() => setIsCameraActive(false)}
              className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium"
            >
              Tutup
            </button>
          </div>
          <div className="my-auto flex flex-col items-center justify-center text-white/40 space-y-2">
            <Camera className="w-12 h-12" />
            <span className="text-xs">Sensor Kamera iPhone 17 Pro Max Siap</span>
          </div>
          <div className="flex items-center justify-center pb-6">
            <div className="w-16 h-16 rounded-full border-4 border-white p-1 flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-full active:scale-90 transition-transform" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
