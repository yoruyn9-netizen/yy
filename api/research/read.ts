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
    const { url } = body || {};

    if (!url || typeof url !== 'string' || !url.trim()) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetUrl = url.trim();
    // Try Jina Reader
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
      text = text.replace(/^Title:[^\n]*\nURL Source:[^\n]*\nMarkdown Content:\s*/i, '');
      const trimmed = text.slice(0, 3000).trim();
      return new Response(
        JSON.stringify({
          url: targetUrl,
          content: trimmed,
          length: trimmed.length,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Direct fetch fallback
    const directRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,text/plain',
      },
      signal: AbortSignal.timeout(7000),
    });

    const rawHtml = await directRes.text();
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

    return new Response(
      JSON.stringify({
        url: targetUrl,
        content: cleanText,
        length: cleanText.length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: `Could not retrieve page: ${err.message || 'Network timeout'}`,
        url: '',
        content: '',
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
