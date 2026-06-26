import React, { useEffect, useState } from 'react';
import { fetchAuthenticatedBlobUrl, revokeBlobUrl } from '../utils/fetchAuthenticatedBlob';

/**
 * Loads images that may be on private S3 or need auth proxy (axios + blob URL).
 */
const AuthenticatedImage = ({ src, alt, className, fallback }) => {
  const [blobUrl, setBlobUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

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

      try {
        objectUrl = await fetchAuthenticatedBlobUrl(src);
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
      revokeBlobUrl(objectUrl);
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
