export default async function handler(_req: any, res: any) {
  const base = (globalThis as any).process?.env?.UPSTREAM_API_BASE;
  if (!base) return res.status(500).send('Missing UPSTREAM_API_BASE');

  const upstreamUrl = `${base.replace(/\/$/, '')}/health/`;
  try {
    const upstreamRes = await fetch(upstreamUrl);
    res.status(upstreamRes.status);
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');
    const text = await upstreamRes.text();
    return res.send(text);
  } catch (err: any) {
    console.error('Proxy error (health):', err?.message || err);
    return res.status(502).send('Upstream unavailable');
  }
}


