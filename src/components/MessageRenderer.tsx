import React from 'react';
import { ExternalLink } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { ResearchSource } from '../types';

interface MessageRendererProps {
  content: string;
  sources?: ResearchSource[];
  onRunInSandbox?: (code: string, language: string) => void;
  onUpdateMessageContent?: (newContent: string) => void;
  onSelectSourceNumber?: (num: number) => void;
  onHoverSourceNumber?: (num: number | null) => void;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({
  content,
  sources,
  onRunInSandbox,
  onUpdateMessageContent,
  onSelectSourceNumber,
  onHoverSourceNumber,
}) => {
  // Parse code blocks with start and end markers (support closed & unclosed)
  const regex = /```([a-zA-Z0-9_\-\.\:\/]+)?\s*\n([\s\S]*?)(?:```|$)/g;
  const segments: Array<
    | { type: 'text'; text: string }
    | { type: 'code'; language: string; filename?: string; code: string; fullBlock: string }
  > = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = content.slice(lastIndex, match.index);
      if (textChunk) {
        segments.push({
          type: 'text',
          text: textChunk,
        });
      }
    }

    let rawHeader = (match[1] || 'html').trim().toLowerCase();
    let language = rawHeader;
    let filename: string | undefined;

    if (rawHeader.includes(':')) {
      const split = rawHeader.split(':');
      language = split[0];
      filename = split[1];
    } else if (rawHeader.includes('.')) {
      filename = rawHeader;
      language = rawHeader.split('.').pop() || 'html';
    }

    const codeBody = match[2].trim();
    if (codeBody || match[0].endsWith('```')) {
      segments.push({
        type: 'code',
        language: normalizeLang(language),
        filename,
        code: codeBody,
        fullBlock: match[0],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      text: content.slice(lastIndex),
    });
  }

  const handleBlockChange = (blockIdx: number, newCode: string, lang: string) => {
    if (!onUpdateMessageContent) return;

    let reconstructed = '';
    let currentCodeIdx = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.type === 'text') {
        reconstructed += seg.text;
      } else {
        if (currentCodeIdx === blockIdx) {
          const header = seg.filename ? `${lang}:${seg.filename}` : lang;
          reconstructed += `\`\`\`${header}\n${newCode}\n\`\`\``;
        } else {
          reconstructed += seg.fullBlock;
        }
        currentCodeIdx++;
      }
    }

    onUpdateMessageContent(reconstructed);
  };

  let codeBlockCounter = 0;

  return (
    <div className="space-y-2 text-[13px] leading-relaxed text-[#d1d5db]">
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return (
            <div key={`txt-${idx}`} className="space-y-1 my-1">
              {renderMarkdownText(seg.text, sources, onSelectSourceNumber, onHoverSourceNumber)}
            </div>
          );
        }

        const currentBlockNum = codeBlockCounter++;
        return (
          <CodeBlock
            key={`code-${idx}`}
            language={seg.language}
            filename={seg.filename}
            code={seg.code}
            onRunInSandbox={onRunInSandbox}
            onCodeChange={(newVal, lang) => handleBlockChange(currentBlockNum, newVal, lang)}
          />
        );
      })}
    </div>
  );
};

function normalizeLang(lang: string): string {
  const l = lang.toLowerCase();
  if (l === 'js' || l === 'javascript' || l === 'ts' || l === 'typescript') return 'javascript';
  if (l === 'htm' || l === 'html') return 'html';
  if (l === 'css') return 'css';
  if (l === 'py' || l === 'python') return 'python';
  return l || 'plaintext';
}

/**
 * Preprocesses markdown text and parses block elements:
 * tables, blockquotes, lists, headings, horizontal rules, and paragraphs
 */
