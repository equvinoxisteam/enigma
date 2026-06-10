import React from 'react';
import { Box, Download, FileText } from 'lucide-react';
import STLViewer from './STLViewer';
import STEPViewer from './STEPViewer';
import PDFViewer from './PDFViewer';
import { getWorkpieceFileUrl, getFileKind, normalizeFileUrl, getFileName } from '../utils/fileUtils';

const CADFileViewer = ({ workpiece, fileUrl, height = '400px', backgroundColor = '#f9fafb' }) => {
  const url = fileUrl || getWorkpieceFileUrl(workpiece);

  if (!url) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center text-gray-500" style={{ height }}>
        <p>No CAD file attached</p>
      </div>
    );
  }

  const kind = getFileKind(url);
  const normalizedUrl = normalizeFileUrl(url);
  const fileName = getFileName(url);

  if (kind === 'stl') {
    return <STLViewer fileUrl={url} height={height} backgroundColor={backgroundColor} />;
  }

  if (kind === 'step') {
    return <STEPViewer fileUrl={url} height={height} backgroundColor={backgroundColor} />;
  }

  if (kind === 'pdf') {
    return <PDFViewer fileUrl={url} height={height} />;
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center" style={{ minHeight: height }}>
      <Box size={48} className="mx-auto mb-4 text-gray-400" />
      <p className="font-semibold text-gray-700 mb-1">{fileName}</p>
      <p className="text-sm text-gray-500 mb-4">CAD file attached — preview not available for this format</p>
      <a
        href={normalizedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#4881F8] text-white rounded-lg text-sm font-medium hover:bg-[#3b6fe0]"
      >
        <Download size={16} />
        Download File
      </a>
    </div>
  );
};

export default CADFileViewer;
