import { useSyncExternalStore } from "react";

const STORAGE_KEY = "therapist-notification-reads";

export const NOTIFICATIONS = [
  {
    id: "new-order",
    type: "booking",
    title: "Orderan baru masuk",
    body: "Pasien baru mengajukan booking fisioterapi. Konfirmasi sebelum jadwal terlewat.",
    time: "5 menit lalu",
    unread: true,
    href: "/dashboard/orders",
  },
  {
    id: "chat-message",
    type: "chat",
    title: "Pesan baru dari pasien",
    body: "Ada pesan di chat orderan yang sedang diproses.",
    time: "1 jam lalu",
    unread: true,
    href: "/dashboard/chat",
  },
  {
    id: "payment-received",
    type: "payment",
    title: "Pembayaran masuk",
    body: "Pembayaran sesi terbaru sudah tercatat di laporan pembayaran.",
    time: "Kemarin",
    unread: true,
    href: "/dashboard/payments",
  },
  {
    id: "schedule-reminder",
    type: "reminder",
    title: "Pengingat jadwal praktek",
    body: "Periksa tanggal praktek bulan ini agar pasien bisa melakukan booking.",
    time: "2 hari lalu",
    unread: false,
    href: "/dashboard/settings/schedule",
  },
  {
    id: "order-finished",
    type: "booking",
    title: "Sesi selesai",
    body: "Laporan kunjungan terakhir sudah tersimpan di daftar orderan.",
    time: "3 hari lalu",
    unread: false,
    href: "/dashboard/orders",
  },
];

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
