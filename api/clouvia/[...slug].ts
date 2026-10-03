export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // Handle CORS preflight for any cross-origin clients
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-request-id',
      },
    });
  }

  const url = new URL(req.url);
  const subpath = url.pathname.replace(/^\/api\/clouvia/, '');
  const targetUrl = `https://router.clouvia.id${subpath}${url.search}`;

  const headers = new Headers();
  const authHeader = req.headers.get('authorization');
  if (authHeader) headers.set('authorization', authHeader);
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  headers.set('accept', req.headers.get('accept') || 'application/json');

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = req.body;
      // @ts-ignore
      fetchOptions.duplex = 'half';
    }

    const res = await fetch(targetUrl, fetchOptions);

    const resHeaders = new Headers(res.headers);
    resHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(res.body, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: {
          message: `Vercel Gateway Proxy Error: ${err.message || 'Gagal tersambung ke Clouvia Router'}`,
          code: 'VERCEL_PROXY_ERROR',
        },
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
