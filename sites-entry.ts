interface SitesEnvironment {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

const API_ORIGIN = 'https://api-production-2722.up.railway.app';

const unavailableApiResponse = (): Response =>
  Response.json(
    {
      error: 'UPSTREAM_UNAVAILABLE',
      message: 'The SPR API is temporarily unavailable.',
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );

const withSecurityHeaders = (response: Response): Response => {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('X-Frame-Options', 'DENY');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export default {
  async fetch(request: Request, env: SitesEnvironment): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      const upstreamUrl = new URL(`${url.pathname}${url.search}`, API_ORIGIN);

      try {
        const upstreamHeaders = new Headers(request.headers);
        upstreamHeaders.delete('if-none-match');
        upstreamHeaders.delete('if-modified-since');
        upstreamHeaders.set('cache-control', 'no-store');

        const upstreamRequest = new Request(upstreamUrl, {
          method: request.method,
          headers: upstreamHeaders,
          body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
          redirect: 'manual',
        });
        const upstreamResponse = await fetch(upstreamRequest);
        const responseHeaders = new Headers(upstreamResponse.headers);
        responseHeaders.set('cache-control', 'no-store');
        responseHeaders.delete('etag');
        responseHeaders.delete('last-modified');

        return withSecurityHeaders(new Response(upstreamResponse.body, {
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
          headers: responseHeaders,
        }));
      } catch (error) {
        console.error('SPR API proxy request failed', error);
        return withSecurityHeaders(unavailableApiResponse());
      }
    }

    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && request.method === 'GET') {
      response = await env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
    }

    return withSecurityHeaders(response);
  },
};
