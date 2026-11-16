import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
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
  return '';
}

function amountNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = String(value || '')
    .replace(/rp/i, '')
    .trim()
    .replace(/\s/g, '');
  if (!text) return 0;
  const normalized =
    text.includes(',') && text.includes('.')
      ? text.replace(/\./g, '').replace(',', '.')
      : text.replace(/\./g, '').replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function countNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parseDate(value) {
  const text = textValue(value);
  if (!text) return null;
  const date = /^\d{4}-\d{2}-\d{2}/.test(text) ? new Date(`${text.slice(0, 10)}T00:00:00`) : new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return textValue(value);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatMonth(value) {
  const date = parseDate(value);
  if (!date) return textValue(value);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function statusLabel(value) {
  const raw = textValue(value);
  const key = raw.toLowerCase();
  if (['paid', 'dibayar', 'lunas', 'success', 'berhasil'].includes(key)) return 'Dibayar';
  if (['unpaid', 'pending', 'outstanding', 'belum dibayar'].includes(key)) return 'Belum dibayar';
  return raw;
}

function extractRows(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const list =
    data.list ||
    data.payrolls ||
    data.payments ||
    data.items ||
    data.rows ||
    data.histories ||
    data.records ||
    data.data;
  return Array.isArray(list) ? list : [];
}

function monthTitle(item) {
  const named = textValue(item.monthLabel || item.monthName || item.periodLabel);
  if (named && !/^\d{4}-\d{2}/.test(named)) return named;
  const start = item.periodStart || item.month || item.period || item.date || item.paymentDate;
  return formatMonth(start) || textValue(item.patient || item.patientName || item.description || item.name) || 'Pembayaran';
}

function mapHistory(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      id: textValue(item.id || item.code || item.payrollCode) || `history-${index}`,
      date: formatDate(item.date || item.paymentDate || item.paidAt || item.lastPayment),
      description: textValue(item.description || item.patient || item.patientName || item.service) || 'Pembayaran',
      amount: amountNumber(item.amount ?? item.totalPayout ?? item.payout ?? item.totalAmount),
      status: statusLabel(item.status || item.paymentStatus) || 'Berhasil',
    }));
}

export function mapPayrollItem(item, index) {
  const start = item?.periodStart || item?.month || item?.period || item?.date;
  return {
    id: textValue(item?.id || item?.code || item?.payrollCode || start) || `payroll-${index}`,
    month: monthTitle(item || {}),
    totalAmount: amountNumber(item?.totalPayout ?? item?.totalAmount ?? item?.amount ?? item?.paid ?? item?.payout),
    servicesCount: countNumber(item?.totalSessions ?? item?.servicesCount ?? item?.sessions ?? item?.paidSessions),
    status: statusLabel(item?.status) || 'Dibayar',
    paymentDate: formatDate(item?.lastPayment || item?.paymentDate || item?.paidAt),
    sortTime: parseDate(start || item?.lastPayment || item?.paymentDate)?.getTime() || 0,
    paymentHistory: mapHistory(item?.paymentHistory || item?.payments || item?.details),
  };
}

function looksLikePayroll(item) {
  return ['totalPayout', 'totalAmount', 'periodStart', 'lastPayment', 'payrollCode'].some(
    (key) => item?.[key] != null && item[key] !== '',
  );
}

function isCurrentMonth(item) {
  const now = new Date();
  const date = parseDate(item?.periodStart || item?.month || item?.period || item?.date || item?.paymentDate || item?.lastPayment);
  return Boolean(date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth());
}

export function mapPayrollList(result) {
  const data = result?.data && typeof result.data === 'object' ? result.data : result;
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const rows = extractRows(data).filter((item) => item && typeof item === 'object').map(mapPayrollItem);
  const record = !rows.length && looksLikePayroll(source) ? [mapPayrollItem(source, 0)] : rows;
  const payments = [...record].sort((left, right) => right.sortTime - left.sortTime);
  const summary = source.summary && typeof source.summary === 'object' ? source.summary : source;
  const hasTotal = ['totalPayout', 'totalAmount', 'totalEarnings', 'paid'].some((key) => summary?.[key] != null);
  const hasSessions = ['totalSessions', 'servicesCount', 'sessions', 'paidSessions'].some((key) => summary?.[key] != null);
  const currentRows = payments.filter((item) => isCurrentMonth(item));

  return {
    payments,
    totalAmount: hasTotal
      ? amountNumber(summary.totalPayout ?? summary.totalAmount ?? summary.totalEarnings ?? summary.paid)
      : payments.reduce((sum, item) => sum + item.totalAmount, 0),
    totalServices: hasSessions
      ? countNumber(summary.totalSessions ?? summary.servicesCount ?? summary.sessions ?? summary.paidSessions)
      : payments.reduce((sum, item) => sum + item.servicesCount, 0),
    currentAmount: currentRows.reduce((sum, item) => sum + item.totalAmount, 0),
    currentServices: currentRows.reduce((sum, item) => sum + item.servicesCount, 0),
  };
}

export function therapistCodeFrom(user) {
  const code = textValue(user?.code || user?.therapistCode);
  if (code) return code;
  const id = textValue(user?.id);
  if (id && !id.includes('@')) return id;
  return '';
}

async function requestPayrollList(therapistCode, signal) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
  if (!therapistCode) throw new Error('Kode terapis tidak ditemukan.');

  const response = await fetch(
    API_ENDPOINTS.GET_PAYROLL_LIST.replace(':therapistCode', encodeURIComponent(therapistCode)),
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
    throw new Error(getErrorMessage(result, 'Gagal memuat laporan pembayaran'));
  }

  return mapPayrollList(result);
}

const EMPTY_PAYROLL = {
  payments: [],
  totalAmount: 0,
  totalServices: 0,
  currentAmount: 0,
  currentServices: 0,
};

const useGetPayrollList = () => {
  const { user } = useAuth();
  const therapistCode = therapistCodeFrom(user);
  const [report, setReport] = useState(EMPTY_PAYROLL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const getPayrollList = useCallback(
    async (signal) => {
      const currentRequest = requestId.current + 1;
      requestId.current = currentRequest;
      setLoading(true);
      setError('');

      try {
        const next = await requestPayrollList(therapistCode, signal);
        if (signal?.aborted || requestId.current !== currentRequest) return null;
        setReport(next);
        return next;
      } catch (err) {
        if (err?.name === 'AbortError' || signal?.aborted) return null;
        const message = err.message || 'Gagal memuat laporan pembayaran';
        if (requestId.current === currentRequest) {
          setReport(EMPTY_PAYROLL);
          setError(message);
        }
        return null;
      } finally {
        if (!signal?.aborted && requestId.current === currentRequest) setLoading(false);
      }
    },
    [therapistCode],
  );

  useEffect(() => {
    const controller = new AbortController();
    getPayrollList(controller.signal);
    return () => controller.abort();
  }, [getPayrollList]);

  return { ...report, loading, error, reload: () => getPayrollList() };
};

export default useGetPayrollList;
