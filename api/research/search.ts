export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { query, limit = 5 } = body || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query.trim())}`;
    const ddgRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      },
      signal: AbortSignal.timeout(9000),
    });

    if (!ddgRes.ok) {
      throw new Error(`Search engine responded with HTTP ${ddgRes.status}`);
    }

    const html = await ddgRes.text();
    const items: Array<{ url: string; domain: string; title: string; snippet: string }> = [];
    const seenUrls = new Set<string>();

    const resultBlocks = html.split(/<div class="result\s+results_links/);
    for (let i = 1; i < resultBlocks.length && items.length < limit; i++) {
      const block = resultBlocks[i];
      const linkMatch = /<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
      const snippetMatch = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block);

      if (linkMatch) {
        let rawUrl = linkMatch[1];
        if (rawUrl.includes('uddg=')) {
          try {
            const u = new URL('https://duckduckgo.com' + rawUrl);
            rawUrl = decodeURIComponent(u.searchParams.get('uddg') || rawUrl);
          } catch {}
        }

        try {
          const parsed = new URL(rawUrl);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') continue;

          parsed.searchParams.delete('utm_source');
          parsed.searchParams.delete('utm_medium');
          parsed.searchParams.delete('utm_campaign');
          const cleanUrl = parsed.toString();

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

    return new Response(JSON.stringify({ query: query.trim(), results: items }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: `Web search couldn't be completed: ${err.message || 'Connection error'}`,
        results: [],
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
