import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/lib/notifications';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthPage = pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/auth/verify-otp';

  if (!user || isAuthPage) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const navItems = [
    { label: 'Orderan', href: '/dashboard/orders' },
    { label: 'Chat', href: '/dashboard/chat' },
    { label: 'Laporan Pembayaran', href: '/dashboard/payments' },
    { label: 'Pengaturan', href: '/dashboard/settings' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            P
          </div>
          <span className="hidden font-bold text-foreground sm:inline">PhysioApp</span>
        </div>

        <nav className="hidden gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`transition-colors ${
                pathname === item.href ||
                (item.href === '/dashboard/settings' && pathname.startsWith('/dashboard/settings'))
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden gap-4 sm:flex sm:items-center">
            <div className="text-sm">
              <p className="font-semibold text-foreground">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground">Terapis</p>
            </div>
            {user.profilePicture && (
              <img src={user.profilePicture} alt="Profile" className="h-8 w-8 rounded-full" />
            )}
          </div>

          <Link
            to="/dashboard/notifications"
            className={`relative inline-flex rounded-lg p-2 transition-colors ${
              pathname.startsWith('/dashboard/notifications')
                ? 'bg-secondary text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
            title="Notifikasi"
            aria-label={
              unreadCount > 0 ? `Notifikasi, ${unreadCount} belum dibaca` : 'Notifikasi'
            }
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className="hidden rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground md:inline-flex"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex rounded-lg p-2 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border bg-secondary md:hidden">
          <div className="space-y-2 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-background"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
