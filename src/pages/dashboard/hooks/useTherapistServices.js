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

function textValue(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (typeof value === 'object') {
    return textValue(value.name || value.label || value.title);
  }
  return '';
}

function formatPrice(service) {
  if (typeof service?.priceFormatted === 'string' && service.priceFormatted.trim()) {
    return service.priceFormatted.trim();
  }
  const price = Number(service?.price);
  if (!Number.isFinite(price) || price <= 0) return '';
  return `Rp ${price.toLocaleString('id-ID')}`;
}

function formatDuration(service) {
  if (typeof service?.durationFormatted === 'string' && service.durationFormatted.trim()) {
    return service.durationFormatted.trim();
  }
  const duration = Number(service?.duration);
  if (!Number.isFinite(duration) || duration <= 0) return '';
  return `${duration} menit`;
}

const INACTIVE_STATUSES = new Set(['inactive', 'disabled', 'nonactive', 'non-active']);

function readFlag(service) {
  const flag = service?.flag;
  if (typeof flag === 'boolean') return flag;
  if (flag === 1 || flag === '1' || flag === 'true') return true;
  if (flag === 0 || flag === '0' || flag === 'false') return false;
  return null;
}

function isServiceRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && (value.serviceId != null || value.id != null);
}

export function mapService(service) {
  if (!service || typeof service !== 'object') return null;
  const id = service.id ?? service.serviceId;
  if (id == null || id === '') return null;

  return {
    id,
    name: textValue(service.name || service.serviceName) || 'Layanan',
    category: textValue(service.category || service.categoryName),
    description: textValue(service.description),
    durationLabel: formatDuration(service),
    priceLabel: formatPrice(service),
    status: textValue(service.status).toLowerCase(),
    flag: readFlag(service),
  };
}

function extractList(result) {
  const data = result?.data ?? result;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.services)) return data.services;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.list)) return data.list;
  if (isServiceRecord(data)) return [data];
  if (isServiceRecord(data?.service)) return [data.service];
  return [];
}

export function mapActiveService(result) {
  const data = result?.data ?? result;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    const list = extractList(result);
    const chosen = list.find((item) => readFlag(item) === true) || list.find((item) => readFlag(item) === false);
    const mapped = mapService(chosen);
    return mapped ? { id: mapped.id, name: mapped.name, flag: mapped.flag } : null;
  }

  const nested = data.service || data.activeService || data.selectedService;
  const source = nested && typeof nested === 'object' && !Array.isArray(nested) ? nested : data;
  const id = source.serviceId ?? source.activeServiceId ?? source.id;
  if (id == null || id === '') return null;

  return {
    id,
    name: textValue(source.name || source.serviceName || data.name || data.serviceName),
    flag: readFlag(source),
  };
}

function currentFromServices(services) {
  return services.find((service) => service.flag === true) || services.find((service) => service.flag === false) || null;
}

function nextPage(result, currentPage, batchLength) {
  const pagination = result?.data?.pagination;
  const explicitNext = Number(pagination?.nextPage);
  if (Number.isFinite(explicitNext) && explicitNext > currentPage) return explicitNext;

  const current = Number(pagination?.currentPage) || currentPage;
  const total = Number(pagination?.total);
  const perPage = Number(pagination?.perPage) || batchLength;
  if (Number.isFinite(total) && perPage > 0 && current * perPage < total) return current + 1;
  return 0;
}

async function request(url, method, body) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, {
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
    return { response, result };
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Permintaan ke server terlalu lama');
    if (err.message === 'Failed to fetch') throw new Error('Tidak dapat terhubung ke server');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchServiceCatalog() {
  const items = [];
  let page = 1;

  while (page > 0 && page <= 5) {
    const url = `${API_ENDPOINTS.GET_SERVICE_LIST}?page=${page}&perPage=100`;
    const { response, result } = await request(url, 'GET');
    const status = Number(result?.status);
    const statusFailed = Number.isFinite(status) && status >= 400;

    if (!response.ok || result?.success === false || statusFailed) {
      throw new Error(getErrorMessage(result, 'Gagal memuat daftar layanan'));
    }

    const batch = extractList(result);
    items.push(...batch);
    page = batch.length === 0 ? 0 : nextPage(result, page, batch.length);
  }

  const seen = new Set();
  return items
    .map(mapService)
    .filter((service) => {
      if (!service || INACTIVE_STATUSES.has(service.status) || seen.has(String(service.id))) return false;
      seen.add(String(service.id));
      return true;
    });
}

const useTherapistServices = () => {
  const [services, setServices] = useState([]);
  const [activeService, setActiveService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setLoading(true);
    setError('');

    try {
      const catalog = await fetchServiceCatalog();
      const active = currentFromServices(catalog);
      if (requestId.current !== currentRequest) return null;
      setServices(catalog);
      setActiveService(active);
      return { services: catalog, activeService: active };
    } catch (err) {
      const message = err.message || 'Gagal memuat layanan';
      if (requestId.current === currentRequest) {
        setServices([]);
        setActiveService(null);
        setError(message);
      }
      return null;
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, []);

  const saveActiveService = useCallback(async (serviceId) => {
    setSaving(true);
    setError('');

    try {
      const numericId = Number(serviceId);
      const payload = {
        serviceId: Number.isFinite(numericId) ? numericId : serviceId,
      };
      const { response, result } = await request(API_ENDPOINTS.SET_ACTIVE_SERVICE, 'PUT', payload);
      const status = Number(result?.status);
      const statusFailed = Number.isFinite(status) && status >= 400;

      if (!response.ok || result?.success === false || statusFailed) {
        throw new Error(getErrorMessage(result, 'Gagal menyimpan layanan'));
      }

      const saved = mapActiveService(result) || {
        id: payload.serviceId,
        name: '',
        flag: false,
      };
      const next = {
        ...saved,
        flag: typeof saved.flag === 'boolean' ? saved.flag : false,
      };
      let updatedServices = [];
      setServices((current) => {
        updatedServices = current.map((service) => {
          if (String(service.id) === String(next.id)) {
            return { ...service, name: next.name || service.name, flag: next.flag };
          }
          if (service.flag === true || service.flag === false) {
            return { ...service, flag: null };
          }
          return service;
        });
        return updatedServices;
      });
      setActiveService(currentFromServices(updatedServices));
      return next;
    } catch (err) {
      const message = err.message || 'Gagal menyimpan layanan';
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    services,
    activeService,
    loading,
    saving,
    error,
    reload: load,
    saveActiveService,
  };
};

export default useTherapistServices;
