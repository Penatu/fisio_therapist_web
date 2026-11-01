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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeScheduleDates(value) {
  const list = Array.isArray(value) ? value : [];
  const dates = list
    .map((item) => {
      if (typeof item === 'string') return item.slice(0, 10);
      if (item && typeof item === 'object') {
        const raw = item.date || item.scheduleDate || item.practiceDate;
        return typeof raw === 'string' ? raw.slice(0, 10) : '';
      }
      return '';
    })
    .filter((item) => DATE_PATTERN.test(item));

  return [...new Set(dates)].sort();
}

export function mapPracticeSchedule(result) {
  const data = result?.data ?? result;
  let dates = [];
  let notes = '';

  if (Array.isArray(data)) {
    dates = data;
  } else if (data && typeof data === 'object') {
    dates = data.dates || data.schedules || data.practiceSchedule || [];
    notes = typeof data.notes === 'string' ? data.notes : '';
  }

  return {
    dates: normalizeScheduleDates(dates),
    notes,
  };
}

async function requestSchedule(method, body) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(API_ENDPOINTS.PRACTICE_SCHEDULE, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || result?.success === false) {
      throw new Error(
        getErrorMessage(result, method === 'GET' ? 'Gagal memuat jadwal' : 'Gagal menyimpan jadwal'),
      );
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

const usePracticeSchedule = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getPracticeSchedule = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await requestSchedule('GET');
      return mapPracticeSchedule(result);
    } catch (err) {
      const message = err.message || 'Gagal memuat jadwal';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const savePracticeSchedule = useCallback(async ({ dates, notes = '' }) => {
    const payload = {
      dates: normalizeScheduleDates(dates),
      notes: typeof notes === 'string' ? notes : '',
    };
    const result = await requestSchedule('POST', payload);
    const mapped = mapPracticeSchedule(result);

    return {
      dates: mapped.dates.length ? mapped.dates : payload.dates,
      notes: mapped.notes || payload.notes,
    };
  }, []);

  return { getPracticeSchedule, savePracticeSchedule, loading, error };
};

export default usePracticeSchedule;
