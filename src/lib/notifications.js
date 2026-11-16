import { useSyncExternalStore } from "react";

const STORAGE_KEY = "therapist-notification-reads";

export const NOTIFICATIONS = [];

function loadReadIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((id) => typeof id === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

let readIds = typeof localStorage === "undefined" ? new Set() : loadReadIds();
const listeners = new Set();
const serverSnapshot = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...readIds]));
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return readIds;
}

function getServerSnapshot() {
  return serverSnapshot;
}

export function useNotifications() {
  const read = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const notifications = NOTIFICATIONS.map((item) => ({
    ...item,
    unread: item.unread && !read.has(item.id),
  }));
  const unreadCount = notifications.filter((item) => item.unread).length;

  const markRead = (id) => {
    if (readIds.has(id)) return;
    readIds = new Set(readIds);
    readIds.add(id);
    persist();
    emit();
  };

  const markAllRead = () => {
    const next = new Set(readIds);
    let changed = false;

    NOTIFICATIONS.forEach((item) => {
      if (item.unread && !next.has(item.id)) {
        next.add(item.id);
        changed = true;
      }
    });

    if (!changed) return;
    readIds = next;
    persist();
    emit();
  };

  return { notifications, unreadCount, markRead, markAllRead };
}
