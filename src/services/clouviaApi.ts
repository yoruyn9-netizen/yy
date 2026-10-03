import { ClouviaModel, ChatMessage, StudioSettings, PingResult, AttachedFile, ProjectFile } from '../types';
import { isExplicitCodingRequest } from '../utils/intentClassifier';

export const DEFAULT_BASE_URL = 'https://router.clouvia.id/v1';
export const DEFAULT_API_KEY =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_CLOUVIA_API_KEY ||
      import.meta.env?.VITE_API_KEY ||
      import.meta.env?.CLOUVIA_API_KEY)) ||
  '';
export const DEFAULT_MODEL = 'coding-high';

export const FALLBACK_MODELS: ClouviaModel[] = [
  {
    id: 'coding-high',
    slug: 'coding-high',
    displayName: 'Coding High (Thinking + Agentic)',
    category: 'Coding High',
    contextLength: 1000000,
    supportsStream: true,
    supportsThinking: true,
    supportsAgentic: true,
    supportsVision: true,
  },
  {
    id: 'deepseek-v3.2',
    slug: 'deepseek-v3.2',
    displayName: 'DeepSeek V3.2',
    category: 'DeepSeek',
    contextLength: 128000,
    supportsStream: true,
    supportsThinking: true,
    supportsAgentic: true,
  },
  {
    id: 'deepseek-r1',
    slug: 'deepseek-r1',
    displayName: 'DeepSeek R1 Reasoning',
    category: 'DeepSeek',
    contextLength: 128000,
    supportsStream: true,
    supportsThinking: true,
    supportsAgentic: true,
  },
  {
    id: 'claude-opus-4.6',
    slug: 'claude-opus-4.6',
    displayName: 'Claude Opus 4.6',
    category: 'Claude',
    contextLength: 200000,
    supportsStream: true,
    supportsThinking: true,
    supportsAgentic: true,
  },
  {
    id: 'claude-sonnet-4.6',
    slug: 'claude-sonnet-4.6',
    displayName: 'Claude Sonnet 4.6',
    category: 'Claude',
    contextLength: 200000,
    supportsStream: true,
    supportsThinking: false,
    supportsAgentic: true,
  },
  {
    id: 'gemini-3.7-flash',
    slug: 'gemini-3.7-flash',
    displayName: 'Gemini 3.7 Flash',
    category: 'Gemini',
    contextLength: 1000000,
    supportsStream: true,
    supportsThinking: false,
    supportsAgentic: true,
    supportsVision: true,
  },
  {
    id: 'gemini-3.1-pro-high',
    slug: 'gemini-3.1-pro-high',
    displayName: 'Gemini 3.1 Pro High',
    category: 'Gemini',
    contextLength: 1000000,
    supportsStream: true,
    supportsThinking: false,
    supportsAgentic: true,
    supportsVision: true,
  },
  {
    id: 'kimi-k3-v2',
    slug: 'kimi-k3-v2',
    displayName: 'Kimi K3 V2',
    category: 'Kimi',
    contextLength: 200000,
    supportsStream: true,
    supportsThinking: false,
    supportsAgentic: true,
  },
  {
    id: 'minimax-m3-v2',
    slug: 'minimax-m3-v2',
    displayName: 'MiniMax M3 V2',
    category: 'MiniMax',
    contextLength: 1000000,
    supportsStream: true,
    supportsThinking: false,
    supportsAgentic: true,
  },
  {
    id: 'glm-5.3-v2',
    slug: 'glm-5.3-v2',
    displayName: 'GLM 5.3 V2',
    category: 'GLM',
    contextLength: 128000,
    supportsStream: true,
    supportsThinking: false,
    supportsAgentic: true,
  },
];

/**
 * Fetch live models from Clouvia /v1/models using API Key
 */
