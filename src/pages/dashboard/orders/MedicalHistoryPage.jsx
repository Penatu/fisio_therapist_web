import { useEffect, useRef, useState } from 'react';
import { useBooking } from '@/lib/booking-context';
import { useNavigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { OrderDetailTabs } from '@/components/order-detail-tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { ArrowLeft, ChevronRight, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import useGetOrderDetail from '../hooks/useGetOrderDetail';

function HistoryField({ label, value }) {
  if (!value) return null;

  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">{label}</p>
      <div className="rounded-lg bg-secondary/30 p-4 text-foreground whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function consentHref(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return '';
}

function recordTitle(record) {
  return record.medicalRecordNumber || record.bookingCode || 'Rekam Medis';
}

function recordSummary(record) {
  return record.subjective || record.assessment || record.plan || 'Tidak ada ringkasan';
}

function HistoryDetailDialog({ record, patientName, onClose }) {
  const consent = record?.informedConsent;
  const consentUrl = consentHref(consent?.url);

  return (
    <Dialog.Root open={Boolean(record)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-card shadow-lg">
          {record && (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
                <div>
                  <Dialog.Title className="text-xl font-bold text-foreground">{recordTitle(record)}</Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    {[patientName, record.date || record.visitDate, record.bookingCode].filter(Boolean).join(' · ')}
                  </Dialog.Description>
                </div>
                <Dialog.Close className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Tutup</span>
                </Dialog.Close>
              </div>

              <div className="space-y-4 overflow-y-auto px-6 py-5">
                <HistoryField label="Waktu Kunjungan" value={record.visitDate} />
                <HistoryField label="S — Subjective" value={record.subjective} />
                <HistoryField label="O — Objective" value={record.objective} />
                <HistoryField label="A — Assessment" value={record.assessment} />
                <HistoryField label="P — Plan" value={record.plan} />
                <HistoryField label="Pemeriksaan Penunjang" value={record.supportingExamination} />
                <HistoryField label="Evidence Based Practice" value={record.evidenceBasedPractice} />
                <HistoryField label="Catatan Tambahan" value={record.additionalNotes} />

                {consent?.name || consent?.url ? (
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Inform Consent</p>
                    {consentUrl ? (
                      <a
                        href={consentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary underline"
                      >
                        {consent.name || 'Lihat dokumen'}
                      </a>
                    ) : (
                      <div className="rounded-lg bg-secondary/30 p-4 text-foreground">
                        {consent.name || consent.url}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function MedicalHistoryPage() {
  const navigate = useNavigate();
  const { id: bookingId } = useParams();
  const { getBookingById, upsertBooking } = useBooking();
  const { order, loading, error, getOrderDetail } = useGetOrderDetail();
  const [selectedRecord, setSelectedRecord] = useState(null);
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
  const records = order?.medicalRecords ?? booking?.medicalRecords ?? (loading || !error ? null : []);

  const loadDetail = async () => {
    try {
      const detail = await getOrderDetail(bookingId);
      upsertBooking(detail);
    } catch {
      // Pesan error ditampilkan dari hook.
    }
  };

  if (!booking && (loading || !error)) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
          <div className="mx-auto max-w-4xl px-4">
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Memuat riwayat medis...</p>
            </Card>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

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
              <p className="text-muted-foreground">Orderan tidak ditemukan</p>
            </Card>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

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

          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">Riwayat Medis</h1>
              <p className="text-muted-foreground">{booking.patientName}</p>
            </div>
            <StatusBadge status={booking.status} label={booking.statusLabel} />
          </div>

          <OrderDetailTabs bookingId={booking.id} />

          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
              <p>{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={loadDetail} disabled={loading}>
                {loading ? 'Memuat...' : 'Muat ulang'}
              </Button>
            </div>
          )}

          {records == null ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Memuat riwayat medis...</p>
            </Card>
          ) : records.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Riwayat medis untuk pasien ini belum tersedia</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => setSelectedRecord(record)}
                  className="block w-full text-left"
                >
                  <Card className="p-5 transition-shadow hover:shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-foreground">{recordTitle(record)}</p>
                          <p className="text-sm text-muted-foreground">{record.date || record.visitDate}</p>
                        </div>
                        {record.bookingCode && (
                          <p className="mt-1 text-xs text-muted-foreground">{record.bookingCode}</p>
                        )}
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{recordSummary(record)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <HistoryDetailDialog
        record={selectedRecord}
        patientName={booking.patientName}
        onClose={() => setSelectedRecord(null)}
      />
    </ProtectedRoute>
  );
}
