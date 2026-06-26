import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getFileName } from '../utils/fileUtils';
import { fetchAuthenticatedBlobUrl, revokeBlobUrl } from '../utils/fetchAuthenticatedBlob';
import FileViewerFrame from './FileViewerFrame';
import ViewerErrorState from './ViewerErrorState';

const PDFViewer = ({ fileUrl, fileName, height = '420px' }) => {
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

  const pdfSrc = blobUrl ? `${blobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH` : '';

  return (
    <FileViewerFrame fileName={displayName} height={height}>
      <div className="relative w-full h-full bg-slate-50">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <div className="text-center">
              <Loader2 className="animate-spin text-[#4881F8] mx-auto mb-2" size={32} />
              <p className="text-sm text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}
        {error ? (
          <ViewerErrorState
            fileName={displayName}
            uploaded
            hint="Your PDF is saved. If preview fails, try re-uploading or use a standard PDF under 150 MB."
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : (
          blobUrl && (
            <embed
              key={retryKey}
              src={pdfSrc}
              type="application/pdf"
              title={displayName}
              className="absolute inset-0 w-full h-full border-0 block bg-white"
            />
          )
        )}
      </div>
    </FileViewerFrame>
  );
};

export default PDFViewer;
