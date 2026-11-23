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

const MONTHS = {
  jan: 0,
  january: 0,
  januari: 0,
  feb: 1,
  february: 1,
  februari: 1,
  mar: 2,
  march: 2,
  maret: 2,
  apr: 3,
  april: 3,
  may: 4,
  mei: 4,
  jun: 5,
  june: 5,
  juni: 5,
  jul: 6,
  july: 6,
  juli: 6,
  aug: 7,
  august: 7,
  agu: 7,
  agustus: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  okt: 9,
  oktober: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
  des: 11,
  desember: 11,
};

function parseDate(value) {
  const text = textValue(value);
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const date = new Date(`${text.slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const named = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (named) {
    const month = MONTHS[named[2].toLowerCase()];
    if (month == null) return null;
    const date = new Date(Number(named[3]), month, Number(named[1]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text);
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
    data.paidPayrolls ||
    data.payrollList ||
    data.payments ||
    data.items ||
    data.rows ||
    data.histories ||
    data.records ||
    data.data;
  return Array.isArray(list) ? list : [];
}

function monthTitle(item) {
  const named = textValue(item.payslipCode || item.monthLabel || item.monthName || item.periodLabel);
  if (named && !/^\d{4}-\d{2}/.test(named)) return named;
  const start = item.periodStart || item.month || item.period || item.paidAt || item.date || item.paymentDate;
  return formatMonth(start) || textValue(item.payslipCode || item.payrollCode || item.patient || item.patientName) || 'Pembayaran';
}

function mapHistory(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      id: textValue(item.bookCode || item.bookingCode || item.id || item.code || item.payrollCode) || `history-${index}`,
      bookCode: textValue(item.bookCode || item.bookingCode),
      date: formatDate(item.bookingDate || item.date || item.paymentDate || item.paidAt || item.lastPayment),
      description:
        textValue(item.patientName || item.patient || item.description || item.serviceName || item.service || item.bookCode) ||
        'Pembayaran',
      amount: amountNumber(item.amount ?? item.amountPaid ?? item.totalPayout ?? item.payout ?? item.totalAmount),
      status: statusLabel(item.status || item.paymentStatus),
    }));
}

export function mapPayrollItem(item, index) {
  const start = item?.periodStart || item?.month || item?.period || item?.paidAt || item?.date;
  const payrollCode = textValue(item?.payslipCode || item?.payrollCode || item?.code || item?.id || start);
  return {
    id: payrollCode || `payroll-${index}`,
    payrollCode: payrollCode || `payroll-${index}`,
    payslipCode: textValue(item?.payslipCode || item?.payrollCode || payrollCode),
    month: monthTitle(item || {}),
    totalAmount: amountNumber(
      item?.amountPaid ?? item?.totalPayout ?? item?.totalAmount ?? item?.amount ?? item?.paid ?? item?.payout,
    ),
    servicesCount: countNumber(
      item?.totalSession ?? item?.totalSessions ?? item?.servicesCount ?? item?.sessions ?? item?.paidSessions,
    ),
    status: statusLabel(item?.status) || 'Dibayar',
    paymentDate: formatDate(item?.paidAt || item?.lastPayment || item?.paymentDate),
    sortTime: parseDate(start || item?.paidAt || item?.lastPayment || item?.paymentDate)?.getTime() || 0,
    paymentHistory: mapHistory(item?.booking || item?.bookings || item?.paymentHistory || item?.payments || item?.details),
  };
}

function looksLikePayroll(item) {
  return ['totalPayout', 'totalAmount', 'amountPaid', 'periodStart', 'lastPayment', 'paidAt', 'payrollCode', 'payslipCode'].some(
    (key) => item?.[key] != null && item[key] !== '',
  );
}

function isCurrentMonth(item) {
  const now = new Date();
  const date = item?.sortTime
    ? new Date(item.sortTime)
    : parseDate(item?.periodStart || item?.month || item?.period || item?.date || item?.paymentDate || item?.lastPayment);
  return Boolean(
    date && !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(),
  );
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

export function mapPayrollDetail(result, payrollCode) {
  const data = result?.data && typeof result.data === 'object' ? result.data : result;
  const source =
    data?.payroll || data?.detail || data?.paidPayroll || (data && typeof data === 'object' && !Array.isArray(data) ? data : {});
  const mapped = mapPayrollItem(
    { ...source, payslipCode: source?.payslipCode || source?.payrollCode || payrollCode },
    0,
  );
  const history = mapHistory(
    source?.booking ||
      source?.bookings ||
      source?.paymentHistory ||
      source?.payments ||
      source?.details ||
      source?.items ||
      data?.booking ||
      data?.bookings ||
      data?.details ||
      data?.items,
  );

  return {
    ...mapped,
    id: mapped.payrollCode || payrollCode,
    payrollCode: mapped.payrollCode || payrollCode,
    paymentHistory: history.length ? history : mapped.paymentHistory,
  };
}

async function requestPayrollList(signal) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');

  const response = await fetch(API_ENDPOINTS.GET_PAYROLL_LIST, {
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
        const next = await requestPayrollList(signal);
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
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    getPayrollList(controller.signal);
    return () => controller.abort();
  }, [getPayrollList]);

  return { ...report, loading, error, reload: () => getPayrollList() };
};

export default useGetPayrollList;
