import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '@/lib/auth-context';
import { API_ENDPOINTS, NOTIFICATION_SOCKET_URL } from '@/lib/endpoints';
import { handleSessionExpired } from '@/lib/session';
import { toast } from '@/hooks/use-toast';

const NotificationContext = createContext(undefined);
const PER_PAGE = 20;

function getErrorMessage(result, fallback) {
  if (!result) return fallback;
  if (typeof result === 'string') return result;
  if (typeof result.message === 'string' && result.message) return result.message;
  if (typeof result.errorServer === 'string' && result.errorServer) return result.errorServer;
  if (typeof result.messageTitle === 'string' && result.messageTitle) return result.messageTitle;
  if (typeof result.error === 'string' && result.error) return result.error;
  return fallback;
}

export function normalizeLang(value) {
  return String(value || '').trim().toLowerCase().startsWith('en') ? 'en' : 'id';
}

function textValue(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  return '';
}

export function mapNotification(item) {
  if (!item || typeof item !== 'object') return null;
  const code = textValue(item.code);
  if (!code) return null;
  const data = item.data && typeof item.data === 'object' && !Array.isArray(item.data) ? item.data : {};
  return {
    code,
    type: textValue(item.type),
    title: textValue(item.title),
    message: textValue(item.message),
    data,
    isRead: item.isRead === true,
    createdAt: textValue(item.createdAt),
  };
}

export function upsertNotification(items, item) {
  return [item, ...items.filter((current) => current.code !== item.code)];
}

export function notificationHref(item) {
  const data = item?.data || {};
  const bookingCode = textValue(data.bookingCode);
  const payrollCode = textValue(data.payrollCode);
  const roomId = textValue(data.roomId);

  switch (item?.type) {
    case 'booking_new':
    case 'booking_confirmed':
    case 'payment_due':
    case 'payment_confirmed':
      return bookingCode ? `/dashboard/orders/${encodeURIComponent(bookingCode)}` : '/dashboard/orders';
    case 'report_due':
      return bookingCode
        ? `/dashboard/orders/${encodeURIComponent(bookingCode)}/create-report`
        : '/dashboard/orders';
    case 'payslip_issued':
      return payrollCode ? `/dashboard/payments/${encodeURIComponent(payrollCode)}` : '/dashboard/payments';
    case 'chat_message':
      return roomId ? `/dashboard/chat/room/${encodeURIComponent(roomId)}` : '/dashboard/chat';
    default:
      return '';
  }
}

function viewingChatRoom(pathname, roomId) {
  if (!roomId) return false;
  const current = decodeURIComponent(pathname || '');
  return current === `/dashboard/chat/room/${roomId}`;
}

function countValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function mapPagination(pagination, fallbackPage) {
  const source = pagination && typeof pagination === 'object' ? pagination : {};
  return {
    perPage: countValue(source.perPage) || PER_PAGE,
    total: countValue(source.total),
    currentPage: countValue(source.currentPage) || fallbackPage,
    previousPage: countValue(source.previousPage),
    nextPage: countValue(source.nextPage),
  };
}