function renderMarkdownText(
  text: string,
  sources?: ResearchSource[],
  onSelectSourceNumber?: (num: number) => void,
  onHoverSourceNumber?: (num: number | null) => void
): React.ReactNode {
  // Strip dangling backtick marks
  let clean = text.replace(/^```\s*$/gm, '');

  // Collapse double blank lines inside markdown tables
  clean = clean.replace(/(\|.*\|)[ \t]*\n[ \t]*\n(?=[ \t]*\|)/g, '$1\n');
  clean = clean.replace(/(\|.*\|)[ \t]*\n[ \t]*\n(?=[ \t]*\|)/g, '$1\n');

  const rawLines = clean.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      blocks.push(<div key={`empty-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^(?:---|\*\*\*|___)$/.test(trimmed)) {
      blocks.push(<hr key={`hr-${i}`} className="my-3 border-white/10" />);
      i++;
      continue;
    }

    // Markdown Table Detection (Line starts and ends with '|')
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length >= 3) {
      const tableLines: string[] = [];
      while (
        i < rawLines.length &&
        rawLines[i].trim().startsWith('|') &&
        rawLines[i].trim().endsWith('|')
      ) {
        tableLines.push(rawLines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        // Parse header and rows
        const headerCells = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());

        // Check if second line is divider (e.g. |---|---|)
        const isDivider = /^\|(?:\s*:?-+:?\s*\|)+$/.test(tableLines[1]);
        const startRow = isDivider ? 2 : 1;
        const rowCells = tableLines.slice(startRow).map((rowStr) =>
          rowStr
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );

        blocks.push(
          <div
            key={`tbl-${i}`}
            className="my-3 overflow-x-auto rounded-2xl border border-white/10 bg-[#101114] shadow-md scrollbar-thin"
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04]">
                  {headerCells.map((h, colIdx) => (
                    <th
                      key={colIdx}
                      className="px-3.5 py-2.5 font-semibold text-white/90 font-sans tracking-wide"
                    >
                      {parseInline(h, sources, onSelectSourceNumber, onHoverSourceNumber)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {rowCells.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-3.5 py-2.5 leading-relaxed align-top text-white/80"
                      >
                        {parseInline(cell, sources, onSelectSourceNumber, onHoverSourceNumber)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className="my-2 pl-3 border-l-2 border-[#38bdf8]/60 bg-white/[0.02] py-1.5 pr-3 rounded-r-xl text-white/80 italic text-xs leading-relaxed"
        >
          {parseInline(quoteText, sources, onSelectSourceNumber, onHoverSourceNumber)}
        </blockquote>
      );
      i++;
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h4 key={`h4-${i}`} className="text-[13px] font-semibold text-white tracking-tight mt-3 mb-1">
          {parseInline(trimmed.slice(4), sources, onSelectSourceNumber, onHoverSourceNumber)}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h3 key={`h3-${i}`} className="text-sm font-semibold text-white tracking-tight mt-3.5 mb-1.5">
          {parseInline(trimmed.slice(3), sources, onSelectSourceNumber, onHoverSourceNumber)}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push(
        <h2 key={`h2-${i}`} className="text-base font-semibold text-white tracking-tight mt-4 mb-2">
          {parseInline(trimmed.slice(2), sources, onSelectSourceNumber, onHoverSourceNumber)}
        </h2>
      );
      i++;
      continue;
    }

    // Unordered lists (- , * , • )
    if (/^[-*•]\s+/.test(trimmed)) {
      const itemContent = trimmed.replace(/^[-*•]\s+/, '');
      blocks.push(
        <div key={`ul-${i}`} className="flex items-start gap-2.5 pl-1.5 my-1 text-[#d6d9e0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#52525b] mt-2 shrink-0" />
          <span className="flex-1 leading-normal">
            {parseInline(itemContent, sources, onSelectSourceNumber, onHoverSourceNumber)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // Numbered lists (1. , 2. )
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      blocks.push(
        <div key={`ol-${i}`} className="flex items-start gap-2 pl-1.5 my-1 text-[#d6d9e0]">
          <span className="font-mono text-[11px] text-[#71717a] mt-0.5 shrink-0">
            {numMatch[1]}.
          </span>
          <span className="flex-1 leading-normal">
            {parseInline(numMatch[2], sources, onSelectSourceNumber, onHoverSourceNumber)}
          </span>
        </div>
      );
      i++;
      continue;
    }

    // Standard paragraph
    blocks.push(
      <p key={`p-${i}`} className="my-1.5 leading-relaxed text-[#d6d9e0]">
        {parseInline(trimmed, sources, onSelectSourceNumber, onHoverSourceNumber)}
      </p>
    );
    i++;
  }

  return blocks;
}

/**
 * Handles inline formatting: **bold**, *italic*, `code`, [Text](url) links, and [1] [2] citation chips
 */
function parseInline(
  str: string,
  sources?: ResearchSource[],
  onSelectSourceNumber?: (num: number) => void,
  onHoverSourceNumber?: (num: number | null) => void
): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  // Matches: **bold**, *italic*, `code`, [1] citation, or [link text](https://url)
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[\d+\]|\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;

  while ((m = regex.exec(str)) !== null) {
    if (m.index > last) {
      tokens.push(str.slice(last, m.index));
    }
    const token = m[0];

    // Markdown Link: [Link Text](https://url)
    if (m[2] && m[3]) {
      const linkText = m[2];
      const linkUrl = m[3];
      tokens.push(
        <a
          key={`link-${k++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[#38bdf8] hover:text-[#7dd3fc] hover:underline underline-offset-2 font-medium transition-colors cursor-pointer"
        >
          <span>{linkText}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0 inline ml-0.5" />
        </a>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={`b-${k++}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={`i-${k++}`} className="italic text-[#e4e4e7]">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={`c-${k++}`}
          className="font-mono text-[11.5px] bg-[#18181b] text-[#fafafa] px-1.5 py-0.5 rounded-md border border-[#27272a]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (/^\[\d+\]$/.test(token)) {
      const sourceNum = parseInt(token.slice(1, -1), 10);
      const matchedSource = sources?.find((s) => s.number === sourceNum);
      tokens.push(
        <button
          type="button"
          key={`cite-${k++}`}
          onClick={() => onSelectSourceNumber?.(sourceNum)}
          onMouseEnter={() => onHoverSourceNumber?.(sourceNum)}
          onMouseLeave={() => onHoverSourceNumber?.(null)}
          className="inline-flex items-center justify-center mx-0.5 px-1.5 py-0.2 rounded bg-white/10 hover:bg-white/20 active:bg-white/25 text-white/90 hover:text-white font-mono text-[10px] font-semibold border border-white/15 transition-all select-none cursor-pointer align-baseline"
          title={
            matchedSource
              ? `${matchedSource.title} (${matchedSource.domain})`
              : `Source [${sourceNum}]`
          }
        >
          {sourceNum}
        </button>
      );
    }
    last = m.index + token.length;
  }

  if (last < str.length) {
    tokens.push(str.slice(last));
  }

  return tokens.length > 0 ? tokens : str;
}
