import { SkillPlugin } from '../types';

export const SYSTEM_SKILLS: SkillPlugin[] = [
  {
    id: 'focus-mode',
    name: 'Focus Mode & Direct Revision',
    category: 'code',
    description: 'Targeted pinpoint revisions responding to selected DOM elements without rebuilding from scratch.',
    instruction: `[FOCUS MODE & DIRECT REVISION PROTOCOL - ACTIVE ONLY ON CODING/REVISION REQUESTS]
When [TARGETED COMPONENT REVISION] or a CSS selector is present, or when the user explicitly requests a code revision or bug fix:
1. FOCUS ON TARGET ELEMENT: Pinpoint the exact DOM element matching the selector and the specific source file that controls it.
2. SURGICAL PINPOINT FIXES: Update only the problem location. DO NOT rewrite or regenerate the entire project from scratch (0).
3. MODULAR PRESERVATION: Return ONLY the specific file(s) that need updates with full code block headers (e.g. \`\`\`js:src/main.js). All untouched files remain intact in project state.
4. CLEAN EXPLANATION: State clearly and concisely what was fixed at the problem location outside of code blocks.
(If the user query is a general question, homework problem, or discussion, keep this protocol idle.)`,
    enabled: true,
  },
  {
    id: 'vibe-coder',
    name: 'Vibe Architect & Modular Engine',
    category: 'code',
    description: 'Generates real multi-file project structures (components, logic, styling) with live thinking actions.',
    instruction: `[VIBE CODING & MODULAR ARCHITECTURE PROTOCOL - ACTIVE ONLY ON WEB/APP BUILD REQUESTS]
When the user explicitly asks to build or develop a web application, UI, interactive feature, or game:
1. MODULAR FILE ARCHITECTURE:
Structure projects cleanly into separate component files:
- \`\`\`html:index.html (HTML markup, containers, meta viewport)
- \`\`\`js:src/main.js (Application state, lifecycle, event wiring)
- \`\`\`js:src/components/... (Modular components, e.g. player.js, cards.js, ui.js)
- \`\`\`css:styles/theme.css (Styling and design)
2. STRICT CLEAN OUTPUT:
- Never output developer internal notes such as "[code] → skipped...", "STATUS: SELESAI", or unfinished bundler notes.
- All code blocks must be complete and runnable.
- Any text outside code blocks must only contain clean, helpful explanations of what was built or changed.
(CRITICAL: If the user is asking a question, asking for help with a problem/soal, seeking website info, or discussing concepts, DO NOT generate project files. Provide a direct, natural text answer.)`,
    enabled: true,
  },
  {
    id: 'claude-artifacts',
    name: 'Claude Artifacts & Self-Contained Engine',
    category: 'code',
    description: 'Builds single-pass, fully complete, interactive prototypes with zero missing dependencies or placeholders.',
    instruction: `[CLAUDE ARTIFACTS PROTOCOL - ACTIVE ONLY ON PROTOTYPE CREATION]
When creating an interactive web prototype or application:
1. NO PLACEHOLDERS: Never output "/* TODO: implement later */" or truncated code snippets. Every function, state hook, and handler must be fully written and operational.
2. ROBUST ERROR BOUNDARIES: Guard against null pointers, undefined object keys, and NaN values. Always provide fallback default states.
3. IMMEDIATE INTERACTIVITY: Buttons must have working click handlers, inputs must be reactive, and data must update live in the UI.
4. ZERO EXTERNAL LOCK-IN: Ensure all imported libraries are either standard browser APIs or standard CDN scripts included in index.html.
(If the conversation is general Q&A, math/science problem-solving, or analysis, do NOT build an artifact.)`,
    enabled: true,
  },
  {
    id: 'frontend-architect',
    name: 'Apple iOS & Minimalist Dark UI',
    category: 'design',
    description: 'Minimalist Apple & Claude design system with sleek typography, smooth surfaces, and zero visual clutter.',
    instruction: `[DESIGN PROTOCOL]
Use modern dark minimalist aesthetics inspired by Apple iOS, macOS, and Linear:
- True OLED Black / deep slate surfaces (#000000, #0c0c0e, #141416, #1c1c1e).
- Subtle hairline borders (rgba(255, 255, 255, 0.08)).
- Rounded squircle pill corners (rounded-2xl, rounded-3xl, rounded-full).
- San Francisco / system sans-serif typography with tight letter spacing (-0.015em).
- Fluid micro-animations and tactile spring presses.
- Responsive mobile & desktop layouts with fluid typography and zero neon slop.`,
    enabled: true,
  },
  {
    id: 'bug-hunter',
    name: 'Bug Hunter & Deep Diagnostics',
    category: 'testing',
    description: 'Diagnoses runtime exceptions, unhandled Promise rejections, null pointers, and provides exact line patches.',
    instruction: `[BUG HUNTER & DIAGNOSTIC PROTOCOL]
1. ROOT CAUSE ISOLATION: When errors occur, trace the exact call stack, variable scope, or asynchronous race condition causing the issue.
2. PRECISE TARGETED REPAIR: Fix the exact lines causing the defect without breaking adjacent working logic.
3. CONSOLE CLEANLINESS: Eliminate uncaught exceptions, 404 network fetch loops, and unmounted event listener memory leaks.
4. CLEAR DIAGNOSIS SUMMARY: Briefly explain what broke, why it broke, and how the patch resolves it.`,
    enabled: true,
  },
  {
    id: 'clean-refactor',
    name: 'SOLID Refactoring & Clean Architecture',
    category: 'code',
    description: 'Transforms messy spaghetti code into clean, modular, maintainable abstractions and decoupled stores.',
    instruction: `[SOLID REFACTORING PROTOCOL]
1. SEPARATION OF CONCERNS: Separate presentation (DOM/HTML), business logic (controllers/handlers), and persistent state (store).
2. DRY & MODULARITY: Eliminate duplicated code by extracting reusable helper functions and utility modules.
3. IMMUTABLE STATE PATTERNS: Use predictable state updates to avoid unexpected side effects.
4. CODE CLARITY: Maintain descriptive naming conventions and self-documenting logic.`,
    enabled: false,
  },
  {
    id: 'wcag-accessibility',
    name: 'A11y & WCAG 2.1 AA Accessibility',
    category: 'design',
    description: 'Enforces complete keyboard navigation, ARIA attributes, semantic HTML, and high contrast.',
    instruction: `[ACCESSIBILITY & A11Y PROTOCOL]
1. KEYBOARD NAVIGABILITY: Ensure all interactive controls (buttons, modals, drawers, tabs) are reachable and operable via Tab, Enter, Space, and Escape.
2. SEMANTIC HTML: Use proper landmarks (<main>, <nav>, <header>, <section>, <button> instead of unadorned <div>).
3. ARIA ATTRIBUTES: Supply aria-label, aria-expanded, aria-hidden, and role attributes where necessary.
4. FOCUS VISIBILITY: Provide distinct, accessible focus indicators for keyboard users.`,
    enabled: false,
  },
  {
    id: 'state-machine',
    name: 'Finite State Machine & Persistence',
    category: 'code',
    description: 'Builds predictable state transitions (idle, loading, success, error) with localStorage auto-persistence.',
    instruction: `[STATE MACHINE PROTOCOL]
1. EXPLICIT STATES: Model application states as deterministic finite states (e.g. idle -> loading -> success | error) to prevent invalid intermediate states.
2. PERSISTENCE ENGINE: Automatically synchronize user preferences and data models with localStorage using safe JSON parsing and fallback defaults.
3. HISTORY & UNDO: Structure state to easily support history stacks (undo / redo) when requested.`,
    enabled: false,
  },
  {
    id: 'api-mock-generator',
    name: 'Mock Data Simulator & REST Client',
    category: 'tools',
    description: 'Injects realistic data fixtures, simulates network latency, search filtering, and pagination.',
    instruction: `[DATA SIMULATOR PROTOCOL]
1. REALISTIC FIXTURES: Generate realistic, rich mock data (names, dates, currency, avatars, metrics) instead of placeholder "Item 1, Item 2".
2. ASYNC LATENCY SIMULATION: Simulate real-world async requests (Promise + setTimeout) to test loading skeletons and spinners.
3. SEARCH & PAGINATION: Implement client-side filtering, debounced search, sorting, and pagination.`,
    enabled: false,
  },
  {
    id: 'documentation-jsdoc',
    name: 'JSDoc & Technical Documentation',
    category: 'tools',
    description: 'Adds comprehensive JSDoc comments, type definitions, and architecture overviews.',
    instruction: `[DOCUMENTATION PROTOCOL]
1. JSDOC ANNOTATIONS: Add clean @param, @returns, and @typedef tags for functions, classes, and exported modules.
2. ARCHITECTURE OVERVIEW: Provide an overview of file structures, data flow, and key component responsibilities in a clear summary.
3. CLEAN CODEBASE: Keep documentation informative, concise, and professional without cluttering code.`,
    enabled: false,
  },
  {
    id: 'responsive-expert',
    name: 'Adaptive Mobile & Fluid Viewports',
    category: 'design',
    description: 'Optimizes layouts flawlessly for iPhone (390px), iPad (768px), and ultra-wide desktop viewports.',
    instruction: `[RESPONSIVE DESIGN PROTOCOL]
1. MOBILE-FIRST FLUIDITY: Ensure touch-friendly tap targets (minimum 44x44px), fluid grids, and no horizontal scroll leaks.
2. SAFE AREA INSETS: Respect notch and home indicator safe areas (env(safe-area-inset-*)).
3. DEVICE ADAPTATION: Adapt navigation patterns seamlessly between bottom sheets/drawers on mobile and split panes on desktop.`,
    enabled: false,
  },
  {
    id: 'canvas-physics-sim',
    name: '2D Canvas & Vector Motion',
    category: 'code',
    description: 'Vector physics, particle loops, collision dynamics, and 60fps canvas graphics.',
    instruction: `[CANVAS PROTOCOL]
Write high-performance HTML5 Canvas 2D animations with requestAnimationFrame, vector math, friction damping, interactive mouse attraction/repulsion, and responsive auto-resize in src/engine/canvas.js.`,
    enabled: false,
  },
];
