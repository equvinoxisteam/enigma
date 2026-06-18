import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { normalizeFileUrl, getFileName } from '../utils/fileUtils';
import FileViewerFrame from './FileViewerFrame';

const PDFViewer = ({ fileUrl, fileName, height = '400px' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const normalizedUrl = normalizeFileUrl(fileUrl);
  const displayName = fileName || getFileName(fileUrl);
  const pdfSrc = `${normalizedUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;

  return (
    <FileViewerFrame fileName={displayName} height={height}>
      <div className="relative w-full h-full bg-gray-100">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <Loader2 className="animate-spin text-[#4881F8] mx-auto mb-2" size={32} />
              <p className="text-sm text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center p-6">
              <AlertCircle className="text-amber-500 mx-auto mb-2" size={32} />
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
        ) : (
          <iframe
            src={pdfSrc}
            title={displayName}
            className="w-full h-full border-0 block"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Unable to display PDF preview.');
            }}
          />
        )}
      </div>
    </FileViewerFrame>
  );
};

export default PDFViewer;
