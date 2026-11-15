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
    const nested = value.code ?? value.id ?? value.ref ?? value.chatRef ?? value.userRef;
    if (typeof nested === 'string' || typeof nested === 'number') return String(nested).trim();
  }
  return '';
}

function fileUrl(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return value.fullUrl || value.url || value.path || '';
  }
  return '';
}

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function formatRoomTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';

  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function extractRooms(result) {
  const data = result?.data ?? result;
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  const list =
    data.list ||
    data.items ||
    data.rooms ||
    data.chatRooms ||
    data.chatRoom ||
    data.chats ||
    data.records ||
    data.rows ||
    data.content ||
    data.data;

  if (Array.isArray(list)) return list;

  if (data.roomId || data.id || data.code || data.name || data.latestMessage) {
    return [data];
  }

  return [];
}

export function mapChatRoom(item, index) {
  const patientName =
    textValue(item?.name || item?.patientName || item?.fullName || item?.patient?.name) || 'Pasien';
  const lastMessage = textValue(
    item?.latestMessage ||
      item?.lastMessage?.text ||
      item?.lastMessage?.content ||
      item?.lastMessage ||
      item?.message,
  );

  return {
    id: textValue(item?.roomId || item?.id || item?.code || item?.bookingCode || item?.roomCode) || `room-${index}`,
    yourChatRef: textValue(item?.yourChatRef),
    patientName,
    patientInitial: initials(patientName),
    patientImage: fileUrl(item?.profilePicture || item?.profile_picture || item?.avatar || item?.patient?.profilePicture),
    lastMessage: lastMessage || 'Belum ada pesan',
    time: formatRoomTime(item?.sendAt || item?.lastMessageAt || item?.updatedAt || item?.createdAt),
    unreadCount: Number(item?.notifCount ?? item?.unreadCount ?? item?.unread ?? 0) || 0,
  };
}

function envelopeYourChatRef(result) {
  const data = result?.data;
  const nested = data && !Array.isArray(data) ? data.yourChatRef : '';
  return textValue(result?.yourChatRef || nested);
}

async function requestChatRooms(signal) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Sesi login tidak ditemukan. Silakan login kembali.');
  }

  const response = await fetch(API_ENDPOINTS.GET_CHAT_ROOM, {
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
    throw new Error(getErrorMessage(result, 'Gagal memuat chat'));
  }

  return result;
}

const useGetChatRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [yourChatRef, setYourChatRef] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const getChatRooms = useCallback(async (signal) => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setLoading(true);
    setError('');

    try {
      const result = await requestChatRooms(signal);
      if (signal?.aborted || requestId.current !== currentRequest) return [];

      const sharedRef = envelopeYourChatRef(result);
      const mapped = extractRooms(result)
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const room = mapChatRoom(item, index);
          return { ...room, yourChatRef: room.yourChatRef || sharedRef };
        });

      setRooms(mapped);
      setYourChatRef(sharedRef || mapped.find((room) => room.yourChatRef)?.yourChatRef || '');
      return mapped;
    } catch (err) {
      if (err?.name === 'AbortError' || signal?.aborted) return [];
      const message = err.message || 'Gagal memuat chat';
      if (requestId.current === currentRequest) {
        setRooms([]);
        setYourChatRef('');
        setError(message);
      }
      return [];
    } finally {
      if (!signal?.aborted && requestId.current === currentRequest) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getChatRooms(controller.signal);
    return () => controller.abort();
  }, [getChatRooms]);

  return { rooms, yourChatRef, loading, error, reload: () => getChatRooms() };
};

export default useGetChatRooms;
