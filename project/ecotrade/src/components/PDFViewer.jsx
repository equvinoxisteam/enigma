import React, { useState } from 'react';
import { Loader2, AlertCircle, Download, FileText } from 'lucide-react';
import { normalizeFileUrl, getFileName } from '../utils/fileUtils';

const PDFViewer = ({ fileUrl, height = '500px' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const normalizedUrl = normalizeFileUrl(fileUrl);
  const fileName = getFileName(fileUrl);

  return (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <Loader2 className="animate-spin text-[#4881F8] mx-auto mb-2" size={32} />
            <p className="text-sm text-gray-600">Loading PDF...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center p-6">
            <AlertCircle className="text-amber-500 mx-auto mb-2" size={32} />
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <a
              href={normalizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#4881F8] text-white rounded-lg text-sm font-medium hover:bg-[#3b6fe0]"
            >
              <Download size={16} />
              Download PDF
            </a>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200">
        <FileText size={16} className="text-red-500" />
        <span className="text-sm font-medium text-gray-700 truncate">{fileName}</span>
        <a
          href={normalizedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-[#4881F8] hover:underline flex items-center gap-1"
        >
          <Download size={12} /> Open
        </a>
      </div>
      <iframe
        src={`${normalizedUrl}#toolbar=1`}
        title={fileName}
        className="w-full border-0"
        style={{ height: `calc(${height} - 40px)` }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError('Unable to display PDF inline. Use the download link.');
        }}
      />
    </div>
  );
};

export default PDFViewer;
