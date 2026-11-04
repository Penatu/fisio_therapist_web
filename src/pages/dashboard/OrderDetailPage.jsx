import { useBooking } from '@/lib/booking-context';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { OrderDetailTabs } from '@/components/order-detail-tabs';
import { ArrowLeft, Clock, MapPin, Phone, MessageSquare, FileText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import useGetOrderDetail from './hooks/useGetOrderDetail';

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { id: bookingId } = useParams();
  const { getBookingById, updateBooking, upsertBooking } = useBooking();
  const { order, loading, error, getOrderDetail } = useGetOrderDetail();
  const [accepting, setAccepting] = useState(false);
  const upsertRef = useRef(upsertBooking);
  upsertRef.current = upsertBooking;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const detail = await getOrderDetail(bookingId);
        if (!cancelled) upsertRef.current(detail);
      } catch {
        // Pesan error ditampilkan dari hook.
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [bookingId, getOrderDetail]);

  const booking = order || getBookingById(bookingId);

  const loadDetail = async () => {
    try {
      const detail = await getOrderDetail(bookingId);
      upsertBooking(detail);
    } catch {
      // Pesan error ditampilkan dari hook.
    }
  };

  if (!booking) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
          <div className="mx-auto max-w-4xl px-4">
            <button
              onClick={() => navigate(-1)}
              className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>

            {error && (
              <div className="mb-6 flex flex-col gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
                <p>{error}</p>
                <Button type="button" variant="outline" size="sm" onClick={loadDetail} disabled={loading}>
                  {loading ? 'Memuat...' : 'Muat ulang'}
                </Button>
              </div>
            )}

            <Card className="p-12 text-center">
              <p className="text-muted-foreground">{loading ? 'Memuat detail orderan...' : 'Orderan tidak ditemukan'}</p>
            </Card>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  const handleAcceptOrder = async () => {
    try {
      setAccepting(true);
      updateBooking(booking.id, { status: 'processing' });
      navigate('/dashboard/orders');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
              <p>{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={loadDetail} disabled={loading}>
                {loading ? 'Memuat...' : 'Muat ulang'}
              </Button>
            </div>
          )}

          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Detail Orderan</h1>
              <p className="text-muted-foreground">ID: {booking.id}</p>
            </div>
            <StatusBadge status={booking.status} label={booking.statusLabel} />
          </div>

          <OrderDetailTabs bookingId={booking.id} />

          <Card className="p-8 mb-6">
            <div className="flex gap-6 items-start">
              <img
                src={booking.patientImage || '/placeholder.png'}
                alt={booking.patientName}
                className="h-24 w-24 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-1">{booking.patientName}</h2>
                <p className="text-muted-foreground mb-4">Pasien</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {booking.patientPhone}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {booking.scheduledTime}
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-xs">Alamat lengkap</p>
                      <p className="mt-0.5 text-foreground">{booking.patientAddress || '-'}</p>
                      {booking.location && booking.location !== booking.patientAddress && (
                        <p className="mt-0.5 text-foreground">{booking.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Informasi Layanan</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Jenis Layanan</p>
                <p className="text-lg font-semibold text-foreground">{booking.service || '-'}</p>
              </div>

              {booking.paymentLabel && (
                <div>
                  <p className="text-sm text-muted-foreground">Status Pembayaran</p>
                  <p className="text-lg font-semibold text-foreground">{booking.paymentLabel}</p>
                </div>
              )}

              {booking.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Catatan</p>
                  <div className="p-4 rounded-lg bg-secondary/30 text-foreground">
                    {booking.notes}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            {booking.status === 'new' && (
              <Button
                onClick={handleAcceptOrder}
                disabled={accepting}
                size="lg"
                className="flex-1"
              >
                {accepting ? 'Memproses...' : 'Terima Orderan'}
              </Button>
            )}

            {booking.status === 'processing' && (
              <>
                <Link to={`/dashboard/chat/room/${bookingId}`} className="flex-1">
                  <Button size="lg" className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat dengan Pasien
                  </Button>
                </Link>
                <Link to={`/dashboard/orders/${bookingId}/create-report`} className="flex-1">
                  <Button variant="outline" size="lg" className="w-full gap-2 bg-transparent">
                    <FileText className="h-4 w-4" />
                    Buat Laporan
                  </Button>
                </Link>
              </>
            )}

            {booking.status === 'completed' && booking.reportId && (
              <Link to={`/dashboard/orders/${bookingId}/report`} className="flex-1">
                <Button size="lg" className="w-full gap-2">
                  <FileText className="h-4 w-4" />
                  Lihat Laporan
                </Button>
              </Link>
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              Tutup
            </Button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
