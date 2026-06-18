import React from 'react';
import { FileText, Paperclip } from 'lucide-react';
import { getFileName } from '../utils/fileUtils';

export const DetailField = ({ label, value, children }) => (
  <div>
    <label className="text-sm font-medium text-gray-500 block mb-1">{label}</label>
    {children || <p className="text-gray-900 break-words">{value || '—'}</p>}
  </div>
);

export const FileChip = ({ url, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium max-w-full ${className}`}
    title={getFileName(url)}
  >
    <FileText size={12} className="flex-shrink-0 text-[#4881F8]" />
    <span className="truncate">{getFileName(url)}</span>
  </span>
);

export const RFQFilesList = ({ workpieces = [], ndaFile, compact = false }) => {
  const mainFiles = workpieces.map((wp) => wp.mainFile).filter(Boolean);
  const extraFiles = workpieces.flatMap((wp) => wp.extraFiles || []).filter(Boolean);
  const allFiles = [...mainFiles, ...extraFiles, ...(ndaFile ? [ndaFile] : [])];

  if (allFiles.length === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
        <Paperclip size={14} className="flex-shrink-0" />
        <span>{allFiles.length} file{allFiles.length !== 1 ? 's' : ''}:</span>
        {allFiles.slice(0, 3).map((url, i) => (
          <FileChip key={i} url={url} />
        ))}
        {allFiles.length > 3 && (
          <span className="text-xs text-gray-400">+{allFiles.length - 3} more</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mainFiles.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Technical Models</p>
          <div className="flex flex-wrap gap-2">
            {mainFiles.map((url, i) => <FileChip key={i} url={url} />)}
          </div>
        </div>
      )}
      {extraFiles.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Extra Files</p>
          <div className="flex flex-wrap gap-2">
            {extraFiles.map((url, i) => <FileChip key={i} url={url} />)}
          </div>
        </div>
      )}
      {ndaFile && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">NDA Document</p>
          <FileChip url={ndaFile} />
        </div>
      )}
    </div>
  );
};

export const WorkpieceSummary = ({ workpiece, index }) => {
  if (!workpiece) return null;
  const dims = workpiece.dimensions || {};
  return (
    <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50 text-sm space-y-1">
      <p className="font-semibold text-gray-800">Workpiece {index + 1}{workpiece.partType ? ` · ${workpiece.partType}` : ''}</p>
      <p className="text-gray-600">
        {workpiece.technology?.replace(/_/g, ' ')} · {workpiece.material} · Qty {workpiece.quantity}
      </p>
      {(dims.length || dims.width || dims.height) ? (
        <p className="text-gray-500 text-xs">
          {dims.length || 0} × {dims.width || 0} × {dims.height || 0} mm
          {dims.diameter ? ` · Ø ${dims.diameter} mm` : ''}
        </p>
      ) : null}
      {workpiece.mainFile && <FileChip url={workpiece.mainFile} className="mt-1" />}
    </div>
  );
};
