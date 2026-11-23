import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/lib/auth-context';
import { API_ENDPOINTS, SOCKET_BASE_URL } from '@/lib/endpoints';
import { handleSessionExpired } from '@/lib/session';

function formatMessageTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function extractHistory(result) {
  const data = result?.data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data)) return data;
  return [];
}

function mapHistoryItem(item, index, userRef) {
  const sendAt = item?.sendAt || item?.createdAt || item?.created_at || '';
  const actorId = item?.actorId || item?.fromId || item?.from_id || '';
  return {
    id: `history-${index}-${sendAt}-${actorId}`,
    actorId,
    text: item?.message || '',
    sendAt,
    time: formatMessageTime(sendAt),
    isSelf: actorId === userRef,
    live: false,
  };
}

function readableConnectionError(detail) {
  const text = String(detail || '').trim();
  const lower = text.toLowerCase();
  if (!text || lower === 'unauthorized' || lower.includes('token') || lower.includes('jwt')) {
    return 'Sesi login tidak valid. Silakan login kembali.';
  }
  return text;
}

function getErrorMessage(result, fallback) {
  if (!result) return fallback;
  if (typeof result.message === 'string' && result.message) return result.message;
  if (typeof result.messageTitle === 'string' && result.messageTitle) return result.messageTitle;
  return fallback;
}

export function useChatSocket({ roomId, userRef, onRoomError }) {
  const { user } = useAuth();
  const token = user?.token || localStorage.getItem('token') || '';
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [connectionError, setConnectionError] = useState('');

  const socketRef = useRef(null);
  const onRoomErrorRef = useRef(onRoomError);
  const loadHistoryRef = useRef(null);
  const messageSeq = useRef(0);

  onRoomErrorRef.current = onRoomError;

  const reloadHistory = useCallback(() => loadHistoryRef.current?.(), []);

  const sendMessage = useCallback((text) => {
    const value = text.trim();
    if (!value) return false;
    const socket = socketRef.current;
    if (!socket?.connected) return false;
    socket.emit('message', { message: value });
    return true;
  }, []);

  useEffect(() => {
    if (!token || !roomId || !userRef) {
      setMessages([]);
      setIsConnected(false);
      setPartnerOnline(false);
      setHistoryLoading(false);
      setHistoryError('');
      setConnectionError(roomId && userRef && !token ? 'Sesi login tidak ditemukan. Silakan login kembali.' : '');
      return undefined;
    }

    let active = true;
    const controller = new AbortController();

    setMessages([]);
    setIsConnected(false);
    setPartnerOnline(false);
    setConnectionError('');
    setHistoryError('');
    setHistoryLoading(true);

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError('');

      try {
        const params = new URLSearchParams({
          roomId,
          page: '1',
          perPage: '50',
        });
        const response = await fetch(`${API_ENDPOINTS.GET_CHAT_HISTORY}?${params.toString()}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });
        const result = await response.json().catch(() => null);
        const status = Number(result?.status);
        const statusFailed = Number.isFinite(status) && status >= 400;

        if (!response.ok || result?.success === false || statusFailed) {
          throw new Error(getErrorMessage(result, 'Gagal memuat pesan'));
        }

        const history = extractHistory(result)
          .map((item, index) => mapHistoryItem(item, index, userRef))
          .filter((item) => item.text)
          .sort((left, right) => {
            const leftTime = new Date(left.sendAt).getTime();
            const rightTime = new Date(right.sendAt).getTime();
            if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) return 0;
            return leftTime - rightTime;
          });

        if (!active) return;

        setMessages((current) => {
          const live = current.filter((item) => item.live);
          const extras = live.filter(
            (item) => !history.some((saved) => saved.actorId === item.actorId && saved.text === item.text),
          );
          return [...history, ...extras];
        });
      } catch (err) {
        if (err?.name === 'AbortError' || !active) return;
        setHistoryError(err?.message || 'Tidak dapat memuat pesan');
      } finally {
        if (active) setHistoryLoading(false);
      }
    };

    loadHistoryRef.current = loadHistory;
    loadHistory();

    const socket = io(`${SOCKET_BASE_URL}/chat`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      query: {
        userRef,
        roomId,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta',
        lang: 'id',
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (!active) return;
      setIsConnected(true);
      setConnectionError('');
    });

    socket.on('disconnect', () => {
      if (!active) return;
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      const detail = err?.data?.message || err?.message || 'Gagal terhubung ke chat';
      if (err?.data?.status === 401 && detail !== 'invalid userRef') {
        handleSessionExpired();
        return;
      }
      if (!active) return;
      setIsConnected(false);
      setConnectionError(readableConnectionError(detail));
    });

    socket.on('message', (payload, ackCallback) => {
      if (typeof ackCallback === 'function') {
        ackCallback({ ack: true, time: new Date().toISOString() });
      }
      if (!active || !payload?.message) return;

      const actorId = payload.actorId || '';
      const sendAt =
        typeof payload.sendAt === 'string' && payload.sendAt.trim() ? payload.sendAt : new Date().toISOString();
      messageSeq.current += 1;

      setMessages((current) => [
        ...current,
        {
          id: `live-${messageSeq.current}-${sendAt}`,
          actorId,
          text: payload.message,
          sendAt,
          time: formatMessageTime(sendAt),
          isSelf: actorId === userRef,
          live: true,
        },
      ]);
    });

    const handleJoin = (payload) => {
      if (!active || !payload?.actorId || payload.actorId === userRef) return;
      setPartnerOnline(true);
    };

    socket.on('notify_join', handleJoin);
    socket.on('Notify_join', handleJoin);

    socket.on('Notify_leave', (payload) => {
      if (!active || !payload?.actorId || payload.actorId === userRef) return;
      setPartnerOnline(false);
    });

    socket.on('alert_error', (msg, ackCallback) => {
      if (typeof ackCallback === 'function') ackCallback();
      const text = typeof msg === 'string' && msg.trim() ? msg : 'Room tidak valid';
      if (!active) return;
      setConnectionError(text);
      onRoomErrorRef.current?.(text);
    });

    return () => {
      active = false;
      controller.abort();
      loadHistoryRef.current = null;
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [token, roomId, userRef]);

  return {
    messages,
    isConnected,
    partnerOnline,
    historyLoading,
    historyError,
    connectionError,
    sendMessage,
    reloadHistory,
  };
}
