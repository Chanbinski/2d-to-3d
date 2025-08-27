export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const base = process.env.UPSTREAM_API_BASE;
  if (!base) return res.status(500).send('Missing UPSTREAM_API_BASE');

  const upstreamUrl = `${base.replace(/\/$/, '')}/health/`;

  try {
    console.log('Health check to:', upstreamUrl);
    
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
    });

    console.log('Health status:', upstreamRes.status, upstreamRes.statusText);

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      console.error('Health check failed:', upstreamRes.status, errorText);
      return res.status(upstreamRes.status).send(errorText || 'Health check failed');
    }

    const responseText = await upstreamRes.text();
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(responseText);
  } catch (err) {
    console.error('Health check error:', err?.message || err);
    return res.status(502).send(`Health check failed: ${err?.message}`);
  }
}