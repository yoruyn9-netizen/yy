import React from 'react';
import {
  RotateCw,
  Lock,
  Terminal,
  Share2,
  Copy,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SafariBarProps {
  url: string;
  onRefresh: () => void;
  onToggleTerminal: () => void;
  isTerminalOpen: boolean;
  errorCount?: number;
  onToggleAppSwitcher?: () => void;
}

export const SafariBar: React.FC<SafariBarProps> = ({
  url,
  onRefresh,
  onToggleTerminal,
  isTerminalOpen,
  errorCount = 0,
  onToggleAppSwitcher,
}) => {
  return (
    <div className="bg-[#141518]/95 backdrop-blur-2xl border-t border-white/[0.08] px-3.5 py-2 flex flex-col gap-1.5 shrink-0 z-30 select-none">
      {/* URL Capsule */}
      <div className="h-9 rounded-2xl bg-white/[0.08] border border-white/10 px-3 flex items-center justify-between text-xs text-white/80 shadow-inner">
        <div className="flex items-center gap-1.5 text-white/50">
          <span className="text-[11px] font-semibold text-white/60">aA</span>
          <Lock className="w-3 h-3 text-white/40" />
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] truncate max-w-[190px] text-white/90">
          <span className="text-white/40">https://</span>
          <span className="truncate">{url || 'localhost:3000'}</span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="p-1 text-white/50 hover:text-white rounded-md hover:bg-white/10 transition-colors"
          title="Segarkan Halaman"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Safari Bottom Action Icons */}
      <div className="flex items-center justify-between px-2 pt-0.5 text-white/60">
        <button
          type="button"
          onClick={onRefresh}
          className="p-1.5 hover:text-white transition-colors"
          title="Kembali"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          className="p-1.5 opacity-40 cursor-not-allowed"
          title="Maju"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleTerminal}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
            isTerminalOpen
              ? 'bg-[#0a84ff] text-white shadow-sm'
              : errorCount > 0
              ? 'bg-[#ff453a]/20 text-[#ff453a] border border-[#ff453a]/30'
              : 'hover:text-white hover:bg-white/10'
          }`}
          title="Buka Terminal di iPhone"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="text-[10px]">Console</span>
          {errorCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff453a] animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={onToggleAppSwitcher}
          className="p-1.5 hover:text-white transition-colors"
          title="Buka Pengalih Aplikasi"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