async function requestNotification(url, { method = 'GET', lang = 'id', signal } = {}) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');

  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Accept-Language': lang,
    },
    signal,
  });
  const result = await response.json().catch(() => null);
  const status = Number(result?.status);
  const statusFailed = Number.isFinite(status) && status >= 400;
  if (!response.ok || result?.success === false || statusFailed) {
    throw new Error(getErrorMessage(result, 'Gagal memuat notifikasi'));
  }
  return result;
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const token = user?.token || (user ? localStorage.getItem('token') : '') || '';
  const lang = normalizeLang(user?.lang);
  const locationRef = useRef(location);
  locationRef.current = location;

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState(mapPagination(null, 1));
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const listLoadedRef = useRef(false);
  const queryRef = useRef({ isRead: undefined });
  const itemsRef = useRef(items);
  const unreadRef = useRef(unreadCount);
  const langRef = useRef(lang);
  itemsRef.current = items;
  unreadRef.current = unreadCount;
  langRef.current = lang;

  const applyPage = useCallback((result, page, append) => {
    const data = result?.data && typeof result.data === 'object' ? result.data : {};
    const mapped = (Array.isArray(data.items) ? data.items : []).map(mapNotification).filter(Boolean);
    setPagination(mapPagination(data.pagination, page));
    if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
    setItems((current) => {
      if (!append) return mapped;
      const seen = new Set(current.map((item) => item.code));
      return [...current, ...mapped.filter((item) => !seen.has(item.code))];
    });
    listLoadedRef.current = true;
  }, []);

  const loadNotifications = useCallback(
    async ({ page = 1, isRead, append = false, signal } = {}) => {
      queryRef.current = { isRead };
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError('');

      try {
        const url = new URL(API_ENDPOINTS.NOTIF_GET_NOTIFICATIONS);
        url.searchParams.set('page', String(page));
        url.searchParams.set('perPage', String(PER_PAGE));
        if (isRead === true || isRead === false) url.searchParams.set('isRead', String(isRead));
        const result = await requestNotification(url.toString(), { lang: langRef.current, signal });
        if (signal?.aborted) return null;
        applyPage(result, page, append);
        return result;
      } catch (err) {
        if (err?.name === 'AbortError' || signal?.aborted) return null;
        setError(err.message || 'Gagal memuat notifikasi');
        return null;
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [applyPage],
  );

  const refreshUnreadCount = useCallback(async () => {
    try {
      const result = await requestNotification(API_ENDPOINTS.NOTIF_GET_UNREAD, { lang: langRef.current });
      const count = Number(result?.data?.unreadCount);
      if (Number.isFinite(count)) setUnreadCount(count);
    } catch {
      // Badge tetap mengikuti event socket jika permintaan ini gagal.
    }
  }, []);

  const markRead = useCallback(async (code) => {
    if (!code) return;
    const previousItems = itemsRef.current;
    const previousCount = unreadRef.current;
    const target = previousItems.find((item) => item.code === code);
    if (!target || target.isRead) return;

    setItems(
      queryRef.current.isRead === false
        ? previousItems.filter((item) => item.code !== code)
        : previousItems.map((item) => (item.code === code ? { ...item, isRead: true } : item)),
    );
    setUnreadCount(Math.max(0, previousCount - 1));

    try {
      await requestNotification(API_ENDPOINTS.NOTIF_READ_ONE.replace(':code', encodeURIComponent(code)), {
        method: 'PUT',
        lang: langRef.current,
      });
    } catch (err) {
      setItems(previousItems);
      setUnreadCount(previousCount);
      setError(err.message || 'Gagal menandai notifikasi');
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const previousItems = itemsRef.current;
    const previousCount = unreadRef.current;
    setItems(queryRef.current.isRead === false ? [] : previousItems.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    try {
      await requestNotification(API_ENDPOINTS.NOTIF_READ_ALL, { method: 'PUT', lang: langRef.current });
    } catch (err) {
      setItems(previousItems);
      setUnreadCount(previousCount);
      setError(err.message || 'Gagal menandai semua notifikasi');
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setItems([]);
      setUnreadCount(0);
      setPagination(mapPagination(null, 1));
      setError('');
      listLoadedRef.current = false;
      return undefined;
    }

    refreshUnreadCount();

    const socket = io(NOTIFICATION_SOCKET_URL, {
      path: '/socket.io',
      auth: { token },
      query: {
        lang,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta',
      },
      extraHeaders: { 'Accept-Language': lang },
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 10000,
    });

    socket.on('connect', () => {
      if (!listLoadedRef.current) return;
      loadNotifications({ page: 1, isRead: queryRef.current.isRead });
    });

    socket.on('connect_error', (err) => {
      const detail = String(err?.data?.message || err?.message || '').toLowerCase();
      if (detail === 'unauthorized' || err?.data?.status === 401) handleSessionExpired();
    });

    socket.on('notification_count', (payload) => {
      const count = Number(payload?.unreadCount);
      if (Number.isFinite(count)) setUnreadCount(count);
    });

    socket.on('notification', (payload) => {
      const item = mapNotification(payload);
      if (!item) return;
      setItems((current) => {
        const isReadFilter = queryRef.current.isRead;
        const without = current.filter((entry) => entry.code !== item.code);
        if (isReadFilter === false && item.isRead) return without;
        if (isReadFilter === true && !item.isRead) return without;
        return upsertNotification(without, item);
      });
      if (item.type === 'chat_message' && viewingChatRoom(locationRef.current.pathname, item.data?.roomId)) return;
      toast({
        title: item.title || 'Notifikasi',
        description: item.message,
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token, lang, loadNotifications, refreshUnreadCount]);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      pagination,
      loading,
      loadingMore,
      error,
      loadNotifications,
      markRead,
      markAllRead,
    }),
    [items, unreadCount, pagination, loading, loadingMore, error, loadNotifications, markRead, markAllRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications harus digunakan dalam NotificationProvider');
  return context;
}
