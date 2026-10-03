/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ClouviaModel,
  ChatMessage,
  Session,
  StudioSettings,
  PingResult,
  ProjectState,
  ProjectFile,
  AttachedFile,
  SkillPlugin,
  SelectedElementInfo,
  ProjectSnapshot,
  ResearchDepth,
  ResearchReport,
} from './types';
import { performWebResearch } from './services/researchService';
import {
  DEFAULT_BASE_URL,
  DEFAULT_API_KEY,
  DEFAULT_MODEL,
  FALLBACK_MODELS,
  fetchClouviaModels,
  pingClouvia,
  sendChatCompletion,
} from './services/clouviaApi';
import { SYSTEM_SKILLS } from './utils/skillsCatalog';
import { extractProjectAndThinking } from './utils/codeParser';
import { exportProjectToZip } from './utils/zipExporter';
import { isExplicitCodingRequest } from './utils/intentClassifier';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PromptWorkspace } from './components/PromptWorkspace';
import { LiveSandbox } from './components/LiveSandbox';
import { ParametersPanel } from './components/ParametersPanel';
import { GetCodeModal } from './components/GetCodeModal';
import { DiagnosticModal } from './components/DiagnosticModal';
import { SkillsModal } from './components/SkillsModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { VesperWelcomeScreen } from './components/VesperWelcomeScreen';
import { ModelSelectorModal } from './components/ModelSelectorModal';
import { ShareChatModal } from './components/ShareChatModal';
import { GlobalPullToRefresh } from './components/GlobalPullToRefresh';
import { getStoredUser, clearUser, GoogleUser } from './services/authService';
import { generateAiImage } from './services/imageService';
import { generateSmartSessionTitle } from './utils/titleGenerator';
import { signOutFirebase } from './services/firebase';
import {
  requestNotificationPermission,
  notifyTaskCompleted,
  initDeviceBroadcastNotificationListener,
} from './services/notificationService';
import { OwnerPanelModal } from './components/OwnerPanelModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { calculateUnreadCount } from './services/notificationInboxService';
import { listenBroadcastNotifications } from './services/ownerService';
import { UserBlockedScreen } from './components/UserBlockedScreen';
import {
  loadUserSessions,
  saveSessionToFirestore,
  deleteSessionFromFirestore,
  saveUserActiveSessionId,
  getUserSessionsStorageKey,
} from './services/sessionStorageService';
import {
  isOwnerUser,
  registerOrUpdateUserInCatalog,
  listenUserBlockStatus,
  recordAiUsage,
} from './services/ownerService';

const STORAGE_KEY_SESSIONS = 'ais_vibe_sessions_clean_v4';
const STORAGE_KEY_SETTINGS = 'ais_vibe_settings_clean_v4';
const STORAGE_KEY_SKILLS = 'ais_vibe_skills_catalog_v4';

const MULTIFUNCTIONAL_SYSTEM_INSTRUCTION =
  `You are Vesper AI, an elite principal software architect and versatile intelligence engine. Adapt naturally to user intent:
- For general questions, explanations, homework/soal, academic analysis, writing, science, math, or conversation: Answer directly, thoroughly, and clearly in formatted Markdown. Do NOT generate web project files or coding preview blocks.
- For coding, website, or app development requests:
  MANDATORY MODULAR ARCHITECTURE: NEVER generate only a single index.html file!
  Every website or application must be architected with a complete, professional multi-file structure:
  1. Entry Markup: \`\`\`html:index.html (Semantic HTML markup, linking <link rel="stylesheet" href="styles/theme.css"> and <script src="src/main.js"></script>)
  2. Stylesheet: \`\`\`css:styles/theme.css (Custom design system, CSS variables, typography, responsive flex/grid, animations)
  3. Interactive Engine: \`\`\`js:src/main.js (Dynamic behaviors, event listeners, state management, API/DOM logic)
  4. Extra Components (optional): \`\`\`js:src/components/[ComponentName].js
  For bug fixes or edits on existing projects: pinpoint the exact issue and update only the necessary file(s) tagged with relative path headers.
  Provide clear architectural explanations outside code blocks.`;

const INITIAL_SETTINGS: StudioSettings = {
  baseUrl: DEFAULT_BASE_URL,
  apiKey: DEFAULT_API_KEY,
  selectedModel: DEFAULT_MODEL,
  temperature: 0.7,
  topP: 0.95,
  maxTokens: 4096,
  stream: true,
  systemInstruction: MULTIFUNCTIONAL_SYSTEM_INSTRUCTION,
  activeSkillIds: ['frontend-architect', 'vibe-coder', 'focus-mode', 'claude-artifacts', 'bug-hunter'],
};

