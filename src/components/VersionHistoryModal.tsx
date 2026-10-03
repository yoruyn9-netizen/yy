import React, { useState } from 'react';
import { X, RotateCcw, Check, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { ProjectSnapshot, ProjectState } from '../types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: ProjectSnapshot[];
  currentFiles: ProjectState['files'];
  onRevertToSnapshot: (snapshot: ProjectSnapshot) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onRevertToSnapshot,
}) => {
  const [revertedId, setRevertedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 180);
  };

  const reversedSnapshots = [...snapshots].reverse();

  const handleRevert = (snapshot: ProjectSnapshot) => {
    onRevertToSnapshot(snapshot);
    setRevertedId(snapshot.id);
    setTimeout(() => {
      setRevertedId(null);
      handleClose();
    }, 700);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn select-none"
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-2xl p-6 shadow-2xl text-white flex flex-col max-h-[85vh] space-y-4 ${
          isClosing ? 'animate-modal-close' : 'animate-fadeIn'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Version History
            </h2>
            <p className="text-[11px] text-white/40 mt-0.5">
              Riwayat snapshot proyek yang tersimpan otomatis
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshots Timeline List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {reversedSnapshots.length === 0 ? (
            <div className="py-12 text-center text-xs text-white/40 space-y-1">
              <p>Belum ada riwayat snapshot.</p>
              <p className="text-[11px] text-white/30">
                Snapshot dibuat otomatis setiap kali kode diperbarui.
              </p>
            </div>
          ) : (
            reversedSnapshots.map((snap, idx) => {
              const fileCount = Object.keys(snap.files).length;
              const isExpanded = expandedId === snap.id;
              const isReverted = revertedId === snap.id;
              const timeStr = new Date(snap.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={snap.id}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-white/40 mb-1">
                        <span>{timeStr}</span>
                        <span>·</span>
                        <span>{fileCount} berkas</span>
                        {idx === 0 && (
                          <>
                            <span>·</span>
                            <span className="text-[10px] font-sans font-medium text-white/80 bg-white/10 px-2 py-0.5 rounded-md">
                              Terkini
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-xs font-semibold text-white/90 truncate">
                        {snap.description || 'Pembaruan Proyek'}
                      </h3>
                    </div>

                    {/* Restore Button */}
                    <button
                      type="button"
                      onClick={() => handleRevert(snap)}
                      disabled={isReverted}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 active:scale-95 text-black text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                    >
                      {isReverted ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Dipulihkan</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Pulihkan</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Toggle File List Dropdown */}
                  <div className="pt-1 border-t border-white/[0.04]">
                    <button
                      type="button"
                      onClick={() => toggleExpand(snap.id)}
                      className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/80 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      <span>{isExpanded ? 'Sembunyikan berkas' : 'Lihat daftar berkas'}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1 pl-1 animate-fadeIn">
                        {Object.entries(snap.files).map(([path, f]) => (
                          <div
                            key={path}
                            className="flex items-center justify-between text-[11px] font-mono text-white/60 py-0.5"
                          >
                            <span className="flex items-center gap-1.5 truncate pr-2">
                              <FileText className="w-3 h-3 text-white/30 shrink-0" />
                              <span className="truncate">{path}</span>
                            </span>
                            <span className="text-white/30 text-[10px] shrink-0">
                              {f.content.length} B
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
