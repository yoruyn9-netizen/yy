import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  File,
  Terminal,
  Maximize2,
  Minimize2,
  Trash2,
  Smartphone,
  Tablet,
  Monitor,
  RotateCw,
  ChevronRight,
  ChevronDown,
  Layers,
  Code,
  MousePointerClick,
  Play,
  Download,
  Plus,
  Wrench,
  AlertCircle,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowDown,
  Check,
} from 'lucide-react';
import { ProjectState, ProjectFile, SelectedElementInfo, ElementHierarchyItem } from '../types';
import { buildMultiFileSandbox, detectLanguage } from '../utils/codeParser';
import { ProjectAppLogo } from './ProjectAppLogo';
import { IPhone17Simulator } from './iphone/IPhone17Simulator';

interface LiveSandboxProps {
  projectState: ProjectState;
  onUpdateProject?: (updated: ProjectState) => void;
  isSelectionMode?: boolean;
  onSelectElement?: (info: SelectedElementInfo) => void;
  onFixWithAi?: (errorMessage: string) => void;
  onExportZip?: () => void;
  selectedElement?: SelectedElementInfo | null;
}

export const LiveSandbox: React.FC<LiveSandboxProps> = ({
  projectState,
  onUpdateProject,
  isSelectionMode = false,
  onSelectElement,
  onFixWithAi,
  onExportZip,
  selectedElement,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [deviceFrame, setDeviceFrame] = useState<'responsive' | 'iphone' | 'ipad'>('responsive');
  const [isPhoneAppOpen, setIsPhoneAppOpen] = useState(true);
  const [liveTime, setLiveTime] = useState(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const [currentFile, setCurrentFile] = useState<string>('index.html');
  const [consoleLogs, setConsoleLogs] = useState<Array<{ level: string; text: string; time: string }>>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTreeOpen, setIsTreeOpen] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    components: true,
    app: true,
  });

  // In-Phone Terminal & Fix All AI state
  const [isPhoneTerminalOpen, setIsPhoneTerminalOpen] = useState(false);
  const [isFixingAi, setIsFixingAi] = useState(false);
  const [fixSuccessMessage, setFixSuccessMessage] = useState<string | null>(null);

  // Trigger "Fix All AI" inside iPhone Terminal
  const handleFixAllAi = () => {
    const errorItems = consoleLogs.filter((l) => l.level === 'error').map((l) => l.text);
    const errorPrompt =
      errorItems.length > 0
        ? errorItems.join('\n')
        : `Tolong periksa dan optimalkan kode proyek "${projectState.title}" agar berjalan mulus tanpa peringatan atau kendala performa.`;

    setIsPhoneTerminalOpen(false);
    if (onFixWithAi) {
      onFixWithAi(errorPrompt);
    }
  };

  // Keyboard shortcut: Escape to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Switch to preview tab when selection mode is activated
  useEffect(() => {
    if (isSelectionMode) {
      setActiveTab('preview');
    }
  }, [isSelectionMode]);

  // Sync selection mode state to iframe
  useEffect(() => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'TOGGLE_SELECTION_MODE',
          enabled: isSelectionMode,
        },
        '*'
      );
    } catch (e) {}
  }, [isSelectionMode]);

  const files = projectState?.files || {
    'index.html': {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Vibe Studio</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #000000;
      color: #86868b;
      letter-spacing: -0.01em;
    }
    .card {
      background: #1c1c1e;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 32px;
      text-align: center;
      max-width: 380px;
    }
    h1 { color: #f5f5f7; font-size: 20px; margin: 0 0 8px 0; font-weight: 600; }
    p { font-size: 13px; line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Live Preview</h1>
    <p>Enter a prompt in the workspace to generate and preview your application.</p>
  </div>
</body>
</html>`,
      language: 'html',
    },
  };

  const filePaths = Object.keys(files);
  const activeFilePath = files[currentFile] ? currentFile : (filePaths[0] || 'index.html');
  const activeFileObject = files[activeFilePath];

  // Receive console messages and element selection from sandbox iframe
  const [openTabs, setOpenTabs] = useState<string[]>(['index.html']);
  const [closingTabPath, setClosingTabPath] = useState<string | null>(null);

  // Keep openTabs in sync with activeFilePath
  useEffect(() => {
    if (activeFilePath && !openTabs.includes(activeFilePath)) {
      setOpenTabs((prev) => [...prev, activeFilePath]);
    }
  }, [activeFilePath, openTabs]);

  const handleCloseTab = (path: string) => {
    if (openTabs.length <= 1) return;
    setClosingTabPath(path);
    setTimeout(() => {
      setOpenTabs((prev) => {
        const next = prev.filter((p) => p !== path);
        if (activeFilePath === path) {
          const nextActive = next[next.length - 1] || 'index.html';
          setCurrentFile(nextActive);
        }
        return next;
      });
      setClosingTabPath(null);
    }, 180);
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'SANDBOX_CONSOLE') {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setConsoleLogs((prev) => [
          ...prev.slice(-150),
          {
            level: e.data.level || 'log',
            text: (e.data.args || []).join(' '),
            time,
          },
        ]);
      } else if (e.data && e.data.type === 'ELEMENT_SELECTED') {
        if (onSelectElement && e.data.payload) {
          onSelectElement(e.data.payload);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectElement]);

  const handleFileContentChange = (newCode: string) => {
    if (!onUpdateProject || !activeFilePath) return;
    const updatedFiles = {
      ...files,
      [activeFilePath]: {
        ...files[activeFilePath],
        content: newCode,
      },
    };
    onUpdateProject({
      ...projectState,
      files: updatedFiles,
    });
  };

  const handleCreateFile = () => {
    const trimmed = newFilePath.trim();
    if (!trimmed) {
      setIsCreatingFile(false);
      return;
    }
    const cleanPath = trimmed.replace(/^\/+/, '');
    if (files[cleanPath]) {
      setCurrentFile(cleanPath);
      setIsCreatingFile(false);
      setNewFilePath('');
      return;
    }

    const language = detectLanguage(cleanPath);
    const updatedFiles: Record<string, ProjectFile> = {
      ...files,
      [cleanPath]: {
        path: cleanPath,
        content: `// ${cleanPath}\n`,
        language,
      },
    };

    onUpdateProject?.({
      ...projectState,
      files: updatedFiles,
      activeFilePath: cleanPath,
    });

    setCurrentFile(cleanPath);
    setIsCreatingFile(false);
    setNewFilePath('');
  };

  const handleDeleteFile = (pathToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pathToDelete === 'index.html') return;
    const remaining = { ...files };
    delete remaining[pathToDelete];

    const nextActive = activeFilePath === pathToDelete ? 'index.html' : activeFilePath;

    onUpdateProject?.({
      ...projectState,
      files: remaining,
      activeFilePath: nextActive,
    });
    if (activeFilePath === pathToDelete) {
      setCurrentFile('index.html');
    }
  };

  const errorLogs = useMemo(() => consoleLogs.filter((l) => l.level === 'error'), [consoleLogs]);
  const errorCount = errorLogs.length;

  const compiledHtml = useMemo(() => {
    return buildMultiFileSandbox(
      {
        title: projectState?.title || 'Vibe App',
        files,
        activeFilePath,
      },
      isSelectionMode
    );
  }, [files, projectState?.title, activeFilePath, isSelectionMode]);

  // Synchronize and re-mount sandbox iframe whenever compiledHtml updates
  useEffect(() => {
    setIframeKey((k) => k + 1);
  }, [compiledHtml]);

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  // Build tree structure
  const treeNodes = useMemo(() => {
    const folders: Record<string, string[]> = {};
    const rootFiles: string[] = [];

    filePaths.forEach((p) => {
      if (p.includes('/')) {
        const parts = p.split('/');
        const folder = parts.slice(0, -1).join('/');
        if (!folders[folder]) folders[folder] = [];
        folders[folder].push(p);
      } else {
        rootFiles.push(p);
      }
    });

    return { folders, rootFiles };
  }, [filePaths]);

  return (
    <div className={`flex flex-col bg-[#000000] h-full ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'}`}>
      {/* Top Header Bar - Apple Safari / macOS Window Chrome */}
      <div className="h-11 bg-[#0c0c0e]/95 backdrop-blur-2xl border-b border-white/[0.08] px-2.5 flex items-center justify-between shrink-0 select-none gap-2 min-w-0">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-[#1c1c1e] p-0.5 rounded-full border border-white/[0.08]">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-all ios-tap ${
                activeTab === 'preview'
                  ? 'bg-[#2c2c2e] text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Preview UI"
            >
              <Play className="w-3 h-3 fill-current text-white/80" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-all ios-tap ${
                activeTab === 'code'
                  ? 'bg-[#2c2c2e] text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
              title={`Files (${filePaths.length})`}
            >
              <Code className="w-3 h-3" />
              <span>Files</span>
              <span className="font-mono text-[10px] text-white/50 bg-white/10 px-1.5 py-0.2 rounded-full">
                {filePaths.length}
              </span>
            </button>
          </div>
        </div>

        {/* Center: iPhone / iPad / Desktop Viewport Switcher */}
        {activeTab === 'preview' && (
          <div className="flex items-center bg-[#1c1c1e] p-0.5 rounded-full border border-white/[0.08] shrink-0">
            <button
              onClick={() => setDeviceFrame('responsive')}
              className={`p-1.5 rounded-full transition-all ios-tap ${
                deviceFrame === 'responsive' ? 'bg-[#2c2c2e] text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}
              title="Responsive Desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceFrame('ipad')}
              className={`p-1.5 rounded-full transition-all ios-tap ${
                deviceFrame === 'ipad' ? 'bg-[#2c2c2e] text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}
              title="iPad View"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceFrame('iphone')}
              className={`p-1.5 rounded-full transition-all ios-tap ${
                deviceFrame === 'iphone' ? 'bg-[#2c2c2e] text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}
              title="iPhone View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/[0.08] rounded-full transition-colors ios-tap"
            title="Reload Preview"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full transition-all ios-tap ${
              isConsoleOpen ? 'bg-[#2c2c2e] text-white' : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Console Log & Errors"
          >
            <Terminal className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Console</span>
            {errorCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-[#ff453a] text-white font-mono text-[9.5px] font-bold">
                {errorCount}
              </span>
            ) : consoleLogs.length > 0 ? (
              <span className="font-mono text-[10px] text-white/50 tabular-nums">
                ({consoleLogs.length})
              </span>
            ) : null}
          </button>

          {onExportZip && (
            <button
              onClick={onExportZip}
              className="flex items-center gap-1 px-2 py-1 text-xs text-white/70 hover:text-white hover:bg-white/[0.08] rounded-full transition-all ios-tap"
              title="Download Project ZIP"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xl:inline font-medium">Export</span>
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/[0.08] rounded-full transition-colors ios-tap"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Sandbox Content Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: File Tree Sidebar (Shown when on 'code' tab) */}
        {activeTab === 'code' && (
          <aside
            className={`${
              isTreeOpen ? 'w-44 sm:w-52' : 'w-10'
            } bg-[#0c0c0e] border-r border-white/[0.08] flex flex-col shrink-0 select-none transition-all duration-200`}
          >
            <div className="p-2 border-b border-white/[0.06] flex items-center justify-between text-xs text-white/60 font-medium">
              {isTreeOpen ? (
                <>
                  <span className="flex items-center gap-1.5 truncate">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span>Files</span>
                    <span className="font-mono text-[10px] text-white/40">({filePaths.length})</span>
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setIsCreatingFile(true)}
                      className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                      title="Create New File"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsTreeOpen(false)}
                      className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                      title="Collapse Files Sidebar"
                    >
                      <PanelLeftClose className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setIsTreeOpen(true)}
                  className="w-full flex items-center justify-center py-1 text-white/50 hover:text-white transition-colors"
                  title="Expand Files Sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              )}
            </div>

            {isTreeOpen && isCreatingFile && (
              <div className="p-2 border-b border-white/[0.06] bg-white/[0.03]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateFile();
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    type="text"
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    placeholder="e.g. src/utils.js"
                    autoFocus
                    className="w-full bg-[#1c1c1e] text-white text-[11px] font-mono px-2 py-1 rounded-md border border-white/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingFile(false);
                      setNewFilePath('');
                    }}
                    className="p-1 text-white/40 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </form>
              </div>
            )}

            {isTreeOpen && (
              <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[11.5px]">
                {/* Root Files */}
                {treeNodes.rootFiles.map((path) => (
                  <div
                    key={path}
                    onClick={() => setCurrentFile(path)}
                    className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      activeFilePath === path
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <File className="w-3.5 h-3.5 text-white/40 shrink-0" />
                      <span className="truncate">{path}</span>
                    </div>
                    {path !== 'index.html' && (
                      <button
                        onClick={(e) => handleDeleteFile(path, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-[#ff453a] rounded-md transition-opacity shrink-0"
                        title="Delete file"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Folders & Nested Files */}
                {Object.entries(treeNodes.folders).map(([folder, fPaths]) => {
                  const isExpanded = expandedFolders[folder] ?? true;
                  return (
                    <div key={folder} className="space-y-0.5">
                      <button
                        onClick={() => toggleFolder(folder)}
                        className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-left text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-white/40 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-white/40 shrink-0" />
                        )}
                        {isExpanded ? (
                          <FolderOpen className="w-3.5 h-3.5 text-white/60 shrink-0" />
                        ) : (
                          <Folder className="w-3.5 h-3.5 text-white/40 shrink-0" />
                        )}
                        <span className="truncate text-white/80">{folder}</span>
                      </button>

                      {isExpanded && (
                        <div className="pl-4 space-y-0.5 border-l border-white/[0.06] ml-2">
                          {fPaths.map((p) => {
                            const filename = p.split('/').pop() || p;
                            return (
                              <div
                                key={p}
                                onClick={() => setCurrentFile(p)}
                                className={`group w-full flex items-center justify-between px-2 py-1 rounded-lg text-left transition-colors cursor-pointer ${
                                  activeFilePath === p
                                    ? 'bg-white/10 text-white font-medium'
                                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate min-w-0">
                                  <File className="w-3 h-3 text-white/40 shrink-0" />
                                  <span className="truncate">{filename}</span>
                                </div>
                                <button
                                  onClick={(e) => handleDeleteFile(p, e)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-[#ff453a] rounded-md transition-opacity shrink-0"
                                  title="Delete file"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        )}

        {/* Center Canvas: Live Sandbox Iframe or Multi-File Editor */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#000000] relative overflow-hidden">
          {activeTab === 'preview' ? (
            <div
              ref={previewContainerRef}
              className="w-full h-full relative flex items-center justify-center p-2 sm:p-4 bg-[#050507] overflow-auto select-none"
            >
              {/* iPhone 17 Pro Max Simulator */}
              {deviceFrame === 'iphone' ? (
                <IPhone17Simulator
                  projectState={projectState}
                  compiledHtml={compiledHtml}
                  consoleLogs={consoleLogs}
                  errorCount={errorCount}
                  onClearLogs={() => setConsoleLogs([])}
                  onFixWithAi={onFixWithAi}
                  iframeRef={iframeRef}
                  onReloadIframe={() => setIframeKey((k) => k + 1)}
                  iframeKey={iframeKey}
                />
              ) : deviceFrame === 'ipad' ? (
                /* iPad Frame Simulator */
                <div className="relative w-full max-w-[768px] h-[95%] max-h-[95%] rounded-[28px] sm:rounded-[36px] border-[7px] border-[#2c2d30] bg-[#000000] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col ring-1 ring-white/20 shrink-0 my-auto">
                  {/* iPad Status Bar */}
                  <div className="h-8 bg-[#121316] px-5 flex items-center justify-between text-white/80 text-xs font-medium border-b border-white/[0.08]">
                    <span>{liveTime}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/50">iPadOS</span>
                      <span className="text-[10px] text-white/70">100%</span>
                    </div>
                  </div>
                  <iframe
                    key={iframeKey}
                    ref={iframeRef}
                    srcDoc={compiledHtml}
                    title="iPad Preview"
                    sandbox="allow-scripts allow-modals allow-same-origin"
                    className="w-full flex-1 border-0 bg-transparent"
                  />
                  <div className="h-4 flex items-center justify-center shrink-0">
                    <div className="w-36 h-1 bg-white/30 rounded-full pointer-events-none" />
                  </div>
                </div>
              ) : (
                /* Responsive Full Frame */
                <div className="w-full h-full flex flex-col">
                  <iframe
                    key={iframeKey}
                    ref={iframeRef}
                    srcDoc={compiledHtml}
                    title="Live Sandbox Preview"
                    sandbox="allow-scripts allow-modals allow-same-origin"
                    className="w-full h-full border-0 bg-transparent"
                  />
                </div>
              )}
              {/* Parent Hierarchy Breadcrumbs Bar */}
              {isSelectionMode && selectedElement?.hierarchy && selectedElement.hierarchy.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-[#1c1c1e]/95 border border-white/20 text-white text-[11px] shadow-2xl backdrop-blur-xl flex items-center gap-1.5 max-w-[94%] overflow-x-auto scrollbar-none animate-fadeIn select-none">
                  <span className="text-white/40 font-medium text-[10px] uppercase tracking-wider shrink-0 pr-1">
                    Hierarchy:
                  </span>
                  {selectedElement.hierarchy.map((item, idx) => {
                    const isTarget = item.selector === selectedElement.selector;
                    return (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-white/30 text-[10px] shrink-0">&gt;</span>}
                        <button
                          onClick={() => {
                            onSelectElement?.({
                              ...selectedElement,
                              selector: item.selector,
                              tagName: item.tagName,
                            });
                          }}
                          className={`px-2 py-0.5 rounded-md font-mono text-[10.5px] transition-all truncate shrink-0 max-w-[110px] ${
                            isTarget
                              ? 'bg-[#0a84ff] text-white font-semibold shadow-sm'
                              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                          }`}
                          title={`Target <${item.tagName}> [${item.selector}]`}
                        >
                          &lt;{item.tagName}&gt;
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-[#000000]">
              {/* File tab bar with real open tabs and close animations */}
              <div className="h-9 px-2 bg-[#0c0c0e] border-b border-white/[0.08] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1 min-w-0">
                  {openTabs.map((tabPath) => {
                    const isTabActive = activeFilePath === tabPath;
                    const isClosing = closingTabPath === tabPath;
                    const fileName = tabPath.split('/').pop() || tabPath;
                    return (
                      <div
                        key={tabPath}
                        onClick={() => setCurrentFile(tabPath)}
                        className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer select-none ${
                          isTabActive
                            ? 'bg-white/10 text-white font-medium shadow-sm'
                            : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
                        } ${isClosing ? 'animate-tab-close' : 'animate-fadeIn'}`}
                      >
                        <File className="w-3 h-3 text-white/40 shrink-0" />
                        <span className="truncate max-w-[120px]">{fileName}</span>
                        {openTabs.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseTab(tabPath);
                            }}
                            className="p-0.5 rounded hover:bg-white/15 text-white/40 hover:text-white opacity-60 group-hover:opacity-100 transition-all ml-0.5"
                            title="Tutup tab"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setActiveTab('preview')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-black hover:bg-white/90 text-xs font-medium font-sans transition-all ios-tap shrink-0"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Run Preview</span>
                </button>
              </div>

              {/* Code editor */}
              <div className="flex-1 p-3 font-mono text-xs overflow-hidden">
                <textarea
                  value={activeFileObject?.content || ''}
                  onChange={(e) => handleFileContentChange(e.target.value)}
                  className="w-full h-full bg-[#121214] text-white/90 p-4 rounded-2xl border border-white/[0.08] focus:outline-none focus:border-white/20 resize-none leading-relaxed font-mono"
                  spellCheck={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Console Drawer - Apple Terminal Sheet */}
      {isConsoleOpen && (
        <div className="h-44 max-h-[45%] bg-[#0c0c0e]/95 backdrop-blur-2xl border-t border-white/[0.08] flex flex-col shrink-0 z-20 shadow-2xl animate-fadeIn">
          <div className="h-8 px-3 bg-[#141416] border-b border-white/[0.06] flex items-center justify-between text-[11px] text-white/60 select-none shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-white/90 font-medium">Console</span>
              {errorCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#ff453a]/20 text-[#ff453a] text-[10px] font-bold">
                  {errorCount} error{errorCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {errorCount > 0 && onFixWithAi && (
                <button
                  onClick={() => {
                    const allErrors = errorLogs.map((l) => l.text).join('\n');
                    onFixWithAi(allErrors);
                  }}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ff453a]/20 hover:bg-[#ff453a]/30 text-[#ff453a] hover:text-white border border-[#ff453a]/30 text-[10px] font-medium transition-all"
                  title="Perbaiki semua error console dengan AI"
                >
                  <Wrench className="w-2.5 h-2.5" />
                  <span>Fix All with AI</span>
                </button>
              )}
              <button
                onClick={() => setConsoleLogs([])}
                className="text-white/40 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-white/5 transition-colors"
                title="Bersihkan log konsol"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
              <button
                onClick={() => setIsConsoleOpen(false)}
                className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
                title="Tutup konsol"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-1.5">
            {consoleLogs.length === 0 ? (
              <div className="text-white/30 italic px-1 py-2 text-center text-xs">
                Tidak ada output konsol atau error runtime.
              </div>
            ) : (
              consoleLogs.map((log, i) => (
                <div
                  key={i}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 rounded-xl transition-all ${
                    log.level === 'error'
                      ? 'text-[#ff453a] bg-[#ff453a]/10 border border-[#ff453a]/20'
                      : log.level === 'warn'
                      ? 'text-[#ffd60a] bg-[#ffd60a]/10'
                      : 'text-white/80 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className="text-white/30 select-none tabular-nums shrink-0 text-[10px] pt-0.5">
                      {log.time}
                    </span>
                    <span className="break-all font-mono text-[11px] leading-relaxed">
                      {log.text}
                    </span>
                  </div>

                  {log.level === 'error' && onFixWithAi && (
                    <button
                      onClick={() => onFixWithAi(log.text)}
                      className="self-end sm:self-center shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ff453a]/20 hover:bg-[#ff453a]/30 text-[#ff453a] hover:text-white border border-[#ff453a]/30 text-[10px] font-sans font-medium transition-all ios-tap"
                      title="Kirim error ini ke AI untuk diperbaiki secara instan"
                    >
                      <Wrench className="w-2.5 h-2.5" />
                      <span>Fix with AI</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
