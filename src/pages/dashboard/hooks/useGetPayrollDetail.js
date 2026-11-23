import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from '@/lib/endpoints';
import { mapPayrollDetail } from './useGetPayrollList';

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

async function requestPayrollDetail(payrollCode, signal) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
  if (!payrollCode) throw new Error('Kode payroll tidak ditemukan.');

  const response = await fetch(
    API_ENDPOINTS.GET_DETAIL_PAYROLL.replace(':payrollCode', encodeURIComponent(payrollCode)),
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    },
  );

  const result = await response.json().catch(() => null);
  const status = Number(result?.status);
  const statusFailed = Number.isFinite(status) && status >= 400;

  if (!response.ok || result?.success === false || statusFailed) {
    throw new Error(getErrorMessage(result, 'Gagal memuat detail pembayaran'));
  }

  return mapPayrollDetail(result, payrollCode);
}

const useGetPayrollDetail = (payrollCode) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(Boolean(payrollCode));
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const getPayrollDetail = useCallback(
    async (signal) => {
      const currentRequest = requestId.current + 1;
      requestId.current = currentRequest;
      setLoading(true);
      setError('');

      try {
        const next = await requestPayrollDetail(payrollCode, signal);
        if (signal?.aborted || requestId.current !== currentRequest) return null;
        setPayment(next);
        return next;
      } catch (err) {
        if (err?.name === 'AbortError' || signal?.aborted) return null;
        const message = err.message || 'Gagal memuat detail pembayaran';
        if (requestId.current === currentRequest) {
          setPayment(null);
          setError(message);
        }
        return null;
      } finally {
        if (!signal?.aborted && requestId.current === currentRequest) setLoading(false);
      }
    },
    [payrollCode],
  );

  useEffect(() => {
    if (!payrollCode) {
      setPayment(null);
      setLoading(false);
      setError('');
      return undefined;
    }

    const controller = new AbortController();
    getPayrollDetail(controller.signal);
    return () => controller.abort();
  }, [getPayrollDetail, payrollCode]);

  return { payment, loading, error, reload: () => getPayrollDetail() };
};

export default useGetPayrollDetail;
