import React, { useState } from 'react';
import { Globe, ChevronDown, ChevronUp, Check, Loader2, AlertCircle } from 'lucide-react';
import { ResearchReport } from '../types';

interface ResearchActivityProps {
  report: ResearchReport;
}

export const ResearchActivity: React.FC<ResearchActivityProps> = ({ report }) => {
  const isFinished = report.status === 'completed' || report.status === 'failed';
  const [isExpanded, setIsExpanded] = useState(!isFinished);

  const titleText =
    report.status === 'searching'
      ? 'Searching the web...'
      : report.status === 'analyzing'
      ? 'Analyzing sources...'
      : report.status === 'failed'
      ? "Web search couldn't be completed"
      : `${report.depth === 'deep' ? 'Deep Research' : 'Web Research'} completed`;

  return (
    <div className="mb-3.5 select-none rounded-2xl border border-white/[0.08] bg-[#0e0f12] text-xs transition-all overflow-hidden shadow-sm">
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-5 h-5 rounded-md bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
            {report.status === 'searching' || report.status === 'analyzing' ? (
              <Loader2 className="w-3 h-3 text-white/80 animate-spin" />
            ) : report.status === 'failed' ? (
              <AlertCircle className="w-3 h-3 text-red-400" />
            ) : (
              <Globe className="w-3 h-3 text-white/70" />
            )}
          </div>

          <div className="flex items-center gap-2 truncate">
            <span className="font-medium text-white/90 truncate">{titleText}</span>
            {report.sources.length > 0 && (
              <span className="text-[10.5px] font-mono text-white/40 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.06] shrink-0">
                {report.sources.length} sources
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-white/40 pl-2 shrink-0">
          <span className="text-[10px] hidden sm:inline">
            {isExpanded ? 'Hide activity' : 'Show activity'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {/* Expandable Activity Details */}
      {isExpanded && (
        <div className="px-3.5 pb-3 pt-1 border-t border-white/[0.05] space-y-2 animate-fadeIn">
          {report.steps.map((step) => (
            <div
              key={step.id}
              className="flex items-start gap-2.5 text-[11px] leading-relaxed"
            >
              <div className="mt-0.5 shrink-0">
                {step.status === 'running' ? (
                  <Loader2 className="w-3 h-3 text-white/60 animate-spin" />
                ) : step.status === 'done' ? (
                  <Check className="w-3 h-3 text-white/70" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-400/80" />
                )}
              </div>
              <span
                className={
                  step.status === 'running'
                    ? 'text-white/80 animate-pulse font-mono'
                    : step.status === 'failed'
                    ? 'text-red-400/90'
                    : 'text-white/60'
                }
              >
                {step.message}
              </span>
            </div>
          ))}

          {report.error && (
            <div className="text-[11px] text-red-400/80 pt-1">
              {report.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
