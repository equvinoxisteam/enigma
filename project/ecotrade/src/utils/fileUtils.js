/**
 * Resolve workpiece file URL from either mainFile (DB) or mainFileUrl (form state).
 */
export const getWorkpieceFileUrl = (workpiece) => {
  if (!workpiece) return '';
  return workpiece.mainFile || workpiece.mainFileUrl || '';
};

/**
 * Extract lowercase file extension from a URL or filename.
 */
export const getFileExtension = (url) => {
  if (!url) return '';
  const clean = url.split('?')[0].split('#')[0];
  const parts = clean.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const STL_EXTS = ['stl'];
const STEP_EXTS = ['step', 'stp'];
const PDF_EXTS = ['pdf'];
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];
const TWO_D_EXTS = ['dxf', 'dwg'];

export const SUPPORTED_TECHNICAL_EXTENSIONS = ['stl', 'step', 'stp', 'pdf', 'dxf', 'png', 'jpg', 'jpeg', 'dwg', 'svg'];
export const SUPPORTED_TECHNICAL_LABEL = 'STL · STEP · STP · PDF · DXF · PNG · DWG (max 150 MB)';

export const getFileKind = (url, fileName = '') => {
  const ext = getFileExtension(url) || getFileExtension(fileName);
  if (STL_EXTS.includes(ext)) return 'stl';
  if (STEP_EXTS.includes(ext)) return 'step';
  if (PDF_EXTS.includes(ext)) return 'pdf';
  if (IMAGE_EXTS.includes(ext)) return 'image';
  if (TWO_D_EXTS.includes(ext)) return '2d';
  return 'other';
};

const getBackendBase = () =>
  (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005').replace(/\/$/, '');

/**
 * API-relative path for authenticated file fetches (axios).
 */
export const getViewerFetchPath = (fileUrl) => {
  if (!fileUrl) return '';
  const backendBase = getBackendBase();

  try {
    const parsed = new URL(fileUrl, window.location.origin);

    if ((parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && parsed.port === '5000') {
      return parsed.pathname;
    }

    if (parsed.hostname.includes('cloudfront.net') || parsed.hostname.includes('amazonaws.com')) {
      return `/api/files/proxy?url=${encodeURIComponent(parsed.toString())}`;
    }

    if (parsed.pathname.startsWith('/uploads/')) {
      return `/api/files/proxy?url=${encodeURIComponent(parsed.toString())}`;
    }

    if (parsed.origin === backendBase) {
      return `/api/files/proxy?url=${encodeURIComponent(parsed.toString())}`;
    }

    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}`;
    }

    return `/api/files/proxy?url=${encodeURIComponent(parsed.toString())}`;
  } catch {
    return fileUrl.startsWith('/') ? fileUrl : `/api/files/proxy?url=${encodeURIComponent(fileUrl)}`;
  }
};

/**
 * Full URL for download links and iframe src.
 */
export const normalizeFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  const fetchPath = getViewerFetchPath(fileUrl);
  if (fetchPath.startsWith('http')) return fetchPath;
  return `${getBackendBase()}${fetchPath.startsWith('/') ? fetchPath : `/${fetchPath}`}`;
};

export const getFileName = (url) => {
  if (!url) return 'file';
  try {
    const parsed = new URL(url, window.location.origin);
    return decodeURIComponent(parsed.pathname.split('/').pop() || 'file');
  } catch {
    return url.split('/').pop() || 'file';
  }
};
