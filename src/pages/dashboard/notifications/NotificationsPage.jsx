import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { notificationHref, useNotifications } from '@/lib/notification-context';
import {
  Bell,
  Calendar,
  CheckCheck,
  Clock,
  CreditCard,
  FileText,
  MessageSquare,
} from 'lucide-react';

const FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'unread', label: 'Belum dibaca' },
];

const TYPE_META = {
  booking_new: { icon: Calendar, iconClass: 'bg-primary/10 text-primary' },
  booking_confirmed: { icon: Calendar, iconClass: 'bg-primary/10 text-primary' },
  report_due: { icon: FileText, iconClass: 'bg-muted text-foreground' },
  payment_due: { icon: CreditCard, iconClass: 'bg-accent/15 text-accent' },
  payment_confirmed: { icon: CreditCard, iconClass: 'bg-accent/15 text-accent' },
  payslip_issued: { icon: CreditCard, iconClass: 'bg-accent/15 text-accent' },
  chat_message: { icon: MessageSquare, iconClass: 'bg-secondary text-secondary-foreground' },
};

function formatTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return value || '';
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const {
    items,
    unreadCount,
    pagination,
    loading,
    loadingMore,
    error,
    loadNotifications,
    markRead,
    markAllRead,
  } = useNotifications();

  useEffect(() => {
    const controller = new AbortController();
    loadNotifications({
      page: 1,
      isRead: filter === 'unread' ? false : undefined,
      signal: controller.signal,
    });
    return () => controller.abort();
  }, [filter, loadNotifications]);

  const openNotification = (item) => {
    if (!item.isRead) markRead(item.code);
    const href = notificationHref(item);
    if (href) navigate(href);
  };

  const loadMore = () => {
    if (!pagination.nextPage || loadingMore) return;
    loadNotifications({
      page: pagination.nextPage,
      isRead: filter === 'unread' ? false : undefined,
      append: true,
    });
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Notifikasi</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua notifikasi sudah dibaca'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={markAllRead}>
                <CheckCheck className="h-4 w-4" />
                Tandai dibaca
              </Button>
            )}
          </div>

          <div className="mb-6 flex gap-2">
            {FILTERS.map((item) => {
              const active = filter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={active}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
              <p>{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadNotifications({ page: 1, isRead: filter === 'unread' ? false : undefined })}
                disabled={loading}
              >
                Muat ulang
              </Button>
            </div>
          )}

          {loading && items.length === 0 ? (
            <Card className="px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">Memuat notifikasi...</p>
            </Card>
          ) : items.length === 0 ? (
            <Card className="items-center px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground">
                {filter === 'unread' ? 'Tidak ada yang belum dibaca' : 'Belum ada notifikasi'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === 'unread'
                  ? 'Semua notifikasi sudah Anda baca.'
                  : 'Update orderan, chat, dan pembayaran akan muncul di sini.'}
              </p>
            </Card>
          ) : (
            <>
              <ul className="space-y-3">
                {items.map((item) => {
                  const meta = TYPE_META[item.type] || { icon: Clock, iconClass: 'bg-muted text-foreground' };
                  const Icon = meta.icon;

                  return (
                    <li key={item.code}>
                      <button type="button" onClick={() => openNotification(item)} className="w-full text-left">
                        <Card
                          className={`flex-row items-start gap-4 p-4 transition-colors hover:border-primary ${
                            item.isRead ? '' : 'border-primary/40 bg-primary/5'
                          }`}
                        >
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.iconClass}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold leading-snug text-foreground">{item.title}</p>
                              {!item.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.message}</p>
                            <p className="mt-2 text-xs text-muted-foreground">{formatTime(item.createdAt)}</p>
                          </div>
                        </Card>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {pagination.nextPage > 0 && (
                <div className="mt-6 flex justify-center">
                  <Button type="button" variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'Memuat...' : 'Muat lagi'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
