import { useCallback, useState } from 'react';
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

export function mapUploadedConsent(result, file) {
  const data = result?.data ?? result;
  const fallbackName = file?.name || '';

  if (typeof data === 'string' && data) {
    return { name: fallbackName, url: data };
  }

  if (data && typeof data === 'object') {
    const consent = data.informedConsent && typeof data.informedConsent === 'object' ? data.informedConsent : data;
    const url = consent.fullUrl || consent.url || consent.fileUrl || data.fullUrl || data.url || '';
    const name = consent.name || consent.fileName || data.name || data.fileName || fallbackName;
    if (url) return { name, url };
  }

  return null;
}

async function requestUploadConsent(file) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
  }

  const body = new FormData();
  body.append('file', file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(API_ENDPOINTS.UPLOAD_REPORT_CONSENT, {
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
      throw new Error(getErrorMessage(result, 'Gagal mengunggah inform consent'));
    }

    const consent = mapUploadedConsent(result, file);
    if (!consent?.url) {
      throw new Error('URL inform consent tidak ditemukan');
    }

    return consent;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Permintaan ke server terlalu lama');
    if (err.message === 'Failed to fetch') throw new Error('Tidak dapat terhubung ke server');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

const useUploadReportConsent = () => {
  const [uploading, setUploading] = useState(false);

  const uploadConsent = useCallback(async (file) => {
    if (!file) return null;

    setUploading(true);
    try {
      return await requestUploadConsent(file);
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadConsent, uploading };
};

export default useUploadReportConsent;
