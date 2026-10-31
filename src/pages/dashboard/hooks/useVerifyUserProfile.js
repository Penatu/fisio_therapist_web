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

export function buildOnboardingPayload(form) {
  const educationHistories = (form.educationHistory || [])
    .filter((item) => item.institution?.trim() || item.degree?.trim() || item.ijazah)
    .map(({ institution, degree, major, startYear, endYear, ijazah }) => ({
      institution: institution || '',
      degree: degree || '',
      major: major || '',
      startYear: startYear || '',
      endYear: endYear || '',
      ijazah: ijazah || '',
    }));

  const workHistories = (form.workHistory || [])
    .filter((item) => item.workplace?.trim() || item.position?.trim())
    .map(({ workplace, position, startYear, endYear, description }) => ({
      workplace: workplace || '',
      position: position || '',
      startYear: startYear || '',
      endYear: endYear || '',
      description: description || '',
    }));

  const trainingItems = (form.trainings || [])
    .filter((item) => item.name?.trim() || item.organizer?.trim() || item.certificate)
    .map(({ name, organizer, year, certificate }) => ({
      name: name || '',
      organizer: organizer || '',
      year: year || '',
      certificate: certificate || '',
    }));

  const hasAddress = Boolean(form.address?.trim());
  const hasBank = Boolean(form.bankName || form.bankAccountName || form.bankAccountNumber);
  const hasDocuments = Boolean(form.ktp || form.str || form.sip || form.ukomCertificate);

  return {
    address: hasAddress
      ? {
          address: form.address,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          practiceLocations: form.practiceLocations || [],
        }
      : null,
    bankAccountInformation: hasBank
      ? {
          bankName: form.bankName || '',
          accountName: form.bankAccountName || '',
          accountNumber: form.bankAccountNumber || '',
        }
      : null,
    documents: hasDocuments
      ? {
          ktp: form.ktp || '',
          str: form.str || '',
          sip: form.sip || '',
          ukomCertificate: form.ukomCertificate || '',
        }
      : null,
    educationHistories,
    fullName: form.fullName || '',
    phone: form.phone || '',
    profilePicture: form.profilePicture || '',
    trainings: trainingItems.length ? trainingItems : null,
    workHistories,
  };
}

const useVerifyUserProfile = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const verifyUserProfile = async (form) => {
    const token = localStorage.getItem('token');
    if (!token) {
      const message = 'Sesi login tidak ditemukan. Silakan login kembali.';
      setError(message);
      throw new Error(message);
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(API_ENDPOINTS.VERIFY_USER_PROFILE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildOnboardingPayload(form)),
        signal: controller.signal,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success === false) {
        throw new Error(getErrorMessage(result, 'Pengajuan verifikasi gagal'));
      }

      setSuccess(true);
      return result;
    } catch (err) {
      const message =
        err.name === 'AbortError'
          ? 'Permintaan ke server terlalu lama'
          : err.message === 'Failed to fetch'
            ? 'Tidak dapat terhubung ke server'
            : err.message || 'Pengajuan verifikasi gagal';
      setError(message);
      throw new Error(message);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return { verifyUserProfile, error, loading, success, setError };
};

export default useVerifyUserProfile;
