import React, { useState } from 'react';
import { Plus, Trash2, MessageSquare, X, Pencil, Check } from 'lucide-react';
import { Session } from '../types';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  onApplyStarter: (prompt: string, title: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

const STARTERS = [
  {
    title: 'Solusi & Analisis Soal',
    desc: 'Pemecahan bertahap soal eksak atau logika',
    prompt: 'Bantu jelaskan dan selesaikan soal fisika ini secara bertahap dengan rumus yang jelas: Sebuah mobil bermassa 1.200 kg melaju dengan kecepatan 20 m/s kemudian direm hingga berhenti dalam jarak 50 meter. Berapakah gaya pengereman yang bekerja pada mobil tersebut?',
  },
  {
    title: 'Riset Informasi Web',
    desc: 'Eksplorasi fakta mendalam dan perbandingan',
    prompt: 'Lakukan riset komprehensif mengenai perkembangan teknologi baterai solid-state vs lithium-ion saat ini, mencakup kelebihan, tantangan manufaktur, dan estimasi waktu komersialisasinya.',
  },
  {
    title: 'Analisis Konsep & Esai',
    desc: 'Argumen terstruktur dan telaah mendalam',
    prompt: 'Tuliskan esai analisis kritis mengenai dampak otomatisasi kecerdasan buatan terhadap keterampilan masa depan dan etika ketenagakerjaan secara mendalam dan berbobot.',
  },
  {
    title: 'Rekayasa Web Modular',
    desc: 'Aplikasi interaktif dengan preview sandbox',
    prompt: 'Buatkan antarmuka kalkulator simulasi investasi berkala dan bunga majemuk modular (index.html, src/main.js, styles/theme.css) dengan visualisasi grafik interaktif.',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onApplyStarter,
  isOpen,
  onCloseMobile,
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartEdit = (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title || 'Untitled');
  };

  const handleSaveEdit = (sessionId: string, e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.stopPropagation();
    const trimmed = editingTitle.trim();
    if (trimmed && onRenameSession) {
      onRenameSession(sessionId, trimmed);
    }
    setEditingSessionId(null);
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSessionId(null);
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-md transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-[70] bg-[#0c0d12]/75 backdrop-blur-2xl backdrop-saturate-[180%] flex flex-col shrink-0 transition-all duration-200 ease-out select-none shadow-[4px_0_30px_rgba(0,0,0,0.5),inset_-1px_0_0_rgba(255,255,255,0.06),inset_0_1px_1px_rgba(255,255,255,0.15)] ${
          isOpen
            ? 'w-64 sm:w-60 lg:w-56 xl:w-60 border-r border-white/10 translate-x-0 opacity-100'
            : 'w-0 border-r-0 overflow-hidden -translate-x-full lg:translate-x-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Action - New Chat Pill (Liquid Glass Style) */}
        <div className="p-3 border-b border-white/[0.08] flex items-center justify-between gap-2 min-w-[220px]">
          <button
            onClick={() => {
              onNewSession();
              onCloseMobile();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-black bg-white hover:bg-neutral-100 rounded-full transition-all ios-tap shadow-[0_2px_12px_rgba(255,255,255,0.3),inset_0_1px_1px_rgba(255,255,255,0.85)] active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Sesi Baru</span>
          </button>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-white/50 hover:text-white rounded-full liquid-glass-icon-btn transition-colors"
            title="Tutup Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4 scrollbar-thin bg-transparent">
          <div>
            <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-white/40 uppercase">
              Riwayat Percakapan
            </div>
            <div className="mt-1 space-y-0.5">
              {sessions.map((s) => {
                const isActive = s.id === activeSessionId;
                const isEditing = editingSessionId === s.id;

                if (isEditing) {
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white/[0.12] border border-white/20 text-xs text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(s.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                        className="flex-1 bg-black/40 border border-white/20 rounded-lg px-2 py-0.5 text-xs text-white outline-none focus:border-white/50 min-w-0"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveEdit(s.id, e)}
                        className="p-1 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                        title="Simpan judul"
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        title="Batal"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectSession(s.id);
                      onCloseMobile();
                    }}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ios-tap ${
                      isActive
                        ? 'bg-white/[0.12] border border-white/20 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.25)] text-white font-medium'
                        : 'bg-transparent hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                      <span className="truncate">{s.title || 'Untitled'}</span>
                    </div>

                    {/* Action Icons beside Chat Title: Edit and Delete */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(s, e)}
                        className={`p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all ${
                          isActive ? 'opacity-80 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Edit judul chat"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => onDeleteSession(s.id, e)}
                        className={`p-1 text-white/40 hover:text-[#ff453a] hover:bg-white/10 rounded-lg transition-all ${
                          isActive ? 'opacity-80 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Hapus percakapan"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Presets / Starters */}
          <div>
            <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-white/40 uppercase">
              Inspirasi & Pintasan
            </div>
            <div className="mt-1 space-y-1.5">
              {STARTERS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onApplyStarter(item.prompt, item.title);
                    onCloseMobile();
                  }}
                  className="w-full text-left p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/20 backdrop-blur-md shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.12)] text-white/70 hover:text-white transition-all group ios-tap"
                >
                  <div className="text-xs font-semibold text-white/90 group-hover:text-white mb-0.5">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-white/45 line-clamp-1 leading-snug">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
