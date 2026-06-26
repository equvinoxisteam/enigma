import React, { useEffect, useState } from 'react';
import { Loader2, Layers, Download } from 'lucide-react';
import { getFileExtension, getFileName } from '../utils/fileUtils';
import { fetchAuthenticatedBlobUrl, revokeBlobUrl } from '../utils/fetchAuthenticatedBlob';
import FileViewerFrame from './FileViewerFrame';
import ViewerErrorState from './ViewerErrorState';

const TwoDViewer = ({ fileUrl, fileName, height = '420px' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [blobUrl, setBlobUrl] = useState('');
  const displayName = fileName || getFileName(fileUrl);
  const ext = getFileExtension(displayName).toUpperCase();

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    const load = async () => {
      setLoading(true);
      setError(false);
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
  }, [fileUrl]);

  if (error) {
    return (
      <FileViewerFrame fileName={displayName} height={height}>
        <ViewerErrorState
          fileName={displayName}
          uploaded
          hint="Your 2D drawing is saved. DXF/DWG preview is limited in-browser — you can continue with this file."
        />
      </FileViewerFrame>
    );
  }

  return (
    <FileViewerFrame fileName={displayName} height={height}>
      <div className="relative w-full h-full bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        {loading ? (
          <Loader2 className="animate-spin text-[#4881F8]" size={32} />
        ) : (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#4881F8]">
              <Layers size={32} />
            </div>
            <p className="text-sm font-semibold text-gray-800">{ext} drawing uploaded</p>
            <p className="mt-1 text-xs text-gray-500 max-w-sm">
              Preview is not available for {ext} in the browser. The file is attached to your RFQ.
            </p>
            {blobUrl && (
              <a
                href={blobUrl}
                download={displayName}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#01364a] hover:bg-gray-50"
              >
                <Download size={14} />
                Download file
              </a>
            )}
          </>
        )}
      </div>
    </FileViewerFrame>
  );
};

export default TwoDViewer;
