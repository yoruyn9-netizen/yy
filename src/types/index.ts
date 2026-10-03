export interface AttachedFile {
  id: string;
  name: string;
  type: string; // 'image/png', 'text/javascript', 'text/plain', etc.
  size: number;
  dataUrl?: string; // for images
  textContent?: string; // for code / text files
}

export interface ElementHierarchyItem {
  tagName: string;
  selector: string;
  className?: string;
}

export interface SelectedElementInfo {
  selector: string;
  tagName: string;
  textSnippet?: string;
  cssRules?: string;
  dimensions?: { width: number; height: number };
  hierarchy?: ElementHierarchyItem[];
}

export interface SandboxConsoleLog {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  stack?: string;
}

export interface ProjectSnapshot {
  id: string;
  timestamp: number;
  description: string;
  files: Record<string, ProjectFile>;
}

export interface SkillPlugin {
  id: string;
  name: string;
  category: 'code' | 'design' | 'testing' | 'security' | 'docs' | 'tools';
  description: string;
  instruction: string;
  enabled: boolean;
}

export interface ClouviaModel {
  id: string;
  slug: string;
  displayName: string;
  category: string;
  contextLength: number;
  priceInput?: string;
  priceOutput?: string;
  supportsStream?: boolean;
  supportsThinking?: boolean;
  supportsAgentic?: boolean;
  supportsVision?: boolean;
  capabilities?: {
    vision?: boolean;
    thinking?: boolean;
    agentic?: boolean;
    toolCall?: boolean;
    stream?: boolean;
  };
}

export interface ProjectFile {
  path: string; // e.g. "index.html", "src/main.js", "src/components/player.js", "styles/theme.css"
  content: string;
  language: string; // 'html' | 'javascript' | 'typescript' | 'css' | 'json' | 'python' | 'markdown'
}

export interface ProjectState {
  title: string;
  files: Record<string, ProjectFile>; // Keyed by file path
  activeFilePath: string;
}

export interface ThinkingStep {
  id: string;
  action: 'analyze' | 'create_file' | 'edit_file' | 'build' | 'verify';
  target?: string;
  detail: string;
  timestamp: number;
  status?: 'pending' | 'in_progress' | 'completed';
}

export type ResearchDepth = 'off' | 'web' | 'deep';

export interface ResearchSource {
  id: string; // e.g. 'source-1'
  number: number; // 1, 2, 3...
  url: string;
  domain: string;
  title: string;
  snippet?: string;
  favicon?: string;
  content?: string;
  retrievedAt: number;
}

export interface ResearchActivityStep {
  id: string;
  type: 'search' | 'open' | 'extract' | 'compare' | 'complete' | 'error';
  query?: string;
  url?: string;
  title?: string;
  message: string;
  timestamp: number;
  status: 'running' | 'done' | 'failed';
}

export interface ResearchReport {
  depth: 'web' | 'deep';
  query: string;
  subQueries?: string[];
  steps: ResearchActivityStep[];
  sources: ResearchSource[];
  status: 'searching' | 'analyzing' | 'completed' | 'failed';
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string; // Clean explanation outside action history
  timestamp: number;
  attachments?: AttachedFile[];
  selectedElement?: SelectedElementInfo; // Captured target element in selection mode
  modelUsed?: string;
  isStreaming?: boolean;
  isCoding?: boolean; // True when message relates to website/app/coding development
  thinkingSteps?: ThinkingStep[]; // Real dynamic thinking modules
  researchReport?: ResearchReport; // Real web research report with sources & activity
  modifiedFiles?: string[]; // Real file paths touched in this message
  projectFiles?: Record<string, ProjectFile>; // Stored project files for ActionHistory drill-down
  fileStatuses?: Record<string, 'in_progress' | 'completed'>; // Step-by-step file generation status
  activeWritingFile?: string | null; // The exact file currently being written by AI stream
  liked?: boolean;
  disliked?: boolean;
  generatedImageUrl?: string;
  generatedImagePrompt?: string;
  isGeneratingImage?: boolean;
  appliedSkillNames?: string[];
  error?: {
    message: string;
    code?: string;
    type?: string;
    requestId?: string;
    status?: number;
  };
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  systemInstruction: string;
  messages: ChatMessage[];
  projectState?: ProjectState;
  activeSkills?: string[];
  snapshots?: ProjectSnapshot[];
}

export interface StudioSettings {
  baseUrl: string;
  apiKey: string;
  selectedModel: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  stream: boolean;
  systemInstruction: string;
  activeSkillIds: string[];
}

export interface PingResult {
  status: 'idle' | 'testing' | 'success' | 'error';
  httpStatus?: number;
  latencyMs?: number;
  message?: string;
  code?: string;
  requestId?: string;
  rawResponse?: string;
}
