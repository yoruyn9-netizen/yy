import React, { useState } from 'react';
import { X, Copy, Check, Code } from 'lucide-react';
import { StudioSettings, ChatMessage } from '../types';

interface GetCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StudioSettings;
  messages: ChatMessage[];
}

export const GetCodeModal: React.FC<GetCodeModalProps> = ({
  isOpen,
  onClose,
  settings,
  messages,
}) => {
  const [lang, setLang] = useState<'curl' | 'python' | 'node' | 'react'>('curl');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const cleanBase = settings.baseUrl.replace(/\/+$/, '');
  const promptList = messages
    .filter((m) => m.content.trim())
    .map((m) => ({ role: m.role, content: m.content }));

  if (promptList.length === 0) {
    promptList.push({ role: 'user', content: 'Create a vibe coding interactive app' });
  }

  const curlCode = `curl -X POST "${cleanBase}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${settings.apiKey}" \\
  -d '{
    "model": "${settings.selectedModel}",
    "messages": ${JSON.stringify(
      settings.systemInstruction.trim()
        ? [{ role: 'system', content: settings.systemInstruction }, ...promptList]
        : promptList,
      null,
      4
    )},
    "temperature": ${settings.temperature},
    "top_p": ${settings.topP},
    "max_tokens": ${settings.maxTokens},
    "stream": true
  }'`;

  const pythonCode = `import requests
import json

url = "${cleanBase}/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${settings.apiKey}"
}

payload = {
    "model": "${settings.selectedModel}",
    "messages": ${JSON.stringify(
      settings.systemInstruction.trim()
        ? [{ role: 'system', content: settings.systemInstruction }, ...promptList]
        : promptList,
      null,
      4
    )},
    "temperature": ${settings.temperature},
    "top_p": ${settings.topP},
    "max_tokens": ${settings.maxTokens},
    "stream": True
}

response = requests.post(url, headers=headers, json=payload, stream=True)
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))`;

  const nodeCode = `import fetch from 'node-fetch';

const response = await fetch('${cleanBase}/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${settings.apiKey}'
  },
  body: JSON.stringify({
    model: '${settings.selectedModel}',
    messages: ${JSON.stringify(
      settings.systemInstruction.trim()
        ? [{ role: 'system', content: settings.systemInstruction }, ...promptList]
        : promptList,
      null,
      4
    )},
    temperature: ${settings.temperature},
    top_p: ${settings.topP},
    max_tokens: ${settings.maxTokens},
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}`;

  const reactCode = `import { useState } from 'react';

export function useClouviaChat() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (prompt) => {
    setLoading(true);
    setOutput('');

    const res = await fetch('${cleanBase}/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${settings.apiKey}'
      },
      body: JSON.stringify({
        model: '${settings.selectedModel}',
        messages: [{ role: 'user', content: prompt }],
        stream: true
      })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      setOutput(prev => prev + text);
    }
    setLoading(false);
  };

  return { send, output, loading };
}`;

  const currentCode =
    lang === 'curl' ? curlCode : lang === 'python' ? pythonCode : lang === 'node' ? nodeCode : reactCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#1c1c1e] border border-white/10 rounded-3xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-white/50" />
            <span className="text-sm font-semibold text-white">Export API Code</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors ios-tap"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection - Apple Segmented Control */}
        <div className="px-5 pt-3.5 pb-3 border-b border-white/[0.06]">
          <div className="inline-flex bg-[#121214] p-0.5 rounded-full border border-white/[0.06]">
            {[
              { id: 'curl', label: 'cURL' },
              { id: 'python', label: 'Python' },
              { id: 'node', label: 'Node.js' },
              { id: 'react', label: 'React' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setLang(t.id as any)}
                className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all ios-tap ${
                  lang === t.id
                    ? 'bg-[#2c2c2e] text-white shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#0c0c0e] font-mono text-xs text-white/90 leading-relaxed">
          <pre>
            <code>{currentCode}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between bg-[#1c1c1e]">
          <span className="text-[11px] text-white/40">
            Model: <span className="font-mono text-white/70">{settings.selectedModel}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-semibold transition-all ios-tap shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Snippet'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
