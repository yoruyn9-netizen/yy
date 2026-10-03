import React from 'react';
import { ShieldAlert, LogOut, Lock } from 'lucide-react';

interface UserBlockedScreenProps {
  reason?: string;
  onLogout: () => void;
}

export const UserBlockedScreen: React.FC<UserBlockedScreenProps> = ({
  reason = 'Akses akun Anda telah dinonaktifkan oleh administrator sistem.',
  onLogout,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl select-none">
      <div className="w-full max-w-md rounded-3xl bg-[#0e0f12] border border-red-500/30 p-6 text-center space-y-5 shadow-2xl shadow-red-500/10 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 font-mono text-[11px] font-semibold">
            <Lock className="w-3 h-3" />
            <span>AKUN DITANGGUHKAN</span>
          </div>

          <h2 className="text-lg font-bold text-white tracking-tight">
            Akses Akun Dibatasi
          </h2>

          <p className="text-xs text-white/60 leading-relaxed">
            {reason}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left text-xs text-white/50 space-y-1">
          <div className="font-semibold text-white/80">Informasi Keamanan:</div>
          <p>
            Akun ini tidak memiliki izin untuk mengirim prompt, mengeksekusi instruksi coding, atau mengakses layanan AI Studio. Hubungi pemilik sistem untuk permohonan pemulihan akses.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all border border-white/15 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </div>
  );
};
