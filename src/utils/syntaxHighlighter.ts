import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markdown';

/**
 * Normalizes language identifier to Prism's supported grammar key
 */
function normalizeLanguage(lang: string): string {
  if (!lang) return 'javascript';
  const clean = lang.toLowerCase().trim();
  switch (clean) {
    case 'js':
    case 'javascript':
    case 'node':
      return 'javascript';
    case 'ts':
    case 'typescript':
      return 'typescript';
    case 'jsx':
      return 'jsx';
    case 'tsx':
      return 'tsx';
    case 'html':
    case 'xml':
    case 'svg':
      return 'markup';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'py':
    case 'python':
      return 'python';
    case 'sh':
    case 'bash':
    case 'shell':
    case 'zsh':
      return 'bash';
    case 'sql':
      return 'sql';
    case 'md':
    case 'markdown':
      return 'markdown';
    default:
      return Prism.languages[clean] ? clean : 'javascript';
  }
}

/**
 * Highlights source code using Prism and returns HTML string with vibrant syntax tokens
 */
export function highlightCode(code: string, language: string = 'javascript'): string {
  if (!code) return '';
  const langKey = normalizeLanguage(language);
  const grammar = Prism.languages[langKey] || Prism.languages.javascript || Prism.languages.markup;

  try {
    if (grammar) {
      return Prism.highlight(code, grammar, langKey);
    }
  } catch (err) {
    console.warn('Prism highlighting fallback:', err);
  }

  // Safe fallback to basic HTML escaping
  return escapeHtml(code);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
