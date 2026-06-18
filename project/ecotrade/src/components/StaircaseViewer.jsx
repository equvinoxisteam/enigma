import React, { useId, useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { getViewerFetchPath, getFileName } from '../utils/fileUtils';
import { loadStaircaseModule, isStaircaseAvailable } from '../utils/staircaseLoader';
import axiosInstance from '../api/axios';
import FileViewerFrame from './FileViewerFrame';
import OcctStepViewer from './OcctStepViewer';

const StaircaseViewer = ({ fileUrl, fileName, height = '400px', backgroundColor = '#111827' }) => {
  const reactId = useId();
  const containerId = `staircase-${reactId.replace(/:/g, '')}`;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useFallback, setUseFallback] = useState(false);

  const displayName = fileName || getFileName(fileUrl);

  useEffect(() => {
    if (!fileUrl) return;

    let cancelled = false;
    let viewerInstance = null;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        setUseFallback(false);

        const staircaseReady = await isStaircaseAvailable();
        if (!staircaseReady) {
          throw new Error('Staircase viewer assets are not installed');
        }

        await loadStaircaseModule();
        if (cancelled) return;

        const fetchPath = getViewerFetchPath(fileUrl);
        const response = await axiosInstance.get(fetchPath, { responseType: 'text' });
        const stepContent = response.data;

        if (!stepContent || typeof stepContent !== 'string') {
          throw new Error('Empty STEP file');
        }

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Staircase viewer timeout')), 45000);

          window.Staircase.queue = [{
            containerId,
            callback: (viewer) => {
              clearTimeout(timeout);
              viewerInstance = viewer;
              try {
                viewer.initEmptyScene();
                const result = viewer.loadStepFile(stepContent);
                if (result !== 0 && result !== undefined) {
                  reject(new Error('Staircase failed to parse STEP file'));
                  return;
                }
                viewer.fitAllObjects();
                if (!cancelled) {
                  setLoading(false);
                  resolve();
                }
              } catch (e) {
                reject(e);
              }
            }
          }];
        });
      } catch (err) {
        console.warn('Staircase viewer unavailable, using OCCT fallback:', err);
        if (!cancelled) {
          setUseFallback(true);
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      if (viewerInstance && window.Staircase?._viewers?.has(containerId)) {
        try {
          window.Staircase._viewers.delete(containerId);
        } catch {
          /* ignore cleanup errors */
        }
      }
    };
  }, [fileUrl, containerId]);

  if (useFallback) {
    return (
      <OcctStepViewer
        fileUrl={fileUrl}
        fileName={displayName}
        height={height}
        backgroundColor={backgroundColor}
      />
    );
  }

  return (
    <FileViewerFrame fileName={displayName} height={height}>
      <div
        id={containerId}
        className="w-full h-full min-h-[200px] bg-[#111827]"
        style={{ backgroundColor }}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-20">
          <div className="text-center">
            <Loader2 className="animate-spin text-[#4881F8] mx-auto mb-2" size={32} />
            <p className="text-sm text-gray-200">Loading STEP model...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/95 z-20">
          <div className="text-center p-4">
            <AlertCircle className="text-red-400 mx-auto mb-2" size={32} />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}
    </FileViewerFrame>
  );
};

export default StaircaseViewer;
