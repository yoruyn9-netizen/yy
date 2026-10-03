import React, { useState } from 'react';
import { X, Trash2, Bell } from 'lucide-react';
import { Wallpaper } from './Wallpaper';

interface NotificationCenterProps {
  onClose: () => void;
  time: string;
  projectTitle: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onClose,
  time,
  projectTitle,
}) => {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      app: 'Vesper Sandbox',
      time: 'Baru saja',
      title: projectTitle || 'Aplikasi Berhasil Dikompilasi',
      desc: 'Semua berkas proyek siap dijalankan live di browser iPhone.',
      badge: 'VS',
    },
    {
      id: '2',
      app: 'Terminal',
      time: '5m lalu',
      title: 'Diagnostics Selesai',
      desc: '0 runtime error ditemukan pada sandboxed iframe.',
      badge: '>',
    },
    {
      id: '3',
      app: 'Safari',
      time: '12m lalu',
      title: 'Pemuatan Halaman Cepat',
      desc: 'Halaman dimuat dalam 142ms dengan rendering optimal.',
      badge: 'SF',
    },
  ]);

  const dateString = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 flex flex-col justify-start p-4 pt-14 select-none overflow-y-auto animate-fadeIn"
    >
      <Wallpaper blurLevel="heavy" dimmed />

      {/* Header Close button */}
      <div className="flex items-center justify-between mb-2 relative z-20 px-2">
        <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
          Pusat Pemberitahuan
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-white/60 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lockscreen-style mini clock */}
      <div className="relative z-20 text-center py-2 text-white">
        <div className="text-[12px] font-medium uppercase tracking-wider text-white/75">
          {dateString}
        </div>
        <div className="text-5xl font-extralight tracking-tight leading-none text-white">
          {time}
        </div>
      </div>

      {/* Notifications Stack */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-20 max-w-[340px] mx-auto w-full mt-4 space-y-2.5"
      >
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
            Pemberitahuan ({notifications.length})
          </span>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => setNotifications([])}
              className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="py-12 text-center text-white/40 text-xs italic">
            Tidak ada pemberitahuan baru.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-black/50 backdrop-blur-2xl border border-white/15 rounded-3xl p-3.5 text-white shadow-xl flex items-start gap-3 transition-transform active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0a84ff] to-[#60a5fa] flex items-center justify-center text-white shrink-0 font-bold text-xs font-mono shadow-sm">
                {notif.badge}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/95 truncate">
                    {notif.app}
                  </span>
                  <span className="text-[10px] text-white/50">{notif.time}</span>
                </div>
                <div className="text-[11.5px] font-medium text-white/90 mt-0.5 truncate">
                  {notif.title}
                </div>
                <p className="text-[11px] text-white/60 leading-snug mt-0.5 line-clamp-2">
                  {notif.desc}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
