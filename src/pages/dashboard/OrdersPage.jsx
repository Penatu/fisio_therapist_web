import { useBooking } from '@/lib/booking-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { Clock, MapPin, Phone, MessageSquare, CheckCircle2, ShieldCheck, AlertCircle, XCircle, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function OrdersPage() {
  const { bookings } = useBooking();
  const [filter, setFilter] = useState('all');

  const verificationStatus = 'not_submitted';

  const getVerificationStatusDisplay = () => {
    switch (verificationStatus) {
      case 'not_submitted':
        return { text: 'Belum Mengajukan', icon: HelpCircle, color: 'text-muted-foreground', bgColor: 'bg-secondary/50' };
      case 'in_process':
        return { text: 'Dalam Proses', icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950' };
      case 'pending':
        return { text: 'Pending', icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-950' };
      case 'rejected':
        return { text: 'Ditolak', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950' };
      case 'approved':
        return { text: 'Terverifikasi', icon: ShieldCheck, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950' };
      default:
        return { text: 'Belum Mengajukan', icon: HelpCircle, color: 'text-muted-foreground', bgColor: 'bg-secondary/50' };
    }
  };

  const statusDisplay = getVerificationStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const stats = {
    new: bookings.filter((b) => b.status === 'new').length,
    processing: bookings.filter((b) => b.status === 'processing').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Orderan Booking</h1>
            <p className="text-muted-foreground">Kelola orderan dari pasien Anda</p>
          </div>

          <Card className={`p-4 mb-8 ${statusDisplay.bgColor} border-2 transition-all`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StatusIcon className={`h-6 w-6 ${statusDisplay.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Status Verifikasi</p>
                  <p className={`text-lg font-semibold ${statusDisplay.color} mt-0.5`}>
                    {statusDisplay.text}
                  </p>
                </div>
              </div>
              <Link to="/dashboard/verification">
                <Button
                  variant={verificationStatus === 'not_submitted' ? 'default' : 'outline'}
                  className="whitespace-nowrap"
                >
                  {verificationStatus === 'not_submitted' ? 'Ajukan Verifikasi' : 'Lihat Detail'}
                </Button>
              </Link>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Orderan Baru</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.new}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Sedang Diproses</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.processing}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Selesai</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.completed}</p>
            </Card>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {['all', 'new', 'processing', 'completed'].map((f) => (
              <Button
                key={f}
                onClick={() => setFilter(f)}
                variant={filter === f ? 'default' : 'outline'}
                className="whitespace-nowrap"
              >
                {f === 'all' && 'Semua'}
                {f === 'new' && 'Orderan Baru'}
                {f === 'processing' && 'Sedang Diproses'}
                {f === 'completed' && 'Selesai'}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <Card key={booking.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <img
                        src={booking.patientImage || '/placeholder.png'}
                        alt={booking.patientName}
                        className="h-14 w-14 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 flex-wrap">
                          <div>
                            <h3 className="font-semibold text-foreground">{booking.patientName}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{booking.service}</p>
                          </div>
                          <StatusBadge status={booking.status} />
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {booking.scheduledTime}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {booking.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {booking.patientPhone}
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="mt-3 p-2 rounded bg-secondary/30 text-sm text-foreground">
                            <p className="font-medium mb-1">Catatan:</p>
                            <p>{booking.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-col-reverse gap-2 w-full sm:w-auto">
                      {booking.status === 'completed' && booking.reportId && (
                        <Link to={`/dashboard/orders/${booking.id}`}>
                          <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                            Lihat Laporan
                          </Button>
                        </Link>
                      )}

                      {booking.status === 'processing' && (
                        <Link to={`/dashboard/chat/room/${booking.id}`}>
                          <Button className="w-full sm:w-auto gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Chat
                          </Button>
                        </Link>
                      )}

                      <Link to={`/dashboard/orders/${booking.id}`}>
                        <Button variant="default" className="w-full sm:w-auto">
                          {booking.status === 'new' ? 'Lihat Detail' : 'Detail'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Tidak ada orderan untuk status ini</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
