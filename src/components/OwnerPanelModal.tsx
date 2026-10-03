import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Bell,
  Shield,
  ShieldAlert,
  Search,
  History,
  Send,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  RefreshCw,
  Cpu,
  Radio,
  UserCheck,
  UserX,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import {
  ManagedUser,
  BroadcastNotificationItem,
  UserAiUsageRecord,
  listenAllUsers,
  setUserBlockStatus,
  fetchUserAiUsage,
  sendBroadcastNotification,
  deleteBroadcastNotification,
  listenBroadcastNotifications,
} from '../services/ownerService';
import { showDeviceNotification } from '../services/notificationService';

interface OwnerPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerPanelModal: React.FC<OwnerPanelModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'broadcast'>('users');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<ManagedUser | null>(null);
  const [userHistoryRecords, setUserHistoryRecords] = useState<UserAiUsageRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Broadcast state
  const [notifications, setNotifications] = useState<BroadcastNotificationItem[]>([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'update' | 'warning' | 'urgent'>('update');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);

  // Real-time listeners
  useEffect(() => {
    if (!isOpen) return;

    const unsubUsers = listenAllUsers((allUsers) => {
      setUsers(allUsers);
    });

    const unsubNotifs = listenBroadcastNotifications((allNotifs) => {
      setNotifications(allNotifs);
    });

    return () => {
      unsubUsers();
      unsubNotifs();
    };
  }, [isOpen]);

  // Load history when a user is selected
  useEffect(() => {
    if (!selectedUserForHistory) {
      setUserHistoryRecords([]);
      return;
    }

    let isMounted = true;
    setIsLoadingHistory(true);

    fetchUserAiUsage(selectedUserForHistory.userId).then((records) => {
      if (isMounted) {
        setUserHistoryRecords(records);
        setIsLoadingHistory(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedUserForHistory]);

  if (!isOpen) return null;

  // Toggle user block status
  const handleToggleBlock = async (user: ManagedUser) => {
    const nextStatus = !user.isBlocked;
    const confirmText = nextStatus
      ? `Blokir akses untuk ${user.displayName}? Pengguna tidak akan dapat berinteraksi atau mengirim prompt ke AI.`
      : `Buka blokir akses untuk ${user.displayName}?`;

    if (!window.confirm(confirmText)) return;

    await setUserBlockStatus(
      user.userId,
      nextStatus,
      nextStatus ? 'Akun Anda dinonaktifkan oleh administrator sistem' : ''
    );
  };

  // Handle broadcast send
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    setIsSendingNotif(true);
    setSendSuccessMessage(null);

    try {
      await sendBroadcastNotification(notifTitle.trim(), notifMessage.trim(), notifType);
      setNotifTitle('');
      setNotifMessage('');
      setSendSuccessMessage('Notifikasi berhasil disiarkan secara real-time ke seluruh klien aktif.');
      setTimeout(() => setSendSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Gagal mengirim notifikasi: ${err.message || 'Error jaringan'}`);
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!window.confirm('Hapus notifikasi siaran ini dari seluruh pengguna?')) return;
    await deleteBroadcastNotification(id);
  };

  const handleTestDeviceNotification = async () => {
    await showDeviceNotification(notifTitle.trim() || 'Vesper.ai — Tes Notifikasi HP', {
      body: notifMessage.trim() || 'Ini adalah contoh tampilan notifikasi di status bar dan lockscreen HP pengguna.',
      tag: 'owner-test-device-notif',
      vibrate: [200, 100, 200],
    });
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.userId.toLowerCase().includes(q)
    );
  });

  const totalUsers = users.length;
  const blockedUsers = users.filter((u) => u.isBlocked).length;
  const activeUsers = totalUsers - blockedUsers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-3xl animate-fadeIn select-none">
      {/* Liquid Glass Window Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#1c1e24]/90 via-[#121318]/95 to-[#0b0c10]/98 backdrop-blur-3xl border border-white/[0.14] shadow-[0_32px_80px_rgba(0,0,0,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(255,255,255,0.06)] overflow-hidden text-white">
        
        {/* Top Header Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl liquid-glass-chip flex items-center justify-center text-white/90 shadow-sm shrink-0">
              <Shield className="w-5 h-5 text-white/90" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-semibold tracking-tight text-white">
                  Owner Control
                </h2>
                <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-md bg-white/[0.08] text-white/80 border border-white/[0.12]">
                  ROOT ACCESS
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/50">
                Manajemen akun pengguna, kontrol otorisasi, riwayat AI, dan siaran sistem
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition-all ios-tap"
            title="Tutup Panel"
            aria-label="Tutup Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Liquid Glass Segmented Controls (Tab Switcher) */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-white/[0.06] bg-black/20 flex items-center justify-between gap-3 flex-wrap">
          <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] inline-flex items-center gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all ios-tap ${
                activeTab === 'users'
                  ? 'liquid-glass-chip-active text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pengguna</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white/[0.08] text-white/80">
                {totalUsers}
              </span>
              {blockedUsers > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {blockedUsers} Diblokir
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('broadcast')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all ios-tap ${
                activeTab === 'broadcast'
                  ? 'liquid-glass-chip-active text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Siaran Notifikasi</span>
              {notifications.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white/[0.08] text-white/80">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-white/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            <span>Real-time Sync Active</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {activeTab === 'users' ? (
            /* TAB 1: USERS DIRECTORY & CONTROLS */
            <div className="space-y-4">
              {/* Liquid Glass Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden transition-all hover:bg-white/[0.05] hover:border-white/[0.14]">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                    Total Pengguna
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {totalUsers}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">Terdaftar di sistem</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden transition-all hover:bg-white/[0.05] hover:border-white/[0.14]">
                  <div className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <UserCheck className="w-3 h-3" />
                    <span>Aktif</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {activeUsers}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">Izin akses penuh</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden transition-all hover:bg-white/[0.05] hover:border-white/[0.14]">
                  <div className="text-[10px] text-rose-400/80 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <UserX className="w-3 h-3" />
                    <span>Terblokir</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                    {blockedUsers}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">Akses dinonaktifkan</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden transition-all hover:bg-white/[0.05] hover:border-white/[0.14]">
                  <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-white/60" />
                    <span>Siaran Global</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {notifications.length}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">Pesan terkirim</div>
                </div>
              </div>

              {/* Liquid Glass Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan nama atau User ID..."
                  className="w-full bg-white/[0.03] focus:bg-white/[0.06] border border-white/[0.1] focus:border-white/30 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/35 outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
                />
              </div>

              {/* User Directory Table / Card Stack */}
              <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-white/[0.02] backdrop-blur-xl">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-white/40 font-sans">
                    Tidak ada akun pengguna yang sesuai dengan kriteria pencarian.
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.05]">
                    {filteredUsers.map((user) => {
                      const isBlocked = !!user.isBlocked;
                      return (
                        <div
                          key={user.userId}
                          className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors"
                        >
                          {/* User Details */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/[0.16] flex items-center justify-center font-semibold text-xs text-white shrink-0 overflow-hidden shadow-sm">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                user.displayName.charAt(0).toUpperCase()
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-white truncate">
                                  {user.displayName}
                                </span>
                                {isBlocked ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.2 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/25">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    Terblokir
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.2 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-white/40 truncate mt-0.5">
                                UID: {user.userId}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedUserForHistory(user)}
                              className="liquid-glass-chip flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/80 hover:text-white transition-all ios-tap"
                              title="Periksa riwayat interaksi AI pengguna"
                            >
                              <History className="w-3.5 h-3.5 text-white/70" />
                              <span>History AI</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleBlock(user)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ios-tap ${
                                isBlocked
                                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/25 text-rose-300'
                              }`}
                            >
                              {isBlocked ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Buka Blokir</span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  <span>Blokir Akun</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: BROADCAST SYSTEM */
            <div className="space-y-5">
              {/* Broadcast Creation Form in Liquid Glass */}
              <form
                onSubmit={handleSendBroadcast}
                className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.1] backdrop-blur-xl shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                    <Radio className="w-3.5 h-3.5 text-white/70" />
                    <span>Siarkan Notifikasi ke Seluruh Klien Aktif</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">
                    Broadcast Dispatcher
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-white/50 font-medium">
                      Judul Siaran / Ringkasan
                    </label>
                    <input
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="Misal: Pemeliharaan Server atau Pembaruan v4.2"
                      required
                      className="w-full bg-white/[0.04] focus:bg-white/[0.07] border border-white/[0.1] focus:border-white/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/35 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-white/50 font-medium">
                      Klasifikasi Tingkat
                    </label>
                    <select
                      value={notifType}
                      onChange={(e) => setNotifType(e.target.value as any)}
                      className="w-full bg-[#181a20] border border-white/[0.1] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all"
                    >
                      <option value="update">Pembaruan Sistem (Neutral Ice)</option>
                      <option value="info">Informasi (Blue)</option>
                      <option value="warning">Peringatan (Subtle Amber)</option>
                      <option value="urgent">Kritis / Urgent (Rose)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-white/50 font-medium">
                    Isi Pesan Notifikasi
                  </label>
                  <textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    rows={3}
                    placeholder="Tuliskan detail pengumuman atau instruksi operasional untuk seluruh pengguna..."
                    required
                    className="w-full bg-white/[0.04] focus:bg-white/[0.07] border border-white/[0.1] focus:border-white/30 rounded-xl p-3 text-xs text-white placeholder-white/35 outline-none transition-all resize-y"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] text-white/50">
                    Notifikasi akan muncul langsung di status bar / lockscreen HP seluruh pengguna dengan getaran.
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestDeviceNotification}
                      className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-white/90 transition-all ios-tap cursor-pointer"
                      title="Uji coba bagaimana notifikasi muncul di HP Anda"
                    >
                      Tes di HP Saya
                    </button>

                    <button
                      type="submit"
                      disabled={isSendingNotif || !notifTitle.trim() || !notifMessage.trim()}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-neutral-100 transition-all shadow-[0_4px_16px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,0.85)] disabled:opacity-40 cursor-pointer ios-tap shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 fill-current" />
                      <span>{isSendingNotif ? 'Mengirim Siaran...' : 'Kirim Siaran ke HP'}</span>
                    </button>
                  </div>
                </div>

                {sendSuccessMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{sendSuccessMessage}</span>
                  </div>
                )}
              </form>

              {/* Broadcast Notification History */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Daftar Siaran Aktif ({notifications.length})</span>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center text-xs text-white/40">
                    Belum ada siaran notifikasi yang dikirimkan.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notif) => {
                      const typeBadge =
                        notif.type === 'update'
                          ? { label: 'Pembaruan', color: 'bg-white/[0.08] text-white/90 border-white/[0.15]' }
                          : notif.type === 'warning'
                          ? { label: 'Peringatan', color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25' }
                          : notif.type === 'urgent'
                          ? { label: 'Urgent', color: 'bg-rose-500/15 text-rose-300 border-rose-500/25' }
                          : { label: 'Informasi', color: 'bg-blue-500/15 text-blue-300 border-blue-500/25' };

                      return (
                        <div
                          key={notif.id}
                          className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-md flex items-start justify-between gap-3 hover:bg-white/[0.04] transition-all"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-medium ${typeBadge.color}`}
                              >
                                {typeBadge.label}
                              </span>
                              <span className="text-xs font-semibold text-white">
                                {notif.title}
                              </span>
                              <span className="text-[10px] text-white/35 font-mono">
                                · {new Date(notif.createdAt).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <p className="text-xs text-white/70 leading-relaxed font-sans">
                              {notif.message}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteBroadcast(notif.id)}
                            className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 ios-tap"
                            title="Tarik / Hapus Siaran"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User AI Usage History Inspection Overlay */}
        {selectedUserForHistory && (
          <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-2xl p-5 sm:p-6 flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/[0.08] border border-white/[0.15] flex items-center justify-center text-white font-semibold text-xs shadow-inner">
                  {selectedUserForHistory.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white">
                    Riwayat AI: {selectedUserForHistory.displayName}
                  </h3>
                  <p className="text-[10px] text-white/40 font-mono">
                    UID: {selectedUserForHistory.userId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUserForHistory(null)}
                className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition-all ios-tap"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 scrollbar-thin">
              {isLoadingHistory ? (
                <div className="p-12 text-center text-xs text-white/50 flex flex-col items-center justify-center gap-2.5">
                  <RefreshCw className="w-5 h-5 animate-spin text-white/70" />
                  <span>Mengambil log interaksi AI...</span>
                </div>
              ) : userHistoryRecords.length === 0 ? (
                <div className="p-12 text-center text-xs text-white/40 font-sans">
                  Pengguna ini belum memiliki riwayat pengiriman prompt atau percakapan AI.
                </div>
              ) : (
                userHistoryRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between text-[11px] text-white/40 font-mono">
                      <div className="flex items-center gap-1.5 text-white/80 font-medium">
                        <Terminal className="w-3.5 h-3.5 text-white/60" />
                        <span>{rec.model || 'Gemini'}</span>
                      </div>
                      <span>{new Date(rec.timestamp).toLocaleString('id-ID')}</span>
                    </div>

                    <div className="text-xs text-white/90 leading-relaxed font-sans bg-black/40 p-3 rounded-xl border border-white/[0.05]">
                      {rec.prompt}
                    </div>

                    {rec.sessionTitle && (
                      <div className="text-[10px] text-white/35 font-mono">
                        Sesi: {rec.sessionTitle}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
