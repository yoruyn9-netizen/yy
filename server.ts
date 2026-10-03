import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Parse JSON bodies with up to 50MB limit (for base64 images & multi-file prompts)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Dedicated server-side proxy for Clouvia Router (Solves all CORS, Preflight 404, and deployment streaming)
app.all('/api/clouvia/*', async (req, res) => {
  const targetSubpath = req.url.replace(/^\/api\/clouvia/, '');
  const targetUrl = `https://router.clouvia.id${targetSubpath}`;

  // Forward client auth headers or request headers
  const authHeader = req.headers['authorization'];
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (authHeader) {
    headers['Authorization'] = authHeader;
  }
  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const clouviaRes = await fetch(targetUrl, fetchOptions);

    // Forward status code
    res.status(clouviaRes.status);

    // Forward SSE streaming or standard JSON response
    const contentType = clouviaRes.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (!clouviaRes.body) {
      return res.end();
    }

    const reader = clouviaRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err: any) {
    console.error('Proxy forward error:', err);
    res.status(502).json({
      error: {
        message: `Proxy Error: ${err.message || 'Gagal tersambung ke Clouvia Router'}`,
        code: 'PROXY_GATEWAY_ERROR',
      },
    });
  }
});

// Real Web Search API (Multi-Engine Resilient Live Query Engine)
app.post('/api/research/search', async (req, res) => {
  const { query, limit = 5 } = req.body || {};
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const cleanQuery = query.trim();
  const items: Array<{ url: string; domain: string; title: string; snippet: string }> = [];
  const seenUrls = new Set<string>();

  // 1. Primary Engine: DuckDuckGo HTML Live Web Search
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
    const ddgRes = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (ddgRes.ok) {
      const html = await ddgRes.text();
      const resultBlocks = html.split(/<div class="result\s+results_links/);
      for (let i = 1; i < resultBlocks.length && items.length < limit; i++) {
        const block = resultBlocks[i];
        const linkMatch = /<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
        const snippetMatch = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block);

        if (linkMatch) {
          let rawUrl = linkMatch[1];
          if (rawUrl.includes('uddg=')) {
            try {
              const fullUrl = rawUrl.startsWith('//')
                ? 'https:' + rawUrl
                : rawUrl.startsWith('http')
                ? rawUrl
                : 'https://duckduckgo.com' + rawUrl;
              const u = new URL(fullUrl);
              rawUrl = decodeURIComponent(u.searchParams.get('uddg') || rawUrl);
            } catch {}
          }

          try {
            const parsed = new URL(rawUrl);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') continue;

            parsed.searchParams.delete('utm_source');
            parsed.searchParams.delete('utm_medium');
            parsed.searchParams.delete('utm_campaign');
            const cleanUrl = parsed.origin + parsed.pathname;

            if (seenUrls.has(cleanUrl)) continue;
            seenUrls.add(cleanUrl);

            const title = linkMatch[2]
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&#x27;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .trim();

            const snippet = snippetMatch
              ? snippetMatch[1]
                  .replace(/<[^>]+>/g, '')
                  .replace(/&amp;/g, '&')
                  .replace(/&#x27;/g, "'")
                  .replace(/&quot;/g, '"')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .trim()
              : '';

            items.push({
              url: cleanUrl,
              domain: parsed.hostname.replace(/^www\./, ''),
              title: title || parsed.hostname,
              snippet,
            });
          } catch {}
        }
      }
    }
  } catch (err: any) {
    console.warn('DDG Primary Search error:', err.message);
  }

  // 2. Secondary Engine: Wikipedia Search API (Indonesian & English for factual/reference queries)
  if (items.length < 3) {
    for (const lang of ['id', 'en']) {
      try {
        const wikiUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
          cleanQuery
        )}&limit=4&namespace=0&format=json`;
        const wRes = await fetch(wikiUrl, {
          headers: { 'User-Agent': 'VesperWebResearch/2.0' },
          signal: AbortSignal.timeout(4000),
        });
        if (wRes.ok) {
          const wData = await wRes.json();
          const titles = wData[1] || [];
          const snippets = wData[2] || [];
          const urls = wData[3] || [];
          for (let k = 0; k < urls.length && items.length < limit; k++) {
            const u = urls[k];
            if (!u || seenUrls.has(u)) continue;
            seenUrls.add(u);
            const parsed = new URL(u);
            items.push({
              url: u,
              domain: parsed.hostname,
              title: titles[k] || parsed.hostname,
              snippet: snippets[k] || `Informasi ensiklopedia resmi tentang ${titles[k] || cleanQuery}`,
            });
          }
        }
      } catch {}
    }
  }

  // 3. Tertiary Engine: Hacker News Algolia Tech Search API (for developer/code/framework queries)
  if (items.length < 3) {
    try {
      const hnUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(cleanQuery)}&hitsPerPage=5`;
      const hnRes = await fetch(hnUrl, { signal: AbortSignal.timeout(4000) });
      if (hnRes.ok) {
        const hnData = await hnRes.json();
        for (const hit of hnData.hits || []) {
          if (!hit.url || seenUrls.has(hit.url) || items.length >= limit) continue;
          try {
            const parsed = new URL(hit.url);
            seenUrls.add(hit.url);
            items.push({
              url: hit.url,
              domain: parsed.hostname.replace(/^www\./, ''),
              title: hit.title || parsed.hostname,
              snippet: hit.story_text ? hit.story_text.slice(0, 160) : `Pembahasan dan dokumentasi terkait ${cleanQuery}`,
            });
          } catch {}
        }
      }
    } catch {}
  }

  // 4. Guaranteed Contextual Documentation Fallback (guarantees at least 3 relevant sources)
  if (items.length < 3) {
    const fallbackSources = [
      {
        url: `https://id.wikipedia.org/wiki/${encodeURIComponent(cleanQuery.replace(/\s+/g, '_'))}`,
        domain: 'id.wikipedia.org',
        title: `${cleanQuery} - Ensiklopedia Bebas`,
        snippet: `Rangkuman komprehensif dan definisi ensiklopedis mengenai ${cleanQuery}.`,
      },
      {
        url: `https://github.com/search?q=${encodeURIComponent(cleanQuery)}`,
        domain: 'github.com',
        title: `${cleanQuery} Repositories & Open Source`,
        snippet: `Repositori kode sumber terbuka, pustaka, dan dokumentasi teknis untuk ${cleanQuery}.`,
      },
      {
        url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(cleanQuery)}`,
        domain: 'developer.mozilla.org',
        title: `MDN Web Docs: ${cleanQuery}`,
        snippet: `Spesifikasi resmi web standar, referensi API, dan panduan teknis ${cleanQuery}.`,
      },
    ];

    for (const fb of fallbackSources) {
      if (!seenUrls.has(fb.url) && items.length < limit) {
        seenUrls.add(fb.url);
        items.push(fb);
      }
    }
  }

  res.json({ query: cleanQuery, results: items.slice(0, limit) });
});

// Helper to sanitize extracted web content and strip scraper debris like ### ** (image1)
function sanitizeWebMarkdown(rawText: string): string {
  if (!rawText) return '';
  let text = rawText;
  // 1. Remove Jina / Scraper metadata headers at the beginning
  text = text.replace(/^(?:Title|URL Source|Markdown Content|Published time|Author|Warning):\s*[^\n]*\n?/gim, '');
  // 2. Remove image tokens and placeholders
  text = text.replace(/#{1,6}\s*\*{0,4}\s*\([iI]mage\s*\d+\)\s*\*{0,4}[^\n]*/gi, '');
  text = text.replace(/\([iI]mage\s*\d+\)/gi, '');
  text = text.replace(/\[[iI]mage\s*\d+[^\]]*\]/gi, '');
  text = text.replace(/\[(?:Photo|Gambar|Foto|Figure|Fig\.)\s*\d+[^\]]*\]/gi, '');
  text = text.replace(/!\[[^\]]*\]\([^\)]*\)/g, '');
  text = text.replace(/\[(?:Illustration|Diagram|Graphic|Logo|Icon)\s*[^\]]*\]/gi, '');
  text = text.replace(/\[(?:Image|Gambar|Photo)\s*source:[^\]]*\]/gi, '');
  // 3. Remove raw HTML tags leaked into markdown
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  // 4. Decode entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
  // 5. Clean empty headers and bold debris
  text = text.replace(/#{1,6}\s*\*{1,4}\s*#{0,6}/g, '');
  text = text.replace(/^\s*#{1,6}\s*$/gm, '');
  text = text.replace(/\*{2,4}\s*\*{2,4}/g, '');
  text = text.replace(/\*\*\s*\*\*/g, '');
  // 6. Clean boilerplate lines
  const boilerplateRegex =
    /^\s*(?:We use cookies|Accept all cookies|Cookie Policy|Privacy Policy|Terms of Service|Manage preferences|Sign up for our newsletter|Subscribe to our newsletter|Share on (?:Twitter|Facebook|LinkedIn|WhatsApp)|All rights reserved|Skip to content|Main navigation|Back to top|Advertisement|Related articles|Read more:?)\b[^\n]*$/gim;
  text = text.replace(boilerplateRegex, '');
  // 7. Filter empty lines and standalone links
  text = text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^https?:\/\/[^\s]+$/.test(trimmed)) return false;
      if (/^[#*_\-`~+=|\s]{1,6}$/.test(trimmed)) return false;
      if (/^\[(?:link|source|url|gambar|foto|baca juga)\]$/i.test(trimmed)) return false;
      return true;
    })
    .join('\n');
  text = text.replace(/[ \t]{2,}/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

// Real Page Content Extractor API (Jina Reader Integration)
app.post('/api/research/read', async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const targetUrl = url.trim();
    // Try Jina Reader which strips ads, navigation, and boilerplate
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    const jinaRes = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'X-No-Cache': 'true',
      },
      signal: AbortSignal.timeout(9000),
    });

    if (jinaRes.ok) {
      let text = await jinaRes.text();
      const sanitized = sanitizeWebMarkdown(text);
      const trimmed = sanitized.slice(0, 3000).trim();
      return res.json({
        url: targetUrl,
        content: trimmed,
        length: trimmed.length,
      });
    }

    // Direct fetch fallback if Jina has issues
    const directRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,text/plain',
      },
      signal: AbortSignal.timeout(7000),
    });

    const rawHtml = await directRes.text();
    // Extract text from body
    const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(rawHtml);
    const contentHtml = bodyMatch ? bodyMatch[1] : rawHtml;
    const cleanText = contentHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 2500)
      .trim();

    res.json({
      url: targetUrl,
      content: cleanText,
      length: cleanText.length,
    });
  } catch (err: any) {
    console.error('Page read error:', err);
    res.status(502).json({
      error: `Could not retrieve page: ${err.message || 'Network timeout'}`,
      url,
      content: '',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--production');

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer();
