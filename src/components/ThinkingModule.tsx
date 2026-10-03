import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileCode,
  FilePlus,
  Terminal,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { ThinkingStep } from '../types';

interface ThinkingModuleProps {
  steps?: ThinkingStep[];
  isStreaming?: boolean;
}

export const ThinkingModule: React.FC<ThinkingModuleProps> = ({
  steps,
  isStreaming,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="my-2.5 rounded-2xl border border-white/10 bg-[#0d0e12]/80 overflow-hidden text-xs shadow-sm backdrop-blur-md">
      {/* Header bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2 flex items-center justify-between text-left hover:bg-white/5 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#a1a1aa] shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#a1a1aa] shrink-0" />
          )}
          <Cpu className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
          <span className="font-medium text-[12px] text-[#f4f4f5]">
            Modul Berpikir & Struktur Komponen
          </span>
          {isStreaming && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
          )}
        </div>

        <span className="font-mono text-[10.5px] text-[#71717a] bg-white/5 px-2 py-0.5 rounded-full">
          {steps.length} aksi
        </span>
      </button>

      {/* Thinking Steps Details */}
      {isOpen && (
        <div className="p-3 pt-1 border-t border-white/5 space-y-1.5 font-mono text-[11.5px] bg-[#090a0d]">
          {steps.map((st) => {
            const isFileAction = st.action === 'create_file' || st.action === 'edit_file';
            return (
              <div
                key={st.id}
                className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.02] text-[#d4d4d8] border border-white/5"
              >
                {st.action === 'create_file' ? (
                  <FilePlus className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
                ) : st.action === 'edit_file' ? (
                  <FileCode className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                ) : (
                  <Terminal className="w-3.5 h-3.5 text-[#a1a1aa] shrink-0" />
                )}

                <span className="flex-1 truncate">
                  {st.detail}
                </span>

                {st.target && (
                  <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[#93c5fd] text-[10px]">
                    {st.target}
                  </span>
                )}

                <CheckCircle2 className="w-3 h-3 text-[#22c55e]/70 shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
