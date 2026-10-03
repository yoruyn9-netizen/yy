import React, { useState, useMemo } from 'react';
import { X, Search, Check, Cpu } from 'lucide-react';
import { ClouviaModel } from '../types';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ClouviaModel[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

const CATEGORIES = [
  'Semua',
  'Coding High',
  'DeepSeek',
  'Claude',
  'Gemini',
  'Kimi',
  'MiniMax',
  'GLM',
];

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  models,
  selectedModel,
  onSelectModel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchCat =
        activeCategory === 'Semua' ||
        m.category.toLowerCase() === activeCategory.toLowerCase() ||
        m.displayName.toLowerCase().includes(activeCategory.toLowerCase()) ||
        m.slug.toLowerCase().includes(activeCategory.toLowerCase());

      const matchSearch =
        !searchQuery.trim() ||
        m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [models, activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[82vh] bg-[#0c0c0e] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-white">
                Pilih Model
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Tutup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-3.5 sm:px-5 space-y-2.5 bg-[#09090b] border-b border-white/[0.06] shrink-0">
          {/* Minimalist Search Bar */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] text-xs text-white pl-9 pr-8 py-2 rounded-full border border-white/10 focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-white/40 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Minimalist Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 text-[11px] rounded-full shrink-0 transition-all ios-tap ${
                  activeCategory === cat
                    ? 'bg-white text-black font-medium shadow-sm'
                    : 'bg-white/[0.03] text-white/50 hover:text-white hover:bg-white/[0.08] border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Model List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 scrollbar-thin">
          {filteredModels.length === 0 ? (
            <div className="py-12 text-center text-xs text-white/40">
              Tidak ada model ditemukan
            </div>
          ) : (
            filteredModels.map((m) => {
              const isSelected = m.slug === selectedModel || m.id === selectedModel;
              const contextInK = m.contextLength ? Math.round(m.contextLength / 1000) : 128;

              return (
                <div
                  key={m.slug || m.id}
                  onClick={() => {
                    onSelectModel(m.slug || m.id);
                    onClose();
                  }}
                  className={`group relative px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer ios-tap flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-white/10 border-white/30 shadow-sm'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white truncate">
                        {m.displayName || m.slug}
                      </span>
                      <span className="font-mono text-[10px] text-white/40">
                        {m.slug}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/40">
                      <span className="font-mono text-[10px]">{contextInK}k</span>
                      <span className="text-white/20">·</span>
                      <span>{m.category}</span>
                      {m.supportsThinking && (
                        <>
                          <span className="text-white/20">·</span>
                          <span className="text-white/50 text-[10px]">Reasoning</span>
                        </>
                      )}
                      {m.supportsVision && (
                        <>
                          <span className="text-white/20">·</span>
                          <span className="text-white/50 text-[10px]">Vision</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Clean Radio Check Indicator */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-white border-white text-black'
                        : 'border-white/20 group-hover:border-white/40'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
