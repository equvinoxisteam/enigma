import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { normalizeFileUrl, getFileName } from '../utils/fileUtils';
import FileViewerFrame from './FileViewerFrame';
import ViewerErrorState from './ViewerErrorState';

const PDFViewer = ({ fileUrl, fileName, height = '420px' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const normalizedUrl = normalizeFileUrl(fileUrl);
  const displayName = fileName || getFileName(fileUrl);
  const pdfSrc = `${normalizedUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

  return (
    <FileViewerFrame fileName={displayName} height={height}>
      <div className="relative w-full h-full bg-slate-50">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <div className="text-center">
              <Loader2 className="animate-spin text-[#4881F8] mx-auto mb-2" size={32} />
              <p className="text-sm text-gray-600">Loading document...</p>
            </div>
          </div>
        )}
        {error ? (
          <ViewerErrorState
            hint="Try re-uploading your PDF. Make sure the file is not password-protected and is under the upload size limit."
            onRetry={() => {
              setError(false);
              setLoading(true);
              setRetryKey((k) => k + 1);
            }}
          />
        ) : (
          <iframe
            key={retryKey}
            src={pdfSrc}
            title={displayName}
            className="absolute inset-0 w-full h-full border-0 block bg-white"
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

export default PDFViewer;
