import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, RotateCcw, Check, Sliders, Cpu, ChevronRight } from 'lucide-react';
import { StudioSettings, ClouviaModel, PingResult } from '../types';
import { DEFAULT_BASE_URL, DEFAULT_API_KEY } from '../services/clouviaApi';

interface ParametersPanelProps {
  settings: StudioSettings;
  onUpdateSettings: (updates: Partial<StudioSettings>) => void;
  models: ClouviaModel[];
  isOpen: boolean;
  onClose: () => void;
  onPing: () => void;
  pingResult: PingResult;
  onOpenModelSelector?: () => void;
}

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  settings,
  onUpdateSettings,
  models,
  isOpen,
  onClose,
  onPing,
  pingResult,
  onOpenModelSelector,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(settings.apiKey);
  const [tempBaseUrl, setTempBaseUrl] = useState(settings.baseUrl);
  const [appliedNotice, setAppliedNotice] = useState(false);

  useEffect(() => {
    setTempApiKey(settings.apiKey);
    setTempBaseUrl(settings.baseUrl);
  }, [settings.apiKey, settings.baseUrl]);

  if (!isOpen) return null;

  const handleApplyCredentials = () => {
    onUpdateSettings({
      apiKey: tempApiKey.trim(),
      baseUrl: tempBaseUrl.trim(),
    });
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2500);
    setTimeout(() => onPing(), 100);
  };

  const handleReset = () => {
    setTempApiKey(DEFAULT_API_KEY);
    setTempBaseUrl(DEFAULT_BASE_URL);
    onUpdateSettings({
      apiKey: DEFAULT_API_KEY,
      baseUrl: DEFAULT_BASE_URL,
    });
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2500);
    setTimeout(() => onPing(), 100);
  };

  return (
    <div className="fixed md:static inset-y-0 right-0 z-40 w-80 lg:w-84 bg-[#0c0c0e] border-l border-white/[0.08] flex flex-col shrink-0 overflow-y-auto select-none">
      {/* Header - Apple Navigation Title */}
      <div className="h-12 px-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-white/50" />
          <span className="text-xs font-semibold tracking-tight text-white/90">
            Model & Parameters
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors ios-tap"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5 flex-1 text-xs">
        {/* Model Selector Card */}
        <div className="bg-[#141416] p-3.5 rounded-2xl border border-white/[0.06] space-y-2">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block">
            Model AI
          </label>
          {onOpenModelSelector ? (
            <button
              type="button"
              onClick={onOpenModelSelector}
              className="w-full flex items-center justify-between bg-[#1c1c1e] hover:bg-[#252528] text-white border border-white/10 rounded-xl px-3 py-2.5 text-xs transition-all ios-tap group"
            >
              <div className="flex items-center gap-2 truncate">
                <Cpu className="w-4 h-4 text-white/70 shrink-0" />
                <span className="font-semibold text-white truncate">
                  {models.find((m) => m.slug === settings.selectedModel || m.id === settings.selectedModel)?.displayName || settings.selectedModel}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[#0a84ff] text-[11px] font-medium shrink-0 group-hover:translate-x-0.5 transition-transform">
                <span>Ganti</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ) : (
            <select
              value={settings.selectedModel}
              onChange={(e) => onUpdateSettings({ selectedModel: e.target.value })}
              className="w-full bg-[#1c1c1e] text-white border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-white/30 font-mono transition-colors"
            >
              {models.map((m) => (
                <option key={m.slug || m.id} value={m.slug}>
                  {m.displayName || m.slug}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
            <span>Context: {models.find(m => m.slug === settings.selectedModel)?.contextLength ? `${(models.find(m => m.slug === settings.selectedModel)!.contextLength / 1000).toFixed(0)}k` : '128k'}</span>
            <span>{models.find(m => m.slug === settings.selectedModel)?.category || 'Coding'}</span>
          </div>
        </div>

        {/* Sliders Card */}
        <div className="bg-[#141416] p-3.5 rounded-2xl border border-white/[0.06] space-y-4">
          {/* Temperature */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                Temperature
              </label>
              <span className="font-mono text-white/90 tabular-nums">
                {settings.temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={settings.temperature}
              onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-white h-1.5 bg-[#2c2c2e] rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/40">
              <span>Precise (0.0)</span>
              <span>Creative (2.0)</span>
            </div>
          </div>

          {/* Top P */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                Top P
              </label>
              <span className="font-mono text-white/90 tabular-nums">
                {settings.topP.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.topP}
              onChange={(e) => onUpdateSettings({ topP: parseFloat(e.target.value) })}
              className="w-full accent-white h-1.5 bg-[#2c2c2e] rounded-full appearance-none cursor-pointer"
            />
          </div>

          {/* Max Output Tokens */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                Max Output Tokens
              </label>
              <span className="font-mono text-white/90 tabular-nums">
                {settings.maxTokens}
              </span>
            </div>
            <input
              type="range"
              min="512"
              max="8192"
              step="256"
              value={settings.maxTokens}
              onChange={(e) => onUpdateSettings({ maxTokens: parseInt(e.target.value) })}
              className="w-full accent-white h-1.5 bg-[#2c2c2e] rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* API Credentials Card */}
        <div className="bg-[#141416] p-3.5 rounded-2xl border border-white/[0.06] space-y-3">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block">
            API Endpoint
          </label>

          <div className="space-y-2">
            <div>
              <div className="text-[10.5px] text-white/40 mb-1">Base URL</div>
              <input
                type="text"
                value={tempBaseUrl}
                onChange={(e) => setTempBaseUrl(e.target.value)}
                className="w-full bg-[#1c1c1e] text-white/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <div className="text-[10.5px] text-white/40 mb-1">API Key</div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full bg-[#1c1c1e] text-white/90 border border-white/10 rounded-xl px-2.5 py-1.5 pr-8 text-xs font-mono focus:outline-none focus:border-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleApplyCredentials}
              className="flex-1 py-1.5 px-3 bg-white text-black hover:bg-white/90 rounded-xl font-medium text-xs transition-all ios-tap shadow-sm"
            >
              Apply
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl transition-all ios-tap"
              title="Reset Defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {appliedNotice && (
            <div className="text-[11px] text-[#30d158] flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>Settings updated</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
