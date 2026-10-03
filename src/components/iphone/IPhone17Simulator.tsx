import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  Terminal,
  X,
  Maximize2,
  Minimize2,
  Smartphone,
  Layers,
  Wrench,
  Trash2,
  Compass,
  Play,
  Moon,
  Sun,
  Layout,
  Sliders,
  ChevronLeft,
} from 'lucide-react';
import { ProjectState } from '../../types';
import { Wallpaper } from './Wallpaper';
import { DynamicIsland } from './DynamicIsland';
import { StatusBar } from './StatusBar';
import { LockScreen } from './LockScreen';
import { HomeScreen } from './HomeScreen';
import { AppSwitcher } from './AppSwitcher';
import { ControlCenter } from './ControlCenter';
import { NotificationCenter } from './NotificationCenter';
import { SafariBar } from './SafariBar';

interface IPhone17SimulatorProps {
  projectState: ProjectState;
  compiledHtml: string;
  consoleLogs: Array<{ level: string; text: string; time: string }>;
  errorCount: number;
  onClearLogs: () => void;
  onFixWithAi?: (errorMessage: string) => void;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  onReloadIframe: () => void;
  iframeKey?: number;
}

export type PhoneScreenState = 'app' | 'home' | 'lock' | 'switcher';

export const IPhone17Simulator: React.FC<IPhone17SimulatorProps> = ({
  projectState,
  compiledHtml,
  consoleLogs,
  errorCount,
  onClearLogs,
  onFixWithAi,
  iframeRef,
  onReloadIframe,
  iframeKey,
}) => {
  // Device Core States
  const [screenState, setScreenState] = useState<PhoneScreenState>('app');
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [browserMode, setBrowserMode] = useState<'safari' | 'standalone'>('safari');

  // Hardware Simulation States
  const [brightness, setBrightness] = useState(90);
  const [volume, setVolume] = useState(75);
  const [isVolumeHudVisible, setIsVolumeHudVisible] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [isWifiOn, setIsWifiOn] = useState(true);
  const [isBluetoothOn, setIsBluetoothOn] = useState(true);
  const [isAirplaneOn, setIsAirplaneOn] = useState(false);
  const [isSilentMode, setIsSilentMode] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  // In-Phone Terminal Drawer State
  const [isPhoneTerminalOpen, setIsPhoneTerminalOpen] = useState(false);
  const [isFixingAi, setIsFixingAi] = useState(false);
  const [fixSuccessMessage, setFixSuccessMessage] = useState<string | null>(null);

  // Live Clock
  const [liveTime, setLiveTime] = useState(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Show transient Dynamic Island feedback
  const triggerFeedback = (msg: string) => {
    setActiveFeedback(msg);
    setTimeout(() => {
      setActiveFeedback((current) => (current === msg ? null : current));
    }, 1800);
  };

  // Hardware button triggers
  const handleVolumeUp = () => {
    setVolume((v) => Math.min(100, v + 8));
    setIsVolumeHudVisible(true);
    triggerFeedback(`Volume ${Math.min(100, volume + 8)}%`);
    setTimeout(() => setIsVolumeHudVisible(false), 1400);
  };

  const handleVolumeDown = () => {
    setVolume((v) => Math.max(0, v - 8));
    setIsVolumeHudVisible(true);
    triggerFeedback(`Volume ${Math.max(0, volume - 8)}%`);
    setTimeout(() => setIsVolumeHudVisible(false), 1400);
  };

  const handleActionButton = () => {
    setIsSilentMode(!isSilentMode);
    triggerFeedback(!isSilentMode ? 'Mode Hening Aktif' : 'Mode Dering Aktif');
  };

  const handlePowerButton = () => {
    if (screenState === 'lock') {
      setScreenState('home');
    } else {
      setScreenState('lock');
      setIsControlCenterOpen(false);
      setIsNotificationCenterOpen(false);
    }
  };

  // Home gesture handler (swipe up from bottom indicator)
  const homeGestureStartY = useRef<number | null>(null);
  const [homeSwipeDelta, setHomeSwipeDelta] = useState(0);

  const handleHomeTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    homeGestureStartY.current = y;
  };

  const handleHomeTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (homeGestureStartY.current === null) return;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = homeGestureStartY.current - y;
    if (delta > 0) {
      setHomeSwipeDelta(Math.min(180, delta));
    }
  };

  const handleHomeTouchEnd = () => {
    if (homeSwipeDelta > 90) {
      // Long swipe opens App Switcher
      setScreenState('switcher');
    } else if (homeSwipeDelta > 30) {
      // Short swipe returns to Home Screen
      setScreenState('home');
    } else {
      // Click returns to Home
      setScreenState('home');
    }
    setHomeSwipeDelta(0);
    homeGestureStartY.current = null;
  };

  // Fix All AI handler
  const handleFixAllAi = () => {
    const errorItems = consoleLogs.filter((l) => l.level === 'error').map((l) => l.text);
    const errorPrompt =
      errorItems.length > 0
        ? errorItems.join('\n')
        : `Tolong periksa dan optimalkan kode proyek "${projectState.title}" agar berjalan mulus tanpa peringatan atau kendala performa.`;

    setIsPhoneTerminalOpen(false);
    if (onFixWithAi) {
      onFixWithAi(errorPrompt);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-h-full py-2 select-none">
      {/* Device Toolbar: Rotate, Browser Mode, Reset */}
      <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-xs text-white/70 shadow-sm z-10 shrink-0">
        <span className="font-semibold text-white/90 pr-1 text-[11px] hidden sm:inline">
          iPhone 17 Pro Max
        </span>

        {/* Rotate Button */}
        <button
          type="button"
          onClick={() => setIsLandscape(!isLandscape)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
            isLandscape ? 'bg-[#0a84ff] text-white shadow-sm' : 'hover:bg-white/10 text-white/80'
          }`}
          title="Putar Orientasi Perangkat"
        >
          <RotateCw className="w-3 h-3" />
          <span>{isLandscape ? 'Lanskap' : 'Potret'}</span>
        </button>

        {/* Mode Toggle: Safari vs Standalone App */}
        <button
          type="button"
          onClick={() => setBrowserMode(browserMode === 'safari' ? 'standalone' : 'safari')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
            browserMode === 'standalone'
              ? 'bg-white/20 text-white border border-white/20'
              : 'hover:bg-white/10 text-white/80'
          }`}
          title="Alihkan Tampilan Browser Safari / Aplikasi Layar Penuh"
        >
          <Compass className="w-3 h-3" />
          <span>{browserMode === 'safari' ? 'Safari Browser' : 'App Mode'}</span>
        </button>

        {/* Power / Lock Shortcut */}
        <button
          type="button"
          onClick={handlePowerButton}
          className="p-1 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-colors"
          title={screenState === 'lock' ? 'Buka Kunci' : 'Kunci Layar'}
        >
          <Moon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Outer Titanium Chassis & Hardware Shell */}
      <div
        className={`relative flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isLandscape
            ? 'w-[780px] max-w-[96vw] h-[390px] max-h-[85vh]'
            : 'w-[392px] max-w-[94vw] h-[820px] max-h-[88vh]'
        }`}
      >
        {/* Physical Hardware Buttons on Left Titanium Edge */}
        {!isLandscape && (
          <div className="absolute -left-[14px] top-24 flex flex-col gap-5 z-0 pointer-events-auto">
            {/* Action Button */}
            <button
              type="button"
              onClick={handleActionButton}
              className="w-2.5 h-8 bg-gradient-to-r from-[#2c2d32] to-[#3a3b42] rounded-l-md border-l border-y border-white/20 shadow-md active:translate-x-0.5 transition-all"
              title="Tombol Aksi (Action Button)"
            />
            {/* Volume Up Button */}
            <button
              type="button"
              onClick={handleVolumeUp}
              className="w-2.5 h-13 bg-gradient-to-r from-[#2c2d32] to-[#3a3b42] rounded-l-md border-l border-y border-white/20 shadow-md active:translate-x-0.5 transition-all"
              title="Volume Naik"
            />
            {/* Volume Down Button */}
            <button
              type="button"
              onClick={handleVolumeDown}
              className="w-2.5 h-13 bg-gradient-to-r from-[#2c2d32] to-[#3a3b42] rounded-l-md border-l border-y border-white/20 shadow-md active:translate-x-0.5 transition-all"
              title="Volume Turun"
            />
          </div>
        )}

        {/* Physical Hardware Buttons on Right Titanium Edge */}
        {!isLandscape && (
          <div className="absolute -right-[14px] top-32 flex flex-col gap-10 z-0 pointer-events-auto">
            {/* Side / Power Button */}
            <button
              type="button"
              onClick={handlePowerButton}
              className="w-2.5 h-16 bg-gradient-to-l from-[#2c2d32] to-[#3a3b42] rounded-r-md border-r border-y border-white/20 shadow-md active:-translate-x-0.5 transition-all"
              title="Tombol Daya / Kunci Layar"
            />
            {/* Camera Control Button */}
            <button
              type="button"
              onClick={() => triggerFeedback('Camera Control Active')}
              className="w-2.5 h-10 bg-gradient-to-l from-[#26272b] to-[#34353b] rounded-r-md border-r border-y border-white/15 shadow-md active:-translate-x-0.5 transition-all"
              title="Camera Control"
            />
          </div>
        )}

        {/* Main Phone Hardware Body (Titanium Frame + OLED Display) */}
        <div
          style={{
            filter: `brightness(${brightness}%)`,
            transition: 'filter 0.15s ease',
          }}
          className="relative w-full h-full rounded-[54px] border-[9px] border-[#1d1f24] bg-black shadow-[0_45px_120px_-25px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.18)] overflow-hidden flex flex-col select-none ring-1 ring-white/10 z-10"
        >
          {/* Subtle Titanium Edge Bevel & Ambient Highlight */}
          <div className="absolute inset-0 rounded-[45px] pointer-events-none ring-1 ring-inset ring-white/10 z-50" />

          {/* iOS Status Bar */}
          <StatusBar
            time={liveTime}
            theme="light"
            batteryLevel={98}
            onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
            onOpenControlCenter={() => setIsControlCenterOpen(true)}
          />

          {/* Dynamic Island */}
          <DynamicIsland
            projectTitle={projectState.title}
            isAppOpen={screenState === 'app'}
            onOpenApp={() => setScreenState('app')}
            onRefreshPreview={onReloadIframe}
            onOpenTerminal={() => {
              setScreenState('app');
              setIsPhoneTerminalOpen(true);
            }}
            errorCount={errorCount}
            silentMode={isSilentMode}
            activeFeedback={activeFeedback}
          />

          {/* Volume HUD Slider on Screen Left Edge */}
          {isVolumeHudVisible && (
            <div className="absolute left-2.5 top-28 z-[70] w-1.5 h-20 bg-white/20 backdrop-blur-md rounded-full overflow-hidden p-0.5 animate-fadeIn">
              <div
                style={{ height: `${volume}%` }}
                className="w-full bg-white rounded-full transition-all duration-100"
              />
            </div>
          )}

          {/* Screen Content Layers based on screenState */}
          <div className="flex-1 flex flex-col relative min-h-0 bg-black overflow-hidden">
            {/* 1. LOCK SCREEN STATE */}
            {screenState === 'lock' && (
              <LockScreen
                time={liveTime}
                projectTitle={projectState.title}
                onUnlock={() => setScreenState('home')}
              />
            )}

            {/* 2. HOME SCREEN STATE (Always mounted underneath for fluid iOS zoom animation) */}
            <div
              style={{
                transform: screenState === 'app' ? 'scale(1.08)' : 'scale(1)',
                opacity: screenState === 'app' ? 0 : 1,
                filter: screenState === 'app' ? 'blur(10px)' : 'none',
                pointerEvents: screenState === 'home' ? 'auto' : 'none',
                transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.35s ease, filter 0.35s ease',
              }}
              className="absolute inset-0 z-20 flex flex-col"
            >
              <HomeScreen
                projectTitle={projectState.title}
                onLaunchProjectApp={() => setScreenState('app')}
                onOpenTerminal={() => {
                  setScreenState('app');
                  setIsPhoneTerminalOpen(true);
                }}
                onOpenSafari={() => setScreenState('app')}
                errorCount={errorCount}
              />
            </div>

            {/* 3. MULTITASKING APP SWITCHER STATE */}
            {screenState === 'switcher' && (
              <AppSwitcher
                projectTitle={projectState.title}
                compiledHtml={compiledHtml}
                consoleLogs={consoleLogs}
                onSelectApp={(id) => {
                  if (id === 'terminal') {
                    setScreenState('app');
                    setIsPhoneTerminalOpen(true);
                  } else {
                    setScreenState('app');
                  }
                }}
                onClose={() => setScreenState('app')}
              />
            )}

            {/* 4. ACTIVE WEB APPLICATION SCREEN (Fluid iOS Spring Launch & Close) */}
            <div
              style={{
                transform:
                  screenState === 'app'
                    ? homeSwipeDelta > 0
                      ? `scale(${1 - (homeSwipeDelta / 180) * 0.15})`
                      : 'scale(1)'
                    : 'scale(0.18)',
                opacity: screenState === 'app' ? 1 : 0,
                borderRadius:
                  screenState === 'app'
                    ? homeSwipeDelta > 0
                      ? '36px'
                      : '0px'
                    : '48px',
                pointerEvents: screenState === 'app' ? 'auto' : 'none',
                transition:
                  homeSwipeDelta > 0
                    ? 'none'
                    : 'transform 0.42s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.32s ease, border-radius 0.38s ease',
                transformOrigin: '50% 30%',
              }}
              className="absolute inset-0 z-30 flex flex-col bg-black overflow-hidden"
            >
              {/* Real Live Sandbox Iframe Content */}
              <iframe
                key={iframeKey}
                ref={iframeRef as any}
                srcDoc={compiledHtml}
                title="iPhone 17 Pro Max Live Preview"
                sandbox="allow-scripts allow-modals allow-same-origin"
                className="w-full flex-1 border-0 bg-transparent overflow-auto"
              />

              {/* Optional Safari Bottom Navigation Bar */}
              {browserMode === 'safari' && (
                <SafariBar
                  url={projectState.title ? `${projectState.title.toLowerCase().replace(/[^a-z0-9]/g, '')}.local:3000` : 'localhost:3000'}
                  onRefresh={onReloadIframe}
                  onToggleTerminal={() => setIsPhoneTerminalOpen(!isPhoneTerminalOpen)}
                  isTerminalOpen={isPhoneTerminalOpen}
                  errorCount={errorCount}
                  onToggleAppSwitcher={() => setScreenState('switcher')}
                />
              )}

                {/* In-Phone Terminal & Diagnostic Drawer Sheet */}
                {isPhoneTerminalOpen && (
                  <div className="absolute inset-x-0 bottom-0 z-50 bg-[#121316]/98 backdrop-blur-2xl rounded-t-[36px] border-t border-white/20 shadow-[0_-20px_50px_rgba(0,0,0,0.9)] flex flex-col h-[75%] transition-transform duration-300 ease-out animate-fadeIn">
                    {/* iOS Grab Handle */}
                    <div
                      className="w-10 h-1 bg-white/30 rounded-full mx-auto my-2.5 shrink-0 cursor-pointer"
                      onClick={() => setIsPhoneTerminalOpen(false)}
                    />

                    {/* Terminal Header inside iPhone */}
                    <div className="px-4 py-2 border-b border-white/[0.08] flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-[#30d158]" />
                        <span className="text-xs font-semibold text-white">
                          Terminal & Diagnostics
                        </span>
                        {errorCount > 0 ? (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#ff453a]/20 text-[#ff453a] text-[10px] font-bold">
                            {errorCount} error
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/40 font-mono">
                            ({consoleLogs.length})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* FIX ALL AI BUTTON */}
                        <button
                          type="button"
                          onClick={handleFixAllAi}
                          disabled={isFixingAi}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0a84ff] hover:bg-[#0071e3] active:bg-[#005bb5] text-white text-[10.5px] font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
                          title="Perbaiki semua error secara otomatis menggunakan AI"
                        >
                          {isFixingAi ? (
                            <RotateCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Wrench className="w-3 h-3" />
                          )}
                          <span>Fix All AI</span>
                        </button>

                        <button
                          type="button"
                          onClick={onClearLogs}
                          className="p-1 text-white/40 hover:text-white rounded-md hover:bg-white/10"
                          title="Bersihkan log"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsPhoneTerminalOpen(false)}
                          className="p-1 text-white/40 hover:text-white rounded-md hover:bg-white/10"
                          title="Tutup Terminal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Fix Notification Banner */}
                    {fixSuccessMessage && (
                      <div className="mx-3 my-2 p-2 rounded-xl bg-[#0a84ff]/20 border border-[#0a84ff]/30 text-[#60a5fa] text-[11px] flex items-center gap-2 animate-fadeIn shrink-0">
                        <RotateCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                        <span>{fixSuccessMessage}</span>
                      </div>
                    )}

                    {/* Console Logs list */}
                    <div className="flex-1 overflow-y-auto p-3 font-mono text-[10.5px] space-y-1.5 scrollbar-thin">
                      {consoleLogs.length === 0 ? (
                        <div className="text-white/30 italic py-8 text-center text-xs">
                          Tidak ada error atau pesan log di konsol web.
                        </div>
                      ) : (
                        consoleLogs.map((log, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-xl border flex flex-col gap-1 ${
                              log.level === 'error'
                                ? 'bg-[#ff453a]/10 border-[#ff453a]/25 text-[#ff453a]'
                                : log.level === 'warn'
                                ? 'bg-[#ffd60a]/10 border-[#ffd60a]/20 text-[#ffd60a]'
                                : 'bg-white/[0.03] border-white/5 text-white/80'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[9.5px] opacity-60">
                              <span>{log.time}</span>
                              <span className="uppercase font-bold tracking-wider">
                                {log.level}
                              </span>
                            </div>
                            <div className="break-all font-mono leading-relaxed">
                              {log.text}
                            </div>
                            {log.level === 'error' && onFixWithAi && (
                              <button
                                type="button"
                                onClick={() => onFixWithAi(log.text)}
                                className="self-end mt-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff453a]/20 hover:bg-[#ff453a]/30 text-[#ff453a] text-[10px] font-sans font-medium transition-all"
                              >
                                <Wrench className="w-2.5 h-2.5" />
                                <span>Fix AI</span>
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

            {/* CONTROL CENTER OVERLAY (Top-Right Swipe) */}
            {isControlCenterOpen && (
              <ControlCenter
                onClose={() => setIsControlCenterOpen(false)}
                brightness={brightness}
                onBrightnessChange={setBrightness}
                volume={volume}
                onVolumeChange={setVolume}
                isFlashlightOn={isFlashlightOn}
                onToggleFlashlight={() => setIsFlashlightOn(!isFlashlightOn)}
                isWifiOn={isWifiOn}
                onToggleWifi={() => setIsWifiOn(!isWifiOn)}
                isBluetoothOn={isBluetoothOn}
                onToggleBluetooth={() => setIsBluetoothOn(!isBluetoothOn)}
                isAirplaneOn={isAirplaneOn}
                onToggleAirplane={() => setIsAirplaneOn(!isAirplaneOn)}
                isRotationLocked={!isLandscape}
                onToggleRotationLock={() => setIsLandscape(!isLandscape)}
              />
            )}

            {/* NOTIFICATION CENTER OVERLAY (Top-Left Swipe) */}
            {isNotificationCenterOpen && (
              <NotificationCenter
                onClose={() => setIsNotificationCenterOpen(false)}
                time={liveTime}
                projectTitle={projectState.title}
              />
            )}
          </div>

          {/* Interactive iOS Home Indicator (Swipe up gesture to return Home or App Switcher) */}
          <div
            onMouseDown={handleHomeTouchStart}
            onMouseMove={handleHomeTouchMove}
            onMouseUp={handleHomeTouchEnd}
            onTouchStart={handleHomeTouchStart}
            onTouchMove={handleHomeTouchMove}
            onTouchEnd={handleHomeTouchEnd}
            className="h-6 flex items-center justify-center cursor-pointer group shrink-0 select-none pb-1 z-50 pointer-events-auto bg-transparent"
            title="Gesek ke atas untuk Beranda / Tahan untuk Pengalih Aplikasi"
          >
            <div className="w-36 h-1 bg-white/60 group-hover:bg-white group-hover:h-1.5 active:scale-95 rounded-full transition-all shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
