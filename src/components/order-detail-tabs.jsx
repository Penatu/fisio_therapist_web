import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TABS = [
  {
    id: 'detail',
    label: 'Detail Orderan',
    to: (bookingId) => `/dashboard/orders/${bookingId}`,
    end: true,
  },
  {
    id: 'history',
    label: 'Riwayat Medis',
    to: (bookingId) => `/dashboard/orders/${bookingId}/medical-history`,
    end: false,
  },
];

export function OrderDetailTabs({ bookingId }) {
  return (
    <div className="mb-6 flex items-end gap-1 border-b border-border">
      {TABS.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.to(bookingId)}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              'relative -mb-px rounded-t-lg border px-5 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-border bg-card text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-card'
                : 'border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
