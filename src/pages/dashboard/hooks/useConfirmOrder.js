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

async function requestConfirmOrder(code, note) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(API_ENDPOINTS.CONFIRM_ORDER.replace(':code', encodeURIComponent(code)), {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ note }),
      signal: controller.signal,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || result?.success === false) {
      throw new Error(getErrorMessage(result, 'Gagal mengonfirmasi orderan'));
    }

    return result;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Permintaan ke server terlalu lama');
    if (err.message === 'Failed to fetch') throw new Error('Tidak dapat terhubung ke server');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

const useConfirmOrder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const confirmOrder = useCallback(async (code, note) => {
    const trimmedNote = String(note || '').trim();
    if (!code) {
      const message = 'Kode orderan tidak ditemukan';
      setError(message);
      throw new Error(message);
    }
    if (!trimmedNote) {
      const message = 'Isi catatan konfirmasi';
      setError(message);
      throw new Error(message);
    }

    setLoading(true);
    setError('');

    try {
      return await requestConfirmOrder(code, trimmedNote);
    } catch (err) {
      const message = err.message || 'Gagal mengonfirmasi orderan';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(''), []);

  return { confirmOrder, loading, error, clearError };
};

export default useConfirmOrder;
