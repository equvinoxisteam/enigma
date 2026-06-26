import axiosInstance from '../api/axios';
import { getViewerFetchPath } from './fileUtils';

/**
 * Fetch a private/S3 file through the authenticated API proxy and return a blob URL.
 */
export const fetchAuthenticatedBlobUrl = async (fileUrl) => {
  if (!fileUrl) {
    throw new Error('NO_URL');
  }
  if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
    return fileUrl;
  }

  const fetchPath = getViewerFetchPath(fileUrl);
  const response = await axiosInstance.get(fetchPath, { responseType: 'blob' });

  if (!response.data || response.data.size === 0) {
    throw new Error('EMPTY_FILE');
  }

  return URL.createObjectURL(response.data);
};

export const revokeBlobUrl = (blobUrl) => {
  if (blobUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl);
  }
};
