import React from 'react';
import { Copy, Check, Play, Download, Edit3 } from 'lucide-react';
import { highlightCode } from '../utils/syntaxHighlighter';
import { copyToClipboard } from '../utils/clipboard';

interface CodeBlockProps {
  language: string;
  code: string;
  filename?: string;
  onRunInSandbox?: (code: string, language: string) => void;
  onCodeChange?: (newCode: string, language: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language,
  code: initialCode,
  filename,
  onRunInSandbox,
  onCodeChange,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(initialCode);

  React.useEffect(() => {
    setEditValue(initialCode);
  }, [initialCode]);

  const handleCopy = async () => {
    // If the user has highlighted a specific snippet with their mouse, prioritize copying that
    const selection = window.getSelection()?.toString();
    const textToCopy = selection && selection.trim().length > 0 ? selection : editValue;
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const ext = language === 'typescript' || language === 'ts' ? 'ts'
      : language === 'javascript' || language === 'js' ? 'js'
      : language === 'html' ? 'html'
      : language === 'css' ? 'css'
      : language === 'python' || language === 'py' ? 'py'
      : language === 'json' ? 'json'
      : 'txt';

    const name = filename || `code-${Date.now()}.${ext}`;
    const blob = new Blob([editValue], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isRunnable = ['html', 'javascript', 'js', 'css', 'typescript', 'ts'].includes(
    language.toLowerCase()
  );

  const handleLiveChange = (newVal: string) => {
    setEditValue(newVal);
    if (onCodeChange) {
      onCodeChange(newVal, language);
    }
  };

  return (
    <div className="my-3 rounded-2xl border border-white/10 bg-[#0c0d0f] overflow-hidden text-xs shadow-lg backdrop-blur-md">
      {/* Code Header - Apple / Claude styled capsule bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#121316] border-b border-white/5 text-[#9ca3af]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 text-[#e4e4e7] border border-white/5">
            {filename || language}
          </span>
          {isEditing && (
            <span className="text-[10px] text-[#22c55e] font-medium animate-pulse">
              Edit Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Edit realtime button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
              isEditing
                ? 'bg-white/15 text-white border border-white/20'
                : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEditing ? 'Selesai' : 'Edit'}</span>
          </button>

          {/* Run live button */}
          {isRunnable && onRunInSandbox && (
            <button
              onClick={() => onRunInSandbox(editValue, language)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-[#166534]/60 hover:bg-[#166534] border border-[#22c55e]/30 text-[#86efac] transition-all shadow-sm"
              title="Kirim ke Preview Code"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Preview Code</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-full text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-[#a1a1aa] hover:text-white hover:bg-white/5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[#22c55e]" />
                <span className="text-[#22c55e]">Disalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body / Live Editor */}
      {isEditing ? (
        <div className="p-3 bg-[#08080a]">
          <textarea
            value={editValue}
            onChange={(e) => handleLiveChange(e.target.value)}
            rows={Math.min(22, Math.max(6, editValue.split('\n').length + 1))}
            className="w-full bg-[#111215] text-[#f4f4f5] p-3 rounded-xl border border-white/10 font-mono text-[12px] leading-relaxed focus:outline-none focus:border-white/30 resize-y"
            spellCheck={false}
          />
          <div className="flex justify-between items-center mt-2 px-1 text-[11px] text-[#71717a]">
            <span>Perubahan otomatis tersinkronisasi.</span>
            {isRunnable && onRunInSandbox && (
              <button
                onClick={() => onRunInSandbox(editValue, language)}
                className="text-[#4ade80] hover:underline"
              >
                Kirim ke Preview &rarr;
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 overflow-x-auto font-mono leading-relaxed text-[12px] max-h-[460px]">
          <pre className={`language-${language}`}>
            <code
              className={`language-${language}`}
              dangerouslySetInnerHTML={{ __html: highlightCode(editValue, language) }}
            />
          </pre>
        </div>
      )}
    </div>
  );
};
