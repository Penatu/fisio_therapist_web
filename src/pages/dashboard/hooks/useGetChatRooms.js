import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/lib/auth-context';
import { API_ENDPOINTS, SOCKET_BASE_URL } from '@/lib/endpoints';

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

function messageTimestamp(value) {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function compareRoomsByLatest(left, right) {
  return messageTimestamp(right.latestMessageAt) - messageTimestamp(left.latestMessageAt);
}

function readNotifCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function mergeLiveRooms(fetchedRooms, liveRooms) {
  const liveById = new Map(liveRooms.map((room) => [room.id, room]));
  return fetchedRooms
    .map((room) => {
      const live = liveById.get(room.id);
      if (!live) return room;
      if (messageTimestamp(live.latestMessageAt) <= messageTimestamp(room.latestMessageAt)) return room;
      return {
        ...room,
        lastMessage: live.lastMessage,
        latestMessageAt: live.latestMessageAt,
        time: live.time,
        unreadCount: live.unreadCount,
      };
    })
    .sort(compareRoomsByLatest);
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
  const latestMessageAt = textValue(
    item?.latestMessageAt || item?.lastMessageAt || item?.sendAt || item?.updatedAt || item?.createdAt,
  );

  return {
    id: textValue(item?.roomId || item?.id || item?.code || item?.bookingCode || item?.roomCode) || `room-${index}`,
    yourChatRef: textValue(item?.yourChatRef),
    patientName,
    patientInitial: initials(patientName),
    patientImage: fileUrl(item?.profilePicture || item?.profile_picture || item?.avatar || item?.patient?.profilePicture),
    lastMessage: lastMessage || 'Belum ada pesan',
    latestMessageAt,
    time: formatRoomTime(latestMessageAt),
    unreadCount: readNotifCount(item?.notifCount ?? item?.unreadCount ?? item?.unread),
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

const UNKNOWN_ROOM_REFETCH_MS = 3000;

const useGetChatRooms = () => {
  const { user, logout } = useAuth();
  const token = user?.token || localStorage.getItem('token') || '';
  const [rooms, setRooms] = useState([]);
  const [yourChatRef, setYourChatRef] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const roomsRef = useRef(rooms);
  const getChatRoomsRef = useRef(null);
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const getChatRooms = useCallback(async (signal, { background = false } = {}) => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    if (!background) {
      setLoading(true);
      setError('');
    }

    try {
      const result = await requestChatRooms(signal);
      if (signal?.aborted || requestId.current !== currentRequest) return [];

      const sharedRef = envelopeYourChatRef(result);
      const mapped = extractRooms(result)
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const room = mapChatRoom(item, index);
          return { ...room, yourChatRef: room.yourChatRef || sharedRef };
        })
        .sort(compareRoomsByLatest);
      const nextRooms = background ? mergeLiveRooms(mapped, roomsRef.current) : mapped;

      roomsRef.current = nextRooms;
      setRooms(nextRooms);
      setYourChatRef(sharedRef || nextRooms.find((room) => room.yourChatRef)?.yourChatRef || '');
      if (background) setError('');
      return nextRooms;
    } catch (err) {
      if (err?.name === 'AbortError' || signal?.aborted) return [];
      const message = err.message || 'Gagal memuat chat';
      if (!background && requestId.current === currentRequest) {
        roomsRef.current = [];
        setRooms([]);
        setYourChatRef('');
        setError(message);
      }
      return [];
    } finally {
      if (!signal?.aborted && !background && requestId.current === currentRequest) setLoading(false);
    }
  }, []);

  getChatRoomsRef.current = getChatRooms;

  useEffect(() => {
    const controller = new AbortController();
    getChatRooms(controller.signal);
    return () => controller.abort();
  }, [getChatRooms]);

  useEffect(() => {
    if (!token || !yourChatRef) return undefined;

    let active = true;
    const controller = new AbortController();
    const lastRefetchAt = { current: 0 };

    const socket = io(`${SOCKET_BASE_URL}/room`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      query: {
        userRef: yourChatRef,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        lang: 'id',
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    const requestUnknownRoomRefetch = () => {
      if (!active) return;
      const now = Date.now();
      if (now - lastRefetchAt.current < UNKNOWN_ROOM_REFETCH_MS) return;
      lastRefetchAt.current = now;
      getChatRoomsRef.current?.(controller.signal, { background: true });
    };

    socket.on('room_notif', (payload) => {
      if (!active) return;
      const updates = Array.isArray(payload?.rooms) ? payload.rooms : Array.isArray(payload) ? payload : [];
      if (updates.length === 0) return;

      const map = new Map(roomsRef.current.map((room) => [room.id, room]));
      let hasUnknownRoom = false;
      let changed = false;

      updates.forEach((item) => {
        const roomId = textValue(item?.roomId);
        if (!roomId) return;
        const existing = map.get(roomId);
        if (!existing) {
          hasUnknownRoom = true;
          return;
        }

        const latestMessageAt = typeof item.latestMessageAt === 'string' ? item.latestMessageAt : '';
        const latestMessage = typeof item.latestMessage === 'string' ? item.latestMessage.trim() : '';
        map.set(roomId, {
          ...existing,
          lastMessage: latestMessage || 'Belum ada pesan',
          latestMessageAt,
          time: formatRoomTime(latestMessageAt),
          unreadCount: readNotifCount(item?.notifCount),
        });
        changed = true;
      });

      if (changed) {
        const next = Array.from(map.values()).sort(compareRoomsByLatest);
        roomsRef.current = next;
        setRooms(next);
      }

      if (hasUnknownRoom) requestUnknownRoomRefetch();
    });

    socket.on('connect_error', (err) => {
      const detail = err?.data?.message || err?.message || '';
      if (err?.data?.status === 401 && detail !== 'invalid userRef') {
        logoutRef.current();
      }
    });

    const refreshOnFocus = () => {
      if (socket.connected) socket.emit('room_notif');
    };
    window.addEventListener('focus', refreshOnFocus);

    return () => {
      active = false;
      controller.abort();
      window.removeEventListener('focus', refreshOnFocus);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token, yourChatRef]);

  return { rooms, yourChatRef, loading, error, reload: () => getChatRooms() };
};

export default useGetChatRooms;
