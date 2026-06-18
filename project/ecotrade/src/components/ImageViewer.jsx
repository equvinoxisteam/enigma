import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { normalizeFileUrl } from '../utils/fileUtils';
import FileViewerFrame from './FileViewerFrame';

const ImageViewer = ({ fileUrl, fileName, height = '400px' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const src = normalizeFileUrl(fileUrl);

  return (
    <FileViewerFrame fileName={fileName} height={height}>
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <Loader2 className="animate-spin text-[#4881F8]" size={32} />
          </div>
        )}
        {error ? (
          <div className="text-center p-4">
            <AlertCircle className="text-amber-400 mx-auto mb-2" size={28} />
            <p className="text-sm text-gray-300">{error}</p>
          </div>
        ) : (
          <img
            src={src}
            alt={fileName || 'Drawing preview'}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Unable to preview this image.');
            }}
          />
        )}
      </div>
    </FileViewerFrame>
  );
};

export default ImageViewer;
