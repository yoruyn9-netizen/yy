import React from 'react';

interface WallpaperProps {
  blurLevel?: 'none' | 'light' | 'medium' | 'heavy';
  className?: string;
  dimmed?: boolean;
}

/**
 * Authentic Apple-style flagship stock wallpaper for iPhone 17 Pro Max.
 * Uses deep natural titanium, slate indigo, and warm ambient light refraction.
 * Absolutely NO AI slop, neon glow, or galaxy explosions.
 */
export const Wallpaper: React.FC<WallpaperProps> = ({
  blurLevel = 'none',
  className = '',
  dimmed = false,
}) => {
  const blurClass =
    blurLevel === 'heavy'
      ? 'backdrop-blur-3xl'
      : blurLevel === 'medium'
      ? 'backdrop-blur-2xl'
      : blurLevel === 'light'
      ? 'backdrop-blur-md'
      : '';

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {/* Deep satin base layer */}
      <div className="absolute inset-0 bg-[#07080b]" />

      {/* Layer 1: Titanium Deep Indigo Swirl */}
      <div
        className="absolute -top-[20%] -left-[20%] w-[140%] h-[90%] rounded-[50%] opacity-45 transform -rotate-12"
        style={{
          background:
            'radial-gradient(ellipse at 45% 45%, rgba(67, 56, 202, 0.45) 0%, rgba(30, 27, 75, 0.25) 50%, transparent 80%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Layer 2: Warm Amber / Natural Titanium Refraction Arc */}
      <div
        className="absolute top-[35%] -right-[30%] w-[130%] h-[80%] rounded-[45%] opacity-35 transform rotate-25"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(180, 83, 9, 0.35) 0%, rgba(120, 53, 15, 0.2) 45%, transparent 75%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Layer 3: Slate Blue Ambient Sweep */}
      <div
        className="absolute -bottom-[25%] -left-[20%] w-[140%] h-[90%] rounded-[50%] opacity-40 transform 6"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(14, 116, 144, 0.4) 0%, rgba(15, 23, 42, 0.3) 55%, transparent 80%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Layer 4: Organic Apple sculptural curve silhouette overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-25 mix-blend-screen"
        preserveAspectRatio="none"
        viewBox="0 0 400 850"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M-50,220 C120,160 280,380 450,300 C350,550 180,500 -50,680 Z"
          fill="url(#titanium-flow-1)"
        />
        <path
          d="M450,480 C260,520 180,720 -50,660 C80,820 320,860 450,780 Z"
          fill="url(#titanium-flow-2)"
        />
        <defs>
          <linearGradient id="titanium-flow-1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="titanium-flow-2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#b45309" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Layer 5: Subtle Micro-grain overlay for physical glass texture */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette & Dimming */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          dimmed ? 'bg-black/55' : 'bg-black/15'
        }`}
      />

      {/* Blur layer for system overlays / multitasking */}
      {blurLevel !== 'none' && (
        <div className={`absolute inset-0 ${blurClass} bg-black/30 transition-all duration-300`} />
      )}
    </div>
  );
};
