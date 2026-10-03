import React, { useState } from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import { ResearchSource } from '../types';

interface ResearchSourcesListProps {
  sources: ResearchSource[];
  activeSourceNumber?: number | null;
  onSelectSource: (source: ResearchSource) => void;
}

export const ResearchSourcesList: React.FC<ResearchSourcesListProps> = ({
  sources,
  activeSourceNumber,
  onSelectSource,
}) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-3.5 border-t border-white/[0.08] select-none">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
          Sources ({sources.length})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {sources.map((source) => {
          const isHighlighted = activeSourceNumber === source.number;
          return (
            <SourceCard
              key={source.id}
              source={source}
              isHighlighted={isHighlighted}
              onClick={() => onSelectSource(source)}
            />
          );
        })}
      </div>
    </div>
  );
};

interface SourceCardProps {
  source: ResearchSource;
  isHighlighted?: boolean;
  onClick: () => void;
}

const SourceCard: React.FC<SourceCardProps> = ({ source, isHighlighted, onClick }) => {
  const [faviconFailed, setFaviconFailed] = useState(false);

  return (
    <div
      onClick={onClick}
      className={`group w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 select-none ${
        isHighlighted
          ? 'bg-white/[0.09] border-white/35 shadow-lg ring-1 ring-white/20'
          : 'bg-[#121316] hover:bg-white/[0.06] border-white/[0.08] hover:border-white/20 shadow-sm'
      }`}
      title={source.title}
    >
      <div className="flex items-center justify-between gap-2 w-full min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-4 h-4 rounded shrink-0 overflow-hidden flex items-center justify-center bg-white/[0.05]">
            {!faviconFailed && source.favicon ? (
              <img
                src={source.favicon}
                alt=""
                className="w-3.5 h-3.5 object-contain"
                onError={() => setFaviconFailed(true)}
                loading="lazy"
              />
            ) : (
              <Globe className="w-3 h-3 text-white/40" />
            )}
          </div>
          <span className="text-[11px] font-mono text-white/50 truncate font-medium">
            {source.domain}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono text-white/60 bg-white/[0.08] px-1.5 py-0.5 rounded border border-white/[0.08]">
            #{source.number}
          </span>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Buka website di tab baru"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="text-[12px] font-medium text-white/90 group-hover:text-white line-clamp-2 leading-snug">
        {source.title}
      </div>

      {source.snippet && (
        <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed">
          {source.snippet}
        </p>
      )}
    </div>
  );
};
