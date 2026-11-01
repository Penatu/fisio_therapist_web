import { useState } from 'react';
import { API_ENDPOINTS } from '@/lib/endpoints';

function getErrorMessage(result, fallback) {
  if (!result) return fallback;
  if (typeof result === 'string') return result;
  if (typeof result.message === 'string' && result.message) return result.message;
  if (typeof result.errorServer === 'string' && result.errorServer) return result.errorServer;
  if (typeof result.messageTitle === 'string' && result.messageTitle) return result.messageTitle;
  if (typeof result.error === 'string' && result.error) return result.error;

  if (result.errors && typeof result.errors === 'object') {
    const first = Object.values(result.errors).flat().find(Boolean);
    if (typeof first === 'string') return first;
  }

  return fallback;
}

function fileUrlFromResponse(result) {
  const data = result?.data;
  if (typeof data === 'string' && data) return data;
  if (data && typeof data === 'object') {
    return data.fullUrl || data.url || '';
  }
  if (typeof result?.url === 'string') return result.url;
  return '';
}

const useUploadFile = () => {
  const [uploadingCount, setUploadingCount] = useState(0);

  const uploadFile = async (file) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
    }

    const body = new FormData();
    body.append('file', file);

    setUploadingCount((count) => count + 1);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(API_ENDPOINTS.UPLOAD_FILE, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body,
        signal: controller.signal,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success === false) {
        throw new Error(getErrorMessage(result, 'Gagal mengunggah file'));
      }

      const url = fileUrlFromResponse(result);
      if (!url) {
        throw new Error('URL file tidak ditemukan');
      }

      return url;
    } catch (err) {
      const message =
        err.name === 'AbortError'
          ? 'Permintaan ke server terlalu lama'
          : err.message === 'Failed to fetch'
            ? 'Tidak dapat terhubung ke server'
            : err.message || 'Gagal mengunggah file';
      throw new Error(message);
    } finally {
      clearTimeout(timeoutId);
      setUploadingCount((count) => count - 1);
    }
  };

  return { uploadFile, uploading: uploadingCount > 0 };
};

export default useUploadFile;