export async function fetchClouviaModels(apiKey: string = DEFAULT_API_KEY): Promise<ClouviaModel[]> {
  const cleanKey = (apiKey || DEFAULT_API_KEY).trim();
  const candidateUrls: string[] = [];

  // In web browsers (Vercel & local server), same-origin proxy avoids CORS preflight
  if (typeof window !== 'undefined' && window.location?.origin) {
    candidateUrls.push('/api/clouvia/v1/models');
  }

  candidateUrls.push(
    cleanKey
      ? `https://router.clouvia.id/v1/models?key=${encodeURIComponent(cleanKey)}&api_key=${encodeURIComponent(cleanKey)}`
      : 'https://router.clouvia.id/v1/models'
  );

  for (const ep of candidateUrls) {
    try {
      const isDirect = ep.startsWith('https://');
      const res = await fetch(ep, {
        headers: isDirect
          ? { 'Accept': 'application/json' }
          : {
              'Accept': 'application/json',
              ...(cleanKey ? { 'Authorization': `Bearer ${cleanKey}` } : {}),
            },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const json = await res.json();
        const rawList = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        if (rawList.length > 0) {
          return rawList.map((m: any) => {
            const id = m.id || m.slug;
            let category = 'Other';
            if (id.includes('claude')) category = 'Claude';
            else if (id.includes('deepseek')) category = 'DeepSeek';
            else if (id.includes('gemini')) category = 'Gemini';
            else if (id.includes('coding') || id.includes('coder')) category = 'Coding';
            else if (id.includes('kimi')) category = 'Kimi';
            else if (id.includes('glm')) category = 'GLM';
            else if (id.includes('minimax')) category = 'MiniMax';
            else if (id.includes('gpt') || id.includes('openai')) category = 'OpenAI';
            else if (id.includes('qwen')) category = 'Qwen';
            else if (id.includes('hunyuan') || id.includes('hy')) category = 'Hunyuan';

            return {
              id,
              slug: id,
              displayName: m.displayName || id,
              category,
              contextLength: m.context_length || 128000,
              supportsStream: true,
              supportsThinking: id.includes('r1') || id.includes('thinking') || id.includes('high'),
              supportsAgentic: true,
              supportsVision: id.includes('vision') || id.includes('flash') || id.includes('4o'),
            };
          });
        }
      }
    } catch {
      // try next
    }
  }

  return FALLBACK_MODELS;
}

/**
 * Ping test to Clouvia router to check API key and network status
 */
export async function pingClouvia(baseUrl: string, apiKey: string): Promise<PingResult> {
  const startTime = performance.now();
  const cleanKey = (apiKey || '').trim();

  // If there is no API key, it is NOT connected!
  if (!cleanKey) {
    return {
      status: 'error',
      latencyMs: 0,
      message: 'API Key belum diatur. Masukkan API Key Anda untuk menghubungkan ke router.',
      code: 'API_KEY_MISSING',
    };
  }

  // Normalize cleanBase ensuring /v1 is present
  let cleanBase = (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  if (!cleanBase.endsWith('/v1')) {
    cleanBase = `${cleanBase}/v1`;
  }

  // Build candidate URLs:
  // 1. Same-origin proxy /api/clouvia/v1/models (Works on Vercel & local server without CORS preflight issues)
  // 2. Direct query param endpoint (Bypasses CORS OPTIONS preflight in Android WebView / APK)
  const candidateUrls: Array<{ url: string; isDirect: boolean }> = [];

  if (typeof window !== 'undefined' && window.location?.origin) {
    candidateUrls.push({ url: '/api/clouvia/v1/models', isDirect: false });
  }

  const directQueryUrl = `${cleanBase}/models?key=${encodeURIComponent(cleanKey)}&api_key=${encodeURIComponent(cleanKey)}`;
  candidateUrls.push({ url: directQueryUrl, isDirect: true });

  let lastErrorResult: PingResult | null = null;

  for (const { url, isDirect } of candidateUrls) {
    try {
      // When calling direct URL, DO NOT send custom Authorization header!
      // This allows the browser/WebView to perform a simple GET without triggering an OPTIONS preflight.
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (!isDirect && cleanKey) {
        headers['Authorization'] = `Bearer ${cleanKey}`;
      }

      const res = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(6000),
      });

      const elapsed = Math.round(performance.now() - startTime);
      const rawText = await res.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(rawText);
      } catch {}

      // If response is a local static 404 (e.g. proxy route does not exist in APK wrapper or static host)
      const isProxyNotFound = res.status === 404 && (
        !isDirect ||
        rawText.includes('The page could not be found') ||
        rawText.includes('Cannot GET') ||
        rawText.includes('Page not found')
      );

      if (isProxyNotFound) {
        // Skip static 404 and continue to direct URL
        continue;
      }

      if (res.ok) {
        const count = Array.isArray(parsed?.data) ? parsed.data.length : undefined;
        return {
          status: 'success',
          httpStatus: res.status,
          latencyMs: elapsed,
          message: count ? `API Key aktif. Terhubung ke ${count} model Clouvia Router.` : 'API Key aktif & terhubung ke Clouvia Router.',
          rawResponse: rawText,
        };
      } else {
        const errMsg = parsed?.error?.message || `Server returned HTTP ${res.status}`;
        const errCode = parsed?.error?.code || 'HTTP_ERROR';
        const reqId = parsed?.error?.request_id || res.headers.get('x-request-id') || undefined;

        return {
          status: 'error',
          httpStatus: res.status,
          latencyMs: elapsed,
          message: errMsg,
          code: errCode,
          requestId: reqId,
          rawResponse: rawText,
        };
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      lastErrorResult = {
        status: 'error',
        latencyMs: elapsed,
        message: err.name === 'TimeoutError' ? 'Koneksi timeout setelah 6s' : err.message || 'Gagal tersambung ke Clouvia Router',
        code: 'NETWORK_FAILURE',
      };
    }
  }

  return lastErrorResult || {
    status: 'error',
    latencyMs: Math.round(performance.now() - startTime),
    message: 'Gagal tersambung ke Clouvia Router',
    code: 'NETWORK_FAILURE',
  };
}

