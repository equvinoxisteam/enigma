import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { normalizeFileUrl } from '../utils/fileUtils';
import FileViewerFrame from './FileViewerFrame';
import ViewerErrorState from './ViewerErrorState';

const ImageViewer = ({ fileUrl, fileName, height = '420px' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const src = normalizeFileUrl(fileUrl);

  return (
    <FileViewerFrame fileName={fileName} height={height}>
      <div className="relative w-full h-full bg-slate-50 flex items-center justify-center p-4">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <Loader2 className="animate-spin text-[#4881F8]" size={32} />
          </div>
        )}
        {error ? (
          <ViewerErrorState
            hint="Try re-uploading your drawing image (PNG, JPG, or PDF export). Make sure the file is clear and under the size limit."
            onRetry={() => {
              setError(false);
              setLoading(true);
              setRetryKey((k) => k + 1);
            }}
          />
        ) : (
          <img
            key={retryKey}
            src={src}
            alt={fileName || 'Drawing preview'}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </div>
    </FileViewerFrame>
  );
};

export default ImageViewer;
