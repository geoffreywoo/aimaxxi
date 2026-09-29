// Vercel adapter for the read-only public UsePaid fee feed.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { getMetrics } = await import('../community-metrics.mjs');
    return res.status(200).json(await getMetrics());
  } catch {
    return res.status(503).json({ error: 'UsePaid data unavailable' });
  }
};
