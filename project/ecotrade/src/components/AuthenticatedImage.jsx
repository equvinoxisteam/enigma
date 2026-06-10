import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { getViewerFetchPath } from '../utils/fileUtils';

/**
 * Loads images that may be on private S3 or need auth proxy (axios + blob URL).
 */
const AuthenticatedImage = ({ src, alt, className, fallback }) => {
  const [blobUrl, setBlobUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;

    const load = async () => {
      if (!src) {
        setBlobUrl('');
        setFailed(false);
        return;
      }

      if (src.startsWith('blob:') || src.startsWith('data:')) {
        setBlobUrl(src);
        setFailed(false);
        return;
      }

      const needsAuthFetch =
        src.includes('amazonaws.com') ||
        src.includes('/api/files/proxy');

      if (!needsAuthFetch) {
        setBlobUrl(src);
        setFailed(false);
        return;
      }

      try {
        const fetchPath = getViewerFetchPath(src);
        const response = await axiosInstance.get(fetchPath, { responseType: 'blob' });
        objectUrl = URL.createObjectURL(response.data);
        if (!cancelled) {
          setBlobUrl(objectUrl);
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setBlobUrl('');
          setFailed(true);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!src || failed) {
    return fallback || null;
  }

  if (!blobUrl) {
    return fallback || null;
  }

  return <img src={blobUrl} alt={alt || ''} className={className} />;
};

export default AuthenticatedImage;
