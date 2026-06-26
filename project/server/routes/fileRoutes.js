const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { protect } = require('../middlewares/auth');
const { s3Client, getBucketName, getS3Hostname, isS3Configured } = require('../config/aws');
const { UPLOADS_DIR } = require('../utils/s3Upload');

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

const parseS3KeyFromUrl = (targetUrl) => {
  try {
    const parsed = new URL(targetUrl);
    const s3Host = getS3Hostname();
    if (s3Host && parsed.hostname === s3Host) {
      return decodeURIComponent(parsed.pathname.replace(/^\//, ''));
    }
    if (parsed.hostname.includes('amazonaws.com') && getBucketName()) {
      const bucket = getBucketName();
      const pathStyle = parsed.hostname.startsWith(`${bucket}.`);
      if (pathStyle || parsed.hostname === 's3.amazonaws.com') {
        return decodeURIComponent(parsed.pathname.replace(/^\//, '').replace(new RegExp(`^${bucket}/`), ''));
      }
    }
  } catch { /* ignore */ }
  return null;
};

const parseLocalUploadFilename = (targetUrl) => {
  try {
    const parsed = new URL(targetUrl);
    const apiUrl = process.env.API_URL || '';
    let apiHost = '';
    if (apiUrl) {
      try { apiHost = new URL(apiUrl).hostname; } catch { /* ignore */ }
    }
    if (apiHost && parsed.hostname === apiHost && parsed.pathname.startsWith('/uploads/')) {
      return path.basename(parsed.pathname);
    }
  } catch { /* ignore */ }
  return null;
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

const CONTENT_TYPES = {
  '.pdf': 'application/pdf',
  '.stl': 'model/stl',
  '.step': 'application/step',
  '.stp': 'application/step',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.dxf': 'application/dxf',
  '.dwg': 'application/acad',
  '.svg': 'image/svg+xml'
};

const guessContentType = (keyOrName) => {
  const ext = path.extname(keyOrName || '').toLowerCase();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
};

const setInlineFileHeaders = (res, keyOrName, contentType) => {
  const type = contentType || guessContentType(keyOrName);
  const safeName = path.basename(keyOrName || 'file').replace(/"/g, '');
  res.setHeader('Content-Type', type);
  res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
  res.setHeader('Cache-Control', 'private, max-age=3600');
};

const streamS3Object = async (key, res) => {
  const result = await s3Client.send(new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key
  }));

  setInlineFileHeaders(res, key, result.ContentType || guessContentType(key));
  if (result.ContentLength) {
    res.setHeader('Content-Length', String(result.ContentLength));
  }

  if (result.Body && typeof result.Body.pipe === 'function') {
    result.Body.pipe(res);
    return;
  }

  const bytes = await result.Body.transformToByteArray();
  res.send(Buffer.from(bytes));
};

const streamLocalUpload = (filename, res) => {
  const filePath = path.join(UPLOADS_DIR, path.basename(filename));
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ message: 'File not found' });
    return;
  }
  setInlineFileHeaders(res, filename);
  res.sendFile(filePath);
};

const streamHttpUrl = (targetUrl, res) => {
  const parsed = new URL(targetUrl);
  const client = parsed.protocol === 'https:' ? https : http;

  const proxyReq = client.get(targetUrl, (proxyRes) => {
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
    console.error('File proxy HTTP error:', err);
    res.status(502).json({ message: 'Failed to proxy file' });
  });
};

// @desc    Proxy remote/local/S3 files with auth (CAD viewers, private S3)
// @route   GET /api/files/proxy?url=<encoded-url>
// @access  Private
router.get('/proxy', protect, async (req, res) => {
  const { url } = req.query;
  if (!url || !isAllowedUrl(url)) {
    return res.status(400).json({ message: 'Invalid or disallowed file URL' });
  }

  try {
    const localFile = parseLocalUploadFilename(url);
    if (localFile) {
      return streamLocalUpload(localFile, res);
    }

    const s3Key = parseS3KeyFromUrl(url);
    if (s3Key && isS3Configured()) {
      try {
        await streamS3Object(s3Key, res);
        return;
      } catch (s3Error) {
        console.error('S3 GetObject failed, trying HTTP:', s3Key, s3Error.message);
      }
    }

    streamHttpUrl(url, res);
  } catch (error) {
    console.error('File proxy error:', error);
    res.status(502).json({ message: 'Failed to proxy file' });
  }
});

module.exports = router;
