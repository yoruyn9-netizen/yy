import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { StudioSettings, PingResult } from '../types';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StudioSettings;
  pingResult: PingResult;
  onRunPing: (targetApiKey?: string, targetBaseUrl?: string) => Promise<void> | void;
  onUpdateSettings?: (updates: Partial<StudioSettings>) => void;
}

const STORAGE_KEY_SETTINGS = 'ais_vibe_settings_clean_v4';

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({
  isOpen,
  onClose,
  settings,
  pingResult,
  onRunPing,
  onUpdateSettings,
}) => {
  const [editedKey, setEditedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditedKey(settings.apiKey || '');
      setShowKey(false);
      setIsApplying(false);
      setStatusNotice(null);
      setIsClosing(false);
    }
  }, [isOpen, settings.apiKey]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 180);
  };

  const handleApplyApiKey = async () => {
    setIsApplying(true);
    setStatusNotice(null);
    const cleanKey = editedKey.trim();

    if (onUpdateSettings) {
      onUpdateSettings({ apiKey: cleanKey });
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.apiKey = cleanKey;
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(parsed));
    } catch {}

    try {
      if (onRunPing) {
        await onRunPing(cleanKey, settings.baseUrl);
      }
      setStatusNotice('Tersimpan');
      setTimeout(() => setStatusNotice(null), 1500);
    } catch {
      setStatusNotice('Tersimpan');
      setTimeout(() => setStatusNotice(null), 1500);
    } finally {
      setIsApplying(false);
    }
  };

  const handleResetToDefault = async () => {
    setEditedKey('');
    setIsApplying(true);
    setStatusNotice(null);

    if (onUpdateSettings) {
      onUpdateSettings({ apiKey: '' });
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.apiKey = '';
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(parsed));
    } catch {}

    try {
      if (onRunPing) {
        await onRunPing('', settings.baseUrl);
      }
      setStatusNotice('Direset');
      setTimeout(() => setStatusNotice(null), 1500);
    } catch {
      setStatusNotice('Direset');
      setTimeout(() => setStatusNotice(null), 1500);
    } finally {
      setIsApplying(false);
    }
  };

  const hasKey = !!settings.apiKey?.trim();
  const isTesting = pingResult.status === 'testing' || isApplying;
  const isOnline = hasKey && pingResult.status === 'success';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-fadeIn select-none"
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-sm sm:max-w-md bg-[#0d0d0f] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl text-white space-y-3.5 max-h-[92vh] overflow-y-auto ${
          isClosing ? 'animate-modal-close' : 'animate-fadeIn'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Ringkas tanpa teks berlebih */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <span className="text-xs sm:text-sm font-semibold text-white tracking-tight">
            API & Network
          </span>
          <button
            onClick={handleClose}
            className="p-1 text-white/40 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Strip Ringkas - Responsif */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isOnline
                  ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                  : isTesting
                  ? 'bg-white/50 animate-pulse'
                  : 'bg-white/20'
              }`}
            />
            <div className="min-w-0">
              <div className="text-xs font-medium text-white truncate">
                {isTesting
                  ? 'Memeriksa...'
                  : isOnline
                  ? 'Online'
                  : hasKey
                  ? 'Gagal Terhubung'
                  : 'Belum Diatur'}
              </div>
              <div className="text-[10.5px] font-mono text-white/40 truncate">
                {isOnline && pingResult.latencyMs
                  ? `${pingResult.latencyMs}ms · ${settings.selectedModel}`
                  : hasKey
                  ? 'Periksa kunci'
                  : 'API key kosong'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onRunPing(editedKey, settings.baseUrl)}
            disabled={isTesting}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-xs font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Uji</span>
          </button>
        </div>

        {/* Input API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70 font-medium">API Key</span>
            {statusNotice && (
              <span className="text-[11px] text-white/90 animate-fadeIn">
                {statusNotice}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={editedKey}
              onChange={(e) => setEditedKey(e.target.value)}
              placeholder="Tempel API key..."
              className="w-full bg-white/[0.04] text-xs font-mono text-white px-3 py-2 pr-9 rounded-xl border border-white/10 focus:border-white/30 outline-none transition-colors placeholder:text-white/25"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              title={showKey ? 'Sembunyikan' : 'Tampilkan'}
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Action Buttons - Responsif: bersebelahan di mobile & desktop tanpa wrapping aneh */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={isApplying}
            className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleApplyApiKey}
            disabled={isApplying}
            className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 active:scale-[0.98] text-black text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {isApplying ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};
