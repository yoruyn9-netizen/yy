import React, { useState } from 'react';
import { X, Copy, Check, Share2, Link, Globe, MessageSquare } from 'lucide-react';
import { Session } from '../types';

interface ShareChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
}

export const ShareChatModal: React.FC<ShareChatModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build clean share URL
  const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const shareUrl = `${currentUrl}?session=${session.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: session.title || 'Vibe Coding Session',
          text: `Sesi coding AI: ${session.title}`,
          url: shareUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn select-none">
      <div className="relative w-full max-w-md bg-[#121316] border border-white/15 rounded-3xl p-6 shadow-2xl text-white space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0a84ff]/20 border border-[#0a84ff]/30 flex items-center justify-center text-[#0a84ff]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-white">
                Bagikan Obrolan
              </h2>
              <p className="text-[11px] text-white/50">
                Bagikan tautan obrolan ini kepada tim atau teman.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Session Card Info */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-white truncate">
            <MessageSquare className="w-3.5 h-3.5 text-[#0a84ff] shrink-0" />
            <span className="truncate">{session.title || 'Obrolan AI'}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/50">
            <span>{session.messages.length} pesan</span>
            <span>·</span>
            <span>{new Date(session.updatedAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
          </div>
        </div>

        {/* Share Link Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-white/50 block">
            Tautan Publik Obrolan
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-[#1c1c1e] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white/80 overflow-hidden">
              <Link className="w-3.5 h-3.5 text-white/40 shrink-0 mr-2" />
              <span className="truncate">{shareUrl}</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-all shrink-0 flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#30d158] stroke-[3]" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Share Buttons */}
        <div className="pt-1 flex items-center gap-2">
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-medium text-white transition-all flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan Aplikasi...</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:text-white transition-all"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
