import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown, RotateCw, Check } from 'lucide-react';

interface GlobalPullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children?: React.ReactNode;
}

const TOP_TRIGGER_ZONE = 64; // Area tarik dibatasi hanya di header paling atas (<= 64px) agar scroll biasa aman
const PULL_THRESHOLD = 80; // Ambang batas tarikan yang disengaja
const MAX_PULL = 120;

export const GlobalPullToRefresh: React.FC<GlobalPullToRefreshProps> = ({
  onRefresh,
  children,
}) => {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const triggerRefresh = async () => {
    setIsRefreshing(true);
    setPullY(PULL_THRESHOLD * 0.7);

    try {
      await onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPullY(0);
      }, 550);
    }
  };

  useEffect(() => {
    // Touch handlers for mobile & tablet
    // Dibatasi HANYA pada area atas (header / top edge <= TOP_TRIGGER_ZONE)
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshing) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      // Hanya aktif jika sentuhan dimulai dari area atas layar (header <= 64px)
      // Mencegah scroll chat/kode/halaman biasa ter-refresh tanpa sengaja
      if (touch.clientY > TOP_TRIGGER_ZONE) {
        isDraggingRef.current = false;
        return;
      }

      // Jangan aktif jika menyentuh input form, button, atau textarea
      const target = touch.target as HTMLElement | null;
      if (target && (target.closest('input') || target.closest('textarea') || target.closest('button'))) {
        isDraggingRef.current = false;
        return;
      }

      startYRef.current = touch.clientY;
      startXRef.current = touch.clientX;
      isDraggingRef.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || isRefreshing || e.touches.length !== 1) return;
      if (window.scrollY > 0) {
        isDraggingRef.current = false;
        setPullY(0);
        return;
      }

      const touch = e.touches[0];
      const deltaY = touch.clientY - startYRef.current;
      const deltaX = Math.abs(touch.clientX - startXRef.current);

      // Jika pergerakan lebih dominan horizontal, abaikan
      if (deltaX > deltaY) {
        return;
      }

      if (deltaY > 0) {
        // Damped rubber-band curve
        const damped = Math.min(MAX_PULL, Math.pow(deltaY, 0.82));
        setPullY(damped);
      } else {
        setPullY(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isDraggingRef.current || isRefreshing) return;
      isDraggingRef.current = false;

      if (pullY >= PULL_THRESHOLD) {
        triggerRefresh();
      } else {
        setPullY(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [pullY, isRefreshing]);

  return (
    <>
      {/* Top Floating Pill Capsule for the Whole Website */}
      {(pullY > 0 || isRefreshing || isSuccess) && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[999999] pointer-events-none select-none transition-all duration-150 ease-out flex items-center justify-center"
          style={{
            top: `${Math.max(14, Math.min(pullY * 0.75, 58))}px`,
          }}
        >
          <div
            className={`flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-200 ${
              isSuccess
                ? 'bg-[#18181b]/95 border-emerald-500/50 text-emerald-400 scale-105'
                : isRefreshing
                ? 'bg-[#18181b]/95 border-[#0a84ff]/50 text-white'
                : pullY >= PULL_THRESHOLD
                ? 'bg-[#18181b]/95 border-emerald-500/50 text-[#30d158] scale-105'
                : 'bg-[#18181b]/90 border-white/20 text-white/80'
            }`}
          >
            {isSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                <span className="text-xs font-semibold text-emerald-300">
                  Aplikasi Diperbarui
                </span>
              </>
            ) : isRefreshing ? (
              <>
                <RotateCw className="w-3.5 h-3.5 text-[#0a84ff] animate-spin shrink-0" />
                <span className="text-xs font-medium text-white/90">
                  Menyegarkan AI Studio...
                </span>
              </>
            ) : pullY >= PULL_THRESHOLD ? (
              <>
                <RotateCw
                  className="w-3.5 h-3.5 text-[#30d158] shrink-0 transition-transform"
                  style={{
                    transform: `rotate(${(pullY / PULL_THRESHOLD) * 360}deg)`,
                  }}
                />
                <span className="text-xs font-semibold text-[#30d158]">
                  Lepas untuk menyegarkan
                </span>
              </>
            ) : (
              <>
                <ArrowDown
                  className="w-3.5 h-3.5 text-white/70 shrink-0 transition-transform"
                  style={{
                    transform: `translateY(${Math.min(pullY * 0.08, 4)}px)`,
                  }}
                />
                <span className="text-xs font-medium text-white/75">
                  Tarik untuk merefresh ({Math.round((pullY / PULL_THRESHOLD) * 100)}%)
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Website Content with subtle elastic transform */}
      <div
        style={{
          transform: pullY > 0 ? `translateY(${Math.min(pullY * 0.35, 28)}px)` : 'none',
          transition: pullY === 0 ? 'transform 0.25s ease-out' : 'none',
        }}
        className="w-full h-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col"
      >
        {children}
      </div>
    </>
  );
};
