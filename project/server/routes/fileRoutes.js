const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { protect } = require('../middlewares/auth');
const { getS3Hostname } = require('../config/aws');

const getAllowedHosts = () => {
  const hosts = new Set(['localhost', '127.0.0.1']);
  const s3Host = getS3Hostname();
  if (s3Host) hosts.add(s3Host);

  const apiUrl = process.env.API_URL || '';
  if (apiUrl) {
    try {
      hosts.add(new URL(apiUrl).hostname);
    } catch { /* ignore */ }
  }
  return hosts;
};

const isAllowedUrl = (targetUrl) => {
  try {
    const parsed = new URL(targetUrl);
    const allowed = getAllowedHosts();
    if (allowed.has(parsed.hostname)) return true;
    if (parsed.hostname.includes('amazonaws.com')) return true;
    return false;
  } catch {
    return false;
  }
};

// @desc    Proxy remote files (S3) with CORS headers for CAD viewers
// @route   GET /api/files/proxy?url=<encoded-url>
// @access  Private
router.get('/proxy', protect, (req, res) => {
  const { url } = req.query;
  if (!url || !isAllowedUrl(url)) {
    return res.status(400).json({ message: 'Invalid or disallowed file URL' });
  }

  const parsed = new URL(url);
  const client = parsed.protocol === 'https:' ? https : http;

  const proxyReq = client.get(url, (proxyRes) => {
    if (proxyRes.statusCode >= 400) {
      return res.status(proxyRes.statusCode).json({ message: 'Failed to fetch file' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/octet-stream');
    if (proxyRes.headers['content-length']) {
      res.setHeader('Content-Length', proxyRes.headers['content-length']);
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');

    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('File proxy error:', err);
    res.status(502).json({ message: 'Failed to proxy file' });
  });
});

module.exports = router;
