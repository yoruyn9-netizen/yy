import React, { useState } from 'react';
import { Compass, Terminal, Settings, X, Wifi, Bluetooth, Radio, Battery, ChevronRight } from 'lucide-react';
import { ProjectAppLogo } from '../ProjectAppLogo';
import { Wallpaper } from './Wallpaper';

interface AppCard {
  id: string;
  title: string;
  iconType: 'project' | 'safari' | 'terminal' | 'settings';
}

interface AppSwitcherProps {
  projectTitle: string;
  onSelectApp: (appId: string) => void;
  onClose: () => void;
  compiledHtml?: string;
  consoleLogs?: Array<{ level: string; text: string; time: string }>;
}

export const AppSwitcher: React.FC<AppSwitcherProps> = ({
  projectTitle,
  onSelectApp,
  onClose,
  compiledHtml,
  consoleLogs = [],
}) => {
  const [cards, setCards] = useState<AppCard[]>([
    {
      id: 'project',
      title: projectTitle || 'Project App',
      iconType: 'project',
    },
    {
      id: 'safari',
      title: 'Safari',
      iconType: 'safari',
    },
    {
      id: 'terminal',
      title: 'Terminal',
      iconType: 'terminal',
    },
    {
      id: 'settings',
      title: 'Pengaturan',
      iconType: 'settings',
    },
  ]);

  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissingId(id);
    setTimeout(() => {
      setCards((prev) => prev.filter((c) => c.id !== id));
      setDismissingId(null);
      if (cards.length <= 1) {
        onClose();
      }
    }, 240);
  };

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 flex flex-col justify-between py-6 select-none overflow-hidden animate-fadeIn"
    >
      <Wallpaper blurLevel="heavy" dimmed />

      {/* Top Space for Status Bar & Header */}
      <div className="h-10 pt-4 text-center pointer-events-none z-10">
        <span className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">
          Pengalih Aplikasi
        </span>
      </div>

      {/* Horizontal Multitasking Cards Carousel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-5 overflow-x-auto px-8 py-2 scrollbar-none snap-x snap-mandatory my-auto relative z-20"
      >
        {cards.map((card) => {
          const isDismissing = dismissingId === card.id;

          return (
            <div
              key={card.id}
              onClick={() => onSelectApp(card.id)}
              style={{
                transform: isDismissing ? 'translateY(-140%) scale(0.7)' : 'none',
                opacity: isDismissing ? 0 : 1,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="flex flex-col items-center gap-2.5 shrink-0 snap-center cursor-pointer group active:scale-95 transition-transform"
            >
              {/* iOS-Style Floating App Header (Above the Card) */}
              <div className="flex items-center justify-between w-full px-1 text-white">
                <div className="flex items-center gap-2 truncate min-w-0">
                  {card.iconType === 'project' ? (
                    <div className="w-6 h-6 rounded-lg overflow-hidden shadow-sm shrink-0">
                      <ProjectAppLogo title={card.title} size={24} />
                    </div>
                  ) : card.iconType === 'safari' ? (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] flex items-center justify-center shadow-sm shrink-0">
                      <Compass className="w-4 h-4 text-white" />
                    </div>
                  ) : card.iconType === 'terminal' ? (
                    <div className="w-6 h-6 rounded-lg bg-[#1c1c1e] border border-white/20 flex items-center justify-center shadow-sm shrink-0">
                      <Terminal className="w-3.5 h-3.5 text-[#30d158]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-neutral-600 flex items-center justify-center shadow-sm shrink-0">
                      <Settings className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  <span className="text-xs font-semibold text-white drop-shadow-md truncate max-w-[170px]">
                    {card.title}
                  </span>
                </div>

                {/* Swipe up / Dismiss button */}
                <button
                  type="button"
                  onClick={(e) => handleDismiss(card.id, e)}
                  className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  title="Tutup Kartu"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Realistic 19.5:9 Phone Card (240px x 520px) */}
              <div className="w-[240px] h-[500px] rounded-[34px] bg-[#121316] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden relative group-hover:border-white/30 transition-all">
                {/* 1. PROJECT APP CARD: Pixel-perfect Scaled Iframe (NO CROPPING) */}
                {card.iconType === 'project' && (
                  <div className="w-full h-full relative overflow-hidden bg-black">
                    {compiledHtml ? (
                      <div
                        style={{
                          width: '390px',
                          height: '812px',
                          transform: 'scale(0.615)',
                          transformOrigin: 'top left',
                        }}
                        className="absolute top-0 left-0 pointer-events-none select-none bg-black overflow-hidden"
                      >
                        <iframe
                          srcDoc={compiledHtml}
                          title="Card Iframe Preview"
                          sandbox="allow-same-origin"
                          className="w-full h-full border-0 pointer-events-none"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-white/40">
                        <ProjectAppLogo title={card.title} size={48} />
                        <span className="text-xs mt-2 text-white/70">Aplikasi Proyek</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. SAFARI BROWSER CARD: Authentic Mobile Safari Look */}
                {card.iconType === 'safari' && (
                  <div className="w-full h-full bg-[#18191c] flex flex-col justify-between p-3.5 text-white select-none">
                    <div className="space-y-3 pt-2">
                      <div className="h-8 rounded-xl bg-white/10 border border-white/10 px-3 flex items-center gap-2 text-[11px] text-white/60">
                        <Compass className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span className="truncate">apple.com/id/iphone</span>
                      </div>
                      <div className="space-y-1.5 px-1">
                        <div className="text-xs font-semibold text-white">Favorit</div>
                        <div className="grid grid-cols-4 gap-2 pt-1">
                          {['Apple', 'iCloud', 'GitHub', 'Google'].map((fav) => (
                            <div key={fav} className="flex flex-col items-center gap-1">
                              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                {fav[0]}
                              </div>
                              <span className="text-[9.5px] text-white/60 truncate">{fav}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-[10.5px] text-white/40 pb-2">
                      Halaman Safari Terbaru
                    </div>
                  </div>
                )}

                {/* 3. TERMINAL CARD: Dark Developer Console Look */}
                {card.iconType === 'terminal' && (
                  <div className="w-full h-full bg-black p-3 font-mono text-[10px] text-white/80 flex flex-col justify-between select-none">
                    <div className="space-y-1.5">
                      <div className="text-[#30d158] font-bold flex items-center gap-1 pb-1 border-b border-white/10">
                        <Terminal className="w-3 h-3" />
                        <span>vesper@iphone-17:~</span>
                      </div>
                      <div className="text-white/40">$ npm run dev</div>
                      <div className="text-[#30d158]">&gt; Local: http://localhost:3000/</div>
                      <div className="text-white/50">&gt; Sandbox: compiled in 118ms</div>
                      {consoleLogs.slice(0, 4).map((log, i) => (
                        <div
                          key={i}
                          className={`truncate ${
                            log.level === 'error' ? 'text-[#ff453a]' : 'text-white/70'
                          }`}
                        >
                          [{log.level}] {log.text}
                        </div>
                      ))}
                    </div>
                    <div className="text-right text-[9.5px] text-white/30">
                      Console Active · Port 3000
                    </div>
                  </div>
                )}

                {/* 4. SETTINGS CARD: Authentic iOS Settings Menu */}
                {card.iconType === 'settings' && (
                  <div className="w-full h-full bg-[#1c1c1e] p-3 text-white select-none flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="text-sm font-bold pt-1">Pengaturan</div>
                      <div className="bg-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/[0.06] text-[11px]">
                        <div className="flex items-center justify-between p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-[#0a84ff] flex items-center justify-center">
                              <Wifi className="w-3 h-3 text-white" />
                            </div>
                            <span>Wi-Fi</span>
                          </div>
                          <span className="text-white/50">Terhubung</span>
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-[#0a84ff] flex items-center justify-center">
                              <Bluetooth className="w-3 h-3 text-white" />
                            </div>
                            <span>Bluetooth</span>
                          </div>
                          <span className="text-white/50">Nyala</span>
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-[#30d158] flex items-center justify-center">
                              <Radio className="w-3 h-3 text-white" />
                            </div>
                            <span>Seluler</span>
                          </div>
                          <span className="text-white/50">5G</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-[10px] text-white/30 pb-2">
                      iOS 18.5
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Home Indicator Bar */}
      <div className="flex flex-col items-center gap-1.5 pb-2 pointer-events-none">
        <span className="text-[11px] font-medium text-white/50 tracking-tight">
          Ketuk kartu untuk membuka · Gesek ke atas untuk menutup
        </span>
        <div className="w-36 h-1 bg-white/60 rounded-full" />
      </div>
    </div>
  );
};
