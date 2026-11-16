import { useCallback, useEffect, useRef, useState } from 'react';
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

const STATUSES = ['unverified', 'pending', 'verified', 'rejected'];

function textValue(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (typeof value === 'object') {
    const nested = value.reason ?? value.message ?? value.note ?? value.description;
    if (typeof nested === 'string' || typeof nested === 'number') return String(nested).trim();
  }
  return '';
}

export function mapOnboardingStatus(result) {
  const data = result?.data && typeof result.data === 'object' ? result.data : {};
  const raw = String(data.verificationStatus || '')
    .trim()
    .toLowerCase();

  return {
    verificationStatus: STATUSES.includes(raw) ? raw : raw || 'unverified',
    isHavingActiveSchedule: data.isHavingActiveSchedule === true,
    rejectionReason: textValue(
      data.rejectionReason ||
        data.rejectReason ||
        data.rejectedReason ||
        data.reason ||
        data.rejectionNote ||
        data.rejectNote ||
        data.note,
    ),
  };
}

async function requestOnboardingStatus(signal) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
  }

  const response = await fetch(API_ENDPOINTS.GET_ONBOARDING_STATUS, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  const result = await response.json().catch(() => null);
  const status = Number(result?.status);
  const statusFailed = Number.isFinite(status) && status >= 400;

  if (!response.ok || result?.success === false || statusFailed) {
    throw new Error(getErrorMessage(result, 'Gagal memuat status verifikasi'));
  }

  return mapOnboardingStatus(result);
}

const useGetOnboardingStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const getOnboardingStatus = useCallback(async (signal) => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setLoading(true);
    setError('');

    try {
      const next = await requestOnboardingStatus(signal);
      if (signal?.aborted || requestId.current !== currentRequest) return null;
      setStatus(next);
      return next;
    } catch (err) {
      if (err?.name === 'AbortError' || signal?.aborted) return null;
      const message = err.message || 'Gagal memuat status verifikasi';
      if (requestId.current === currentRequest) {
        setStatus(null);
        setError(message);
      }
      return null;
    } finally {
      if (!signal?.aborted && requestId.current === currentRequest) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getOnboardingStatus(controller.signal);
    return () => controller.abort();
  }, [getOnboardingStatus]);

  return {
    status,
    loading,
    error,
    reload: () => getOnboardingStatus(),
    isVerified: status?.verificationStatus === 'verified',
  };
};

export default useGetOnboardingStatus;
