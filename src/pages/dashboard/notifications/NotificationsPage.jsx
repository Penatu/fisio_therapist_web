import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNotifications } from '@/lib/notifications';
import {
  Bell,
  Calendar,
  CheckCheck,
  Clock,
  CreditCard,
  MessageSquare,
} from 'lucide-react';

const FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'unread', label: 'Belum dibaca' },
];

const TYPE_META = {
  booking: {
    icon: Calendar,
    iconClass: 'bg-primary/10 text-primary',
  },
  chat: {
    icon: MessageSquare,
    iconClass: 'bg-secondary text-secondary-foreground',
  },
  payment: {
    icon: CreditCard,
    iconClass: 'bg-accent/15 text-accent',
  },
  reminder: {
    icon: Clock,
    iconClass: 'bg-muted text-foreground',
  },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const visible =
    filter === 'unread' ? notifications.filter((item) => item.unread) : notifications;

  const openNotification = (item) => {
    markRead(item.id);
    if (item.href) navigate(item.href);
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Notifikasi</h1>
              <p className="text-muted-foreground">
                {notifications.length === 0
                  ? 'Belum ada notifikasi'
                  : unreadCount > 0
                    ? `${unreadCount} belum dibaca`
                    : 'Semua notifikasi sudah dibaca'}
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

          {visible.length === 0 ? (
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
            <ul className="space-y-3">
              {visible.map((item) => {
                const meta = TYPE_META[item.type] || TYPE_META.booking;
                const Icon = meta.icon;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(item)}
                      className="w-full text-left"
                    >
                      <Card
                        className={`flex-row items-start gap-4 p-4 transition-colors hover:border-primary ${
                          item.unread ? 'border-primary/40 bg-primary/5' : ''
                        }`}
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.iconClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold leading-snug text-foreground">
                              {item.title}
                            </p>
                            {item.unread && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {item.body}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">{item.time}</p>
                        </div>
                      </Card>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
