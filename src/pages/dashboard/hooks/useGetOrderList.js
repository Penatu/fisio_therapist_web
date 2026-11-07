import { useCallback, useRef, useState } from 'react';
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
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return '';
}

const PAID_STATUSES = ['paid', 'lunas'];

export function isOrderPaid(order) {
  const status = String(order?.paymentStatus || '').trim().toLowerCase();
  const label = String(order?.paymentLabel || '').trim().toLowerCase();
  return PAID_STATUSES.includes(status) || PAID_STATUSES.includes(label);
}

function fileUrl(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return value.fullUrl || value.url || value.path || '';
  }
  return '';
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatSchedule(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'object') {
    const date = textValue(value.date || value.bookingDate || value.scheduleDate);
    const time = textValue(value.time || value.startTime || value.scheduleTime);
    return [date, time].filter(Boolean).join(' ');
  }

  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ]|$)/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(text)) return text.slice(0, 16);

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const NEW_STATUSES = ['new', 'baru', 'pending', 'waiting', 'booked', 'created', 'unconfirmed', 'requested', 'orderan_baru'];
const CONFIRMED_STATUSES = ['confirmed', 'confirm', 'accepted', 'dikonfirmasi', 'di_konfirmasi', 'konfirmasi'];
const VISIT_STATUSES = ['processing', 'process', 'in_progress', 'inprogress', 'ongoing', 'diproses', 'proses_visit', 'visit', 'visiting', 'on_visit'];
const COMPLETED_STATUSES = ['completed', 'complete', 'done', 'finished', 'finish', 'selesai'];
const CANCELLED_STATUSES = ['cancelled', 'canceled', 'cancel', 'dibatalkan', 'rejected'];

export function mapOrderStatus(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (!raw) return 'new';
  if (NEW_STATUSES.includes(raw)) return 'new';
  if (CONFIRMED_STATUSES.includes(raw)) return 'confirmed';
  if (VISIT_STATUSES.includes(raw)) return 'processing';
  if (COMPLETED_STATUSES.includes(raw)) return 'completed';
  if (CANCELLED_STATUSES.includes(raw)) return 'cancelled';
  return raw;
}

function extractList(result) {
  const data = result?.data ?? result;
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  const list =
    data.list ||
    data.items ||
    data.rows ||
    data.bookings ||
    data.orders ||
    data.records ||
    data.content ||
    data.data;

  return Array.isArray(list) ? list : [];
}

export function mapOrder(item, index) {
  const patient = item?.patient || item?.customer || item?.user || {};
  const service = item?.service || item?.treatment || {};
  const address = item?.address || {};
  const serviceName =
    typeof service === 'string'
      ? service
      : textValue(service.name || service.serviceName || item?.serviceName || item?.treatmentName);
  const addressText = typeof address === 'string' ? address : textValue(address.fullAddress || address.address);
  const location = textValue(item?.location || item?.city || address.city || addressText);

  return {
    id: textValue(item?.id || item?.bookingId || item?.bookingCode || item?.code || item?.orderId) || `order-${index}`,
    patientName: textValue(
      item?.patientName || item?.customerName || patient.fullName || patient.name || patient.patientName || item?.name,
    ),
    patientPhone: textValue(item?.patientPhone || item?.phone || item?.customerPhone || patient.phone || patient.phoneNumber),
    patientImage: fileUrl(
      item?.patientPhoto ||
        item?.patientImage ||
        item?.profilePicture ||
        item?.avatar ||
        patient.profilePicture ||
        patient.photo ||
        patient.avatar,
    ),
    service: serviceName,
    location,
    patientAddress: textValue(item?.patientAddress || item?.fullAddress || addressText || location),
    scheduledTime:
      formatSchedule(
        item?.schedule ||
          item?.scheduledTime ||
          item?.scheduleTime ||
          item?.bookingTime ||
          item?.appointmentTime ||
          item?.dateTime ||
          item?.scheduleDate ||
          item?.bookingDate,
      ) || [textValue(item?.date), textValue(item?.time)].filter(Boolean).join(', '),
    status: mapOrderStatus(item?.status || item?.orderStatus || item?.bookingStatus),
    statusLabel: textValue(item?.statusLabel),
    paymentStatus: textValue(
      item?.paymentStatus || item?.payment_status || item?.payment?.status || item?.payment?.paymentStatus,
    ),
    paymentLabel: textValue(item?.paymentLabel || item?.payment?.label || item?.payment?.paymentLabel),
    notes: textValue(item?.notes || item?.note || item?.complaint || item?.description),
    reportId: textValue(item?.reportId || item?.report?.id),
  };
}

export function mapOrderList(result) {
  return extractList(result)
    .filter((item) => item && typeof item === 'object')
    .map(mapOrder);
}

function orderListUrl(status) {
  const url = new URL(API_ENDPOINTS.GET_ORDER_LIST);
  if (status) url.searchParams.set('status', status);
  return url.toString();
}

async function requestOrderList(status) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(orderListUrl(status), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || result?.success === false) {
      throw new Error(getErrorMessage(result, 'Gagal memuat orderan'));
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

const useGetOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const getOrderList = useCallback(async (status = '') => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setLoading(true);
    setError('');

    try {
      const result = await requestOrderList(status);
      const mapped = mapOrderList(result);
      if (requestId.current === currentRequest) setOrders(mapped);
      return mapped;
    } catch (err) {
      const message = err.message || 'Gagal memuat orderan';
      if (requestId.current === currentRequest) setError(message);
      throw new Error(message);
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, []);

  return { orders, loading, error, getOrderList };
};

export default useGetOrderList;