/**
 * Format message content for OpenAI compatible multimodal chat completions
 */
function buildMessageContent(m: ChatMessage): any {
  let fullText = m.content;

  // Append clean targeting instructions for AI when an element was selected
  if (m.selectedElement) {
    const meta = `\n\n[TARGETED COMPONENT REVISION]:
Target DOM Element: <${m.selectedElement.tagName}>
CSS Selector: ${m.selectedElement.selector}
${m.selectedElement.textSnippet ? `Text Content: "${m.selectedElement.textSnippet}"\n` : ''}${
      m.selectedElement.cssRules ? `Current Styles: { ${m.selectedElement.cssRules} }\n` : ''
    }Apply the requested changes directly to this target element and its controlling source file.`;
    fullText = fullText ? `${fullText}\n${meta}` : meta;
  }

  if (!m.attachments || m.attachments.length === 0) {
    return fullText;
  }

  const parts: any[] = [];

  // Add text part with code attachments included
  for (const att of m.attachments) {
    if (att.textContent) {
      fullText += `\n\n[File: ${att.name}]\n\`\`\`\n${att.textContent}\n\`\`\``;
    }
  }

  if (fullText.trim()) {
    parts.push({
      type: 'text',
      text: fullText,
    });
  }

  // Add image parts if available
  for (const att of m.attachments) {
    if (att.dataUrl && att.type.startsWith('image/')) {
      parts.push({
        type: 'image_url',
        image_url: {
          url: att.dataUrl,
        },
      });
    }
  }

  return parts.length > 0 ? parts : m.content;
}

/**
 * Send streaming chat completion to Clouvia Router (OpenAI compatible)
 */
