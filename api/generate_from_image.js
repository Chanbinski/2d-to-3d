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

  const upstreamUrl = `${base.replace(/\/$/, '')}/generate_from_image/`;

  try {
    console.log('=== IMAGE PROXY START ===');
    console.log('Request method:', req.method);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Proxying to:', upstreamUrl);
    console.log('UPSTREAM_API_BASE:', base);
    
    const requestBody = JSON.stringify(req.body);
    console.log('Request body size:', requestBody.length, 'bytes');
    
    const upstreamRes = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    console.log('Upstream status:', upstreamRes.status, upstreamRes.statusText);
    console.log('Upstream headers:', Object.fromEntries(upstreamRes.headers.entries()));

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      console.error('Upstream error body:', errorText);
      console.error('Full upstream error:', upstreamRes.status, upstreamRes.statusText, errorText);
      return res.status(upstreamRes.status).send(errorText || 'Upstream error');
    }

    const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
    const disp = upstreamRes.headers.get('content-disposition');
    console.log('Response content-type:', contentType);
    console.log('Response content-disposition:', disp);

    res.status(upstreamRes.status);
    res.setHeader('Content-Type', contentType);
    if (disp) res.setHeader('Content-Disposition', disp);

    const buf = Buffer.from(await upstreamRes.arrayBuffer());
    console.log('Response buffer size:', buf.length, 'bytes');
    console.log('=== IMAGE PROXY SUCCESS ===');
    return res.send(buf);
  } catch (err) {
    console.error('=== IMAGE PROXY ERROR ===');
    console.error('Error type:', err?.constructor?.name);
    console.error('Error message:', err?.message);
    console.error('Error stack:', err?.stack);
    console.error('Error details:', err);
    return res.status(502).send(`Upstream unavailable: ${err?.message}`);
  }
}