const DEFAULT_PROJECT_STATE: ProjectState = {
  title: 'Vibe Studio App',
  activeFilePath: 'index.html',
  files: {
    'index.html': {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vibe Studio Application</title>
  <link rel="stylesheet" href="styles/theme.css">
</head>
<body>
  <div id="app" class="app-layout">
    <!-- Top Header -->
    <header class="app-header">
      <div class="brand">
        <div class="brand-logo">V</div>
        <div class="brand-info">
          <h1>Vibe Studio</h1>
          <span class="badge">Modular Architecture</span>
        </div>
      </div>
      <div class="header-actions">
        <button id="themeToggleBtn" class="btn btn-secondary btn-sm" title="Ubah Tema">
          <span id="themeIcon">🌙</span>
        </button>
        <button id="createItemBtn" class="btn btn-primary btn-sm">
          <span>+ Tambah Fitur</span>
        </button>
      </div>
    </header>

    <!-- Main Content Grid -->
    <main class="main-content">
      <!-- Live Stats Hero -->
      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Modul</div>
          <div id="statModules" class="stat-value">5</div>
          <div class="stat-desc">HTML, CSS, State, UI, Main</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Item Aktif</div>
          <div id="statItems" class="stat-value">3</div>
          <div class="stat-desc">Fungsional & Tersinkronisasi</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Interaksi</div>
          <div id="statClicks" class="stat-value">0</div>
          <div class="stat-desc">Event listener realtime</div>
        </div>
      </section>

      <!-- Filter & Search Bar -->
      <section class="action-bar">
        <div class="search-box">
          <input type="text" id="searchInput" placeholder="Cari modul atau fitur..." />
        </div>
        <div class="filter-tabs">
          <button class="filter-tab active" data-filter="all">Semua</button>
          <button class="filter-tab" data-filter="core">Core</button>
          <button class="filter-tab" data-filter="ui">Antarmuka</button>
        </div>
      </section>

      <!-- Dynamic Items List -->
      <section class="items-section">
        <div id="itemsContainer" class="items-grid">
          <!-- Rendered dynamically by src/app/ui.js -->
        </div>
      </section>
    </main>

    <!-- Modal Dialog -->
    <div id="appModal" class="modal-backdrop hidden">
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="modalTitle">Tambah Item Baru</h3>
          <button id="modalCloseBtn" class="btn-icon">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="newItemTitle">Nama Fitur/Modul</label>
            <input type="text" id="newItemTitle" placeholder="Misal: Audio Engine" />
          </div>
          <div class="form-group">
            <label for="newItemDesc">Deskripsi Singkat</label>
            <textarea id="newItemDesc" rows="3" placeholder="Jelaskan fungsionalitas modul ini..."></textarea>
          </div>
          <div class="form-group">
            <label for="newItemCategory">Kategori</label>
            <select id="newItemCategory">
              <option value="core">Core Module</option>
              <option value="ui">UI Component</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button id="modalCancelBtn" class="btn btn-secondary">Batal</button>
          <button id="modalSaveBtn" class="btn btn-primary">Simpan Modul</button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications Container -->
    <div id="toastContainer" class="toast-container"></div>
  </div>

  <!-- Modular Scripts Architecture -->
  <script src="src/app/state.js"></script>
  <script src="src/app/ui.js"></script>
  <script src="src/main.js"></script>
</body>
</html>`,
      language: 'html',
    },
    'styles/theme.css': {
      path: 'styles/theme.css',
      content: `/* Vesper Vibe Design System */
:root {
  --bg-primary: #07080a;
  --bg-secondary: #0f1015;
  --surface: #14151b;
  --surface-hover: #1e2029;
  --surface-border: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(255, 255, 255, 0.22);
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
  --accent-glow: rgba(59, 130, 246, 0.25);
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.45);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

.app-layout {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Header */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: #fff;
  box-shadow: 0 2px 10px var(--accent-glow);
}

.brand-info h1 {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.badge {
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  outline: none;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
}

.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 2px 12px var(--accent-glow);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  border: 1px solid var(--surface-border);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.btn-icon:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: 16px;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.stat-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.stat-label {
  font-size: 11.5px;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  margin: 4px 0;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.stat-desc {
  font-size: 11px;
  color: var(--text-secondary);
}

/* Action Bar */
.action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.search-box {
  flex: 1;
  min-width: 220px;
}

.search-box input {
  width: 100%;
  padding: 9px 14px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-box input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.filter-tabs {
  display: flex;
  gap: 6px;
  background: var(--surface);
  padding: 3px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--surface-border);
}

.filter-tab {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 5px 12px;
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.filter-tab.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 500;
}

/* Items Grid */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.item-card {
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  transition: all 0.15s ease;
}

.item-card:hover {
  background: var(--surface-hover);
  border-color: rgba(255, 255, 255, 0.16);
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}

.item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.item-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.item-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-top: 4px;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.item-badge {
  font-size: 10.5px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
}

.item-btn {
  padding: 4px 10px;
  font-size: 11.5px;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 100;
  transition: opacity 0.2s ease;
}

.modal-backdrop.hidden {
  display: none;
}

.modal-card {
  width: 100%;
  max-width: 440px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  animation: modalEnter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalEnter {
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: 15px;
  font-weight: 600;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: var(--accent);
}

.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

/* Toast */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
  pointer-events: none;
}

.toast {
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--surface-border);
  color: #fff;
  font-size: 12.5px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  animation: toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
}

.toast-success {
  border-color: rgba(16, 185, 129, 0.4);
  background: #064e3b;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}`,
      language: 'css',
    },
    'src/app/state.js': {
      path: 'src/app/state.js',
      content: `// Reactive State Store & Persistence Layer
const STORAGE_KEY = 'vibe_app_state_v1';

const defaultState = {
  theme: 'dark',
  metrics: {
    modulesCount: 5,
    activeItemsCount: 3,
    clickCount: 0,
  },
  activeFilter: 'all',
  searchQuery: '',
  items: [
    {
      id: 'item-1',
      title: 'Semantic HTML Entry',
      description: 'Struktur markup HTML5 yang bersih dengan modul terpisah.',
      category: 'core',
      clicks: 0,
    },
    {
      id: 'item-2',
      title: 'Modular CSS Design System',
      description: 'Variabel CSS tema modern, tata letak grid responsif, dan animasi.',
      category: 'ui',
      clicks: 0,
    },
    {
      id: 'item-3',
      title: 'Reactive State Store',
      description: 'Pengelolaan data tersinkronisasi dengan pub/sub event model.',
      category: 'core',
      clicks: 0,
    },
  ],
};

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Gagal memuat state dari storage:', e);
  }
  return { ...defaultState };
}

export const state = loadStoredState();
const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (err) {
      console.error('Error pada subscriber listener:', err);
    }
  });
}

export function dispatch(action, payload) {
  switch (action) {
    case 'INCREMENT_CLICK': {
      state.metrics.clickCount += 1;
      if (payload && payload.itemId) {
        const item = state.items.find((i) => i.id === payload.itemId);
        if (item) item.clicks = (item.clicks || 0) + 1;
      }
      notify();
      break;
    }
    case 'SET_FILTER': {
      state.activeFilter = payload || 'all';
      notify();
      break;
    }
    case 'SET_SEARCH': {
      state.searchQuery = (payload || '').toLowerCase();
      notify();
      break;
    }
    case 'ADD_ITEM': {
      if (!payload || !payload.title) return;
      const newItem = {
        id: 'item-' + Date.now(),
        title: payload.title.trim(),
        description: payload.description ? payload.description.trim() : 'Modul baru aktif.',
        category: payload.category || 'core',
        clicks: 0,
      };
      state.items.unshift(newItem);
      state.metrics.activeItemsCount = state.items.length;
      notify();
      break;
    }
    case 'TOGGLE_THEME': {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      notify();
      break;
    }
    default:
      console.warn('Action tidak dikenal:', action);
  }
}

if (typeof window !== 'undefined') {
  window.AppState = { state, dispatch, subscribe };
}`,
      language: 'javascript',
    },
    'src/app/ui.js': {
      path: 'src/app/ui.js',
      content: `// UI Renderers & Interactive Component Controller

export function renderStats(state) {
  const modEl = document.getElementById('statModules');
  const itemEl = document.getElementById('statItems');
  const clickEl = document.getElementById('statClicks');

  if (modEl) modEl.textContent = state.metrics.modulesCount;
  if (itemEl) itemEl.textContent = state.items.length;
  if (clickEl) clickEl.textContent = state.metrics.clickCount;
}

export function renderItems(state, onCardAction) {
  const container = document.getElementById('itemsContainer');
  if (!container) return;

  const filtered = state.items.filter((item) => {
    const matchesFilter = state.activeFilter === 'all' || item.category === state.activeFilter;
    const matchesSearch =
      !state.searchQuery ||
      item.title.toLowerCase().includes(state.searchQuery) ||
      item.description.toLowerCase().includes(state.searchQuery);
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = \`
      <div style="grid-column: 1 / -1; padding: 36px; text-align: center; color: var(--text-muted); font-size: 13px;">
        Tidak ada modul atau fitur yang cocok dengan filter.
      </div>
    \`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (item) => \`
      <article class="item-card" data-id="\${item.id}">
        <div class="item-top">
          <div>
            <h4 class="item-title">\${escapeHtml(item.title)}</h4>
            <p class="item-desc">\${escapeHtml(item.description)}</p>
          </div>
        </div>
        <div class="item-footer">
          <span class="item-badge">\${item.category.toUpperCase()}</span>
          <button class="btn btn-secondary item-btn action-item-btn" data-id="\${item.id}">
            Tes Aksi (\${item.clicks || 0})
          </button>
        </div>
      </article>
    \`
    )
    .join('');

  container.querySelectorAll('.action-item-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (onCardAction && id) onCardAction(id);
    });
  });
}

export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast ' + (type === 'success' ? 'toast-success' : '');
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

export function openModal() {
  const modal = document.getElementById('appModal');
  if (modal) modal.classList.remove('hidden');
  const titleInput = document.getElementById('newItemTitle');
  if (titleInput) {
    titleInput.value = '';
    titleInput.focus();
  }
}

export function closeModal() {
  const modal = document.getElementById('appModal');
  if (modal) modal.classList.add('hidden');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

if (typeof window !== 'undefined') {
  window.AppUI = { renderStats, renderItems, showToast, openModal, closeModal };
}`,
      language: 'javascript',
    },
    'src/main.js': {
      path: 'src/main.js',
      content: `// Main Application Bootloader & Event Bindings
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Vesper] Multi-file Application Engine booted successfully.');

  const stateModule = window.AppState;
  const uiModule = window.AppUI;

  if (!stateModule || !uiModule) {
    console.warn('Submodul state atau UI belum siap di DOM.');
    return;
  }

  const { state, dispatch, subscribe } = stateModule;
  const { renderStats, renderItems, showToast, openModal, closeModal } = uiModule;

  // Initial Render
  renderStats(state);
  renderItems(state, (itemId) => {
    dispatch('INCREMENT_CLICK', { itemId });
    showToast('Aksi pada modul dijalankan!', 'success');
  });

  // Subscribe to state updates
  subscribe((updatedState) => {
    renderStats(updatedState);
    renderItems(updatedState, (itemId) => {
      dispatch('INCREMENT_CLICK', { itemId });
      showToast('Aksi pada modul dijalankan!', 'success');
    });
  });

  // 1. Search Input binding
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      dispatch('SET_SEARCH', e.target.value);
    });
  }

  // 2. Filter Tabs binding
  document.querySelectorAll('.filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.getAttribute('data-filter') || 'all';
      dispatch('SET_FILTER', filter);
    });
  });

  // 3. Modal Actions
  const createBtn = document.getElementById('createItemBtn');
  if (createBtn) {
    createBtn.addEventListener('click', () => openModal());
  }

  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => closeModal());
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', () => closeModal());

  const modalSaveBtn = document.getElementById('modalSaveBtn');
  if (modalSaveBtn) {
    modalSaveBtn.addEventListener('click', () => {
      const titleInput = document.getElementById('newItemTitle');
      const descInput = document.getElementById('newItemDesc');
      const catInput = document.getElementById('newItemCategory');

      const title = titleInput ? titleInput.value.trim() : '';
      const desc = descInput ? descInput.value.trim() : '';
      const category = catInput ? catInput.value : 'core';

      if (!title) {
        showToast('Mohon masukkan nama fitur/modul.');
        return;
      }

      dispatch('ADD_ITEM', { title, description: desc, category });
      closeModal();
      showToast('Modul baru berhasil ditambahkan!', 'success');
    });
  }

  // 4. Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // 5. Theme Toggle button
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      dispatch('TOGGLE_THEME');
      showToast('Tema aplikasi diperbarui.');
    });
  }
});`,
      language: 'javascript',
    },
  },
};

export default function App() {
  // Settings State
  const [settings, setSettings] = useState<StudioSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.apiKey === 'clv_live_RIFaJmIye9Y4FBiFqOyK4J4hKz84W3jkSltxdlm9Upm') {
          parsed.apiKey = '';
        }
        if (!parsed.apiKey && DEFAULT_API_KEY) {
          parsed.apiKey = DEFAULT_API_KEY;
        }
        if (
          !parsed.systemInstruction ||
          parsed.systemInstruction.includes('high-speed modular vibe coding engine')
        ) {
          parsed.systemInstruction = MULTIFUNCTIONAL_SYSTEM_INSTRUCTION;
        }
        return { ...INITIAL_SETTINGS, ...parsed };
      }
    } catch {}
    return INITIAL_SETTINGS;
  });

  // Skills Catalog
  const [skills, setSkills] = useState<SkillPlugin[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SKILLS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const systemIds = new Set(SYSTEM_SKILLS.map((s) => s.id));
          const customSkills = parsed.filter(
            (s: SkillPlugin) => s.id.startsWith('custom-') || !systemIds.has(s.id)
          );
          return [...SYSTEM_SKILLS, ...customSkills];
        }
      }
    } catch {}
    return SYSTEM_SKILLS;
  });

  // Clouvia Models
  const [models, setModels] = useState<ClouviaModel[]>(FALLBACK_MODELS);

  // Chat Sessions State
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    const initialSession: Session = {
      id: 'session-' + Date.now(),
      title: 'Prompt Baru',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      systemInstruction: INITIAL_SETTINGS.systemInstruction,
      messages: [],
      projectState: DEFAULT_PROJECT_STATE,
      snapshots: [
        {
          id: 'snap-' + Date.now(),
          timestamp: Date.now(),
          description: 'Initial Template',
          files: DEFAULT_PROJECT_STATE.files,
        },
      ],
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const querySession = urlParams.get('session');
      if (querySession && sessions.some((s) => s.id === querySession)) {
        return querySession;
      }
    }
    return sessions[0]?.id || '';
  });

  // Layout View State: 'workspace' (prompt) | 'preview' (sandbox) | 'split'
  const [activeView, setActiveView] = useState<'workspace' | 'preview' | 'split'>('workspace');
  // Auto-swap preview controller: allows at most 1x auto-swap, and strictly respects manual user view selection
  const hasAutoSwappedPreviewRef = useRef<boolean>(false);
  const userManuallySelectedViewRef = useRef<boolean>(false);

  const handleUserChangeView = (view: 'workspace' | 'preview' | 'split') => {
    userManuallySelectedViewRef.current = true;
    setActiveView(view);
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [isGetCodeOpen, setIsGetCodeOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isOwnerPanelOpen, setIsOwnerPanelOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isCurrentUserBlocked, setIsCurrentUserBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | undefined>(undefined);

  // Sync unread notification count in real time
  useEffect(() => {
    const unsub = listenBroadcastNotifications((items) => {
      setUnreadNotificationCount(calculateUnreadCount(items));
    });
    return () => unsub();
  }, []);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(() => getStoredUser());
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(() => !getStoredUser());

  // Sync user catalog and listen to real-time block status
  useEffect(() => {
    if (!currentUser) {
      setIsCurrentUserBlocked(false);
      return;
    }

    // Register active user in catalog for owner management
    registerOrUpdateUserInCatalog(currentUser);

    // Listen to real-time block status
    const unsub = listenUserBlockStatus(currentUser.id, (blocked, reason) => {
      setIsCurrentUserBlocked(blocked);
      setBlockReason(reason);
    });

    return () => unsub();
  }, [currentUser]);

  // Logout handler
  const handleLogout = () => {
    signOutFirebase().catch(() => {});
    clearUser();
    setCurrentUser(null);
    setShowWelcomeScreen(true);
    setIsCurrentUserBlocked(false);
  };

  // Listen to owner broadcasts in real time and trigger real smartphone system notifications!
  useEffect(() => {
    const unsub = initDeviceBroadcastNotificationListener();
    return () => unsub();
  }, []);

  // Streaming & Execution State
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active Project State for Sandbox
  const [activeProject, setActiveProject] = useState<ProjectState>(DEFAULT_PROJECT_STATE);

  // Ping Diagnostic State
  const [pingResult, setPingResult] = useState<PingResult>({ status: 'idle' });

  // Selection Mode & Focus Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);

  const handleToggleSelectionMode = () => {
    setIsSelectionMode((prev) => {
      const next = !prev;
      // If turning on and currently only showing prompt workspace, switch to split view so preview is visible
      if (next && activeView === 'workspace') {
        setActiveView('split');
      }
      return next;
    });
  };

  const handleSelectElement = (info: SelectedElementInfo) => {
    setSelectedElement(info);
    // If on preview only, switch to split so user sees prompt input
    if (activeView === 'preview') {
      setActiveView('split');
    }
  };

  // Current session object
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Sync active project state with active session
  useEffect(() => {
    if (activeSession?.projectState) {
      setActiveProject(activeSession.projectState);
    }
  }, [activeSessionId]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Persist skills
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SKILLS, JSON.stringify(skills));
    } catch {}
  }, [skills]);

  // Load permanent user sessions from Firestore and local storage on login / initial boot
  useEffect(() => {
    if (!currentUser?.id) return;

    let isMounted = true;
    const initialFallback = sessions[0];

    loadUserSessions(currentUser.id, initialFallback).then(
      ({ sessions: loadedSessions, activeSessionId: restoredActiveId }) => {
        if (!isMounted) return;
        if (loadedSessions && loadedSessions.length > 0) {
          setSessions(loadedSessions);
          if (restoredActiveId && loadedSessions.some((s) => s.id === restoredActiveId)) {
            setActiveSessionId(restoredActiveId);
            const activeSess = loadedSessions.find((s) => s.id === restoredActiveId);
            if (activeSess?.projectState) {
              setActiveProject(activeSess.projectState);
            }
          } else {
            setActiveSessionId(loadedSessions[0].id);
            if (loadedSessions[0].projectState) {
              setActiveProject(loadedSessions[0].projectState);
            }
          }
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Persist sessions: user-scoped + global fallback + Firestore sync
  useEffect(() => {
    if (!currentUser?.id) {
      try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
      } catch {}
      return;
    }

    try {
      const userKey = getUserSessionsStorageKey(currentUser.id);
      localStorage.setItem(userKey, JSON.stringify(sessions));
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch {}

    // Sync current active session to Firestore permanently
    const currentActive = sessions.find((s) => s.id === activeSessionId);
    if (currentActive) {
      saveSessionToFirestore(currentUser.id, currentActive).catch(() => {});
    }
  }, [sessions, currentUser?.id, activeSessionId]);

  // Remember active session ID for user
  useEffect(() => {
    if (currentUser?.id && activeSessionId) {
      saveUserActiveSessionId(currentUser.id, activeSessionId);
    }
  }, [currentUser?.id, activeSessionId]);

  // Fetch real Clouvia models and run initial ping on mount
  useEffect(() => {
    async function init() {
      const fetchedModels = await fetchClouviaModels();
      if (fetchedModels && fetchedModels.length > 0) {
        setModels(fetchedModels);
      }
      handleRunPing();
    }
    init();
  }, []);

  const handleRunPing = async (targetApiKey = settings.apiKey, targetBaseUrl = settings.baseUrl) => {
    setPingResult({ status: 'testing' });
    const res = await pingClouvia(targetBaseUrl, targetApiKey);
    setPingResult(res);
    if (res.status === 'success') {
      const fetchedModels = await fetchClouviaModels(targetApiKey);
      if (fetchedModels && fetchedModels.length > 0) {
        setModels(fetchedModels);
      }
    }
  };

  const handleUpdateSettings = (updates: Partial<StudioSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      if (updates.apiKey || updates.baseUrl) {
        handleRunPing(updates.apiKey || next.apiKey, updates.baseUrl || next.baseUrl);
      }
      return next;
    });
  };

  const handleNewSession = () => {
    const newSession: Session = {
      id: 'session-' + Date.now(),
      title: 'Prompt Baru',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      systemInstruction: settings.systemInstruction,
      messages: [],
      projectState: DEFAULT_PROJECT_STATE,
      snapshots: [
        {
          id: 'snap-' + Date.now(),
          timestamp: Date.now(),
          description: 'Initial Template',
          files: DEFAULT_PROJECT_STATE.files,
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveProject(DEFAULT_PROJECT_STATE);
    setActiveView('workspace');

    if (currentUser?.id) {
      saveSessionToFirestore(currentUser.id, newSession).catch(() => {});
      saveUserActiveSessionId(currentUser.id, newSession.id);
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (currentUser?.id) {
      deleteSessionFromFirestore(currentUser.id, id).catch(() => {});
    }

    if (sessions.length <= 1) {
      const fallback: Session = {
        id: 'session-' + Date.now(),
        title: 'Prompt Baru',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        systemInstruction: settings.systemInstruction,
        messages: [],
        projectState: DEFAULT_PROJECT_STATE,
      };
      setSessions([fallback]);
      setActiveSessionId(fallback.id);
      setActiveProject(DEFAULT_PROJECT_STATE);
      if (currentUser?.id) {
        saveSessionToFirestore(currentUser.id, fallback).catch(() => {});
        saveUserActiveSessionId(currentUser.id, fallback.id);
      }
      return;
    }

    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      const nextActive = filtered[0];
      setActiveSessionId(nextActive.id);
      setActiveProject(nextActive.projectState || DEFAULT_PROJECT_STATE);
      if (currentUser?.id) {
        saveUserActiveSessionId(currentUser.id, nextActive.id);
      }
    }
  };

  const handleRenameSession = (newTitle: string, targetSessionId = activeSessionId) => {
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === targetSessionId ? { ...s, title: newTitle, updatedAt: Date.now() } : s
      );
      if (currentUser?.id) {
        const renamed = updated.find((s) => s.id === targetSessionId);
        if (renamed) saveSessionToFirestore(currentUser.id, renamed).catch(() => {});
      }
      return updated;
    });
  };

  const handleUpdateSystemInstruction = (newInstruction: string) => {
    setSettings((prev) => ({ ...prev, systemInstruction: newInstruction }));
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, systemInstruction: newInstruction } : s))
    );
  };

  const handleToggleSkill = (skillId: string) => {
    setSettings((prev) => {
      const exists = prev.activeSkillIds.includes(skillId);
      const nextSkillIds = exists
        ? prev.activeSkillIds.filter((id) => id !== skillId)
        : [...prev.activeSkillIds, skillId];
      return { ...prev, activeSkillIds: nextSkillIds };
    });
  };

  const handleCreateCustomSkill = (skillData: Omit<SkillPlugin, 'id' | 'enabled'>) => {
    const newSkill: SkillPlugin = {
      ...skillData,
      id: 'custom-' + Date.now(),
      enabled: true,
    };
    setSkills((prev) => [...prev, newSkill]);
    setSettings((prev) => ({
      ...prev,
      activeSkillIds: [...prev.activeSkillIds, newSkill.id],
    }));
  };

  const handleDeleteCustomSkill = (skillId: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== skillId));
    setSettings((prev) => ({
      ...prev,
      activeSkillIds: prev.activeSkillIds.filter((id) => id !== skillId),
    }));
  };

  const handleApplyStarter = (promptText: string, starterTitle: string) => {
    handleSendMessage(promptText);
    handleRenameSession(starterTitle);
  };

  // Run isolated code snippet in Sandbox
  const handleRunInSandbox = (code: string, language: string) => {
    const filePath = language === 'html' ? 'index.html' : language === 'css' ? 'styles/theme.css' : 'src/main.js';
    const updatedFiles = {
      ...activeProject.files,
      [filePath]: {
        path: filePath,
        content: code,
        language,
      },
    };
    const nextState: ProjectState = {
      ...activeProject,
      files: updatedFiles,
      activeFilePath: filePath,
    };
    setActiveProject(nextState);
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, projectState: nextState } : s))
    );
    setActiveView('split');
  };

  const handleUpdateMessageContent = (messageId: string, newContent: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: s.messages.map((m) => (m.id === messageId ? { ...m, content: newContent } : m)),
          };
        }
        return s;
      })
    );
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  // Core Send Chat Message Handler
  const handleSendMessage = async (
    text: string,
    attachments?: AttachedFile[],
    elementInfo?: SelectedElementInfo,
    researchDepth: ResearchDepth = 'off'
  ) => {
    const trimmedText = text.trim();
    if ((!trimmedText && (!attachments || attachments.length === 0) && !elementInfo) || isStreaming) {
      return;
    }

    const sessId = activeSessionId;
    const userMsgId = 'msg-' + Date.now();
    const assistantMsgId = 'msg-' + (Date.now() + 1);

    const isCoding = isExplicitCodingRequest(trimmedText, elementInfo);

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmedText || (elementInfo ? `Perbarui elemen <${elementInfo.tagName}>` : ''),
      timestamp: Date.now(),
      attachments,
      selectedElement: elementInfo,
      isCoding,
    };

    const isFirstMessage = (activeSession?.messages?.length || 0) === 0;
    if (isFirstMessage && trimmedText) {
      const smartTitle = generateSmartSessionTitle(trimmedText);
      handleRenameSession(smartTitle);
    }

    // Reset auto-swap preview flags for this new request
    hasAutoSwappedPreviewRef.current = false;
    userManuallySelectedViewRef.current = false;

    // Request notification permission on interaction so user gets notified if backgrounding tab
    requestNotificationPermission();

    // AI Support for Image Generation (/image or natural language request)
    const isImageRequest =
      trimmedText.startsWith('/image ') ||
      ((trimmedText.toLowerCase().includes('buat gambar') ||
        trimmedText.toLowerCase().includes('buatkan gambar') ||
        trimmedText.toLowerCase().includes('generate image') ||
        trimmedText.toLowerCase().includes('buatkan ilustrasi') ||
        trimmedText.toLowerCase().includes('buat ilustrasi')) &&
        !trimmedText.toLowerCase().includes('code') &&
        !trimmedText.toLowerCase().includes('koding') &&
        !trimmedText.toLowerCase().includes('komponen'));

    if (isImageRequest) {
      const imagePrompt = trimmedText.replace(/^\/image\s*/i, '').trim();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        modelUsed: 'Flux AI Image Engine',
        isStreaming: true,
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === sessId ? { ...s, messages: [...s.messages, userMsg, assistantMsg] } : s))
      );

      setIsStreaming(true);
      try {
        const imageResult = await generateAiImage(imagePrompt || 'Modern minimalist aesthetic UI asset');
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: `Berikut adalah visual AI yang dibuat untuk deskripsi: "${imagePrompt || 'Karya AI'}". Anda dapat mengunduh gambar ini atau menyematkannya ke dalam proyek di Live Sandbox.`,
                          isStreaming: false,
                          generatedImageUrl: imageResult.imageUrl,
                          generatedImagePrompt: imagePrompt || 'Karya Seni AI',
                        }
                      : m
                  ),
                }
              : s
          )
        );
        notifyTaskCompleted(imagePrompt ? `Gambar: "${imagePrompt}"` : 'Gambar AI selesai');
      } catch (err: any) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          isStreaming: false,
                          content: 'Gagal membuat gambar: ' + (err.message || 'Koneksi error'),
                        }
                      : m
                  ),
                }
              : s
          )
        );
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    if (isCurrentUserBlocked) {
      return;
    }

    if (!settings.apiKey.trim()) {
      const warningMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: 'API Key Clouvia saat ini masih kosong. Silakan buka menu **Model & Parameters** (atau tombol Model AI di atas) untuk memasukkan API Key Anda sendiri dan menyimpannya.',
        timestamp: Date.now(),
        modelUsed: settings.selectedModel,
        isStreaming: false,
      };
      setSessions((prev) =>
        prev.map((s) => (s.id === sessId ? { ...s, messages: [...s.messages, userMsg, warningMsg] } : s))
      );
      setIsParamsOpen(true);
      return;
    }

    const initialResearchReport: ResearchReport | undefined =
      researchDepth !== 'off'
        ? {
            depth: researchDepth,
            query: trimmedText,
            steps: [],
            sources: [],
            status: 'searching',
          }
        : undefined;

    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: settings.selectedModel,
      isStreaming: true,
      isCoding,
      thinkingSteps: isCoding
        ? [
            {
              id: 'step-arch',
              action: 'analyze',
              detail: 'Menganalisis kebutuhan & arsitektur proyek...',
              timestamp: Date.now(),
            },
          ]
        : [],
      modifiedFiles: [],
      projectFiles: undefined,
      fileStatuses: {},
      activeWritingFile: null,
      researchReport: initialResearchReport,
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === sessId ? { ...s, messages: [...s.messages, userMsg, assistantMsg] } : s))
    );

    // Record AI prompt usage for owner inspection
    if (currentUser) {
      const targetSess = sessions.find((s) => s.id === sessId);
      recordAiUsage(currentUser, trimmedText, settings.selectedModel, targetSess?.title || 'Percakapan AI');
    }

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    const targetSession = sessions.find((s) => s.id === sessId);
    const history = targetSession ? [...targetSession.messages, userMsg] : [userMsg];

    // Build active skill instructions
    const activeSkillsList = skills.filter((sk) => settings.activeSkillIds.includes(sk.id));
    const activeSkillInstructions = activeSkillsList.map((sk) => sk.instruction).join('\n\n');

    let researchContext = '';
    let finalResearchReport: ResearchReport | undefined = initialResearchReport;

    // Run real-time web research if enabled
    if (researchDepth !== 'off') {
      try {
        const researchResult = await performWebResearch(trimmedText, researchDepth, (updatedReport) => {
          finalResearchReport = updatedReport;
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMsgId ? { ...m, researchReport: updatedReport } : m
                    ),
                  }
                : s
            )
          );
        });

        researchContext = researchResult.researchPromptContext;
        finalResearchReport = researchResult.report;
      } catch (err: any) {
        console.error('Research process failed:', err);
      }
    }

    const combinedInstructions = [activeSkillInstructions, researchContext].filter(Boolean).join('\n\n');

    try {
      let streamedAccumulator = '';

      const { fullContent } = await sendChatCompletion(
        history,
        settings,
        (chunk) => {
          streamedAccumulator += chunk;

          // Parse project structure and thinking steps in real time (isStreaming = true)
          const { thinkingSteps, files, fileStatuses, activeWritingFile, explanation } =
            extractProjectAndThinking(streamedAccumulator, isCoding, true);
          const hasProjectFiles = Object.keys(files).length > 0;
          const effectiveCoding = isCoding || hasProjectFiles;

          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === sessId) {
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: hasProjectFiles
                            ? explanation || ''
                            : streamedAccumulator,
                          isCoding: effectiveCoding,
                          thinkingSteps: effectiveCoding ? (thinkingSteps.length > 0 ? thinkingSteps : m.thinkingSteps) : [],
                          modifiedFiles: hasProjectFiles ? Object.keys(files) : (effectiveCoding ? m.modifiedFiles : []),
                          projectFiles: hasProjectFiles ? files : undefined,
                          fileStatuses,
                          activeWritingFile,
                          researchReport: finalResearchReport || m.researchReport,
                        }
                      : m
                  ),
                };
              }
              return s;
            })
          );

          if (hasProjectFiles) {
            setActiveProject((prev) => {
              const merged = { ...prev.files, ...files };
              return {
                ...prev,
                files: merged,
              };
            });

            // Auto-swap to preview at most ONCE, only if user hasn't explicitly selected Prompt/view
            if (!hasAutoSwappedPreviewRef.current && !userManuallySelectedViewRef.current) {
              hasAutoSwappedPreviewRef.current = true;
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
              setActiveView(isMobile ? 'preview' : 'split');
            }
          }
        },
        abortControllerRef.current.signal,
        combinedInstructions,
        activeProject.files
      );

      // Final post-stream extraction (isStreaming = false allows fallback decomposition if needed)
      const { thinkingSteps, files, fileStatuses, explanation } = extractProjectAndThinking(fullContent, isCoding, false);
      const hasFinalFiles = Object.keys(files).length > 0;
      const effectiveCoding = isCoding || hasFinalFiles;

      if (hasFinalFiles) {
        // Fresh website/app build vs editing existing project
        const isFreshBuild =
          /\b(buat|buatkan|bikin|buatin|develop|create|build|rancang)\s+(sebuah\s+|suatu\s+)?(web|website|web\s*app|aplikasi|app|landing\s*page|dashboard|game|ui|antarmuka|situs|portofolio)\b/i.test(
            trimmedText
          ) || (targetSession?.messages?.length || 0) <= 2;

        const mergedFiles = isFreshBuild && files['index.html'] ? files : { ...activeProject.files, ...files };

        const nextProjectState: ProjectState = {
          title: targetSession?.title || 'Vibe App',
          files: mergedFiles,
          activeFilePath: Object.keys(files)[0] || 'index.html',
        };

        const newSnapshot: ProjectSnapshot = {
          id: 'snap-' + Date.now(),
          timestamp: Date.now(),
          description: trimmedText.slice(0, 48) || 'AI Code Generation',
          files: nextProjectState.files,
        };

        setActiveProject(nextProjectState);

        // Auto-swap to preview at most ONCE, only if not yet swapped and user hasn't chosen a view
        if (!hasAutoSwappedPreviewRef.current && !userManuallySelectedViewRef.current) {
          hasAutoSwappedPreviewRef.current = true;
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          setActiveView(isMobile ? 'preview' : 'split');
        }
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessId
              ? {
                  ...s,
                  projectState: nextProjectState,
                  snapshots: [...(s.snapshots || []), newSnapshot],
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: explanation || 'Aplikasi dan struktur berkas modular berhasil diperbarui.',
                          isStreaming: false,
                          isCoding: true,
                          thinkingSteps,
                          modifiedFiles: Object.keys(files),
                          projectFiles: mergedFiles,
                          fileStatuses,
                          activeWritingFile: null,
                          researchReport: finalResearchReport || m.researchReport,
                        }
                      : m
                  ),
                }
              : s
          )
        );
        notifyTaskCompleted(trimmedText.slice(0, 45) || 'Proyek telah selesai dikerjakan');
      } else if (effectiveCoding) {
        // Coding request or fix request without explicitly parsed files
        const isFixPrompt =
          trimmedText.includes('PERBAIKAN ERROR RUNTIME') ||
          trimmedText.toLowerCase().includes('perbaiki error') ||
          trimmedText.toLowerCase().includes('difix dri console') ||
          trimmedText.toLowerCase().includes('fix all ai') ||
          trimmedText.toLowerCase().includes('fix with ai') ||
          trimmedText.toLowerCase().includes('fix console');

        let autoRepairedFiles: Record<string, ProjectFile> | null = null;

        // 1. Try extracting any raw JS code block from fullContent if present
        const rawJsMatch = fullContent.match(/```(?:javascript|js)\s*\n([\s\S]*?)```/i);
        if (rawJsMatch && rawJsMatch[1].trim()) {
          const extractedCode = rawJsMatch[1].trim();
          autoRepairedFiles = {
            ...activeProject.files,
            'src/main.js': {
              path: 'src/main.js',
              content: extractedCode,
              language: 'javascript',
            },
          };
        } else if (isFixPrompt && activeProject.files['src/main.js']) {
          // 2. Automatic runtime safety guard patch
          let jsContent = activeProject.files['src/main.js'].content;
          if (!jsContent.includes('DOMContentLoaded')) {
            jsContent = `// Auto-repaired DOM safety wrapper\ndocument.addEventListener('DOMContentLoaded', () => {\n${jsContent}\n});`;
          }
          autoRepairedFiles = {
            ...activeProject.files,
            'src/main.js': {
              ...activeProject.files['src/main.js'],
              content: jsContent,
            },
          };
        }

        if (autoRepairedFiles) {
          const nextState: ProjectState = {
            ...activeProject,
            files: autoRepairedFiles,
          };
          setActiveProject(nextState);
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessId
                ? {
                    ...s,
                    projectState: nextState,
                    snapshots: [
                      ...(s.snapshots || []),
                      {
                        id: 'snap-' + Date.now(),
                        timestamp: Date.now(),
                        description: 'Perbaikan Runtime Otomatis',
                        files: autoRepairedFiles!,
                      },
                    ],
                    messages: s.messages.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            content:
                              explanation ||
                              'Error runtime telah dianalisis dan berkas `src/main.js` telah diperbarui secara otomatis dengan penanganan null-safety dan inisialisasi DOM.',
                            isStreaming: false,
                            isCoding: true,
                            modifiedFiles: ['src/main.js'],
                            projectFiles: autoRepairedFiles!,
                          }
                        : m
                    ),
                  }
                : s
            )
          );
          notifyTaskCompleted('Perbaikan runtime berhasil diterapkan');
        } else {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === sessId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            content: explanation || fullContent,
                            isStreaming: false,
                            isCoding: true,
                            thinkingSteps:
                              thinkingSteps.length > 0
                                ? thinkingSteps
                                : [
                                    {
                                      id: 'step-arch',
                                      action: 'analyze',
                                      detail: 'Selesai menganalisis dan menyusun solusi teknis',
                                      timestamp: Date.now(),
                                    },
                                  ],
                            modifiedFiles: Object.keys(files),
                            projectFiles:
                              Object.keys(files).length > 0
                                ? { ...activeProject.files, ...files }
                                : m.projectFiles,
                            researchReport: finalResearchReport || m.researchReport,
                          }
                        : m
                    ),
                  }
                : s
            )
          );
          notifyTaskCompleted(trimmedText.slice(0, 45) || 'Tugas coding selesai');
        }
      } else {
        // Multifunctional general response (questions, homework, explanations, writing, etc.)
        // Never show Action History!
        const finalContent = fullContent || streamedAccumulator;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: finalContent,
                          isStreaming: false,
                          isCoding: false,
                          thinkingSteps: [],
                          modifiedFiles: [],
                          projectFiles: undefined,
                          researchReport: finalResearchReport || m.researchReport,
                        }
                      : m
                  ),
                }
              : s
          )
        );
        notifyTaskCompleted(trimmedText.slice(0, 45) || 'Jawaban telah selesai');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === sessId) {
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                ),
              };
            }
            return s;
          })
        );
      } else {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === sessId) {
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        isStreaming: false,
                        error: {
                          message: err.message || 'Koneksi ke Clouvia Router terputus.',
                          code: err.code || 'REQUEST_FAILED',
                          status: err.status,
                          requestId: err.requestId,
                          type: err.type,
                        },
                      }
                    : m
                ),
              };
            }
            return s;
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleToggleMessageLike = (messageId: string, type: 'like' | 'dislike') => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: s.messages.map((m) => {
              if (m.id === messageId) {
                if (type === 'like') {
                  return { ...m, liked: !m.liked, disliked: false };
                } else {
                  return { ...m, disliked: !m.disliked, liked: false };
                }
              }
              return m;
            }),
          };
        }
        return s;
      })
    );
  };

  const handleInsertImageToProject = (imageUrl: string) => {
    const htmlFile = activeProject.files['index.html'];
    if (htmlFile) {
      const imgTag = `\n<div class="my-4 flex justify-center">\n  <img src="${imageUrl}" alt="AI Asset" class="rounded-2xl max-w-full shadow-lg border border-white/10" />\n</div>\n`;
      let content = htmlFile.content;
      if (content.includes('</body>')) {
        content = content.replace('</body>', `${imgTag}</body>`);
      } else {
        content += imgTag;
      }
      const updatedFiles = {
        ...activeProject.files,
        'index.html': { ...htmlFile, content },
      };
      const nextProjectState = { ...activeProject, files: updatedFiles };
      setActiveProject(nextProjectState);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, projectState: nextProjectState }
            : s
        )
      );
    }
  };

  const activeSessionSnapshots = activeSession?.snapshots || [];

  const handleRevertToSnapshot = (snapshot: ProjectSnapshot) => {
    const revertedState: ProjectState = {
      title: activeSession?.title || 'Vibe App',
      files: snapshot.files,
      activeFilePath: Object.keys(snapshot.files)[0] || 'index.html',
    };
    setActiveProject(revertedState);
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, projectState: revertedState } : s))
    );
  };

  // Full-Website Pull-to-refresh handler (sync latency, models, active project)
  const handleGlobalRefresh = async () => {
    handleRunPing();
    try {
      const refreshed = await fetchClouviaModels(settings.apiKey);
      if (refreshed && refreshed.length > 0) {
        setModels(refreshed);
      }
    } catch {}
    if (activeSession?.projectState) {
      setActiveProject({ ...activeSession.projectState });
    }
  };

  return (
    <GlobalPullToRefresh onRefresh={handleGlobalRefresh}>
      <div
        className={`flex flex-col h-[100dvh] max-h-[100dvh] w-full fixed inset-0 overflow-hidden bg-[#07080a] text-[#e4e4e7] antialiased ${
          !showWelcomeScreen ? 'animate-workspace-enter' : ''
        }`}
      >
      {/* Top Header */}
      <Header
        sessionTitle={activeSession?.title || 'Prompt Baru'}
        onRenameTitle={handleRenameSession}
        activeView={activeView}
        setActiveView={handleUserChangeView}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isParamsOpen={isParamsOpen}
        setIsParamsOpen={setIsParamsOpen}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
        onOpenGetCode={() => setIsGetCodeOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticOpen(true)}
        onOpenSkills={() => setIsSkillsOpen(true)}
        onOpenHistory={() => setIsVersionHistoryOpen(true)}
        snapshotCount={activeSessionSnapshots.length}
        activeSkillCount={settings.activeSkillIds.length}
        pingResult={pingResult}
        selectedModel={settings.selectedModel}
        onOpenModelSelector={() => setIsModelSelectorOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenOwnerPanel={() => setIsOwnerPanelOpen(true)}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        unreadNotificationCount={unreadNotificationCount}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Drawer / Sidebar */}
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => setActiveSessionId(id)}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={(id, title) => handleRenameSession(title, id)}
          onApplyStarter={handleApplyStarter}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Center Canvas / Workspaces */}
        <main className="flex-1 flex min-w-0 overflow-hidden relative bg-[#07080a]">
          {/* Workspace (Prompt & Stream) View */}
          <div
            className={`h-full min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden ${
              activeView === 'workspace' ? 'flex' : activeView === 'split' ? 'hidden md:flex md:w-1/2 md:border-r md:border-white/5' : 'hidden'
            }`}
          >
            <PromptWorkspace
              messages={activeSession?.messages || []}
              systemInstruction={activeSession?.systemInstruction || settings.systemInstruction}
              onUpdateSystemInstruction={handleUpdateSystemInstruction}
              onSendMessage={handleSendMessage}
              onStopStreaming={handleStopStreaming}
              isStreaming={isStreaming}
              onRunInSandbox={handleRunInSandbox}
              onUpdateMessageContent={handleUpdateMessageContent}
              onOpenParameters={() => setIsParamsOpen(true)}
              onOpenDiagnostics={() => setIsDiagnosticOpen(true)}
              onOpenSkills={() => setIsSkillsOpen(true)}
              activeSkillCount={settings.activeSkillIds.length}
              settings={settings}
              pingResult={pingResult}
              selectedElement={selectedElement}
              onClearSelectedElement={() => setSelectedElement(null)}
              skills={skills}
              onToggleSkill={handleToggleSkill}
              onOpenShareModal={() => setIsShareModalOpen(true)}
              onToggleMessageLike={handleToggleMessageLike}
              onInsertImageToProject={handleInsertImageToProject}
              isSidebarOpen={isSidebarOpen}
              projectFiles={activeProject.files}
            />
          </div>

          {/* Interactive Multi-File Live Sandbox Preview */}
          <div
            className={`h-full min-w-0 flex-1 ${
              activeView === 'preview' ? 'block' : activeView === 'split' ? 'block md:w-1/2' : 'hidden'
            }`}
          >
            <LiveSandbox
              projectState={activeProject}
              isSelectionMode={isSelectionMode}
              onSelectElement={handleSelectElement}
              selectedElement={selectedElement}
              onFixWithAi={(errMsg) => {
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                handleUserChangeView(isMobile ? 'workspace' : 'split');
                const targetJs = activeProject.files['src/main.js']?.content || '';
                const prompt =
                  `[PERBAIKAN ERROR RUNTIME BROWSER CONSOLE]\n` +
                  `Error Console:\n\`\`\`\n${errMsg}\n\`\`\`\n\n` +
                  `Berkas proyek tempat error terjadi ('src/main.js'):\n` +
                  `\`\`\`js:src/main.js\n${targetJs}\n\`\`\`\n\n` +
                  `INSTRUKSI PERBAIKAN:\n` +
                  `Perbaiki error runtime tersebut di dalam berkas 'src/main.js' agar bebas dari error.\n` +
                  `WAJIB: Kembalikan SELURUH isi berkas 'src/main.js' yang sudah diperbaiki secara lengkap dari awal hingga akhir dalam blok kode:\n` +
                  `\`\`\`js:src/main.js\n[KODE LENGKAP HASIL PERBAIKAN]\n\`\`\`\n` +
                  `DILARANG HANYA MEMBERIKAN PENJELASAN TEKS! Berikan kode lengkap agar berkas proyek langsung ter-update secara otomatis di Live Sandbox!`;
                handleSendMessage(prompt);
              }}
              onExportZip={() => {
                exportProjectToZip(activeProject, activeSession?.title || 'vibe-project');
              }}
              onUpdateProject={(updated) => {
                setActiveProject(updated);
                setSessions((prev) =>
                  prev.map((s) => (s.id === activeSessionId ? { ...s, projectState: updated } : s))
                );
              }}
            />
          </div>
        </main>

        {/* Right Parameters Drawer */}
        <ParametersPanel
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          models={models}
          isOpen={isParamsOpen}
          onClose={() => setIsParamsOpen(false)}
          onPing={handleRunPing}
          pingResult={pingResult}
          onOpenModelSelector={() => setIsModelSelectorOpen(true)}
        />
      </div>

      {/* Modals */}
      <SkillsModal
        isOpen={isSkillsOpen}
        onClose={() => setIsSkillsOpen(false)}
        skills={skills}
        activeSkillIds={settings.activeSkillIds}
        onToggleSkill={handleToggleSkill}
        onCreateCustomSkill={handleCreateCustomSkill}
        onDeleteCustomSkill={handleDeleteCustomSkill}
      />

      <GetCodeModal
        isOpen={isGetCodeOpen}
        onClose={() => setIsGetCodeOpen(false)}
        settings={settings}
        messages={activeSession?.messages || []}
      />

      <DiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        pingResult={pingResult}
        settings={settings}
        onRunPing={handleRunPing}
        onUpdateSettings={handleUpdateSettings}
      />

      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        snapshots={activeSessionSnapshots}
        currentFiles={activeProject.files}
        onRevertToSnapshot={handleRevertToSnapshot}
      />

      {/* Custom AI Model Selector Modal */}
      <ModelSelectorModal
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        models={models}
        selectedModel={settings.selectedModel}
        onSelectModel={(m) => handleUpdateSettings({ selectedModel: m })}
      />

      {/* Share Chat Session Modal */}
      <ShareChatModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        session={activeSession}
      />

      {/* Notification Center Modal (opened by clicking Logo V in Header) */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onUnreadCountChange={(count) => setUnreadNotificationCount(count)}
      />

      {/* Owner Management Control Panel Modal */}
      <OwnerPanelModal
        isOpen={isOwnerPanelOpen}
        onClose={() => setIsOwnerPanelOpen(false)}
      />

      {/* User Blocked Fullscreen Screen Overlay */}
      {isCurrentUserBlocked && (
        <UserBlockedScreen
          reason={blockReason}
          onLogout={handleLogout}
        />
      )}

      {/* Vesper.ai Welcome Landing Screen */}
      {showWelcomeScreen && (
        <VesperWelcomeScreen
          onEnter={() => {
            setCurrentUser(getStoredUser());
            setShowWelcomeScreen(false);
          }}
          onLogin={(user) => {
            setCurrentUser(user);
            setShowWelcomeScreen(false);
          }}
          onUpdateApiKey={(key) => {
            handleUpdateSettings({ apiKey: key });
          }}
          userEmail={currentUser?.email || ''}
        />
      )}
      </div>
    </GlobalPullToRefresh>
  );
}
