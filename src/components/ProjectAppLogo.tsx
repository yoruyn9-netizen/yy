import React from 'react';

interface ProjectAppLogoProps {
  title?: string;
  size?: number; // size in px, default 56
  className?: string;
}

export const ProjectAppLogo: React.FC<ProjectAppLogoProps> = ({
  title = 'Vibe App',
  size = 56,
  className = '',
}) => {
  // Derive a deterministic visual variant from the title string
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variant = hash % 4;

  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative rounded-[22%] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.5)] border border-white/20 select-none shrink-0 ${className}`}
    >
      {/* Background Gradient Mesh */}
      {variant === 0 ? (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2]" />
      ) : variant === 1 ? (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#00c6ff] via-[#0072ff] to-[#7f00ff]" />
      ) : variant === 2 ? (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#10b981] via-[#06b6d4] to-[#3b82f6]" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#f59e0b] via-[#ec4899] to-[#8b5cf6]" />
      )}

      {/* Glossy Glass Arc Reflection */}
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/35 to-transparent rounded-full pointer-events-none transform -rotate-12" />

      {/* Auto-Generated Procedural AI Emblem SVG */}
      <svg
        className="absolute inset-0 w-full h-full p-2.5 drop-shadow-md"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`grad-${hash}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.65" />
          </linearGradient>
          <filter id={`glow-${hash}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {variant === 0 && (
          /* Isometric Neural Prism */
          <g filter={`url(#glow-${hash})`}>
            <polygon
              points="24,6 40,15 24,24 8,15"
              fill={`url(#grad-${hash})`}
              opacity="0.95"
            />
            <polygon
              points="8,15 24,24 24,42 8,33"
              fill="#ffffff"
              opacity="0.6"
            />
            <polygon
              points="24,24 40,15 40,33 24,42"
              fill="#ffffff"
              opacity="0.8"
            />
            <circle cx="24" cy="24" r="3" fill="#ffffff" />
          </g>
        )}

        {variant === 1 && (
          /* Interlocking Orbital AI Core */
          <g filter={`url(#glow-${hash})`}>
            <circle
              cx="24"
              cy="24"
              r="12"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              opacity="0.85"
            />
            <ellipse
              cx="24"
              cy="24"
              rx="15"
              ry="7"
              transform="rotate(45 24 24)"
              stroke="#ffffff"
              strokeWidth="2"
              opacity="0.75"
            />
            <ellipse
              cx="24"
              cy="24"
              rx="15"
              ry="7"
              transform="rotate(-45 24 24)"
              stroke="#ffffff"
              strokeWidth="2"
              opacity="0.75"
            />
            <circle cx="24" cy="24" r="4" fill="#ffffff" />
          </g>
        )}

        {variant === 2 && (
          /* Dynamic Geometric Diamond Crest */
          <g filter={`url(#glow-${hash})`}>
            <path
              d="M24 7L39 20L24 41L9 20L24 7Z"
              stroke="#ffffff"
              strokeWidth="2.5"
              fill="rgba(255,255,255,0.15)"
            />
            <path
              d="M17 19L24 10L31 19L24 35L17 19Z"
              fill="#ffffff"
              opacity="0.85"
            />
            <circle cx="24" cy="20" r="2.5" fill="#000000" opacity="0.3" />
          </g>
        )}

        {variant === 3 && (
          /* AI Sparks Matrix */
          <g filter={`url(#glow-${hash})`}>
            <path
              d="M24 8C24 16 16 24 8 24C16 24 24 32 24 40C24 32 32 24 40 24C32 24 24 16 24 8Z"
              fill={`url(#grad-${hash})`}
            />
            <circle cx="34" cy="14" r="2" fill="#ffffff" opacity="0.9" />
            <circle cx="14" cy="34" r="1.5" fill="#ffffff" opacity="0.8" />
          </g>
        )}
      </svg>

      {/* Subtle Bottom Rim Shade */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20" />
    </div>
  );
};
