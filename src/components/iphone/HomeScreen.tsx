import React, { useState } from 'react';
import {
  Compass,
  Camera,
  Folder,
  Terminal,
  Settings,
  Mail,
  Music,
  Calendar,
  CloudSun,
  Search,
  MessageSquare,
  Phone,
  FileText,
  MapPin,
  ShoppingBag,
  Image as ImageIcon,
} from 'lucide-react';
import { ProjectAppLogo } from '../ProjectAppLogo';
import { Wallpaper } from './Wallpaper';

interface HomeScreenProps {
  projectTitle: string;
  onLaunchProjectApp: () => void;
  onOpenTerminal: () => void;
  onOpenSafari: () => void;
  errorCount?: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  projectTitle,
  onLaunchProjectApp,
  onOpenTerminal,
  onOpenSafari,
  errorCount = 0,
}) => {
  const [spotlightQuery, setSpotlightQuery] = useState('');
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [launchingAppId, setLaunchingAppId] = useState<string | null>(null);

  const todayDate = new Date();
  const dayName = todayDate.toLocaleDateString('id-ID', { weekday: 'short' });
  const dayNumber = todayDate.getDate();

  // App launch spring animation handler
  const handleLaunch = (id: string, action: () => void) => {
    setLaunchingAppId(id);
    setTimeout(() => {
      action();
      setLaunchingAppId(null);
    }, 280);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 pt-12 pb-2 select-none overflow-hidden">
      <Wallpaper />

      {/* Spotlight Search Pull-Down Trigger */}
      {isSpotlightOpen ? (
        <div className="relative z-30 pt-2 pb-4 px-2 space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-2xl border border-white/20 rounded-2xl px-3.5 py-2 shadow-2xl">
            <Search className="w-4 h-4 text-white/50" />
            <input
              type="text"
              value={spotlightQuery}
              onChange={(e) => setSpotlightQuery(e.target.value)}
              placeholder="Cari di iPhone..."
              autoFocus
              className="w-full bg-transparent text-white text-xs placeholder-white/40 focus:outline-none"
            />
            <button
              onClick={() => setIsSpotlightOpen(false)}
              className="text-[11px] text-[#0a84ff] font-medium"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsSpotlightOpen(true)}
          className="relative z-20 mx-auto py-1 px-3 rounded-full bg-black/25 backdrop-blur-md border border-white/10 text-[10.5px] text-white/60 flex items-center gap-1.5 cursor-pointer hover:bg-black/40 hover:text-white transition-all active:scale-95 shadow-sm"
        >
          <Search className="w-3 h-3 text-white/50" />
          <span>Cari</span>
        </div>
      )}

      {/* 4x4 App Grid */}
      <div className="relative z-20 grid grid-cols-4 gap-y-4 gap-x-3.5 px-1.5 my-auto">
        {/* 1. PROJECT APP ICON (The User's Real Application) */}
        <button
          type="button"
          onClick={() => handleLaunch('project', onLaunchProjectApp)}
          className={`flex flex-col items-center gap-1.5 group ios-tap transition-transform ${
            launchingAppId === 'project' ? 'scale-110 opacity-70' : ''
          }`}
        >
          <div className="relative group-hover:scale-105 active:scale-95 transition-transform duration-200 shadow-md">
            <ProjectAppLogo title={projectTitle} size={54} />
          </div>
          <span className="text-[11px] font-medium text-white truncate max-w-[62px] text-center drop-shadow-sm">
            {projectTitle ? projectTitle.slice(0, 10) : 'Project'}
          </span>
        </button>

        {/* 2. Safari */}
        <button
          type="button"
          onClick={() => handleLaunch('safari', onOpenSafari)}
          className={`flex flex-col items-center gap-1.5 group ios-tap transition-transform ${
            launchingAppId === 'safari' ? 'scale-125 opacity-70' : ''
          }`}
        >
          <div className="w-[54px] h-[54px] rounded-[22%] bg-gradient-to-tr from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-transform duration-200">
            <Compass className="w-7 h-7 text-white" />
          </div>
          <span className="text-[11px] font-medium text-white/95 text-center drop-shadow-sm">
            Safari
          </span>
        </button>

        {/* 3. Terminal & Diagnostics */}
        <button
          type="button"
          onClick={() => handleLaunch('terminal', onOpenTerminal)}
          className={`flex flex-col items-center gap-1.5 group ios-tap transition-transform ${
            launchingAppId === 'terminal' ? 'scale-125 opacity-70' : ''
          }`}
        >
          <div className="relative w-[54px] h-[54px] rounded-[22%] bg-[#1c1c1e] border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-transform duration-200">
            <Terminal className="w-6 h-6 text-[#30d158]" />
            {errorCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#ff453a] text-white text-[9.5px] font-bold border border-black animate-pulse">
                {errorCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-white/95 text-center drop-shadow-sm">
            Terminal
          </span>
        </button>

        {/* 4. Calendar (Live Date) */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-[54px] h-[54px] rounded-[22%] bg-white flex flex-col items-center justify-between p-1.5 shadow-md border border-white/10 group-hover:scale-105 transition-transform duration-200">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#ff3b30]">
              {dayName}
            </span>
            <span className="text-xl font-bold text-black leading-none pb-0.5 font-sans">
              {dayNumber}
            </span>
          </div>
          <span className="text-[11px] font-medium text-white/90 text-center drop-shadow-sm">
            Kalender
          </span>
        </div>

        {/* 5. Photos */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-[54px] h-[54px] rounded-[22%] bg-white flex items-center justify-center shadow-md border border-white/10 group-hover:scale-105 transition-transform duration-200">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#ff3b30] via-[#ffcc00] to-[#5856d6] flex items-center justify-center">
              <ImageIcon className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <span className="text-[11px] font-medium text-white/90 text-center drop-shadow-sm">
            Foto
          </span>
        </div>

        {/* 6. Camera */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-[54px] h-[54px] rounded-[22%] bg-gradient-to-b from-[#2c2c2e] to-[#1c1c1e] border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <div className="w-6 h-6 rounded-full border-2 border-white/70 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white/80" />
            </div>
          </div>
          <span className="text-[11px] font-medium text-white/90 text-center drop-shadow-sm">
            Kamera
          </span>
        </div>

        {/* 7. Weather */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-[54px] h-[54px] rounded-[22%] bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] border border-white/20 flex flex-col items-center justify-between p-1.5 shadow-md group-hover:scale-105 transition-transform duration-200">
            <CloudSun className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white leading-none">28°</span>
          </div>
          <span className="text-[11px] font-medium text-white/90 text-center drop-shadow-sm">
            Cuaca
          </span>
        </div>

        {/* 8. Maps */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-[54px] h-[54px] rounded-[22%] bg-gradient-to-tr from-[#34d399] via-[#10b981] to-[#059669] border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-medium text-white/90 text-center drop-shadow-sm">
            Peta
          </span>
        </div>

        {/* 9. Mail */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-[54px] h-[54px] rounded-[22%] bg-gradient-to-tr from-[#0a84ff] to-[#60a5fa] border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-medium text-white/90 text-center drop-shadow-sm">
            Mail
          </span>
        </div>

        {/* 10. Notes */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-[54px] h-[54px] rounded-[22%] bg-[#fff8e7] border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <FileText className="w-6 h-6 text-[#d97706]" />
          </div>
          <span className="text-[11px] font-medium text-white/90 text-center drop-shadow-sm">
            Catatan
          </span>
        </div>

        {/* 11. Music */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-[54px] h-[54px] rounded-[22%] bg-gradient-to-tr from-[#ff2d55] to-[#ff375f] border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <Music className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-medium text-white/90 text-center drop-shadow-sm">
            Musik
          </span>
        </div>

        {/* 12. App Store */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-[54px] h-[54px] rounded-[22%] bg-gradient-to-tr from-[#0a84ff] to-[#5ac8fa] border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-medium text-white/90 text-center drop-shadow-sm">
            App Store
          </span>
        </div>

        {/* 13. Files */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-[54px] h-[54px] rounded-[22%] bg-gradient-to-tr from-[#007aff] to-[#5856d6] border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <Folder className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-medium text-white/90 text-center drop-shadow-sm">
            File
          </span>
        </div>

        {/* 14. Settings */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-[54px] h-[54px] rounded-[22%] bg-gradient-to-b from-[#8e8e93] to-[#636366] border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-medium text-white/90 text-center drop-shadow-sm">
            Pengaturan
          </span>
        </div>

        {/* 15. Messages */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-[54px] h-[54px] rounded-[22%] bg-gradient-to-tr from-[#30d158] to-[#34d399] border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-medium text-white/90 text-center drop-shadow-sm">
            Pesan
          </span>
        </div>

        {/* 16. Phone */}
        <div className="flex flex-col items-center gap-1.5 group cursor-default">
          <div className="w-[54px] h-[54px] rounded-[22%] bg-gradient-to-tr from-[#30d158] to-[#28cd41] border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-medium text-white/90 text-center drop-shadow-sm">
            Telepon
          </span>
        </div>
      </div>

      {/* Page Dots Indicator */}
      <div className="relative z-20 flex items-center justify-center gap-1.5 py-1">
        <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
      </div>

      {/* Authentic iOS Frosted Glass Translucent Bottom Dock */}
      <div className="relative z-20 bg-white/15 backdrop-blur-2xl rounded-[34px] p-2.5 flex items-center justify-around border border-white/20 shadow-2xl mx-1 mb-1">
        {/* Phone */}
        <button
          type="button"
          onClick={() => handleLaunch('dock-phone', onLaunchProjectApp)}
          className="w-12 h-12 rounded-[22%] bg-gradient-to-tr from-[#30d158] to-[#34d399] flex items-center justify-center shadow-md active:scale-95 transition-transform"
          title="Telepon"
        >
          <Phone className="w-5 h-5 text-white" />
        </button>

        {/* Safari */}
        <button
          type="button"
          onClick={() => handleLaunch('dock-safari', onOpenSafari)}
          className="w-12 h-12 rounded-[22%] bg-gradient-to-tr from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] flex items-center justify-center shadow-md active:scale-95 transition-transform"
          title="Safari"
        >
          <Compass className="w-6 h-6 text-white" />
        </button>

        {/* Messages */}
        <button
          type="button"
          onClick={() => handleLaunch('dock-messages', onLaunchProjectApp)}
          className="w-12 h-12 rounded-[22%] bg-gradient-to-tr from-[#30d158] to-[#28cd41] flex items-center justify-center shadow-md active:scale-95 transition-transform"
          title="Pesan"
        >
          <MessageSquare className="w-5 h-5 text-white" />
        </button>

        {/* Project Application Shortcut */}
        <button
          type="button"
          onClick={() => handleLaunch('dock-project', onLaunchProjectApp)}
          className="w-12 h-12 rounded-[22%] overflow-hidden active:scale-95 transition-transform shadow-md"
          title="Buka Aplikasi Proyek"
        >
          <ProjectAppLogo title={projectTitle} size={48} />
        </button>
      </div>
    </div>
  );
};
