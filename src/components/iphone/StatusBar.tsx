import React from 'react';

interface StatusBarProps {
  time: string;
  theme?: 'light' | 'dark';
  batteryLevel?: number;
  isCharging?: boolean;
  onOpenNotificationCenter?: () => void;
  onOpenControlCenter?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  time,
  theme = 'light',
  batteryLevel = 98,
  isCharging = false,
  onOpenNotificationCenter,
  onOpenControlCenter,
}) => {
  const isLight = theme === 'light';
  const textColor = isLight ? 'text-white' : 'text-black';
  const glyphFill = isLight ? 'fill-white' : 'fill-black';
  const borderColor = isLight ? 'border-white/80' : 'border-black/80';
  const batteryFill = isCharging
    ? 'bg-[#30d158]'
    : batteryLevel < 20
    ? 'bg-[#ff453a]'
    : isLight
    ? 'bg-white'
    : 'bg-black';

  return (
    <div className="relative z-50 h-11 px-7 flex items-center justify-between text-[13px] font-semibold tracking-tight pt-1 select-none pointer-events-auto">
      {/* Left side: Time & Notification Center gesture trigger */}
      <button
        type="button"
        onClick={onOpenNotificationCenter}
        className={`flex items-center gap-1 font-semibold tracking-tight ${textColor} hover:opacity-80 active:scale-95 transition-all text-left ios-tap`}
        title="Gesek / Klik untuk Pusat Pemberitahuan"
      >
        <span>{time}</span>
      </button>

      {/* Center is reserved for Dynamic Island */}
      <div className="w-32" />

      {/* Right side: 5G, Wi-Fi, Battery & Control Center gesture trigger */}
      <button
        type="button"
        onClick={onOpenControlCenter}
        className={`flex items-center gap-1.5 ${textColor} hover:opacity-80 active:scale-95 transition-all ios-tap`}
        title="Gesek / Klik untuk Pusat Kontrol"
      >
        {/* 4-bar cellular signal */}
        <div className="flex items-end gap-[1.5px] h-3">
          <div className={`w-[2.5px] h-[3px] rounded-xs ${isLight ? 'bg-white' : 'bg-black'}`} />
          <div className={`w-[2.5px] h-[5px] rounded-xs ${isLight ? 'bg-white' : 'bg-black'}`} />
          <div className={`w-[2.5px] h-[8px] rounded-xs ${isLight ? 'bg-white' : 'bg-black'}`} />
          <div className={`w-[2.5px] h-[11px] rounded-xs ${isLight ? 'bg-white' : 'bg-black'}`} />
        </div>
        <span className="text-[10px] font-bold tracking-tighter ml-0.5">5G</span>

        {/* Wi-Fi Icon */}
        <svg width="13" height="13" viewBox="0 0 24 24" className={glyphFill}>
          <path d="M12 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4.9-3.7l1.4 1.4c1.9-1.9 5.1-1.9 7 0l1.4-1.4c-2.7-2.7-7.1-2.7-9.8 0zm-4-4l1.4 1.4c4.1-4.1 10.9-4.1 15 0l1.4-1.4c-4.9-4.9-12.9-4.9-17.8 0z" />
        </svg>

        {/* iOS Battery Capsule with inner fill & percentage */}
        <div className="flex items-center gap-1 ml-0.5">
          <span className="text-[10.5px] font-mono tracking-tighter font-semibold opacity-90">
            {batteryLevel}%
          </span>
          <div className="flex items-center">
            <div className={`w-5 h-2.5 rounded-sm border ${borderColor} p-[1.5px] flex items-center`}>
              <div
                style={{ width: `${Math.min(100, Math.max(10, batteryLevel))}%` }}
                className={`h-full rounded-xs transition-all duration-300 ${batteryFill}`}
              />
            </div>
            <div className={`w-0.5 h-1 ${isLight ? 'bg-white/80' : 'bg-black/80'} rounded-r-xs`} />
          </div>
        </div>
      </button>
    </div>
  );
};
