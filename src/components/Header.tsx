import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  Code2,
  Play,
  Columns,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Cpu,
  MousePointerClick,
  History,
  Download,
  Menu,
  Share2,
  LogOut,
  User,
  Shield,
} from 'lucide-react';
import { PingResult } from '../types';
import { GoogleUser } from '../services/authService';
import { isOwnerUser } from '../services/ownerService';

interface HeaderProps {
  sessionTitle: string;
  onUpdateTitle?: (title: string) => void;
  onRenameTitle?: (title: string) => void;
  activeView: 'workspace' | 'preview' | 'split';
  setActiveView: (view: 'workspace' | 'preview' | 'split') => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isParamsOpen: boolean;
  setIsParamsOpen: (open: boolean) => void;
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  onOpenGetCode: () => void;
  onOpenDiagnostics: () => void;
  onOpenSkills: () => void;
  onOpenHistory?: () => void;
  snapshotCount?: number;
  activeSkillCount: number;
  pingResult: PingResult;
  selectedModel: string;
  onOpenModelSelector?: () => void;
  onOpenShare?: () => void;
  currentUser?: GoogleUser | null;
  onLogout?: () => void;
  onOpenOwnerPanel?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  sessionTitle,
  onUpdateTitle,
  onRenameTitle,
  activeView,
  setActiveView,
  isSidebarOpen,
  setIsSidebarOpen,
  isParamsOpen,
  setIsParamsOpen,
  isSelectionMode = false,
  onToggleSelectionMode,
  onOpenGetCode,
  onOpenDiagnostics,
  onOpenSkills,
  onOpenHistory,
  snapshotCount = 0,
  activeSkillCount,
  pingResult,
  selectedModel,
  onOpenModelSelector,
  onOpenShare,
  currentUser,
  onLogout,
  onOpenOwnerPanel,
  onOpenNotifications,
  unreadNotificationCount = 0,
}) => {
  const isOwner = isOwnerUser(currentUser);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(sessionTitle);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      if (onRenameTitle) onRenameTitle(titleInput.trim());
      else if (onUpdateTitle) onUpdateTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-13 bg-[#000000]/75 backdrop-blur-2xl border-b border-white/[0.08] px-3 md:px-4 flex items-center justify-between gap-3 shrink-0 select-none z-30 transition-colors">
      {/* Zone 1: Sidebar Toggle & Session Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all ios-tap"
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative w-7 h-7 rounded-xl liquid-glass-chip flex items-center justify-center shrink-0 shadow-sm hover:bg-white/[0.12] active:scale-95 transition-all ios-tap cursor-pointer group"
            title={
              unreadNotificationCount > 0
                ? `Kotak Pemberitahuan (${unreadNotificationCount} baru)`
                : 'Buka Kotak Pemberitahuan Sistem'
            }
            aria-label="Kotak Pemberitahuan Sistem"
          >
            <span className="text-[11px] font-semibold tracking-tight text-white font-mono group-hover:text-white transition-colors">
              V
            </span>
            {/* Unread indicator */}
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-white ring-1 ring-black" />
            )}
          </button>

          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTitleInput(sessionTitle);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="bg-[#1c1c1e] text-xs text-white px-2.5 py-1 rounded-lg border border-white/20 focus:outline-none focus:border-white/40 max-w-[200px]"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-xs font-medium text-white/80 hover:text-white truncate max-w-[140px] sm:max-w-[200px] md:max-w-[260px] text-left transition-colors"
            >
              {sessionTitle}
            </button>
          )}
        </div>
      </div>

      {/* Zone 2: View Switcher (Prompt / Split / Preview) - iOS Segmented Control */}
      <div className="flex items-center bg-[#1c1c1e]/80 p-0.5 rounded-full border border-white/[0.08] shadow-inner">
        <button
          onClick={() => setActiveView('workspace')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-all ios-tap ${
            activeView === 'workspace'
              ? 'bg-[#2c2c2e] text-white shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Prompt</span>
        </button>
        <button
          onClick={() => setActiveView('split')}
          className={`hidden md:flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-all ios-tap ${
            activeView === 'split'
              ? 'bg-[#2c2c2e] text-white shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Split</span>
        </button>
        <button
          onClick={() => setActiveView('preview')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-all ios-tap ${
            activeView === 'preview'
              ? 'bg-[#2c2c2e] text-white shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Play className="w-3 h-3 fill-current text-white/80" />
          <span>Preview</span>
        </button>
      </div>

      {/* Zone 3: Consolidated Actions & Garis Tiga Menu */}
      <div className="flex items-center gap-1.5 shrink-0 relative" ref={menuRef}>
        {/* Owner Panel Button (Only visible to verified owner, never exposes email) */}
        {isOwner && onOpenOwnerPanel && (
          <button
            onClick={onOpenOwnerPanel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/90 hover:text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.18] shadow-[0_2px_10px_rgba(255,255,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all ios-tap"
            title="Buka Owner Panel (Kontrol Pengguna & Broadcast)"
          >
            <Shield className="w-3.5 h-3.5 text-white/90" />
            <span className="hidden sm:inline">Owner Panel</span>
          </button>
        )}

        {/* Settings / Model Selector Button */}
        <button
          onClick={() => {
            if (onOpenModelSelector) onOpenModelSelector();
            else setIsParamsOpen(!isParamsOpen);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-full transition-all ios-tap border ${
            isParamsOpen
              ? 'bg-[#2c2c2e] border-white/20 text-white'
              : 'bg-white/[0.05] border-white/[0.08] text-white/70 hover:text-white hover:border-white/25'
          }`}
          title="Pilih Model AI (Clouvia Router)"
        >
          <Cpu className="w-3.5 h-3.5 text-white/70" />
          <span className="hidden sm:inline font-mono text-[11px] text-white/90 truncate max-w-[90px]">
            {selectedModel}
          </span>
        </button>

        {/* Garis Tiga (Menu) Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`relative flex items-center justify-center p-2 rounded-full border transition-all ios-tap ${
            isMenuOpen
              ? 'bg-[#2c2c2e] border-white/20 text-white shadow-sm'
              : isSelectionMode
              ? 'bg-[#0071e3]/20 border-[#0a84ff]/50 text-[#0a84ff]'
              : 'bg-white/[0.05] border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Menu Fitur (Selection, Skills, History, Network, Export)"
          aria-label="Menu Fitur"
        >
          <Menu className="w-4 h-4" />
          {/* Active indicator dot if Selection Mode is active */}
          {isSelectionMode && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#0a84ff] ring-2 ring-black animate-pulse" />
          )}
        </button>

        {/* Dropdown Menu Popover */}
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#141416]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 animate-fadeIn space-y-1">
            {/* User Google Account Card if logged in */}
            {currentUser && (
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      isOwner
                        ? 'bg-white/[0.12] border border-white/20 text-white shadow-sm'
                        : 'bg-[#0a84ff] text-white'
                    }`}
                  >
                    {isOwner ? <Shield className="w-3.5 h-3.5 text-white/90" /> : currentUser.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-semibold text-white truncate flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      {isOwner && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-white/[0.08] text-white/90 border border-white/[0.12]">
                          Owner
                        </span>
                      )}
                    </div>
                    {isOwner ? (
                      <div className="text-[9.5px] text-white/50 font-mono">
                        Root Administrator
                      </div>
                    ) : (
                      <div className="text-[9.5px] text-white/40 font-mono truncate">
                        {currentUser.email}
                      </div>
                    )}
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMenuOpen(false);
                    }}
                    className="p-1 text-white/40 hover:text-[#ff453a] rounded-lg transition-colors shrink-0"
                    title="Keluar"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Owner Panel Shortcut in Dropdown */}
            {isOwner && onOpenOwnerPanel && (
              <button
                onClick={() => {
                  onOpenOwnerPanel();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/90 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] transition-all ios-tap"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-white/80" />
                  <span>Owner Control Panel</span>
                </div>
                <span className="text-[10px] font-mono text-white/70 bg-white/[0.08] border border-white/[0.12] px-1.5 py-0.5 rounded-md">
                  Root
                </span>
              </button>
            )}

            {/* Header label */}
            <div className="px-3 py-1.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/[0.06] flex items-center justify-between">
              <span>Tools & Workspace</span>
              {isSelectionMode && (
                <span className="text-[#0a84ff] font-normal normal-case flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] animate-ping" />
                  Select ON
                </span>
              )}
            </div>

            {/* 0. Model AI Selector */}
            {onOpenModelSelector && (
              <button
                onClick={() => {
                  onOpenModelSelector();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:bg-white/[0.06] hover:text-white transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-white/70" />
                  <span>Pilih Model</span>
                </div>
                <span className="font-mono text-[10px] text-white/50 bg-white/10 px-2 py-0.5 rounded-full truncate max-w-[80px]">
                  {selectedModel}
                </span>
              </button>
            )}

            {/* 0.1 Bagikan Obrolan */}
            {onOpenShare && (
              <button
                onClick={() => {
                  onOpenShare();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:bg-white/[0.06] hover:text-white transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Share2 className="w-4 h-4 text-white/50" />
                  <span>Bagikan Obrolan</span>
                </div>
                <span className="text-[10px] text-white/40">Tautan</span>
              </button>
            )}

            {/* 1. Selection Mode */}
            {onToggleSelectionMode && (
              <button
                onClick={() => {
                  onToggleSelectionMode();
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isSelectionMode
                    ? 'bg-[#0071e3]/20 text-white border border-[#0a84ff]/30'
                    : 'text-white/80 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MousePointerClick
                    className={`w-4 h-4 ${isSelectionMode ? 'text-[#0a84ff]' : 'text-white/50'}`}
                  />
                  <span>Selection Mode</span>
                </div>
                {isSelectionMode ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0a84ff] text-white">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] text-white/40">Off</span>
                )}
              </button>
            )}

            {/* 2. Skills Catalog */}
            <button
              onClick={() => {
                onOpenSkills();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:bg-white/[0.06] hover:text-white transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-white/50" />
                <span>Skills Catalog</span>
              </div>
              <span className="font-mono text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                {activeSkillCount} active
              </span>
            </button>

            {/* 3. Version History */}
            {onOpenHistory && (
              <button
                onClick={() => {
                  onOpenHistory();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:bg-white/[0.06] hover:text-white transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-white/50" />
                  <span>Version History</span>
                </div>
                {snapshotCount > 0 && (
                  <span className="font-mono text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                    {snapshotCount} snaps
                  </span>
                )}
              </button>
            )}

            {/* 4. Networks & API Diagnostics */}
            <button
              onClick={() => {
                onOpenDiagnostics();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:bg-white/[0.06] hover:text-white transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-white/50" />
                <span>Network & Diagnostics</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    pingResult.status === 'success'
                      ? 'bg-[#30d158]'
                      : pingResult.code === 'API_KEY_MISSING'
                      ? 'bg-white/30'
                      : pingResult.status === 'error'
                      ? 'bg-[#ff453a]'
                      : pingResult.status === 'testing'
                      ? 'bg-[#ffd60a] animate-pulse'
                      : 'bg-white/30'
                  }`}
                />
                <span className="font-mono text-[10px] text-white/50">
                  {pingResult.status === 'testing'
                    ? 'Testing'
                    : pingResult.code === 'API_KEY_MISSING'
                    ? 'No Key'
                    : pingResult.status === 'success'
                    ? 'Online'
                    : 'Offline'}
                </span>
              </div>
            </button>

            <div className="h-px bg-white/[0.06] my-1" />

            {/* 5. Export Code */}
            <button
              onClick={() => {
                onOpenGetCode();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:bg-white/[0.06] hover:text-white transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-white/50" />
                <span>Export Code</span>
              </div>
              <span className="text-[10px] text-white/40">JSON / ZIP</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
