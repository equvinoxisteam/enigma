import React from 'react';

const FileViewerFrame = ({ fileName, height, children, className = '' }) => (
  <div className={`flex flex-col ${className}`}>
    <div className="relative overflow-hidden flex-shrink-0" style={{ height, minHeight: height }}>
      {children}
    </div>
    {fileName && (
      <p
        className="px-4 py-2.5 bg-gray-900/95 text-gray-300 text-xs font-medium truncate border-t border-white/5"
        title={fileName}
      >
        {fileName}
      </p>
    )}
  </div>
);

export default FileViewerFrame;
