interface SitesEnvironment {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

const unavailableApiResponse = (): Response =>
  Response.json(
    {
      error: 'SERVICE_UNAVAILABLE',
      message:
        'SPR server APIs are pending production runtime configuration and are not available on this deployment.',
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
      return withSecurityHeaders(unavailableApiResponse());
    }

    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && request.method === 'GET') {
      response = await env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
    }

    return withSecurityHeaders(response);
  },
};
