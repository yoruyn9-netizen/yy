import React, { useState, useEffect } from 'react';
import { Play, RotateCw, Terminal, Bell, Volume2, X } from 'lucide-react';
import { ProjectAppLogo } from '../ProjectAppLogo';

interface DynamicIslandProps {
  projectTitle: string;
  isAppOpen: boolean;
  onOpenApp: () => void;
  onRefreshPreview: () => void;
  onOpenTerminal: () => void;
  errorCount?: number;
  silentMode?: boolean;
  activeFeedback?: string | null;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  projectTitle,
  isAppOpen,
  onOpenApp,
  onRefreshPreview,
  onOpenTerminal,
  errorCount = 0,
  silentMode = false,
  activeFeedback = null,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [waveStep, setWaveStep] = useState(0);

  // Equalizer wave animation
  useEffect(() => {
    const timer = setInterval(() => {
      setWaveStep((s) => (s + 1) % 4);
    }, 380);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-[60] select-none pointer-events-auto">
      {/* Dynamic Island Capsule */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`bg-black text-white cursor-pointer transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_8px_28px_rgba(0,0,0,0.95)] border border-white/[0.06] overflow-hidden flex flex-col justify-center ${
          isExpanded
            ? 'w-[342px] h-[165px] rounded-[44px] p-4.5 bg-black/98 backdrop-blur-3xl'
            : activeFeedback
            ? 'w-[190px] h-[35px] rounded-full px-4 flex-row items-center justify-between'
            : !isAppOpen
            ? 'w-[148px] h-[35px] rounded-full px-3.5 flex-row items-center justify-between hover:scale-[1.02] active:scale-[0.98]'
            : 'w-[124px] h-[35px] rounded-full px-3.5 flex-row items-center justify-between hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {isExpanded ? (
          /* EXPANDED INTERACTIVE ISLAND */
          <div className="flex flex-col justify-between h-full w-full animate-fadeIn select-none">
            {/* Top row: Project status and camera optics */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 shadow-inner">
                  <ProjectAppLogo title={projectTitle} size={28} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-white truncate leading-tight">
                    {projectTitle || 'Vesper Sandbox'}
                  </div>
                  <div className="text-[10px] text-white/50 flex items-center gap-1 font-mono mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
                    <span>localhost:3000 · Live</span>
                  </div>
                </div>
              </div>

              {/* Physical camera optics & close */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Micro camera optics module */}
                <div className="w-3 h-3 rounded-full bg-[#0a0a0c] ring-1 ring-white/10 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-[#007aff]/80" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="p-1 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Middle row: Live Equalizer & Status Platter */}
            <div className="flex items-center justify-between bg-white/[0.04] border border-white/[0.06] rounded-2xl px-3.5 py-2">
              <div className="flex items-center gap-1.5 h-4">
                {[12, 18, 9, 15, 20, 11, 16].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      height: `${Math.max(4, (h * ((waveStep + i) % 4 + 1)) / 3.2)}px`,
                      transition: 'height 0.25s ease',
                    }}
                    className="w-[2.5px] bg-[#30d158] rounded-full"
                  />
                ))}
                <span className="text-[10px] font-mono text-white/60 ml-2">Preview Aktif</span>
              </div>

              {errorCount > 0 ? (
                <span className="text-[10.5px] font-mono text-[#ff453a] font-semibold bg-[#ff453a]/15 px-2 py-0.5 rounded-full">
                  {errorCount} error
                </span>
              ) : (
                <span className="text-[10px] font-mono text-[#30d158]/80">0 issues</span>
              )}
            </div>

            {/* Bottom row: Quick action buttons */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefreshPreview();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-[11px] font-medium text-white transition-all"
              >
                <RotateCw className="w-3 h-3" />
                <span>Reload</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTerminal();
                  setIsExpanded(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-[11px] font-medium text-white transition-all"
              >
                <Terminal className="w-3 h-3 text-[#30d158]" />
                <span>Console</span>
              </button>

              {!isAppOpen && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenApp();
                    setIsExpanded(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#0a84ff] hover:bg-[#0071e3] active:scale-95 text-[11px] font-semibold text-white transition-all shadow-md"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Buka</span>
                </button>
              )}
            </div>
          </div>
        ) : activeFeedback ? (
          /* SYSTEM NOTIFICATION / ACTION FEEDBACK */
          <>
            <div className="flex items-center gap-2 text-white/90 truncate min-w-0">
              {silentMode ? (
                <Bell className="w-3.5 h-3.5 text-[#ff453a] shrink-0" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#30d158] shrink-0" />
              )}
              <span className="text-[11px] font-medium truncate">{activeFeedback}</span>
            </div>
            {/* Front camera lens */}
            <div className="w-[10px] h-[10px] rounded-full bg-[#0a0a0c] ring-1 ring-white/10 shrink-0 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#007aff]/70" />
            </div>
          </>
        ) : !isAppOpen ? (
          /* COMPACT PREVIEW RUNNING STATE: Symmetrical & Ultra-clean */
          <>
            {/* Leading: Green live ring with pulse */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#30d158] ring-2 ring-[#30d158]/30 animate-pulse" />
              <span className="text-[10px] font-semibold text-white/80 font-mono tracking-tight">
                LIVE
              </span>
            </div>

            {/* Trailing: Micro Equalizer Bars + Camera Lens */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-end gap-[1.5px] h-2.5">
                <div
                  style={{ height: `${waveStep % 2 === 0 ? 8 : 4}px` }}
                  className="w-[2px] bg-[#30d158] rounded-full transition-all duration-200"
                />
                <div
                  style={{ height: `${waveStep % 2 === 0 ? 4 : 10}px` }}
                  className="w-[2px] bg-[#30d158] rounded-full transition-all duration-200"
                />
                <div
                  style={{ height: `${waveStep % 3 === 0 ? 9 : 5}px` }}
                  className="w-[2px] bg-[#30d158] rounded-full transition-all duration-200"
                />
              </div>

              {/* Physical front camera lens */}
              <div className="w-[10px] h-[10px] rounded-full bg-[#0a0a0c] ring-1 ring-white/10 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#007aff]/70" />
              </div>
            </div>
          </>
        ) : (
          /* DEFAULT IN-APP COMPACT ISLAND: Pure Apple Hardware Sensor Module */
          <>
            {/* Left: Face ID TrueDepth Sensor */}
            <div className="w-[9px] h-[9px] rounded-full bg-[#060608]" />

            {/* Right: Front Camera Lens with Sapphire Coating Highlight */}
            <div className="w-[11px] h-[11px] rounded-full bg-[#0a0a0d] ring-1 ring-white/10 flex items-center justify-center">
              <div className="w-[3.5px] h-[3.5px] rounded-full bg-[#007aff]/80 shadow-[0_0_2px_rgba(0,122,255,0.8)]" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
