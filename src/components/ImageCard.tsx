import React, { useState } from 'react';
import { Download, Copy, Check, ExternalLink, Image as ImageIcon, Plus } from 'lucide-react';

interface ImageCardProps {
  imageUrl: string;
  prompt: string;
  onInsertToProject?: (url: string) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  imageUrl,
  prompt,
  onInsertToProject,
}) => {
  const [copied, setCopied] = useState(false);
  const [isInserted, setIsInserted] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vesper-ai-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="my-3 rounded-2xl border border-white/10 bg-[#121316] overflow-hidden text-xs shadow-lg max-w-xl">
      <div className="relative group overflow-hidden bg-black/40">
        <img
          src={imageUrl}
          alt={prompt}
          referrerPolicy="no-referrer"
          className="w-full max-h-80 object-cover object-center transition-transform duration-300 group-hover:scale-[1.01]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 justify-between">
          <span className="text-[11px] text-white/90 truncate max-w-xs font-medium">
            {prompt}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white text-black hover:text-black backdrop-blur-md transition-all"
              title="Unduh Gambar"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <ImageIcon className="w-4 h-4 text-[#0a84ff] shrink-0" />
          <span className="text-[11px] text-white/70 italic truncate">
            "{prompt}"
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all text-[11px]"
            title="Salin URL Gambar"
          >
            {copied ? <Check className="w-3 h-3 text-[#30d158]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Tersalin' : 'Salin URL'}</span>
          </button>

          {onInsertToProject && (
            <button
              onClick={() => {
                onInsertToProject(imageUrl);
                setIsInserted(true);
                setTimeout(() => setIsInserted(false), 2500);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0a84ff]/20 hover:bg-[#0a84ff]/30 border border-[#0a84ff]/40 text-[#0a84ff] hover:text-white transition-all text-[11px] font-medium"
              title="Sematkan ke dalam kode proyek di Sandbox"
            >
              <Plus className="w-3 h-3" />
              <span>{isInserted ? 'Tersisip!' : 'Sisipkan ke Proyek'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
