import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileCode,
  Check,
  Hammer,
  History,
  Copy,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import { ThinkingStep, ProjectFile } from '../types';
import { highlightCode } from '../utils/syntaxHighlighter';
import { copyToClipboard } from '../utils/clipboard';

interface ActionHistoryProps {
  steps?: ThinkingStep[];
  modifiedFiles?: string[];
  projectFiles?: Record<string, ProjectFile>;
  fileStatuses?: Record<string, 'in_progress' | 'completed'>;
  activeWritingFile?: string | null;
  isStreaming?: boolean;
  modelName?: string;
  durationSeconds?: number;
  onRunInSandbox?: (code: string, language: string) => void;
}

export const ActionHistory: React.FC<ActionHistoryProps> = ({
  steps = [],
  modifiedFiles = [],
  projectFiles = {},
  fileStatuses = {},
  activeWritingFile = null,
  isStreaming = false,
  modelName = 'Gemini 3.8 Flash',
  durationSeconds = 1,
  onRunInSandbox,
}) => {
  // Main Action history collapsible (default open)
  const [isOpen, setIsOpen] = useState(true);

  // Individual file code expansion state: maps filePath -> boolean
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Compile unique files modified/created for this action
  const fileList = React.useMemo(() => {
    if (modifiedFiles && modifiedFiles.length > 0) {
      return Array.from(new Set(modifiedFiles));
    }
    const stepTargets = steps
      .filter((s) => s.target)
      .map((s) => s.target as string);
    if (stepTargets.length > 0) {
      return Array.from(new Set(stepTargets));
    }
    // Only if streaming is completely done, fallback to projectFiles keys
    if (!isStreaming && projectFiles && Object.keys(projectFiles).length > 0) {
      return Object.keys(projectFiles);
    }
    return [];
  }, [modifiedFiles, steps, projectFiles, isStreaming]);

  const fileCount = fileList.length;

  const toggleFileCode = (filePath: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filePath]: !prev[filePath],
    }));
  };

  const handleCopyCode = async (filePath: string, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedFile(filePath);
      setTimeout(() => setCopiedFile(null), 2000);
    }
  };

  return (
    <div className="my-3 w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#141416] overflow-hidden text-xs shadow-md select-none transition-all">
      {/* Action history header button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors select-none group ios-tap cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-white/50 shrink-0 transition-transform" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-white/50 shrink-0 transition-transform" />
          )}
          <History className="w-3.5 h-3.5 text-white/50 shrink-0" />
          <span className="font-medium text-[13px] text-white/90 truncate">
            Action History
          </span>
          {isStreaming && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0a84ff] animate-ping ml-1 shrink-0" />
          )}
        </div>
        <span className="text-[11px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded-full shrink-0 ml-2">
          {fileCount > 0 ? `${fileCount} ${fileCount === 1 ? 'file' : 'files'}` : isStreaming ? 'building...' : 'completed'}
        </span>
      </button>

      {/* Expanded Details Body */}
      {isOpen && (
        <div className="px-3.5 sm:px-4 pb-3.5 pt-1 space-y-3 border-t border-white/[0.06] text-[12px] bg-[#0c0c0e]">
          {/* Detailed Execution Steps if available */}
          {steps.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-white/40 text-[11px] font-medium tracking-wide">
                Aksi & Eksekusi:
              </div>
              <div className="space-y-1">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 py-1 px-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11.5px] text-white/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] shrink-0" />
                    <span className="truncate flex-1">{step.detail}</span>
                    {step.target && (
                      <span className="text-[10px] font-mono text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                        {step.target}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edited files list */}
          {fileCount > 0 ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-white/80 font-medium text-[12px]">
                <FileCode className="w-3.5 h-3.5 text-white/50 shrink-0" />
                <span>
                  {isStreaming ? 'Editing' : 'Updated'} {fileCount} {fileCount === 1 ? 'file' : 'files'}
                </span>
              </div>

              {/* List of files with disclosure toggle */}
              <div className="space-y-1.5 font-mono text-[11.5px]">
                {fileList.map((filePath, idx) => {
                  const fileData = projectFiles[filePath];
                  const fileCode = fileData?.content || '';
                  const hasCode = Boolean(fileCode && fileCode.trim().length > 0);
                  const isFileExpanded = Boolean(expandedFiles[filePath]);

                  // Determine if this file is actively being written by the AI stream
                  const isWriting =
                    isStreaming &&
                    (fileStatuses[filePath] === 'in_progress' ||
                      activeWritingFile === filePath ||
                      (idx === fileList.length - 1 && fileStatuses[filePath] !== 'completed'));

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/[0.06] bg-[#141416] overflow-hidden transition-all"
                    >
                      {/* File row */}
                      <button
                        type="button"
                        onClick={() => hasCode && toggleFileCode(filePath)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                          hasCode ? 'hover:bg-white/[0.04] cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {hasCode ? (
                            isFileExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-white/80 shrink-0 transition-transform" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white shrink-0 transition-transform" />
                            )
                          ) : (
                            <span className="w-3.5 h-3.5" />
                          )}
                          <span className={`truncate text-[11.5px] ${isFileExpanded ? 'text-white font-medium' : 'text-white/70'}`}>
                            {filePath}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {hasCode && isFileExpanded && (
                            <span
                              onClick={(e) => handleCopyCode(filePath, fileCode, e)}
                              className="text-[10.5px] font-sans flex items-center gap-1 text-white/50 hover:text-white px-2 py-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              {copiedFile === filePath ? (
                                <span className="text-[#30d158]">Copied</span>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </span>
                          )}

                          {isWriting ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0a84ff]/15 border border-[#0a84ff]/30 text-[#0a84ff] text-[10px] font-sans font-medium shrink-0 animate-pulse">
                              <RotateCw className="w-2.5 h-2.5 animate-spin shrink-0" />
                              <span>Menulis...</span>
                            </div>
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-[#30d158]/15 border border-[#30d158]/50 flex items-center justify-center shrink-0" title="Selesai dibuat">
                              <Check className="w-2.5 h-2.5 text-[#30d158] stroke-[2.5]" />
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Code block viewer */}
                      {isFileExpanded && hasCode && (
                        <div className="border-t border-white/[0.06] bg-[#09090b] p-3 text-[11px] leading-relaxed">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06] text-white/40 font-sans text-[11px]">
                            <span>{fileData?.language || 'code'} • {fileCode.length} chars</span>
                            {onRunInSandbox && (
                              <button
                                type="button"
                                onClick={() => onRunInSandbox(fileCode, fileData?.language || 'javascript')}
                                className="text-white/80 hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>Preview in sandbox</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <pre className={`overflow-x-auto max-h-72 font-mono scrollbar-thin language-${fileData?.language || 'javascript'}`}>
                            <code
                              className={`language-${fileData?.language || 'javascript'}`}
                              dangerouslySetInnerHTML={{
                                __html: highlightCode(fileCode, fileData?.language || 'javascript'),
                              }}
                            />
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            isStreaming && (
              <div className="flex items-center gap-2 py-1 text-white/50 text-[11.5px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] animate-ping shrink-0" />
                <span>Mempersiapkan struktur berkas proyek...</span>
              </div>
            )
          )}

          {/* Built verification step */}
          <div className="flex items-center gap-2 pt-1.5 text-white/80 text-[12px] border-t border-white/[0.04]">
            <Hammer className="w-3.5 h-3.5 text-white/40 shrink-0" />
            <span>{isStreaming ? 'Assembling project structure...' : 'Built successfully'}</span>
            {!isStreaming && (
              <span className="w-4 h-4 rounded-full border border-[#30d158]/50 flex items-center justify-center shrink-0 ml-auto">
                <Check className="w-2.5 h-2.5 text-[#30d158] stroke-[2.5]" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
