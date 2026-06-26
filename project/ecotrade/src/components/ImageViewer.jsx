import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getFileName } from '../utils/fileUtils';
import { fetchAuthenticatedBlobUrl, revokeBlobUrl } from '../utils/fetchAuthenticatedBlob';
import FileViewerFrame from './FileViewerFrame';
import ViewerErrorState from './ViewerErrorState';

const ImageViewer = ({ fileUrl, fileName, height = '420px' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [blobUrl, setBlobUrl] = useState('');
  const displayName = fileName || getFileName(fileUrl);

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    const load = async () => {
      setLoading(true);
      setError(false);
      setBlobUrl('');

      try {
        objectUrl = await fetchAuthenticatedBlobUrl(fileUrl);
        if (!active) return;
        setBlobUrl(objectUrl);
        setLoading(false);
      } catch {
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
      revokeBlobUrl(objectUrl);
    };
  }, [fileUrl, retryKey]);

  return (
    <FileViewerFrame fileName={displayName} height={height}>
      <div className="relative w-full h-full bg-slate-50 flex items-center justify-center p-4">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <Loader2 className="animate-spin text-[#4881F8]" size={32} />
          </div>
        )}
        {error ? (
          <ViewerErrorState
            fileName={displayName}
            uploaded
            hint="Your image is saved. Try re-uploading PNG or JPG under 150 MB."
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : (
          blobUrl && (
            <img
              key={retryKey}
              src={blobUrl}
              alt={displayName}
              className="max-w-full max-h-full object-contain"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          )
        )}
      </div>
    </FileViewerFrame>
  );
};

export default ImageViewer;