export async function sendChatCompletion(
  messages: ChatMessage[],
  settings: StudioSettings,
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
  activeSkillInstructions?: string,
  projectFilesContext?: Record<string, ProjectFile>
): Promise<{ fullContent: string; finishReason?: string }> {
  let cleanBase = (settings.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  if (!cleanBase.endsWith('/v1')) {
    cleanBase = `${cleanBase}/v1`;
  }
  
  // Endpoints to try:
  // In web deployments (Vercel & local server), same-origin proxy avoids CORS preflights completely.
  const endpoints: string[] = [];
  if (typeof window !== 'undefined' && window.location?.origin) {
    endpoints.push('/api/clouvia/v1/chat/completions');
  }

  if (cleanBase.startsWith('http://') || cleanBase.startsWith('https://')) {
    const directUrl = settings.apiKey.trim()
      ? `${cleanBase}/chat/completions?key=${encodeURIComponent(settings.apiKey.trim())}`
      : `${cleanBase}/chat/completions`;
    endpoints.push(directUrl);
  }
  if (!endpoints.some(e => e.includes('router.clouvia.id/v1/chat/completions'))) {
    endpoints.push(`https://router.clouvia.id/v1/chat/completions?key=${encodeURIComponent(settings.apiKey.trim())}`);
  }

  const formattedMessages: Array<{ role: string; content: any }> = [];

  // Detect user intent from the latest user message
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const userText = (lastUserMsg?.content || '').toLowerCase();
  const isCodingRequest = isExplicitCodingRequest(userText, lastUserMsg?.selectedElement);
  const isFixRequest =
    userText.includes('error runtime') ||
    userText.includes('perbaikan error') ||
    userText.includes('perbaiki error') ||
    userText.includes('difix dri console') ||
    userText.includes('fix console');

  const isBuildFromScratch =
    isCodingRequest &&
    !isFixRequest &&
    (/\b(buat|buatkan|bikin|buatin|develop|create|build|rancang|desain)\s+(sebuah\s+|suatu\s+)?(web|website|web\s*app|aplikasi|app|landing\s*page|dashboard|game|ui|antarmuka|situs|portofolio|sistem)\b/i.test(
      userText
    ) ||
      userText.includes('only html') ||
      userText.includes('jangan only html') ||
      userText.includes('create banyak') ||
      userText.includes('bikin banyak file') ||
      userText.includes('jangan dummy') ||
      userText.includes('jangan fake') ||
      (userText.includes('html') && userText.includes('main') && (userText.includes('app') || userText.includes('css')))) &&
    !lastUserMsg?.selectedElement;

  let combinedSystem = settings.systemInstruction.trim();

  if (isCodingRequest) {
    const codingProtocol = `
[VESPER AI HIGH-CALIBER MODULAR ARCHITECTURE PROTOCOL]:
- The user is requesting to build, develop, fix, or enhance a website, web application, UI, component, or code.
- STRICT QUALITY STANDARD: Single-file index.html is STRICTLY FORBIDDEN.
- NO DUMMY OR FAKE FILES: Every single file must have real, complete, production-ready code. Never write placeholder comments like "// TODO" or empty mock objects.
- Every web application must be engineered with a complete, professional multi-file structure:
  1. Entry Markup: \`\`\`html:index.html (Semantic HTML5 markup, head tags, viewport, linking <link rel="stylesheet" href="styles/theme.css">, <script src="src/app/state.js"></script>, <script src="src/app/ui.js"></script>, and <script src="src/main.js"></script>)
  2. Stylesheet & Design System: \`\`\`css:styles/theme.css (Custom design system, CSS variables, typography, responsive flex/grid, modern animations, polished dark aesthetics)
  3. App State & Logic Store: \`\`\`js:src/app/state.js (State management, reactive events, data store)
  4. App UI Controller: \`\`\`js:src/app/ui.js (DOM rendering, components, toasts, dynamic updates)
  5. Application Engine: \`\`\`js:src/main.js (Interactive state, event listeners with null checks, DOM manipulation, error handling)
- For revisions or bug fixes: identify and update the specific file(s) using their relative path headers with FULL code blocks.
- Before or outside the code blocks, provide a concise, high-level architectural summary of the modules.`;

    combinedSystem = combinedSystem
      ? `${combinedSystem}\n\n${codingProtocol}`
      : codingProtocol;

    if (activeSkillInstructions && activeSkillInstructions.trim()) {
      combinedSystem = `${combinedSystem}\n\n${activeSkillInstructions.trim()}`;
    }

    if (isBuildFromScratch) {
      const freshBuildProtocol = `
[VESPER AI FRESH WEB/APP ARCHITECTURE - MANDATORY MULTI-FILE STANDARD]:
- The user is creating a new website, web application, or UI project from scratch, or requesting multi-file architecture.
- STRICT QUALITY STANDARD: Single-file index.html is STRICTLY FORBIDDEN.
- NO FAKE OR DUMMY FILES: Never generate placeholder files or dummy code. Every file must contain complete, functional, production-ready code.
- You MUST construct the project using a complete, professional multi-file structure:
  1. Entry Markup: \`\`\`html:index.html (Semantic HTML5 structure linking styles/theme.css, src/app/state.js, src/app/ui.js, and src/main.js)
  2. Stylesheet & Design System: \`\`\`css:styles/theme.css (Custom design system, CSS variables, typography, responsive flex/grid, modern animations)
  3. Reactive State Store: \`\`\`js:src/app/state.js (Functional reactive state store, action dispatchers, event listeners)
  4. UI Renderer & Components: \`\`\`js:src/app/ui.js (UI renderers, toast notifications, dynamic components)
  5. Application Controller: \`\`\`js:src/main.js (Initialization, event handlers with DOM null-safety, keyboard shortcuts)
- Every file must be complete and ready to run immediately.
- Outside the code blocks, provide a concise, high-level architectural summary of the modules.`;

      combinedSystem = combinedSystem
        ? `${combinedSystem}\n\n${freshBuildProtocol}`
        : freshBuildProtocol;
    } else if (projectFilesContext && Object.keys(projectFilesContext).length > 0) {
      const fileEntries = Object.entries(projectFilesContext);
      const filesSummary = fileEntries
        .map(([path, f]) => `--- File: ${path} (${f.language}) ---\n${f.content}`)
        .join('\n\n');

      const revisionInstructions = `
[CURRENT PROJECT FILES STATE]:
The project currently has ${fileEntries.length} files:
${filesSummary}

[TARGETED REVISION & BUG FIX PROTOCOL - CODE BLOCK MANDATORY]:
- The user is asking for a ${isFixRequest ? 'CRITICAL RUNTIME ERROR FIX' : 'code revision, feature addition, or style adjustment'}.
- Pinpoint the exact file and problem location, and update the specific file(s) that need changes.
- CRITICAL REQUIREMENT: You MUST return the FULL updated file(s) using complete code blocks with their path header (e.g. \`\`\`js:src/main.js or \`\`\`html:index.html).
- DO NOT answer with only text explanations, suggestions, or small disconnected code snippets! The application bundler requires the full code block to automatically update the project.
- Outside the code blocks, state clearly and concisely what was fixed at the problem location.`;

      combinedSystem = combinedSystem
        ? `${combinedSystem}\n\n${revisionInstructions}`
        : revisionInstructions;
    }
  } else {
    // Non-coding: General Q&A, homework/soal, math, writing, web info, explanations
    // Filter out any coding/vibe instructions so the model does not attempt to create an index.html app!
    const nonCodingSkills = (activeSkillInstructions || '')
      .split('\n\n')
      .filter((block) => !block.includes('MODULAR FILE ARCHITECTURE') && !block.includes('CLAUDE ARTIFACTS') && !block.includes('TARGETED COMPONENT REVISION'))
      .join('\n\n');

    if (nonCodingSkills.trim()) {
      combinedSystem = combinedSystem
        ? `${combinedSystem}\n\n${nonCodingSkills.trim()}`
        : nonCodingSkills.trim();
    }

    const generalDirective = `
[VESPER AI MULTIFUNCTIONAL INTELLIGENT ASSISTANT PROTOCOL - ABSOLUTE REQUIREMENT]:
- The user is asking a general question, asking for help with a problem/exam/homework (soal), seeking website recommendations/information, requesting an explanation, translation, essay, analysis, or conversational discussion.
- This is NOT a web application development request.
- Answer the user's question directly, clearly, comprehensively, and naturally in formatted Markdown text in the chat bubble.
- DO NOT generate web project files (index.html, styles/theme.css, src/main.js, etc.) and DO NOT output code blocks with project path headers (e.g., do NOT write \`\`\`html:index.html).
- For math, science, or homework questions: provide clear step-by-step reasoning, show any applicable formulas, and clearly state the final answer.
- For questions about websites, tools, or resources: provide clear descriptions, comparisons, and website recommendations in text.
- If code is needed to illustrate a concept, algorithm, or solution, write standard inline or fenced code blocks (e.g. \`\`\`python or \`\`\`sql) WITHOUT file path headers so the user can easily read and copy it in chat.`;

    combinedSystem = combinedSystem
      ? `${combinedSystem}\n\n${generalDirective}`
      : generalDirective;
  }

  if (combinedSystem) {
    formattedMessages.push({
      role: 'system',
      content: combinedSystem,
    });
  }

  for (const m of messages) {
    if (m.content.trim() || (m.attachments && m.attachments.length > 0)) {
      let content = buildMessageContent(m);
      if (m === lastUserMsg && isCodingRequest) {
        const instruction = isBuildFromScratch
          ? `\n\n[MANDATORY ARCHITECTURE DIRECTIVE - MULTI-FILE REQUIRED]:
Kamu WAJIB mengembalikan proyek web ini dalam struktur berkas terpisah (MINIMAL 4-5 BERKAS LENGKAP):
1. \`\`\`html:index.html (Semantic HTML5 markup lengkap dengan nav/header/main/footer, responsive meta, link styles/theme.css, script src/app/state.js, script src/app/ui.js, script src/main.js)
2. \`\`\`css:styles/theme.css (Design system lengkap, CSS variables, tata letak responsif grid & flexbox, animasi)
3. \`\`\`js:src/app/state.js (Modul data state management reaktif nyata dengan store/pub-sub/storage)
4. \`\`\`js:src/app/ui.js (Modul UI renderers, dynamic components, toast notifications)
5. \`\`\`js:src/main.js (Modul inisialisasi aplikasi, event listeners dengan DOM null-safety, keyboard shortcuts)
SEMUA BERKAS HARUS BERISI KODE LENGKAP YANG BERFUNGSI NYATA DARI AWAL HINGGA AKHIR. DILARANG KERAS hanya mengeluarkan 1 file index.html saja dan DILARANG MEMBUAT DUMMY/PLACEHOLDER FILE!`
          : `\n\n[WAJIB RETURN KODE LENGKAP BER-HEADER JALUR]:
Kembalikan SELURUH isi kode berkas yang diperbaiki dalam blok kode lengkap ber-header jalur (contoh: \`\`\`js:src/main.js atau \`\`\`html:index.html). JANGAN hanya memberikan saran teks atau potongan kecil tanpa header jalur, agar berkas proyek langsung ter-update secara otomatis di Live Sandbox!`;

        if (typeof content === 'string') {
          content += instruction;
        } else if (Array.isArray(content)) {
          const textPart = content.find((p) => p.type === 'text');
          if (textPart && typeof textPart.text === 'string') {
            textPart.text += instruction;
          } else {
            content.push({ type: 'text', text: instruction });
          }
        }
      }
      formattedMessages.push({
        role: m.role,
        content,
      });
    }
  }

  const payload = {
    model: settings.selectedModel,
    messages: formattedMessages,
    temperature: settings.temperature,
    top_p: settings.topP,
    max_tokens: Math.max(settings.maxTokens || 4096, 12288),
    stream: true,
  };

  let response: Response | null = null;
  let lastFetchError: any = null;

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey.trim()}`,
        },
        body: JSON.stringify(payload),
        signal,
      });

      // If this endpoint returned 404 (e.g. proxy route does not exist on this host or APK wrapper)
      // or 502/504 Bad Gateway, try next candidate endpoint!
      if ((res.status === 404 || res.status === 502 || res.status === 504) && endpoints.indexOf(ep) < endpoints.length - 1) {
        continue;
      }

      response = res;
      if (res.ok) {
        break;
      }
      break;
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      lastFetchError = err;
      // try next endpoint
    }
  }

  if (!response) {
    throw new Error(`Koneksi ke endpoint gagal: ${lastFetchError?.message || 'Network error'}`);
  }

  if (!response.ok) {
    let errBody: any;
    try {
      errBody = await response.json();
    } catch {
      const txt = await response.text().catch(() => '');
      errBody = { error: { message: txt || `HTTP ${response.status}` } };
    }

    const err = new Error(errBody?.error?.message || `HTTP ${response.status}`) as any;
    err.status = response.status;
    err.code = errBody?.error?.code || 'API_ERROR';
    err.requestId = errBody?.error?.request_id || response.headers.get('x-request-id');
    err.type = errBody?.error?.type;
    throw err;
  }

  if (!response.body) {
    throw new Error('Response body kosong dari server.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullContent = '';
  let finishReason = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;

      if (trimmed === 'data: [DONE]') {
        return { fullContent, finishReason: 'stop' };
      }

      if (trimmed.startsWith('data: ')) {
        const jsonStr = trimmed.slice(6);
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullContent += delta;
            onChunk(delta);
          }
          if (parsed.choices?.[0]?.finish_reason) {
            finishReason = parsed.choices[0].finish_reason;
          }
        } catch {
          // Incomplete chunk line, skip
        }
      }
    }
  }

  return { fullContent, finishReason };
}
