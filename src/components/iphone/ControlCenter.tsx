import React from 'react';
import {
  Wifi,
  Bluetooth,
  Plane,
  Radio,
  Sun,
  Volume2,
  Flashlight,
  Moon,
  RotateCw,
  Play,
  Pause,
  SkipForward,
  Camera,
  Timer,
  Calculator,
  X,
} from 'lucide-react';
import { Wallpaper } from './Wallpaper';

interface ControlCenterProps {
  onClose: () => void;
  brightness: number;
  onBrightnessChange: (val: number) => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  isFlashlightOn: boolean;
  onToggleFlashlight: () => void;
  isWifiOn: boolean;
  onToggleWifi: () => void;
  isBluetoothOn: boolean;
  onToggleBluetooth: () => void;
  isAirplaneOn: boolean;
  onToggleAirplane: () => void;
  isRotationLocked: boolean;
  onToggleRotationLock: () => void;
}

export const ControlCenter: React.FC<ControlCenterProps> = ({
  onClose,
  brightness,
  onBrightnessChange,
  volume,
  onVolumeChange,
  isFlashlightOn,
  onToggleFlashlight,
  isWifiOn,
  onToggleWifi,
  isBluetoothOn,
  onToggleBluetooth,
  isAirplaneOn,
  onToggleAirplane,
  isRotationLocked,
  onToggleRotationLock,
}) => {
  const [isPlayingMusic, setIsPlayingMusic] = React.useState(false);

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 flex flex-col justify-start p-4 pt-14 select-none overflow-y-auto animate-fadeIn"
    >
      <Wallpaper blurLevel="heavy" dimmed />

      {/* Top Close Bar */}
      <div className="flex items-center justify-between mb-4 relative z-20 px-1">
        <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
          Pusat Kontrol
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-white/60 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Control Center Grid */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-20 grid grid-cols-2 gap-3 max-w-[340px] mx-auto w-full"
      >
        {/* Platter 1: Connectivity (2x2 mini grid) */}
        <div className="bg-black/45 backdrop-blur-2xl border border-white/15 rounded-[28px] p-3 grid grid-cols-2 gap-2.5 shadow-xl">
          {/* Airplane Mode */}
          <button
            type="button"
            onClick={onToggleAirplane}
            className={`w-11 h-11 mx-auto rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isAirplaneOn ? 'bg-[#ff9500] text-white shadow-md' : 'bg-white/15 text-white/70 hover:bg-white/25'
            }`}
            title="Mode Pesawat"
          >
            <Plane className="w-5 h-5" />
          </button>

          {/* Cellular Data */}
          <button
            type="button"
            className="w-11 h-11 mx-auto rounded-full bg-[#30d158] text-white flex items-center justify-center shadow-md active:scale-90 transition-all"
            title="Data Seluler"
          >
            <Radio className="w-5 h-5" />
          </button>

          {/* Wi-Fi */}
          <button
            type="button"
            onClick={onToggleWifi}
            className={`w-11 h-11 mx-auto rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isWifiOn ? 'bg-[#0a84ff] text-white shadow-md' : 'bg-white/15 text-white/70 hover:bg-white/25'
            }`}
            title="Wi-Fi"
          >
            <Wifi className="w-5 h-5" />
          </button>

          {/* Bluetooth */}
          <button
            type="button"
            onClick={onToggleBluetooth}
            className={`w-11 h-11 mx-auto rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isBluetoothOn ? 'bg-[#0a84ff] text-white shadow-md' : 'bg-white/15 text-white/70 hover:bg-white/25'
            }`}
            title="Bluetooth"
          >
            <Bluetooth className="w-5 h-5" />
          </button>
        </div>

        {/* Platter 2: Media Player */}
        <div className="bg-black/45 backdrop-blur-2xl border border-white/15 rounded-[28px] p-3 flex flex-col justify-between shadow-xl text-white">
          <div className="space-y-0.5">
            <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
              Musik
            </span>
            <div className="text-xs font-semibold truncate text-white">
              Vesper Live Audio
            </div>
            <div className="text-[10px] text-white/60 truncate">
              Apple Lossless
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsPlayingMusic(!isPlayingMusic)}
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 transition-all text-white"
            >
              {isPlayingMusic ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              type="button"
              className="p-1.5 text-white/60 hover:text-white"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Platter 3: Rotation Lock & Focus */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Orientation Lock */}
          <button
            type="button"
            onClick={onToggleRotationLock}
            className={`h-[72px] rounded-[24px] flex flex-col items-center justify-center gap-1 backdrop-blur-2xl border transition-all active:scale-90 ${
              isRotationLocked
                ? 'bg-white text-black border-white shadow-md'
                : 'bg-black/45 text-white border-white/15 hover:bg-black/60'
            }`}
            title="Kunci Orientasi"
          >
            <RotateCw className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">Rotasi</span>
          </button>

          {/* Focus Mode */}
          <button
            type="button"
            className="h-[72px] rounded-[24px] flex flex-col items-center justify-center gap-1 bg-black/45 text-white border border-white/15 hover:bg-black/60 backdrop-blur-2xl transition-all active:scale-90"
            title="Fokus"
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span className="text-[10px] font-medium leading-none">Fokus</span>
          </button>
        </div>

        {/* Platter 4: Sliders (Brightness & Volume) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* BRIGHTNESS SLIDER */}
          <div className="h-[140px] bg-black/45 backdrop-blur-2xl border border-white/15 rounded-[26px] p-1.5 relative overflow-hidden flex flex-col justify-end group shadow-xl">
            <div
              style={{ height: `${brightness}%` }}
              className="w-full bg-white rounded-[20px] transition-all duration-100 flex items-center justify-center"
            />
            {/* Draggable overlay input */}
            <input
              type="range"
              min="20"
              max="100"
              value={brightness}
              onChange={(e) => onBrightnessChange(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ns-resize w-full h-full"
            />
            <Sun className={`w-5 h-5 absolute bottom-3.5 left-1/2 -translate-x-1/2 pointer-events-none transition-colors ${
              brightness > 40 ? 'text-black' : 'text-white'
            }`} />
          </div>

          {/* VOLUME SLIDER */}
          <div className="h-[140px] bg-black/45 backdrop-blur-2xl border border-white/15 rounded-[26px] p-1.5 relative overflow-hidden flex flex-col justify-end group shadow-xl">
            <div
              style={{ height: `${volume}%` }}
              className="w-full bg-white rounded-[20px] transition-all duration-100 flex items-center justify-center"
            />
            {/* Draggable overlay input */}
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ns-resize w-full h-full"
            />
            <Volume2 className={`w-5 h-5 absolute bottom-3.5 left-1/2 -translate-x-1/2 pointer-events-none transition-colors ${
              volume > 40 ? 'text-black' : 'text-white'
            }`} />
          </div>
        </div>

        {/* Platter 5: Quick Tool Icons (Flashlight, Timer, Calculator, Camera) */}
        <div className="col-span-2 grid grid-cols-4 gap-2.5 pt-1">
          {/* Flashlight */}
          <button
            type="button"
            onClick={onToggleFlashlight}
            className={`h-14 rounded-[22px] flex items-center justify-center backdrop-blur-2xl border transition-all active:scale-90 ${
              isFlashlightOn
                ? 'bg-white text-black border-white shadow-md'
                : 'bg-black/45 text-white border-white/15 hover:bg-black/60'
            }`}
            title="Senter"
          >
            <Flashlight className="w-5 h-5" />
          </button>

          {/* Timer */}
          <button
            type="button"
            className="h-14 rounded-[22px] flex items-center justify-center bg-black/45 text-white border border-white/15 hover:bg-black/60 backdrop-blur-2xl transition-all active:scale-90"
            title="Pengatur Waktu"
          >
            <Timer className="w-5 h-5" />
          </button>

          {/* Calculator */}
          <button
            type="button"
            className="h-14 rounded-[22px] flex items-center justify-center bg-black/45 text-white border border-white/15 hover:bg-black/60 backdrop-blur-2xl transition-all active:scale-90"
            title="Kalkulator"
          >
            <Calculator className="w-5 h-5" />
          </button>

          {/* Camera */}
          <button
            type="button"
            className="h-14 rounded-[22px] flex items-center justify-center bg-black/45 text-white border border-white/15 hover:bg-black/60 backdrop-blur-2xl transition-all active:scale-90"
            title="Kamera"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
