import { useState } from 'react';
import { API_ENDPOINTS } from '@/lib/endpoints';

function getErrorMessage(result, fallback) {
  if (!result) return fallback;
  if (typeof result === 'string') return result;
  if (typeof result.message === 'string' && result.message) return result.message;
  if (typeof result.error === 'string' && result.error) return result.error;

  if (result.errors && typeof result.errors === 'object') {
    const first = Object.values(result.errors).flat().find(Boolean);
    if (typeof first === 'string') return first;
  }

  return fallback;
}

const useRegister = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const register = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
        signal: controller.signal,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(result, 'Registrasi gagal'));
      }

      setSuccess(true);
      return result;
    } catch (err) {
      const message =
        err.name === 'AbortError'
          ? 'Permintaan ke server terlalu lama'
          : err.message === 'Failed to fetch'
            ? 'Tidak dapat terhubung ke server'
            : err.message || 'Registrasi gagal';
      setError(message);
      throw err;
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return { register, error, loading, success, setError };
};

export default useRegister;
