import React, { useState } from 'react';
import { X, ExternalLink, Globe, Calendar, FileText, Copy, Check } from 'lucide-react';
import { ResearchSource } from '../types';
import { cleanExtractedWebMarkdown } from '../utils/researchCleaner';

interface SourcePreviewModalProps {
  source: ResearchSource | null;
  onClose: () => void;
}

export const SourcePreviewModal: React.FC<SourcePreviewModalProps> = ({ source, onClose }) => {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!source) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 180);
  };

  const rawSnippet = source.content || source.snippet || 'Konten halaman tidak tersedia.';
  const cleanedSnippet = cleanExtractedWebMarkdown(rawSnippet);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paragraphs = cleanedSnippet.split(/\n\n+/).filter(Boolean);

  const renderBlock = (p: string, idx: number) => {
    const trimmed = p.trim();
    if (trimmed.startsWith('# ')) {
      return (
        <h4 key={idx} className="text-sm font-semibold text-white/95 pt-2">
          {trimmed.replace(/^#\s*/, '')}
        </h4>
      );
    }
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      return (
        <h5 key={idx} className="text-xs font-semibold text-white/90 pt-1">
          {trimmed.replace(/^#{2,3}\s*/, '')}
        </h5>
      );
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split('\n').filter(Boolean);
      return (
        <ul key={idx} className="space-y-1.5 my-1 pl-3 border-l border-white/20">
          {items.map((it, i) => (
            <li key={i} className="text-[12px] text-white/80 leading-relaxed list-none">
              {it.replace(/^[-*•]\s*/, '')}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <p key={idx} className="text-[12px] text-white/80 leading-relaxed font-sans">
        {trimmed}
      </p>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none"
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-xl liquid-glass-panel rounded-3xl shadow-2xl text-white flex flex-col max-h-[85vh] overflow-hidden ${
          isClosing ? 'animate-modal-close' : 'animate-fadeIn'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {!faviconFailed && source.favicon ? (
                <img
                  src={source.favicon}
                  alt=""
                  className="w-4 h-4 object-contain"
                  onError={() => setFaviconFailed(true)}
                />
              ) : (
                <Globe className="w-3.5 h-3.5 text-white/60" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white/70 truncate">
                  {source.domain}
                </span>
                <span className="text-[10px] font-mono text-white/60 bg-white/10 px-2 py-0.5 rounded-full border border-white/15 shrink-0 shadow-sm">
                  Sumber [{source.number}]
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-white/50 hover:text-white rounded-full liquid-glass-icon-btn transition-colors shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs scrollbar-thin">
          <div>
            <h3 className="text-sm font-semibold text-white leading-snug tracking-tight">
              {source.title}
            </h3>
            <div className="mt-1 text-[11px] font-mono text-white/40 truncate">
              {source.url}
            </div>
          </div>

          <div className="p-4 rounded-2xl liquid-glass-chip space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-white/50" />
                <span>Extracted Page Content</span>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-medium bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all ios-tap"
                title="Salin konten hasil ekstraksi"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-[#30d158]" />
                    <span className="text-[#30d158]">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1.5 scrollbar-thin">
              {paragraphs.length > 0 ? (
                paragraphs.map((p, idx) => renderBlock(p, idx))
              ) : (
                <p className="text-[12px] text-white/50 italic">
                  Konten halaman bersih tidak tersedia atau dalam format media.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.08] text-[11px] text-white/40">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-white/40" />
              <span>Diekstraksi {new Date(source.retrievedAt).toLocaleTimeString()}</span>
            </div>

            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-100 transition-all ios-tap shadow-sm"
            >
              <span>Kunjungi Sumber</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
