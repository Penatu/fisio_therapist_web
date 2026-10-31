import { useState } from 'react';
import { useBooking } from '@/lib/booking-context';
import { getMedicalHistoryRecords } from '@/lib/medical-history';
import { useNavigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { OrderDetailTabs } from '@/components/order-detail-tabs';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { ArrowLeft, ChevronRight, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

function HistoryField({ label, value }) {
  if (!value) return null;

  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">{label}</p>
      <div className="rounded-lg bg-secondary/30 p-4 text-foreground whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function HistoryDetailDialog({ record, patientName, onClose }) {
  return (
    <Dialog.Root open={Boolean(record)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-card shadow-lg">
          {record && (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
                <div>
                  <Dialog.Title className="text-xl font-bold text-foreground">{record.title}</Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    {patientName} · {record.date}
                  </Dialog.Description>
                </div>
                <Dialog.Close className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Tutup</span>
                </Dialog.Close>
              </div>

              <div className="space-y-6 overflow-y-auto px-6 py-5">
                <div className="space-y-4">
                  <HistoryField label="Keluhan Utama" value={record.chiefComplaint} />
                  <HistoryField label="Riwayat Penyakit Sekarang" value={record.presentIllness} />
                  <HistoryField label="Riwayat Penyakit Dahulu" value={record.pastHistory} />
                  <HistoryField label="Tindakan" value={record.treatment} />
                  <HistoryField label="Catatan" value={record.notes} />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Obat yang Dikonsumsi</p>
                    <ul className="space-y-2">
                      {record.medications.map((item) => (
                        <li key={item} className="rounded-lg bg-secondary/30 px-4 py-3 text-foreground">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Alergi</p>
                    <ul className="space-y-2">
                      {record.allergies.map((item) => (
                        <li key={item} className="rounded-lg bg-secondary/30 px-4 py-3 text-foreground">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
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
  const { getBookingById } = useBooking();
  const [selectedRecord, setSelectedRecord] = useState(null);

  const booking = getBookingById(bookingId);
  const records = getMedicalHistoryRecords(bookingId);

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
            <StatusBadge status={booking.status} />
          </div>

          <OrderDetailTabs bookingId={booking.id} />

          {records.length === 0 ? (
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
                          <p className="font-semibold text-foreground">{record.title}</p>
                          <p className="text-sm text-muted-foreground">{record.date}</p>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{record.summary}</p>
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
