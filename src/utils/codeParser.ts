import { ProjectFile, ProjectState, ThinkingStep } from '../types';

export interface ParsedCodeBlock {
  language: string;
  code: string;
  filename?: string;
  startIndex: number;
}

/**
 * Normalizes file paths (removes leading slash/dots)
 */
export function normalizePath(p: string): string {
  return p.replace(/^[\.\/]+/, '').replace(/\\/g, '/');
}

/**
 * Detect language from file path extension
 */
export function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
    case 'javascript':
    case 'mjs':
      return 'javascript';
    case 'jsx':
      return 'jsx';
    case 'ts':
    case 'typescript':
      return 'typescript';
    case 'tsx':
      return 'tsx';
    case 'json':
      return 'json';
    case 'py':
    case 'python':
      return 'python';
    case 'md':
    case 'markdown':
      return 'markdown';
    default:
      return 'plaintext';
  }
}

/**
 * Cleans unwanted unfinished raw developer tokens or boilerplate leaks
 * e.g., "[code] → skipped: [Vite/Rollup bundler setup]...", "STATUS: SELESAI / WORK"
 */
export function sanitizeExplanationText(raw: string): string {
  let cleaned = raw;

  // Clean raw skipped bundler tags like "[code] → skipped: ... add when ..."
  cleaned = cleaned.replace(/\[code\]\s*→\s*skipped:.*?(?:\n|$)/gi, '');
  cleaned = cleaned.replace(/\[Vite\/Rollup[^\]]*\]/gi, '');

  // Clean raw caps status tags like "STATUS: SELESAI / WORK", "STATUS: SELESAI"
  cleaned = cleaned.replace(/STATUS:\s*(?:SELESAI|WORK|DONE|SUCCESS|BERHASIL)[^\n]*/gi, '');

  // Clean dangling file label remnants like "berkas nama :", "Nama berkas :", "File:"
  cleaned = cleaned.replace(/(?:^|\n)\s*(?:berkas\s*nama|nama\s*berkas|nama\s*file|file\s*name|berkas|file)\s*[:=–-]?\s*(?:\n|$)/gi, '\n');

  // Clean double blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

export interface ExtractedProject {
  thinkingSteps: ThinkingStep[];
  files: Record<string, ProjectFile>;
  fileStatuses: Record<string, 'in_progress' | 'completed'>;
  activeWritingFile: string | null;
  explanation: string;
  cleanContent: string;
}

/**
 * Extracts real thinking actions, real multi-file projects, and separates explanation
 * from code blocks so all file codes are neatly tucked into ActionHistory!
 */
