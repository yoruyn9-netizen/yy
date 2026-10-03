import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Smartphone,
} from 'lucide-react';
import { BroadcastNotificationItem, listenBroadcastNotifications } from '../services/ownerService';
import {
  getInboxReadIds,
  getInboxDeletedIds,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationFromInbox,
  clearAllNotificationsFromInbox,
} from '../services/notificationInboxService';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  showDeviceNotification,
} from '../services/notificationService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const [broadcasts, setBroadcasts] = useState<BroadcastNotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => getInboxReadIds());
  const [deletedIds, setDeletedIds] = useState<string[]>(() => getInboxDeletedIds());
  const [osPermission, setOsPermission] = useState<NotificationPermission | 'unsupported'>('default');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Listen to Firestore broadcast notifications
  useEffect(() => {
    const unsub = listenBroadcastNotifications((items) => {
      setBroadcasts(items);
    });
    return () => unsub();
  }, []);

  // Sync OS permission status
  useEffect(() => {
    if (isOpen) {
      setOsPermission(getNotificationPermissionStatus());
    }
  }, [isOpen]);

  // Visible and unread counts
  const visibleItems = broadcasts.filter((b) => !deletedIds.includes(b.id));
  const unreadCount = visibleItems.filter((b) => !readIds.includes(b.id)).length;

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  if (!isOpen) return null;

  const handleMarkAsRead = (id: string) => {
    const updated = markNotificationAsRead(id);
    setReadIds(updated);
  };

  const handleMarkAllAsRead = () => {
    const allVisibleIds = visibleItems.map((b) => b.id);
    const updated = markAllNotificationsAsRead(allVisibleIds);
    setReadIds(updated);
  };

  const handleDeleteItem = (id: string) => {
    const updated = deleteNotificationFromInbox(id);
    setDeletedIds(updated);
  };

  const handleClearAll = () => {
    if (!window.confirm('Bersihkan semua riwayat pemberitahuan?')) return;
    const allVisibleIds = visibleItems.map((b) => b.id);
    const updated = clearAllNotificationsFromInbox(allVisibleIds);
    setDeletedIds(updated);
  };

  const handleEnableOsNotification = async () => {
    const res = await requestNotificationPermission();
    setOsPermission(res);
    if (res === 'granted') {
      await showDeviceNotification('Vesper.ai', {
        body: 'Notifikasi sistem di HP Anda telah aktif.',
        tag: 'os-notif-enabled',
        vibrate: [200, 100, 200],
      });
    }
  };

  return (
    /* Blurred Translucent Backdrop: click anywhere outside to close! */
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-xl sm:backdrop-blur-2xl animate-fadeIn select-none cursor-pointer"
    >
      {/* Liquid Glass Dark Modal Container (Stop propagation so clicks inside don't close) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-[#090a0d]/90 backdrop-blur-3xl border border-white/[0.1] shadow-[0_32px_100px_rgba(0,0,0,0.9),inset_0_1px_1.5px_rgba(255,255,255,0.18),inset_0_-1px_1px_rgba(255,255,255,0.03)] overflow-hidden text-white cursor-default"
      >
        
        {/* Top Header Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.015]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold tracking-tight text-white/95">
              Pemberitahuan
            </h2>
            {unreadCount > 0 ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.1] text-white/90 border border-white/[0.14] shadow-sm">
                {unreadCount} baru
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-white/40">
                Semua dibaca
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all ios-tap cursor-pointer"
            title="Tutup (atau ketuk di luar kotak)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar (Capsule Buttons, Monochrome) */}
        <div className="px-5 sm:px-6 py-2 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-white/90 transition-all ios-tap cursor-pointer"
              >
                Tandai Semua
              </button>
            )}

            {visibleItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1 rounded-full text-xs text-white/40 hover:text-white/80 transition-all ios-tap cursor-pointer"
              >
                Bersihkan
              </button>
            )}
          </div>

          {/* Device notification status toggle */}
          <div>
            {osPermission === 'granted' ? (
              <span className="text-[10.5px] font-mono text-white/40">
                HP: Aktif
              </span>
            ) : (
              <button
                type="button"
                onClick={handleEnableOsNotification}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white/70 hover:text-white text-[10.5px] transition-all ios-tap cursor-pointer"
                title="Aktifkan notifikasi status bar HP"
              >
                <Smartphone className="w-3 h-3 text-white/60" />
                <span>Aktifkan di HP</span>
              </button>
            )}
          </div>
        </div>

        {/* Notification List Body with Dark Liquid Glass Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 scrollbar-thin">
          {visibleItems.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-xs text-white/40 font-medium">
                Tidak ada pemberitahuan
              </p>
              <p className="text-[11px] text-white/30 max-w-xs mx-auto">
                Semua pengumuman sudah dibaca atau dibersihkan.
              </p>
            </div>
          ) : (
            visibleItems.map((item) => {
              const isRead = readIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl transition-all ${
                    !isRead
                      ? 'bg-white/[0.05] hover:bg-white/[0.075] backdrop-blur-2xl border border-white/[0.13] shadow-[0_10px_32px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.18),inset_0_-1px_1px_rgba(255,255,255,0.03)]'
                      : 'bg-white/[0.02] hover:bg-white/[0.045] backdrop-blur-xl border border-white/[0.06] opacity-75 hover:opacity-100 shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.08)]'
                  }`}
                >
                  {/* Card Header: Title & Time */}
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="text-xs sm:text-[13px] font-semibold text-white/95 leading-snug">
                      {item.title}
                    </h3>
                    <span className="text-[10px] text-white/35 font-mono shrink-0 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Card Message */}
                  <p className="text-xs text-white/70 leading-relaxed font-sans mb-3.5">
                    {item.message}
                  </p>

                  {/* Card Footer: Delete (Left) & Capsule "Mengerti" (Right) */}
                  <div className="pt-2.5 border-t border-white/[0.05] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-white/30 hover:text-white/80 rounded-lg transition-colors ios-tap cursor-pointer"
                      title="Hapus pemberitahuan ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div>
                      {!isRead ? (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(item.id)}
                          className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-neutral-100 transition-all ios-tap cursor-pointer shadow-[0_2px_10px_rgba(255,255,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.9)] active:scale-95"
                        >
                          Mengerti
                        </button>
                      ) : (
                        <span className="text-[11px] text-white/35 font-mono px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                          Mengerti
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
