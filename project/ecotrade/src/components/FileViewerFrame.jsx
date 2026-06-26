import React from 'react';

const FileViewerFrame = ({ fileName, height, children, className = '' }) => (
  <div className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
    <div
      className="relative flex-shrink-0 bg-slate-50"
      style={{ height, minHeight: height }}
    >
      {children}
    </div>
    {fileName && (
      <div className="border-t border-gray-100 bg-white px-4 py-2.5">
        <p className="truncate text-xs font-medium text-gray-600" title={fileName}>
          {fileName}
        </p>
      </div>
    )}
  </div>
);

export default FileViewerFrame;
