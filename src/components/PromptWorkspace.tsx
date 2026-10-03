import React, { useRef, useState, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  FileCode,
  X,
  Play,
  Crosshair,
  Globe,
  Layers,
  Terminal,
  Compass,
  RefreshCw,
  Bug,
  FileText,
  Palette,
  ShieldCheck,
  ArrowDown,
  Mic,
  MicOff,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Share2,
  Check,
  Cpu,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { copyToClipboard } from '../utils/clipboard';
import { ChatMessage, StudioSettings, PingResult, AttachedFile, SelectedElementInfo, SkillPlugin, ResearchDepth, ResearchSource, ProjectFile } from '../types';
import { MessageRenderer } from './MessageRenderer';
import { ActionHistory } from './ActionHistory';
import { ImageCard } from './ImageCard';
import { ResearchActivity } from './ResearchActivity';
import { ResearchSourcesList } from './ResearchSourcesList';
import { SourcePreviewModal } from './SourcePreviewModal';

const QUICK_ACTIONS = [
  {
    id: 'solve-soal',
    label: 'Solusi & Analisis Soal',
    icon: FileText,
    prompt: 'Bantu analisis dan selesaikan permasalahan atau soal ini secara bertahap dan terstruktur dengan metode yang jelas.',
  },
  {
    id: 'deep-research',
    label: 'Riset Informasi',
    icon: Globe,
    prompt: 'Lakukan riset mendalam mengenai topik ini dengan data faktual, perbandingan komparatif, dan kesimpulan objektif.',
  },
  {
    id: 'summarize',
    label: 'Ringkas & Intisari',
    icon: Compass,
    prompt: 'Tolong ringkaskan poin-poin utama, esensi konsep, dan kesimpulan penting dari materi ini secara padat dan mudah dipahami.',
  },
  {
    id: 'refactor',
    label: 'Refactor Code',
    icon: RefreshCw,
    prompt: 'Refactor kode proyek saat ini agar lebih modular, bersih, efisien, dan menerapkan best practice arsitektur.',
  },
  {
    id: 'debug',
    label: 'Debug & Perbaiki',
    icon: Bug,
    prompt: 'Analisis dan temukan bug, console error, atau logika yang rusak pada proyek ini, lalu perbaiki langsung pada berkas terkait.',
  },
];

interface PromptWorkspaceProps {
  messages: ChatMessage[];
  onSendMessage: (
    content: string,
    attachments?: AttachedFile[],
    elementInfo?: SelectedElementInfo,
    researchDepth?: ResearchDepth
  ) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  systemInstruction: string;
  onUpdateSystemInstruction: (inst: string) => void;
  onRunInSandbox?: (code: string, language: string) => void;
  onUpdateMessageContent?: (messageId: string, newContent: string) => void;
  onOpenParameters?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenSkills: () => void;
  activeSkillCount: number;
  settings: StudioSettings;
  pingResult: PingResult;
  selectedElement?: SelectedElementInfo | null;
  onClearSelectedElement?: () => void;
  skills?: SkillPlugin[];
  onToggleSkill?: (skillId: string) => void;
  onOpenShareModal?: () => void;
  onToggleMessageLike?: (messageId: string, type: 'like' | 'dislike') => void;
  onInsertImageToProject?: (url: string) => void;
  isSidebarOpen?: boolean;
  projectFiles?: Record<string, ProjectFile>;
}

export const PromptWorkspace: React.FC<PromptWorkspaceProps> = ({
  messages,
  onSendMessage,
  isStreaming,
  onStopStreaming,
  systemInstruction,
  onUpdateSystemInstruction,
  onRunInSandbox,
  onUpdateMessageContent,
  onOpenParameters,
  onOpenDiagnostics,
  onOpenSkills,
  activeSkillCount,
  settings,
  pingResult,
  selectedElement,
  onClearSelectedElement,
  skills = [],
  onToggleSkill,
  onOpenShareModal,
  onToggleMessageLike,
  onInsertImageToProject,
  isSidebarOpen = false,
  projectFiles,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState<number>(36);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false);
  const [isSlashDismissed, setIsSlashDismissed] = useState(false);
  const [researchDepth, setResearchDepth] = useState<ResearchDepth>('off');
  const [selectedSourcePreview, setSelectedSourcePreview] = useState<ResearchSource | null>(null);
  const [hoveredSourceNumber, setHoveredSourceNumber] = useState<number | null>(null);

  // Auto-resize and track textarea height for smooth dynamic layout changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      const clampedH = Math.min(scrollH, 192);
      textareaRef.current.style.height = `${clampedH}px`;
      setTextareaHeight(clampedH);
    }
  }, [input]);

  // Progressive Layout Mode for the 3 feature buttons (Paperclip, Globe, Mic):
  // - 'horizontal': Short/empty prompt (single line, < 35 chars, height <= 44px) -> all 3 buttons side-by-side
  // - 'semi-vertical': Moderately long prompt (2 lines, or 35-90 chars, or height 45-78px) -> 2 buttons stack vertically, 1 alongside
  // - 'vertical': Long/multi-line prompt (>= 3 lines, or >= 90 chars, or height > 78px) -> all 3 buttons stacked in vertical column
  const lineCount = (input.match(/\n/g) || []).length + 1;
  const promptLen = input.trim().length;

  const featureRailMode: 'horizontal' | 'semi-vertical' | 'vertical' = (() => {
    if (lineCount >= 3 || promptLen >= 90 || textareaHeight > 78) {
      return 'vertical';
    }
    if (lineCount === 2 || promptLen >= 35 || textareaHeight > 44) {
      return 'semi-vertical';
    }
    return 'horizontal';
  })();

  // Slash commands calculation: only trigger if '/' is at the beginning of input or preceded by whitespace
  const lastSlashIndex = input.lastIndexOf('/');
  const isPrecededByWhitespace =
    lastSlashIndex === 0 ||
    (lastSlashIndex > 0 && /\s/.test(input[lastSlashIndex - 1]));
  const textAfterSlash = lastSlashIndex !== -1 ? input.slice(lastSlashIndex) : '';
  const isSlashActive =
    lastSlashIndex !== -1 &&
    isPrecededByWhitespace &&
    !textAfterSlash.includes(' ') &&
    !textAfterSlash.includes('\n') &&
    !textAfterSlash.includes('`') &&
    !textAfterSlash.includes('"') &&
    !textAfterSlash.includes("'");

  const [isClosingSkillMenu, setIsClosingSkillMenu] = useState(false);
  const skillMenuRef = useRef<HTMLDivElement>(null);

  const handleCloseSkillMenu = () => {
    setIsClosingSkillMenu(true);
    setTimeout(() => {
      setIsSkillMenuOpen(false);
      setIsClosingSkillMenu(false);
      setIsSlashDismissed(true);
    }, 160);
  };

  const isMenuVisible = (isSlashActive && !isSlashDismissed) || isSkillMenuOpen;

  // Auto-close skill menu when sidebar is opened
  useEffect(() => {
    if (isSidebarOpen && isMenuVisible) {
      setIsSkillMenuOpen(false);
      setIsSlashDismissed(true);
    }
  }, [isSidebarOpen, isMenuVisible]);

  // Click outside and Escape key closes pintasan skill menu
  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuVisible) {
        handleCloseSkillMenu();
      }
    };
    const handleOutsideClick = (e: MouseEvent) => {
      if (isMenuVisible && skillMenuRef.current && !skillMenuRef.current.contains(e.target as Node)) {
        handleCloseSkillMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDownGlobal);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDownGlobal);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMenuVisible]);

  const rawSlashQuery = isSlashActive ? input.slice(lastSlashIndex + 1).toLowerCase() : '';
  // Support both "/query" and "/skill query"
  const slashQuery = rawSlashQuery.startsWith('skill')
    ? rawSlashQuery.replace(/^skill\s*/, '')
    : rawSlashQuery;

  const filteredSlashSkills = skills.filter(
    (s) =>
      !slashQuery ||
      s.name.toLowerCase().includes(slashQuery) ||
      s.id.toLowerCase().includes(slashQuery) ||
      s.description.toLowerCase().includes(slashQuery)
  );

  const handleSelectSlashSkill = (skill: SkillPlugin) => {
    let nextText = '';
    if (lastSlashIndex !== -1) {
      const beforeSlash = input.slice(0, lastSlashIndex);
      nextText = beforeSlash + `/${skill.name} `;
    } else {
      nextText = (input ? input + ' ' : '') + `/${skill.name} `;
    }
    setInput(nextText);
    if (onToggleSkill && !settings.activeSkillIds.includes(skill.id)) {
      onToggleSkill(skill.id);
    }
    setIsSkillMenuOpen(false);
    setIsSlashDismissed(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    }, 40);
  };

  const handleSelectSlashImage = () => {
    let nextText = '';
    if (lastSlashIndex !== -1) {
      const beforeSlash = input.slice(0, lastSlashIndex);
      nextText = beforeSlash + '/image ';
    } else {
      nextText = (input ? input + ' ' : '') + '/image ';
    }
    setInput(nextText);
    setIsSkillMenuOpen(false);
    setIsSlashDismissed(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 40);
  };

  const handleCopyMessage = async (text: string, id: string, fullMsg?: ChatMessage) => {
    // 1. If user highlighted a specific string on screen, copy that exact selection
    const selection = typeof window !== 'undefined' ? window.getSelection()?.toString().trim() : '';
    let targetText = text;

    if (selection && selection.length > 0) {
      targetText = selection;
    } else if (fullMsg && fullMsg.projectFiles && Object.keys(fullMsg.projectFiles).length > 0) {
      // 2. If assistant generated project files, include the complete file contents so user copies the real work!
      const filesFormatted = Object.entries(fullMsg.projectFiles)
        .map(([path, f]) => `\`\`\`${f.language || 'html'}:${path}\n${f.content}\n\`\`\``)
        .join('\n\n');
      targetText = fullMsg.content ? `${fullMsg.content}\n\n${filesFormatted}` : filesFormatted;
    }

    const ok = await copyToClipboard(targetText);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Robust renderer: Code snippets (e.g. /text, /src/index.tsx, regex) MUST NOT turn into blue skill tags
  const renderUserText = (text: string) => {
    if (!text) return null;

    // Split by code blocks (```...```) or inline code (`...`)
    const codeBlockRegex = /(```[\s\S]*?```|`[^`]+`)/g;
    const segments = text.split(codeBlockRegex);

    const validSkillNames = new Set([
      'image',
      'skill',
      ...skills.map((s) => s.name.toLowerCase()),
      ...skills.map((s) => s.id.toLowerCase()),
    ]);

    return segments.map((seg, segIdx) => {
      // 1. Multiline Code block
      if (seg.startsWith('```') && seg.endsWith('```')) {
        const inner = seg.slice(3, -3).replace(/^[a-z0-9_-]*\n/i, '');
        return (
          <pre
            key={segIdx}
            className="my-2 p-3 rounded-xl bg-black/60 border border-white/10 text-xs font-mono overflow-x-auto text-emerald-400"
          >
            <code>{inner}</code>
          </pre>
        );
      }

      // 2. Inline code
      if (seg.startsWith('`') && seg.endsWith('`') && seg.length >= 2) {
        return (
          <code
            key={segIdx}
            className="px-1.5 py-0.5 rounded-md bg-white/10 text-xs font-mono text-emerald-300"
          >
            {seg.slice(1, -1)}
          </code>
        );
      }

      // 3. Regular text: only highlight genuine standalone slash skills
      // Must be at start of string or preceded by whitespace, followed by boundary/whitespace
      const wordRegex = /(^|\s)(\/[a-zA-Z0-9_-]+)(?=\s|$|[.,!?])/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = wordRegex.exec(seg)) !== null) {
        const preSpace = match[1];
        const slashWord = match[2];
        const matchStart = match.index;

        if (matchStart > lastIndex) {
          parts.push(seg.slice(lastIndex, matchStart));
        }
        if (preSpace) {
          parts.push(preSpace);
        }

        const tagCommand = slashWord.slice(1).toLowerCase();
        if (validSkillNames.has(tagCommand)) {
          parts.push(
            <span
              key={`${segIdx}-${matchStart}`}
              className="text-[#0a84ff] font-semibold bg-[#0a84ff]/10 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 border border-[#0a84ff]/20 transition-all"
            >
              {slashWord}
            </span>
          );
        } else {
          // Normal text like /text, /api, /src - keep as plain text!
          parts.push(slashWord);
        }

        lastIndex = matchStart + match[0].length;
      }

      if (lastIndex < seg.length) {
        parts.push(seg.slice(lastIndex));
      }

      return <span key={segIdx}>{parts}</span>;
    });
  };

  // Smooth auto scroll on new messages or streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isStreaming]);

  // Monitor scroll position for smooth jump to bottom
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottom(isFarFromBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // Quick Action Handler
  const handleQuickAction = (actionPrompt: string) => {
    setInput((prev) => {
      if (!prev.trim()) {
        return actionPrompt;
      }
      return `${prev}\n\n${actionPrompt}`;
    });
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    }, 40);
  };

  // Voice Speech-to-Text Recognition
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'id-ID' | 'en-US'>('id-ID');
  const baseInputRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Browser ini belum mendukung Web Speech Recognition. Coba buka di Chrome atau Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLang;

      // Preserve base input prior to dictation start
      baseInputRef.current = input ? input.trim() + ' ' : '';
      finalTranscriptRef.current = '';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            finalTranscriptRef.current += text + ' ';
          } else {
            interimText += text;
          }
        }

        // Clean concatenation: base + committed final + current interim preview
        // NEVER duplicates words on interim frames!
        const assembled = (baseInputRef.current + finalTranscriptRef.current + interimText)
          .replace(/\s+/g, ' ')
          .trimStart();
        setInput(assembled);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error notice:', e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInput((prev) => prev.replace(/\s+/g, ' ').trim());
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Recognition start notice:', err);
      setIsRecording(false);
    }
  };

  // Enter key goes down to the next line (kebawah ke baris selanjutnya).
  // Send via Cmd+Enter / Ctrl+Enter or by clicking the Send button.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  // Focus textarea when element is selected so user can directly type their revision
  useEffect(() => {
    if (selectedElement) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
    }
  }, [selectedElement]);

  const handleSend = () => {
    const textToSend = input.trim();
    if ((!textToSend && attachments.length === 0 && !selectedElement) || isStreaming) return;

    onSendMessage(textToSend, attachments, selectedElement || undefined, researchDepth);
    setInput('');
    setAttachments([]);
    onClearSelectedElement?.();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setIsSlashDismissed(false);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const newAttachments: AttachedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const isImg = file.type.startsWith('image/');
      const isText =
        file.type.startsWith('text/') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.tsx') ||
        file.name.endsWith('.jsx') ||
        file.name.endsWith('.html') ||
        file.name.endsWith('.css') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.py') ||
        file.name.endsWith('.md');

      if (isImg) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        newAttachments.push({
          id: 'att-' + Date.now() + '-' + i,
          name: file.name,
          type: file.type || 'image/png',
          size: file.size,
          dataUrl,
        });
      } else if (isText || file.size < 500000) {
        const textContent = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        });
        newAttachments.push({
          id: 'att-' + Date.now() + '-' + i,
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          textContent,
        });
      }
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
      }}
      className={`flex-1 flex flex-col min-w-0 bg-[#07080a] relative h-full transition-all overflow-hidden ${
        isDragging ? 'ring-1 ring-inset ring-white/30' : ''
      }`}
    >
      {/* Ambient Vesper Video Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <video
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260818_072341_50851634-bbc3-4c33-9acc-7647d4db44aa.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-35 scale-105 pointer-events-none"
        />
        {/* Scrim & Vignette for dark contrast & readability */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.5)_0%,rgba(7,8,10,0.85)_70%,#07080a_100%)] pointer-events-none" />
        {/* Subtle Grain Overlay */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.js,.ts,.tsx,.jsx,.html,.css,.json,.py,.md,.txt"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Messages Stream Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-6 space-y-6 scroll-smooth relative z-10 overscroll-contain"
        style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto py-16 text-center space-y-8 animate-fadeIn">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white drop-shadow-sm">
                Bagaimana Vesper AI dapat membantu Anda hari ini?
              </h2>
              <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed">
                Asisten multifungsi untuk analisis, tanya jawab & solusi soal, riset informasi web, serta rekayasa antarmuka.
              </p>
            </div>

            {/* Multifunctional Clean Action Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-1">
              {[
                {
                  icon: FileText,
                  label: 'Pemecahan & Solusi Soal',
                  desc: 'Penalaran bertahap soal matematika, sains, atau analisis logika',
                  prompt: 'Bantu jelaskan dan selesaikan soal fisika ini secara bertahap dengan rumus yang jelas: Sebuah mobil bermassa 1.200 kg melaju dengan kecepatan 20 m/s kemudian direm hingga berhenti dalam jarak 50 meter. Berapakah gaya pengereman yang bekerja pada mobil tersebut?',
                },
                {
                  icon: Globe,
                  label: 'Riset & Eksplorasi Web',
                  desc: 'Analisis mendalam, fakta terkini, dan perbandingan komprehensif',
                  prompt: 'Lakukan riset komprehensif mengenai perkembangan teknologi baterai solid-state vs lithium-ion saat ini, mencakup kelebihan, tantangan manufaktur, dan estimasi waktu komersialisasinya.',
                },
                {
                  icon: Compass,
                  label: 'Analisis Konsep & Esai',
                  desc: 'Susun argumen terstruktur, tinjauan kritis, atau penulisan esai',
                  prompt: 'Tuliskan esai analisis kritis mengenai dampak otomatisasi kecerdasan buatan terhadap keterampilan masa depan dan etika ketenagakerjaan secara mendalam dan berbobot.',
                },
                {
                  icon: Layers,
                  label: 'Rekayasa Web & Antarmuka',
                  desc: 'Bangun prototipe aplikasi modular interaktif di live preview',
                  prompt: 'Buatkan antarmuka kalkulator simulasi investasi berkala dan bunga majemuk modular (index.html, src/main.js, styles/theme.css) dengan visualisasi grafik interaktif.',
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    onClick={() => onSendMessage(item.prompt)}
                    className="p-3.5 rounded-2xl bg-[#141416]/80 hover:bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 hover:border-white/25 text-left transition-all ios-tap group shadow-lg flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-white/80 group-hover:text-white" />
                      </div>
                      <div className="text-xs font-medium text-white/90 group-hover:text-white">
                        {item.label}
                      </div>
                    </div>
                    <div className="text-[11px] text-white/50 mt-2 line-clamp-1 leading-normal">
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => {
              if (msg.role === 'user') {
                // Clean any legacy raw metadata strings from display
                const cleanContent = msg.content
                  .replace(/\[AIS_METADATA_SECTION_START\][\s\S]*?\[AIS_METADATA_SECTION_END\]/g, '')
                  .replace(/^Perbarui elemen \[.*?\] \(.*?\):\s*/i, '')
                  .trim();

                const targetTag = msg.selectedElement?.tagName?.toLowerCase() || (
                  msg.content.match(/^Perbarui elemen \[.*?\] \(([a-z0-9_-]+)\)/i)?.[1]?.toLowerCase()
                );

                return (
                  <div key={msg.id} className="flex flex-col items-end gap-1.5 max-w-full min-w-0">
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap justify-end gap-2 max-w-full">
                        {msg.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="rounded-2xl border border-white/10 bg-[#1c1c1e] overflow-hidden text-xs max-w-full"
                          >
                            {att.dataUrl && att.type.startsWith('image/') ? (
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                className="max-h-48 max-w-xs object-cover rounded-2xl"
                              />
                            ) : (
                              <div className="flex items-center gap-2 p-2.5 font-mono text-[11px] text-white/80">
                                <FileCode className="w-4 h-4 text-white/60" />
                                <span className="truncate max-w-[180px]">{att.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {(cleanContent || targetTag) && (
                      <div className="flex flex-col items-end gap-1 max-w-[90%] sm:max-w-[82%]">
                        <div className="w-full liquid-glass-panel rounded-[22px] px-4 py-3 text-xs text-white leading-relaxed overflow-hidden flex flex-col items-start gap-1.5 break-words">
                          {targetTag && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-chip text-[11px] font-mono text-white/95">
                              <span className="text-[#0a84ff] font-semibold">&lt;{targetTag}&gt;</span>
                              {msg.selectedElement?.textSnippet && (
                                <span className="text-white/50 text-[10.5px] font-sans truncate max-w-[140px]">
                                  "{msg.selectedElement.textSnippet}"
                                </span>
                              )}
                            </div>
                          )}
                          {cleanContent && (
                            <div className="whitespace-pre-wrap break-words w-full overflow-hidden text-left">
                              {renderUserText(cleanContent)}
                            </div>
                          )}
                        </div>

                        {/* User Bubble Action Buttons: Like, Dislike, Salin, Bagikan */}
                        <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity px-1">
                          <button
                            type="button"
                            onClick={() => onToggleMessageLike?.(msg.id, 'like')}
                            className={`p-1 rounded-md hover:bg-white/10 transition-colors ${
                              msg.liked ? 'text-[#30d158]' : 'text-white/40 hover:text-white'
                            }`}
                            title="Sukai pesan ini"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleMessageLike?.(msg.id, 'dislike')}
                            className={`p-1 rounded-md hover:bg-white/10 transition-colors ${
                              msg.disliked ? 'text-[#ff453a]' : 'text-white/40 hover:text-white'
                            }`}
                            title="Tidak suka"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(cleanContent, msg.id, msg)}
                            className="p-1 text-white/40 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                            title="Salin isi pesan"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-[#30d158]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={onOpenShareModal}
                            className="p-1 text-white/40 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                            title="Bagikan Tautan Obrolan"
                          >
                            <Share2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Assistant turn
              return (
                <div key={msg.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <span className="text-white/60 font-medium">
                      {msg.modelUsed || settings.selectedModel}
                    </span>
                  </div>

                  <div className="text-xs text-white/90">
                    {/* Action History: Strictly for coding, website, or app development tasks, and restores persisted messages */}
                    {Boolean(
                      msg.isCoding ||
                      (msg.isCoding !== false && (
                        (msg.modifiedFiles && msg.modifiedFiles.length > 0) ||
                        (msg.projectFiles && Object.keys(msg.projectFiles).length > 0) ||
                        (msg.thinkingSteps && msg.thinkingSteps.some((s) => s.action === 'create_file' || s.action === 'edit_file' || s.action === 'build'))
                      ))
                    ) && (
                      <ActionHistory
                        steps={msg.thinkingSteps}
                        modifiedFiles={msg.modifiedFiles}
                        projectFiles={msg.projectFiles || (msg.isStreaming ? undefined : projectFiles)}
                        fileStatuses={msg.fileStatuses}
                        activeWritingFile={msg.activeWritingFile}
                        isStreaming={msg.isStreaming}
                        modelName={msg.modelUsed || settings.selectedModel}
                        onRunInSandbox={onRunInSandbox}
                      />
                    )}

                    {/* Bouncing Dots Typing/Processing Animation: (...) */}
                    {msg.isStreaming && !msg.content.trim() && (!msg.modifiedFiles || msg.modifiedFiles.length === 0) && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18181b]/80 border border-white/10 w-fit my-2 shadow-sm animate-fadeIn">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" />
                        </div>
                        <span className="text-[11px] text-white/40 font-mono tracking-widest ml-0.5">
                          (...)
                        </span>
                      </div>
                    )}

                    {/* Real-time Web Research Activity */}
                    {msg.researchReport && (
                      <ResearchActivity report={msg.researchReport} />
                    )}

                    {/* AI Generated Image Card Support */}
                    {msg.generatedImageUrl && (
                      <ImageCard
                        imageUrl={msg.generatedImageUrl}
                        prompt={msg.generatedImagePrompt || ''}
                        onInsertToProject={onInsertImageToProject}
                      />
                    )}

                    {msg.content && (
                      <MessageRenderer
                        content={msg.content}
                        sources={msg.researchReport?.sources}
                        onSelectSourceNumber={(num) => {
                          const matched = msg.researchReport?.sources?.find((s) => s.number === num);
                          if (matched) setSelectedSourcePreview(matched);
                        }}
                        onHoverSourceNumber={(num) => setHoveredSourceNumber(num)}
                        onRunInSandbox={onRunInSandbox}
                        onUpdateMessageContent={(newContent) =>
                          onUpdateMessageContent?.(msg.id, newContent)
                        }
                      />
                    )}

                    {/* Verified Sources List */}
                    {msg.researchReport?.sources && msg.researchReport.sources.length > 0 && (
                      <ResearchSourcesList
                        sources={msg.researchReport.sources}
                        activeSourceNumber={hoveredSourceNumber}
                        onSelectSource={(source) => setSelectedSourcePreview(source)}
                      />
                    )}

                    {/* Assistant Bubble Action Buttons (when completed): Like, Dislike, Salin, Bagikan */}
                    {!msg.isStreaming && (
                      <div className="flex items-center gap-1.5 pt-2 text-white/40">
                        <button
                          type="button"
                          onClick={() => onToggleMessageLike?.(msg.id, 'like')}
                          className={`p-1 rounded-md hover:bg-white/10 transition-colors ${
                            msg.liked ? 'text-[#30d158]' : 'hover:text-white'
                          }`}
                          title="Sukai jawaban ini"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleMessageLike?.(msg.id, 'dislike')}
                          className={`p-1 rounded-md hover:bg-white/10 transition-colors ${
                            msg.disliked ? 'text-[#ff453a]' : 'hover:text-white'
                          }`}
                          title="Tidak suka"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.content, msg.id, msg)}
                          className="p-1 rounded-md hover:bg-white/10 hover:text-white transition-colors"
                          title="Salin teks jawaban"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-[#30d158]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={onOpenShareModal}
                          className="p-1 rounded-md hover:bg-white/10 hover:text-white transition-colors"
                          title="Bagikan Tautan Obrolan"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating smooth scroll-to-bottom button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="sticky bottom-4 ml-auto mr-2 z-20 p-2.5 rounded-full bg-[#1c1c1e]/90 hover:bg-[#2c2c2e] active:scale-95 border border-white/15 text-white/80 hover:text-white shadow-xl backdrop-blur-xl transition-all ios-tap flex items-center justify-center animate-fadeIn"
            title="Gulir ke pesan terbaru"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Bottom Input Dock - Seamless gradient: transparent at top, 50% black at bottom */}
      <div className="border-t-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent p-3 md:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-6 shrink-0 relative z-10">
        <div className="max-w-3xl mx-auto space-y-2 relative">
          {/* Floating Slash Commands & Skills Menu */}
          {isMenuVisible && (
            <div
              ref={skillMenuRef}
              className={`absolute bottom-full mb-3 left-0 right-0 max-w-xl mx-auto liquid-glass-panel rounded-3xl p-3 shadow-2xl z-20 space-y-2 ${
                isClosingSkillMenu ? 'animate-popover-close' : 'animate-fadeIn'
              }`}
              style={{ isolation: 'isolate' }}
            >
              <div className="px-3 py-1.5 text-[10.5px] font-semibold text-white/60 uppercase tracking-wider border-b border-white/[0.12] flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/95">
                  <span className="w-4 h-4 rounded-md bg-white/15 text-white flex items-center justify-center font-bold text-xs shadow-inner">/</span>
                  <span className="text-white text-xs font-semibold normal-case tracking-normal">Pintasan Skill & Perintah AI</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-[10px] hidden sm:inline">Pilih untuk menerapkan</span>
                  <button
                    type="button"
                    onClick={handleCloseSkillMenu}
                    className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    title="Tutup menu pintasan"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 p-1 scrollbar-thin">
                {/* 1. Image Generator Command */}
                <button
                  type="button"
                  onClick={() => {
                    handleSelectSlashImage();
                    handleCloseSkillMenu();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl text-left liquid-glass-chip hover:border-white/30 transition-all group ios-tap"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl liquid-glass-icon-btn flex items-center justify-center text-white/90 shrink-0">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white transition-colors">
                        /image <span className="font-normal text-white/40">[deskripsi gambar]</span>
                      </div>
                      <div className="text-[10.5px] text-white/50">
                        Buat gambar AI beresolusi tinggi langsung di chat
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/80 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full font-mono shadow-sm">
                    Gambar
                  </span>
                </button>

                {/* 2. Skills from Catalog */}
                {filteredSlashSkills.map((sk) => {
                  const isActive = settings.activeSkillIds.includes(sk.id);
                  return (
                    <button
                      key={sk.id}
                      type="button"
                      onClick={() => {
                        handleSelectSlashSkill(sk);
                        handleCloseSkillMenu();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all group ios-tap ${
                        isActive ? 'liquid-glass-chip-active' : 'liquid-glass-chip'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="w-7 h-7 rounded-xl liquid-glass-icon-btn flex items-center justify-center text-white/90 shrink-0">
                          <Cpu className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            /{sk.name}
                          </div>
                          <div className="text-[10.5px] text-white/50 truncate">
                            {sk.description}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full shrink-0 transition-all ${
                          isActive
                            ? 'bg-white/25 text-white border border-white/30 font-medium shadow-sm'
                            : 'text-white/50 bg-white/[0.06] hover:text-white/80 border border-white/10'
                        }`}
                      >
                        {isActive ? 'Aktif' : 'Pilih'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions Panel - Liquid Glass Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
            <span className="text-[10.5px] font-medium tracking-tight text-white/40 shrink-0 pr-1 hidden sm:inline">
              Quick Actions:
            </span>

            {/* Pintasan Skill Capsule Button */}
            <button
              type="button"
              onClick={() => {
                if (isMenuVisible) {
                  handleCloseSkillMenu();
                } else {
                  setIsSkillMenuOpen(true);
                  setIsSlashDismissed(false);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium shrink-0 transition-all ios-tap ${
                isMenuVisible
                  ? 'liquid-glass-chip-active text-white'
                  : 'liquid-glass-chip text-white/80 hover:text-white'
              }`}
              title="Buka Pintasan Skill & Perintah AI (/)"
            >
              <Cpu className="w-3 h-3 text-white/80" />
              <span>Pintasan Skill (/)</span>
            </button>

            {/* Riset Web Capsule Button in Quick Actions */}
            <button
              type="button"
              onClick={() =>
                setResearchDepth((prev) =>
                  prev === 'off' ? 'web' : prev === 'web' ? 'deep' : 'off'
                )
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium shrink-0 transition-all ios-tap ${
                researchDepth !== 'off'
                  ? 'liquid-glass-chip-active text-white'
                  : 'liquid-glass-chip text-white/80 hover:text-white'
              }`}
              title="Ubah mode riset web (Off / Web Search / Deep Research)"
            >
              <Globe className={`w-3 h-3 ${researchDepth !== 'off' ? 'text-white' : 'text-white/70'}`} />
              <span>
                {researchDepth === 'web'
                  ? 'Web Search'
                  : researchDepth === 'deep'
                  ? 'Deep Research'
                  : 'Riset Web'}
              </span>
              {researchDepth !== 'off' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)] shrink-0 ml-0.5" />
              )}
            </button>

            {QUICK_ACTIONS.map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-chip text-[11px] font-medium text-white/80 hover:text-white shrink-0 transition-all ios-tap"
                  title={action.prompt}
                >
                  <ActionIcon className="w-3 h-3 text-white/60 group-hover:text-white transition-colors" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Status Badges: Target Focus Element & Research Mode */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedElement && (
              <div className="inline-flex items-center gap-2 px-3 py-1 liquid-glass-chip-active rounded-full text-xs text-white shadow-sm animate-fadeIn">
                <Crosshair className="w-3.5 h-3.5 text-[#0a84ff] shrink-0" />
                <span className="font-mono font-medium text-white/95">
                  &lt;{selectedElement.tagName.toLowerCase()}&gt;
                </span>
                {selectedElement.textSnippet && (
                  <span className="text-white/50 text-[11px] truncate max-w-[160px]">
                    "{selectedElement.textSnippet}"
                  </span>
                )}
                <button
                  onClick={onClearSelectedElement}
                  className="p-0.5 text-white/50 hover:text-white rounded-full transition-colors ml-0.5"
                  title="Batalkan target elemen"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Active Research Indicator Chip */}
            {researchDepth !== 'off' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 liquid-glass-chip-active rounded-full text-xs text-white shadow-sm animate-fadeIn">
                <Globe className="w-3.5 h-3.5 text-white/90 shrink-0" />
                <span className="font-medium text-white/95 text-[11px]">
                  {researchDepth === 'web' ? 'Web Search Aktif' : 'Deep Research Aktif'}
                </span>
                <button
                  type="button"
                  onClick={() => setResearchDepth('off')}
                  className="p-0.5 text-white/50 hover:text-white rounded-full transition-colors ml-0.5"
                  title="Matikan Riset Web"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2 liquid-glass-panel rounded-2xl">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 pl-2.5 pr-2 py-1 liquid-glass-chip rounded-full text-[11px] text-white/90"
                >
                  {att.type.startsWith('image/') ? (
                    <ImageIcon className="w-3.5 h-3.5 text-white/70" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-white/70" />
                  )}
                  <span className="truncate max-w-[130px] font-mono">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="p-0.5 text-white/50 hover:text-white rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Real-time Voice Recording Status Indicator (Liquid Glass) */}
          {isRecording && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-white/[0.06] border border-white/[0.14] backdrop-blur-xl mb-2 text-xs shadow-lg animate-fadeIn select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <span className="font-medium text-white/90 truncate">
                  Mendengarkan ({voiceLang === 'id-ID' ? 'Bahasa Indonesia' : 'English'})...
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const nextLang = voiceLang === 'id-ID' ? 'en-US' : 'id-ID';
                    setVoiceLang(nextLang);
                    if (recognitionRef.current) {
                      recognitionRef.current.lang = nextLang;
                    }
                  }}
                  className="px-2 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-[10.5px] font-mono text-white/90 transition-all ios-tap cursor-pointer"
                  title="Ganti Bahasa Input Suara"
                >
                  Lang: {voiceLang === 'id-ID' ? 'ID' : 'EN'}
                </button>

                <button
                  type="button"
                  onClick={toggleRecording}
                  className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/35 text-[11px] font-medium text-rose-300 transition-all ios-tap cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}

          {/* Liquid Glass Floating Capsule Input Field */}
          <div className="relative flex items-end gap-1.5 sm:gap-2 liquid-glass-capsule rounded-[28px] p-2 sm:p-2.5 transition-all">
            {/* Dynamic Feature Rail with Framer Motion (Paperclip, Globe, Mic) */}
            <motion.div
              layout
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 32,
                mass: 0.8,
              }}
              className={`shrink-0 self-end transition-all ${
                featureRailMode === 'vertical'
                  ? 'flex flex-col items-center gap-1.5 pb-0.5 max-h-48 overflow-y-auto scrollbar-none scroll-smooth'
                  : featureRailMode === 'semi-vertical'
                  ? 'grid grid-flow-col grid-rows-2 gap-1.5 pb-0.5 items-end'
                  : 'flex flex-row items-center gap-1.5 pb-0.5'
              }`}
              style={{ scrollBehavior: 'smooth' }}
            >
              {/* 1. Attachment Button */}
              <motion.button
                layout
                key="feature-attachment"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 440, damping: 28 }}
                className="w-8 h-8 flex items-center justify-center liquid-glass-icon-btn text-white/70 hover:text-white rounded-full transition-all shrink-0 ios-tap"
                title="Lampirkan file atau gambar"
              >
                <Paperclip className="w-4 h-4" />
              </motion.button>

              {/* 2. Research Mode Circular Icon Button */}
              <motion.button
                layout
                key="feature-research"
                type="button"
                onClick={() =>
                  setResearchDepth((prev) =>
                    prev === 'off' ? 'web' : prev === 'web' ? 'deep' : 'off'
                  )
                }
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 440, damping: 28 }}
                className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-all shrink-0 ios-tap ${
                  researchDepth !== 'off'
                    ? 'liquid-glass-icon-btn-active text-white'
                    : 'liquid-glass-icon-btn text-white/70 hover:text-white'
                }`}
                title={`Riset Web: ${
                  researchDepth === 'web'
                    ? 'Web Search (Aktif - klik untuk Deep Research)'
                    : researchDepth === 'deep'
                    ? 'Deep Research (Aktif - klik untuk Nonaktifkan)'
                    : 'Riset Web (Nonaktif - klik untuk Aktifkan)'
                }`}
              >
                <Globe className="w-4 h-4" />
                {researchDepth !== 'off' && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)]" />
                )}
              </motion.button>

              {/* 3. Mic / Voice Recording Button */}
              <motion.button
                layout
                key="feature-mic"
                type="button"
                onClick={toggleRecording}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 440, damping: 28 }}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shrink-0 ios-tap ${
                  isRecording
                    ? 'bg-[#ff453a] text-white shadow-[0_0_15px_rgba(255,69,58,0.6)] animate-pulse'
                    : 'liquid-glass-icon-btn text-white/70 hover:text-white'
                }`}
                title={isRecording ? 'Berhenti merekam suara' : 'Dikte suara (Speech-to-Text)'}
              >
                <Mic className="w-4 h-4" />
              </motion.button>
            </motion.div>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedElement
                  ? `curahkan idemu untuk <${selectedElement.tagName.toLowerCase()}> disini...`
                  : 'curahkan idemu disini...'
              }
              rows={1}
              className="flex-1 bg-transparent text-xs sm:text-[13px] text-white placeholder-white/40 focus:outline-none resize-none max-h-48 leading-relaxed py-2 px-1 font-sans selection:bg-white/20 scrollbar-thin scroll-smooth overscroll-contain transition-all"
            />

            <div className="flex items-center gap-1.5 shrink-0 pr-0.5">
              {isStreaming ? (
                <button
                  onClick={onStopStreaming}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#ff453a]/25 hover:bg-[#ff453a]/35 text-[#ff453a] border border-[#ff453a]/40 text-xs font-medium transition-all shadow-[0_0_12px_rgba(255,69,58,0.3)] ios-tap"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() && attachments.length === 0 && !selectedElement}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-neutral-100 disabled:opacity-20 text-black transition-all disabled:cursor-not-allowed shadow-[0_2px_12px_rgba(255,255,255,0.35),inset_0_1px_1px_rgba(255,255,255,0.9)] active:scale-95 ios-tap"
                  title="Kirim (Cmd/Ctrl + Enter)"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real Source Preview Modal */}
      <SourcePreviewModal
        source={selectedSourcePreview}
        onClose={() => setSelectedSourcePreview(null)}
      />
    </div>
  );
};
