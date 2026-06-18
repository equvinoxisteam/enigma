import React from 'react';
import { FileText, Layers } from 'lucide-react';
import STLViewer from './STLViewer';
import StaircaseViewer from './StaircaseViewer';
import PDFViewer from './PDFViewer';
import ImageViewer from './ImageViewer';
import FileViewerFrame from './FileViewerFrame';
import { getWorkpieceFileUrl, getFileKind, getFileName } from '../utils/fileUtils';

const CADFileViewer = ({
  workpiece,
  fileUrl,
  fileName,
  height = '400px',
  backgroundColor = '#111827'
}) => {
  const url = fileUrl || getWorkpieceFileUrl(workpiece);
  const displayName = fileName || workpiece?.mainFile?.name || getFileName(url);

  if (!url) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center text-gray-500" style={{ height }}>
        <p>No file attached</p>
      </div>
    );
  }

  const kind = getFileKind(url, displayName);

  if (kind === 'stl') {
    return (
      <STLViewer
        fileUrl={url}
        fileName={displayName}
        height={height}
        backgroundColor={backgroundColor}
      />
    );
  }

  if (kind === 'step') {
    return (
      <StaircaseViewer
        fileUrl={url}
        fileName={displayName}
        height={height}
        backgroundColor={backgroundColor}
      />
    );
  }

  if (kind === 'pdf') {
    return <PDFViewer fileUrl={url} fileName={displayName} height={height} />;
  }

  if (kind === 'image') {
    return <ImageViewer fileUrl={url} fileName={displayName} height={height} />;
  }

  if (kind === '2d') {
    return (
      <FileViewerFrame fileName={displayName} height={height}>
        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-gray-300 p-6">
          <Layers size={48} className="text-[#4881F8] mb-3 opacity-80" />
          <p className="text-sm font-semibold text-center">2D CAD drawing attached</p>
          <p className="text-xs text-gray-500 mt-1 text-center">Preview not available for this format</p>
        </div>
      </FileViewerFrame>
    );
  }

  return (
    <FileViewerFrame fileName={displayName} height={height}>
      <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-gray-300 p-6">
        <FileText size={48} className="text-gray-500 mb-3" />
        <p className="text-sm font-semibold text-center">File attached</p>
        <p className="text-xs text-gray-500 mt-1 text-center">Preview not available for this format</p>
      </div>
    </FileViewerFrame>
  );
};

export default CADFileViewer;
