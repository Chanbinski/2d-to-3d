export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const base = process.env.UPSTREAM_API_BASE;
  if (!base) return res.status(500).send('Missing UPSTREAM_API_BASE');

  const upstreamUrl = `${base.replace(/\/$/, '')}/generate_from_text/`;

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
    const disp = upstreamRes.headers.get('content-disposition');

    res.status(upstreamRes.status);
    res.setHeader('Content-Type', contentType);
    if (disp) res.setHeader('Content-Disposition', disp);

    const buf = Buffer.from(await upstreamRes.arrayBuffer());
    return res.send(buf);
  } catch (err) {
    console.error('Proxy error (text):', err?.message || err);
    return res.status(502).send('Upstream unavailable');
  }
}