export function extractProjectAndThinking(
  text: string,
  isCoding: boolean = false,
  isStreaming: boolean = false
): ExtractedProject {
  const thinkingSteps: ThinkingStep[] = [];
  const files: Record<string, ProjectFile> = {};
  const fileStatuses: Record<string, 'in_progress' | 'completed'> = {};
  let activeWritingFile: string | null = null;
  let workingText = text;

  // 1. Parse real <thinking> or ```thinking blocks if emitted
  const thinkingTagRegex = /<thinking>([\s\S]*?)<\/thinking>/gi;
  let tMatch: RegExpExecArray | null;
  while ((tMatch = thinkingTagRegex.exec(text)) !== null) {
    const rawThinking = tMatch[1].trim();
    const lines = rawThinking.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const l of lines) {
      const cleanLine = l.replace(/^[-*•\d\.]+\s*/, '');
      if (cleanLine.toLowerCase().includes('edit') || cleanLine.toLowerCase().includes('ubah')) {
        thinkingSteps.push({
          id: 'step-' + Math.random().toString(36).slice(2, 7),
          action: 'edit_file',
          detail: cleanLine,
          timestamp: Date.now(),
        });
      } else if (
        cleanLine.toLowerCase().includes('buat') ||
        cleanLine.toLowerCase().includes('create') ||
        cleanLine.toLowerCase().includes('tambah')
      ) {
        thinkingSteps.push({
          id: 'step-' + Math.random().toString(36).slice(2, 7),
          action: 'create_file',
          detail: cleanLine,
          timestamp: Date.now(),
        });
      } else {
        thinkingSteps.push({
          id: 'step-' + Math.random().toString(36).slice(2, 7),
          action: 'analyze',
          detail: cleanLine,
          timestamp: Date.now(),
        });
      }
    }
    workingText = workingText.replace(tMatch[0], '');
  }

  // 2. Extract code blocks with file paths
  const codeBlockRegex = /```([a-zA-Z0-9_\-\.\:\/]+)?\s*\n([\s\S]*?)(?:```|$)/g;
  let cMatch: RegExpExecArray | null;

  while ((cMatch = codeBlockRegex.exec(workingText)) !== null) {
    const header = (cMatch[1] || '').trim();
    const code = cMatch[2].trim();
    if (!code && !cMatch[0].endsWith('```')) continue;

    let targetPath = '';
    let language = 'html';

    if (header.includes(':')) {
      const parts = header.split(':');
      language = parts[0].toLowerCase();
      targetPath = parts.slice(1).join(':').trim();
    } else if (header.includes('/') || (header.includes('.') && !header.endsWith('.md'))) {
      targetPath = header;
      language = detectLanguage(header);
    } else {
      language = header.toLowerCase() || 'html';
    }

    // Check if right above the code block there's an explicit project file indicator:
    // e.g. "Berkas nama : index.html", "Nama berkas : src/main.js", "Berkas: index.html", "### index.html", "**src/main.js**"
    let labelMatchedLength = 0;
    if (!targetPath) {
      const textBefore = workingText.slice(Math.max(0, cMatch.index - 200), cMatch.index);
      const fileHeaderMatch = textBefore.match(
        /(?:berkas\s*nama|nama\s*berkas|nama\s*file|file\s*name|project\s*file|berkas\s*proyek|file\s*path|path\s*file|perbaikan\s*(?:pada|untuk|di)?|revisi\s*(?:pada|untuk|di)?|update\s*(?:pada|untuk|di)?|file|berkas|path|dokumen|nama|filename)\s*[:=–-]?\s*[\`\*\s]*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)\b[\`\*]*/i
      );
      if (fileHeaderMatch) {
        targetPath = fileHeaderMatch[1].trim();
        const lastIdx = textBefore.lastIndexOf(fileHeaderMatch[0]);
        if (lastIdx !== -1) {
          labelMatchedLength = textBefore.length - lastIdx;
        }
      } else {
        const mdHeaderMatch = textBefore.match(
          /(?:###|##|#|\*\*|`)\s*([a-zA-Z0-9_\-\.\/]+\.(?:html|css|js|jsx|ts|tsx|json|py))[\`\*]*/i
        );
        if (mdHeaderMatch) {
          targetPath = mdHeaderMatch[1].trim();
          const lastIdx = textBefore.lastIndexOf(mdHeaderMatch[0]);
          if (lastIdx !== -1) {
            labelMatchedLength = textBefore.length - lastIdx;
          }
        }
      }
    }

    // Check inside the first two lines of code for inline comment headers:
    // e.g. "<!-- index.html -->", "// src/main.js", "/* styles/theme.css */"
    if (!targetPath && code) {
      const firstLines = code.split('\n').slice(0, 2).join(' ');
      const commentMatch = firstLines.match(
        /(?:<!--|\/\/|\/\*)\s*([a-zA-Z0-9_\-\.\/]+\.(?:html|css|js|jsx|ts|tsx|json))\s*(?:-->|\*\/)?/i
      );
      if (commentMatch) {
        targetPath = commentMatch[1].trim();
      }
    }

    // If still no path, automatically deduce standard web project files from content:
    if (!targetPath) {
      const trimmedCode = code.trim();
      const isHtmlLike =
        language === 'html' ||
        trimmedCode.startsWith('<!DOCTYPE') ||
        trimmedCode.startsWith('<html') ||
        (trimmedCode.startsWith('<div') && trimmedCode.includes('</div>')) ||
        trimmedCode.includes('<body') ||
        trimmedCode.includes('<head');

      const isCssLike =
        language === 'css' ||
        (trimmedCode.includes('{') &&
          (trimmedCode.includes(':') && (trimmedCode.includes(';') || trimmedCode.includes('}'))));

      const isJsLike =
        language === 'javascript' ||
        language === 'js' ||
        language === 'ts' ||
        language === 'typescript' ||
        language === 'jsx' ||
        language === 'tsx';

      if (isHtmlLike) {
        targetPath = !files['index.html'] ? 'index.html' : 'src/template.html';
        language = 'html';
      } else if (isCssLike && (language === 'css' || !isHtmlLike)) {
        targetPath = !files['styles/theme.css'] ? 'styles/theme.css' : 'styles/custom.css';
        language = 'css';
      } else if (isJsLike && !isHtmlLike) {
        targetPath = !files['src/main.js'] ? 'src/main.js' : 'src/app.js';
        language = 'javascript';
      }
    }

    // If it does NOT have a project file target, keep it as normal markdown code in the chat!
    if (!targetPath) {
      continue;
    }

    targetPath = normalizePath(targetPath);
    const isComplete = cMatch[0].endsWith('```');
    const status = isComplete ? 'completed' : 'in_progress';
    fileStatuses[targetPath] = status;
    if (!isComplete) {
      activeWritingFile = targetPath;
    }

    files[targetPath] = {
      path: targetPath,
      content: code,
      language: detectLanguage(targetPath) || language,
    };

    thinkingSteps.push({
      id: 'step-file-' + targetPath.replace(/[^a-zA-Z0-9]/g, '-'),
      action: 'create_file',
      target: targetPath,
      detail: isComplete ? `Menyelesaikan berkas ${targetPath}` : `Sedang menulis berkas ${targetPath}...`,
      timestamp: Date.now(),
      status,
    });

    // Remove the extracted project file block AND its preceding label from explanation text
    const cutStart = Math.max(0, cMatch.index - labelMatchedLength);
    workingText = workingText.slice(0, cutStart) + workingText.slice(cMatch.index + cMatch[0].length);
    codeBlockRegex.lastIndex = cutStart;
  }

  // 3. Explanation is the remaining text (including normal code snippets for Q&A, math, python, etc.)
  let explanation = workingText.trim();
  explanation = sanitizeExplanationText(explanation);

  // 4. Guarantee Professional Multi-File Vibe Coding Architecture:
  // ONLY run fallback modular synthesis if streaming is COMPLETELY finished (!isStreaming)!
  // This ensures files appear ONE BY ONE naturally as they are streamed, not all at once!
  if (!isStreaming && files['index.html']) {
    let htmlContent = files['index.html'].content;

    // A. Extract or establish styles/theme.css
    if (!files['styles/theme.css']) {
      const styleMatches = [...htmlContent.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
      let cssContent = '';

      if (styleMatches.length > 0) {
        cssContent = styleMatches
          .map((m) => m[1].trim())
          .filter(Boolean)
          .join('\n\n');
        htmlContent = htmlContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      }

      if (!cssContent.trim()) {
        cssContent = `/* Vesper Modern Design System & Theme */
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --bg-primary: #07080a;
  --bg-secondary: #0f1015;
  --surface: #14151b;
  --surface-hover: #1e2029;
  --border: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(255, 255, 255, 0.22);
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --accent: #3b82f6;
  --accent-glow: rgba(59, 130, 246, 0.25);
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --shadow-subtle: 0 4px 20px rgba(0, 0, 0, 0.4);
}

* {
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.glass-panel {
  background: rgba(20, 21, 27, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-subtle);
}
`;
      }

      files['styles/theme.css'] = {
        path: 'styles/theme.css',
        content: `${cssContent.trim()}\n`,
        language: 'css',
      };

      thinkingSteps.push({
        id: 'step-css-' + Math.random().toString(36).slice(2, 6),
        action: 'create_file',
        target: 'styles/theme.css',
        detail: 'Menyusun berkas modular styles/theme.css',
        timestamp: Date.now(),
      });

      if (!htmlContent.includes('styles/theme.css')) {
        if (htmlContent.includes('</head>')) {
          htmlContent = htmlContent.replace('</head>', '  <link rel="stylesheet" href="styles/theme.css">\n</head>');
        } else {
          htmlContent = `<link rel="stylesheet" href="styles/theme.css">\n` + htmlContent;
        }
      }
    }

    // B. Extract or establish src/app/state.js
    if (!files['src/app/state.js'] && !files['src/app/app.js']) {
      files['src/app/state.js'] = {
        path: 'src/app/state.js',
        content: `// Reactive Application State Store & Event Hub
const STORAGE_KEY = 'vesper_app_store_v1';

function getInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    theme: 'dark',
    activeView: 'home',
    items: [],
    metrics: { actions: 0, lastUpdated: new Date().toLocaleTimeString() },
    isInitialized: true,
  };
}

export const appState = getInitialState();
const subscribers = new Set();

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function dispatch(action, payload) {
  if (action === 'INCREMENT_ACTION') {
    appState.metrics.actions = (appState.metrics.actions || 0) + 1;
    appState.metrics.lastUpdated = new Date().toLocaleTimeString();
  } else if (action === 'SET_VIEW') {
    appState.activeView = payload || 'home';
  } else if (action === 'ADD_ITEM') {
    if (payload) appState.items.unshift(payload);
  } else if (action === 'TOGGLE_THEME') {
    appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {}
  subscribers.forEach((fn) => {
    try { fn(appState); } catch (err) { console.error('[State Error]:', err); }
  });
}

if (typeof window !== 'undefined') {
  window.appState = appState;
  window.AppState = { state: appState, dispatch, subscribe };
}
`,
        language: 'javascript',
      };

      thinkingSteps.push({
        id: 'step-state-' + Math.random().toString(36).slice(2, 6),
        action: 'create_file',
        target: 'src/app/state.js',
        detail: 'Menyusun modul state src/app/state.js',
        timestamp: Date.now(),
      });

      if (!htmlContent.includes('src/app/state.js')) {
        if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', '  <script src="src/app/state.js"></script>\n</body>');
        } else {
          htmlContent += '\n<script src="src/app/state.js"></script>';
        }
      }
    }

    // C. Extract or establish src/main.js
    if (!files['src/main.js']) {
      const scriptRegex = /<script(?![^>]*src=["']https?:\/\/)(?:[^>]*)>([\s\S]*?)<\/script>/gi;
      const scriptMatches = [...htmlContent.matchAll(scriptRegex)];
      let jsContent = '';

      if (scriptMatches.length > 0) {
        jsContent = scriptMatches
          .map((m) => m[1].trim())
          .filter(Boolean)
          .join('\n\n');
        htmlContent = htmlContent.replace(scriptRegex, '');
      }

      if (!jsContent.trim()) {
        jsContent = `// Vesper Application Engine & Main Controller
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Vesper] Application engine booted.');

  // Initialize Lucide icons if available
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  // Interactive tactile feedback for all buttons
  document.querySelectorAll('button, a, [role="button"]').forEach((el) => {
    el.addEventListener('pointerdown', () => {
      el.style.transform = 'scale(0.97)';
      el.style.transition = 'transform 0.12s ease';
    });
    const reset = () => {
      el.style.transform = 'none';
    };
    el.addEventListener('pointerup', reset);
    el.addEventListener('pointerleave', reset);
  });

  // Handle form submissions cleanly with feedback
  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const existingMsg = form.querySelector('.form-feedback-toast');
      if (existingMsg) existingMsg.remove();

      const toast = document.createElement('div');
      toast.className = 'form-feedback-toast p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl mt-3 animate-fade-in font-medium';
      toast.textContent = 'Aksi berhasil dieksekusi secara instan!';
      form.appendChild(toast);
      setTimeout(() => toast.remove(), 3200);
    });
  });
});
`;
      }

      files['src/main.js'] = {
        path: 'src/main.js',
        content: `${jsContent.trim()}\n`,
        language: 'javascript',
      };

      thinkingSteps.push({
        id: 'step-js-' + Math.random().toString(36).slice(2, 6),
        action: 'create_file',
        target: 'src/main.js',
        detail: 'Menyusun berkas kontroler src/main.js',
        timestamp: Date.now(),
      });

      if (!htmlContent.includes('src/main.js')) {
        if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', '  <script src="src/main.js"></script>\n</body>');
        } else {
          htmlContent += '\n<script src="src/main.js"></script>';
        }
      }
    }

    files['index.html'].content = htmlContent;
  }

  // If in coding mode and we have files, ensure structured thinking steps exist
  if (isCoding) {
    const hasAnalyzeStep = thinkingSteps.some((s) => s.action === 'analyze');
    if (!hasAnalyzeStep) {
      thinkingSteps.unshift({
        id: 'step-arch',
        action: 'analyze',
        detail: 'Menganalisis arsitektur sistem dan spesifikasi antarmuka',
        timestamp: Date.now() - 200,
      });
    }

    const hasBuildStep = thinkingSteps.some((s) => s.action === 'build' || s.action === 'verify');
    if (!hasBuildStep && Object.keys(files).length > 0) {
      thinkingSteps.push({
        id: 'step-build',
        action: 'build',
        detail: 'Memverifikasi dan merakit struktur proyek modular',
        timestamp: Date.now(),
      });
    }
  }

  return {
    thinkingSteps,
    files,
    fileStatuses,
    activeWritingFile,
    explanation,
    cleanContent: sanitizeExplanationText(workingText),
  };
}

/**
 * Checks if code contains JSX or React-specific syntax needing Babel
 */
function needsBabel(code: string): boolean {
  return /<[A-Z][a-zA-Z0-9]*\b|React\.|ReactDOM|createRoot\b|jsx\b|export\s+default\s+function\s+[A-Z]/.test(code);
}

/**
 * Transforms JavaScript / TypeScript module code so that classes, functions,
 * and variables are exposed across files without being trapped inside closures.
 */
function prepareModuleScript(code: string, path: string): string {
  // 1. Convert common React / standard imports to global window access
  let prepared = code
    .replace(/import\s+React\s*,\s*\{([^}]+)\}\s+from\s+['"]react['"];?/g, 'const { $1 } = window.React || {};')
    .replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"];?/g, 'const { $1 } = window.React || {};')
    .replace(/import\s+React\s+from\s+['"]react['"];?/g, 'const React = window.React;')
    .replace(/import\s+ReactDOM\s+from\s+['"]react-dom(?:\/client)?['"];?/g, 'const ReactDOM = window.ReactDOM;')
    .replace(/import\s+.*?\s+from\s+['"][^'"]+['"];?/g, '// [import resolved: $&]');

  // 2. Transform exports so variables / classes are attached to window and global scope
  prepared = prepared.replace(
    /export\s+default\s+(class|function)\s+([a-zA-Z0-9_$]+)/g,
    '$1 $2; window.$2 = $2;'
  );
  prepared = prepared.replace(
    /export\s+default\s+([a-zA-Z0-9_$]+);?/g,
    'window.$1 = $1;'
  );
  prepared = prepared.replace(
    /export\s+(const|let|var)\s+([a-zA-Z0-9_$]+)\s*=/g,
    '$1 $2 = window.$2 ='
  );
  prepared = prepared.replace(
    /export\s+(function|class)\s+([a-zA-Z0-9_$]+)/g,
    '$1 $2'
  );

  // Expose top-level named classes and functions to window so other files can find them
  const topLevelDeclarations: string[] = [];
  const classMatches = prepared.matchAll(/class\s+([a-zA-Z0-9_$]+)/g);
  for (const m of classMatches) {
    if (m[1]) topLevelDeclarations.push(`if (typeof ${m[1]} !== 'undefined') window.${m[1]} = ${m[1]};`);
  }
  const funcMatches = prepared.matchAll(/function\s+([a-zA-Z0-9_$]+)\s*\(/g);
  for (const m of funcMatches) {
    if (m[1]) topLevelDeclarations.push(`if (typeof ${m[1]} !== 'undefined') window.${m[1]} = ${m[1]};`);
  }

  const exportBridging = topLevelDeclarations.length > 0 ? `\n${topLevelDeclarations.join('\n')}\n` : '';

  return `
/* --- Module: ${path} --- */
try {
${prepared}
${exportBridging}
} catch (moduleErr) {
  console.error('[Runtime Error in ${path}]:', moduleErr.message, moduleErr.stack || '');
}
`;
}

/**
 * Builds a runnable single sandbox runtime bundle from an entire multi-file project.
 * Solves preview errors by:
 * 1. Inlining virtual files for any <script src="..."> and <link href="..."> tags.
 * 2. Removing unresolvable relative URLs that cause 404 HTML parse errors in iframes.
 * 3. Loading Tailwind CSS (Play CDN), Babel Standalone, React 18, and Lucide icons.
 * 4. Ensuring global cross-file visibility for classes/functions across modular files.
 * 5. Providing an interactive DOM Selection Mode inspector for targeted element revisions.
 */
export function buildMultiFileSandbox(project: ProjectState, isSelectionMode: boolean = false): string {
  const files = project.files || {};
  const filePaths = Object.keys(files);

  // Helper to match paths flexibly (e.g. "./src/main.js", "/src/main.js", "src/main.js")
  const findMatchingFile = (url: string): { path: string; file: ProjectFile } | null => {
    const clean = normalizePath(url.split('?')[0].split('#')[0]);
    if (files[clean]) return { path: clean, file: files[clean] };
    const byName = filePaths.find((p) => p.endsWith('/' + clean) || clean.endsWith('/' + p) || p === clean);
    if (byName && files[byName]) return { path: byName, file: files[byName] };
    return null;
  };

  // 1. Identify primary entry HTML file (index.html or first .html file)
  let entryHtmlPath = filePaths.find((p) => p === 'index.html' || p.endsWith('/index.html'));
  if (!entryHtmlPath) {
    entryHtmlPath = filePaths.find((p) => p.endsWith('.html'));
  }

  let rawHtml = entryHtmlPath && files[entryHtmlPath] ? files[entryHtmlPath].content : '';

  // Track inlined files so they are not duplicated
  const inlinedPaths = new Set<string>();
  if (entryHtmlPath) inlinedPaths.add(entryHtmlPath);

  // 2. Scan and replace <link rel="stylesheet" href="..."> matching virtual files
  rawHtml = rawHtml.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
    // If it's an external CDN (http/https/cdn), keep it
    if (/^(https?:)?\/\//i.test(href)) return match;
    const matchObj = findMatchingFile(href);
    if (matchObj) {
      inlinedPaths.add(matchObj.path);
      return `<style data-origin="${matchObj.path}">\n/* Inlined from ${matchObj.path} */\n${matchObj.file.content}\n</style>`;
    }
    // Remove unresolved relative stylesheet link to prevent 404 network fetch error in iframe
    return `<!-- [unresolved local stylesheet: ${href}] -->`;
  });

  // 3. Scan and replace <script src="..."> matching virtual files
  rawHtml = rawHtml.replace(/<script[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (match, src) => {
    // If it's an external CDN (http/https/cdn), keep it
    if (/^(https?:)?\/\//i.test(src)) return match;
    const matchObj = findMatchingFile(src);
    if (matchObj) {
      inlinedPaths.add(matchObj.path);
      const transformed = prepareModuleScript(matchObj.file.content, matchObj.path);
      const scriptTypeAttr = needsBabel(matchObj.file.content) ? 'type="text/babel"' : 'type="text/javascript"';
      return `<script ${scriptTypeAttr} data-origin="${matchObj.path}">\n${transformed}\n</script>`;
    }
    // Remove unresolved relative script to prevent 404 HTML error in iframe
    return `<!-- [unresolved local script: ${src}] -->`;
  });

  // 4. Gather remaining CSS files not yet inlined
  let extraCss = '';
  for (const path of filePaths) {
    if (path.endsWith('.css') && !inlinedPaths.has(path)) {
      extraCss += `\n/* --- ${path} --- */\n` + files[path].content + '\n';
      inlinedPaths.add(path);
    }
  }

  // 5. Gather remaining JS / TS / JSX files not yet inlined
  const remainingJsFiles = filePaths.filter(
    (p) =>
      (p.endsWith('.js') ||
        p.endsWith('.ts') ||
        p.endsWith('.mjs') ||
        p.endsWith('.jsx') ||
        p.endsWith('.tsx')) &&
      !inlinedPaths.has(p)
  );

  // Sort submodules/components first, entry point (main.js, app.js, index.js) last
  remainingJsFiles.sort((a, b) => {
    const isMainA = a.includes('main') || a.includes('index') || a.includes('app');
    const isMainB = b.includes('main') || b.includes('index') || b.includes('app');
    if (isMainA && !isMainB) return 1;
    if (!isMainA && isMainB) return -1;
    return a.localeCompare(b);
  });

  let aggregatedJs = '';
  for (const path of remainingJsFiles) {
    aggregatedJs += prepareModuleScript(files[path].content, path);
  }

  // 6. Console Bridge & Error Dispatcher
  const consoleBridge = `
<script>
(function() {
  const _log = console.log;
  const _error = console.error;
  const _warn = console.warn;
  function send(type, args) {
    try {
      window.parent.postMessage({
        type: 'SANDBOX_CONSOLE',
        level: type,
        args: Array.from(args).map(function(a) {
          if (a === null) return 'null';
          if (a === undefined) return 'undefined';
          if (typeof a === 'object') {
            try { return JSON.stringify(a); } catch(e) { return String(a); }
          }
          return String(a);
        })
      }, '*');
    } catch(e) {}
  }
  console.log = function() { _log.apply(console, arguments); send('log', arguments); };
  console.error = function() { _error.apply(console, arguments); send('error', arguments); };
  console.warn = function() { _warn.apply(console, arguments); send('warn', arguments); };
  window.addEventListener('error', function(e) {
    const msg = e.message || 'Script error';
    const loc = e.filename ? ' (' + e.filename.split('/').pop() + ':' + e.lineno + ')' : '';
    send('error', [msg + loc]);
  });
  window.addEventListener('unhandledrejection', function(e) {
    send('error', ['Unhandled Promise Rejection: ' + (e.reason?.message || e.reason || 'Unknown error')]);
  });
})();
</script>
`;

  // 7. Interactive Element Selection Mode (Inspector Script)
  const selectionInspector = `
<script>
(function() {
  let isSelectionActive = ${isSelectionMode ? 'true' : 'false'};
  let hoveredEl = null;
  let overlay = null;
  let label = null;

  function createOverlay() {
    if (overlay && document.contains(overlay)) return;
    overlay = document.createElement('div');
    overlay.id = '__ais_selection_overlay';
    overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:1.5px solid #0a84ff;background:rgba(10,132,255,0.08);border-radius:6px;transition:all 0.04s ease-out;display:none;box-sizing:border-box;box-shadow:0 0 0 1px rgba(0,0,0,0.4);';
    
    label = document.createElement('div');
    label.id = '__ais_selection_label';
    label.style.cssText = 'position:absolute;top:-26px;left:0;background:rgba(24,24,26,0.92);color:#f5f5f7;font-size:10px;font-family:-apple-system,BlinkMacSystemFont,"SF Mono",monospace;padding:3px 7px;border-radius:5px;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.6);font-weight:500;pointer-events:none;z-index:2147483647;border:1px solid rgba(255,255,255,0.15);backdrop-filter:blur(10px);letter-spacing:-0.01em;';
    overlay.appendChild(label);
    (document.body || document.documentElement).appendChild(overlay);
  }

  function getUniqueSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '#' + CSS.escape(el.id);
    
    let tag = el.tagName.toLowerCase();
    if (tag === 'body' || tag === 'html') return tag;

    // Filter useful semantic classes
    const classes = Array.from(el.classList || [])
      .filter(function(c) {
        return !c.startsWith('__ais') && !c.includes(':') && !c.includes('[') && !c.includes('/');
      });

    if (classes.length > 0) {
      const classSelector = tag + '.' + classes.slice(0, 2).map(function(c) { return CSS.escape(c); }).join('.');
      try {
        if (document.querySelectorAll(classSelector).length === 1) {
          return classSelector;
        }
      } catch(e) {}
    }

    // Path selector with nth-of-type
    const path = [];
    let current = el;
    while (current && current.nodeType === 1 && current.tagName.toLowerCase() !== 'html') {
      let currentTag = current.tagName.toLowerCase();
      if (current.id) {
        path.unshift('#' + CSS.escape(current.id));
        break;
      }
      let sibling = current;
      let nth = 1;
      while ((sibling = sibling.previousElementSibling)) {
        if (sibling.tagName.toLowerCase() === currentTag) nth++;
      }
      path.unshift(nth > 1 ? currentTag + ':nth-of-type(' + nth + ')' : currentTag);
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  function updateHover(e) {
    if (!isSelectionActive) return;
    createOverlay();
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target === overlay || target === label || target === document.documentElement || target === document.body) {
      if (overlay) overlay.style.display = 'none';
      hoveredEl = null;
      return;
    }

    hoveredEl = target;
    const rect = target.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.top = Math.max(0, rect.top) + 'px';
    overlay.style.left = Math.max(0, rect.left) + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    const selector = getUniqueSelector(target);
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    label.textContent = '<' + target.tagName.toLowerCase() + '> ' + selector + ' · ' + width + '×' + height + 'px';
    if (rect.top < 28) {
      label.style.top = '3px';
    } else {
      label.style.top = '-25px';
    }
  }

  function handleClick(e) {
    if (!isSelectionActive) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const target = hoveredEl || e.target;
    if (!target) return;

    const selector = getUniqueSelector(target);
    const tagName = target.tagName.toLowerCase();
    const textSnippet = (target.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 50);
    const rect = target.getBoundingClientRect();

    // Collect parent hierarchy breadcrumbs
    const hierarchy = [];
    let p = target;
    while (p && p.nodeType === 1 && p.tagName.toLowerCase() !== 'html' && hierarchy.length < 5) {
      hierarchy.unshift({
        tagName: p.tagName.toLowerCase(),
        selector: getUniqueSelector(p),
        className: p.className && typeof p.className === 'string' ? p.className.slice(0, 30) : ''
      });
      p = p.parentElement;
    }

    let cssRules = '';
    try {
      const comp = window.getComputedStyle(target);
      cssRules = 'color: ' + comp.color + '; background-color: ' + comp.backgroundColor;
    } catch(err) {}

    // Apple Blue tactile confirmation
    if (overlay) {
      overlay.style.borderColor = '#ffffff';
      overlay.style.background = 'rgba(10, 132, 255, 0.22)';
      if (label) {
        label.style.background = '#0071e3';
        label.style.borderColor = '#0a84ff';
      }
    }

    window.parent.postMessage({
      type: 'ELEMENT_SELECTED',
      payload: {
        selector: selector,
        tagName: tagName,
        textSnippet: textSnippet,
        cssRules: cssRules,
        dimensions: { width: Math.round(rect.width), height: Math.round(rect.height) },
        hierarchy: hierarchy
      }
    }, '*');
  }

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'TOGGLE_SELECTION_MODE') {
      isSelectionActive = Boolean(e.data.enabled);
      if (!isSelectionActive && overlay) {
        overlay.style.display = 'none';
      }
      if (document.body) {
        document.body.style.cursor = isSelectionActive ? 'crosshair' : '';
      }
    }
  });

  window.addEventListener('mousemove', updateHover, true);
  window.addEventListener('click', handleClick, true);

  if (isSelectionActive && document.body) {
    document.body.style.cursor = 'crosshair';
  }
})();
</script>
`;

  // 8. Runtime Libraries injected in <head>
  // Tailwind Play CDN, Babel Standalone (TS/JSX), React 18, Lucide Icons
  const runtimeLibs = `
<!-- AI Studio Sandbox Runtime CDNs -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  if (window.tailwind) {
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: '#38bdf8'
          }
        }
      }
    };
  }
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.4/babel.min.js"></script>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<script>
  window.addEventListener('DOMContentLoaded', function() {
    if (window.lucide) {
      try { window.lucide.createIcons(); } catch(e) {}
    }
  });
</script>
${consoleBridge}
${selectionInspector}
`;

  // 9. If rawHtml has full HTML document structure
  if (rawHtml.includes('<!DOCTYPE') || rawHtml.includes('<html')) {
    let output = rawHtml;

    // Inject runtime libraries into <head>
    if (output.includes('</head>')) {
      output = output.replace('</head>', `${runtimeLibs}</head>`);
    } else {
      output = `<head>${runtimeLibs}</head>${output}`;
    }

    // Inject extra CSS
    if (extraCss) {
      if (output.includes('</head>')) {
        output = output.replace('</head>', `<style data-role="extra-css">\n${extraCss}\n</style></head>`);
      } else {
        output = `<style data-role="extra-css">\n${extraCss}\n</style>${output}`;
      }
    }

    // Inject aggregated JS before </body>
    if (aggregatedJs) {
      const scriptTypeAttr = needsBabel(aggregatedJs) ? 'type="text/babel"' : 'type="text/javascript"';
      const scriptBlock = `\n<script ${scriptTypeAttr} data-role="aggregated-scripts">\n${aggregatedJs}\n</script>\n`;
      if (output.includes('</body>')) {
        output = output.replace('</body>', `${scriptBlock}</body>`);
      } else {
        output = `${output}${scriptBlock}`;
      }
    }

    return output;
  }

  // 10. Fallback: Wrap raw HTML or components inside complete HTML5 document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${project.title || 'Vibe App'}</title>
  ${runtimeLibs}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
      background: #090a0b;
      color: #f3f4f6;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    ${extraCss}
  </style>
</head>
<body>
  ${rawHtml || '<div id="root"></div><div id="app" class="p-6"></div>'}
  <script type="text/babel" data-role="main-scripts">
    ${aggregatedJs}
  </script>
</body>
</html>`;
}
