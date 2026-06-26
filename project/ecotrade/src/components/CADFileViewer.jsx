import React from 'react';
import { FileText } from 'lucide-react';
import STLViewer from './STLViewer';
import OcctStepViewer from './OcctStepViewer';
import PDFViewer from './PDFViewer';
import ImageViewer from './ImageViewer';
import TwoDViewer from './TwoDViewer';
import FileViewerFrame from './FileViewerFrame';
import { getWorkpieceFileUrl, getFileKind, getFileName } from '../utils/fileUtils';

const CADFileViewer = ({
  workpiece,
  fileUrl,
  fileName,
  height = '420px'
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
      />
    );
  }

  if (kind === 'step') {
    return (
      <OcctStepViewer
        fileUrl={url}
        fileName={displayName}
        height={height}
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
    return <TwoDViewer fileUrl={url} fileName={displayName} height={height} />;
  }

  return (
    <FileViewerFrame fileName={displayName} height={height}>
      <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-gray-600 p-6">
        <FileText size={48} className="text-gray-400 mb-3" />
        <p className="text-sm font-semibold text-center">File attached</p>
        <p className="text-xs text-gray-500 mt-1 text-center">Supported: STL, STEP, STP, PDF, DXF, PNG, DWG (max 150 MB)</p>
      </div>
    </FileViewerFrame>
  );
};

export default CADFileViewer;
