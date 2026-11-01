import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CalendarDays, ChevronRight, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const links = [
  {
    href: '/dashboard/settings/profile',
    title: 'Profil',
    description: 'Kelola foto, dokumen, riwayat, lokasi praktek, dan rekening bank.',
    icon: UserRound,
  },
  {
    href: '/dashboard/settings/schedule',
    title: 'Atur Jadwal Praktek',
    description: 'Pilih tanggal di bulan tertentu saat Anda menerima pasien.',
    icon: CalendarDays,
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const scheduleCount = Array.isArray(user?.practiceSchedule) ? user.practiceSchedule.length : 0;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Pengaturan</h1>
            <p className="text-muted-foreground">Kelola profil dan jadwal praktek Anda</p>
          </div>

          <div className="space-y-4">
            {links.map((item) => {
              const Icon = item.icon;
              const detail =
                item.href.endsWith('/schedule')
                  ? scheduleCount > 0
                    ? `${scheduleCount} hari praktek tersimpan`
                    : 'Belum ada tanggal praktek'
                  : user?.fullName || user?.name || 'Lengkapi data profil Anda';

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="flex-row items-center gap-4 p-5 transition-colors hover:border-primary">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      <p className="mt-2 text-xs font-medium text-primary">{detail}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
