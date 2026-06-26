import React from 'react';
import { RefreshCw, FileWarning, CheckCircle2 } from 'lucide-react';

const ViewerErrorState = ({
  title = "We couldn't preview this file",
  hint = 'Try re-uploading the file. STL files work best for 3D preview; STEP and PDF should be valid and under 150 MB.',
  fileName,
  uploaded = false,
  onRetry,
  compact = false
}) => (
  <div className={`absolute inset-0 flex items-center justify-center bg-slate-50 z-20 ${compact ? 'p-4' : 'p-6'}`}>
    <div className="text-center max-w-md">
      {uploaded && fileName ? (
        <div className="mx-auto mb-3 flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-emerald-700 text-xs font-semibold">
          <CheckCircle2 size={14} />
          Uploaded: {fileName}
        </div>
      ) : (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <FileWarning size={24} />
        </div>
      )}
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">{hint}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#4881F8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3b6fe0] transition-colors"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </div>
  </div>
);

export default ViewerErrorState;
