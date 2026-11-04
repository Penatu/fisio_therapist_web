import { useCallback, useState } from 'react';
import { API_ENDPOINTS } from '@/lib/endpoints';
import { mapOrder } from './useGetOrderList';

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

export function mapOrderDetail(result, code) {
  const data = result?.data ?? result;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  const item = data.booking || data.order || data.detail || data;
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;

  const mapped = mapOrder(item, 0);
  return {
    ...mapped,
    id: mapped.id && mapped.id !== 'order-0' ? mapped.id : code,
  };
}

async function requestOrderDetail(code) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(API_ENDPOINTS.GET_ORDER_DETAIL.replace(':code', encodeURIComponent(code)), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || result?.success === false) {
      throw new Error(getErrorMessage(result, 'Gagal memuat detail orderan'));
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

const useGetOrderDetail = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getOrderDetail = useCallback(async (code) => {
    if (!code) {
      const message = 'Kode orderan tidak ditemukan';
      setError(message);
      setOrder(null);
      throw new Error(message);
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const result = await requestOrderDetail(code);
      const mapped = mapOrderDetail(result, code);
      if (!mapped) throw new Error('Detail orderan tidak ditemukan');
      setOrder(mapped);
      return mapped;
    } catch (err) {
      const message = err.message || 'Gagal memuat detail orderan';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { order, loading, error, getOrderDetail };
};

export default useGetOrderDetail;
