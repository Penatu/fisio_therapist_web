import { useBooking } from '@/lib/booking-context';
import { useNavigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer } from 'lucide-react';

function formatVisitDateTime(value) {
  if (!value) return '';
  const normalized = String(value).trim().replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReportPage() {
  const navigate = useNavigate();
  const { id: bookingId } = useParams();

  const { getBookingById, getReportsByBookingId } = useBooking();

  const booking = getBookingById(bookingId);
  const reports = getReportsByBookingId(bookingId);
  const report = reports[0];

  if (!booking || !report) {
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
              <p className="text-muted-foreground">Laporan tidak ditemukan</p>
            </Card>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('Laporan akan diunduh dalam format PDF');
  };

  const reportDate = new Date(report.createdAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const visitDateTime = report.visitDateTime || report.nextAppointment;
  const visitLabel = formatVisitDateTime(visitDateTime);
  const consent = report.informedConsent;
  const sections = [
    { title: 'Subjective', value: report.subjective || report.diagnosis },
    { title: 'Objective', value: report.objective },
    { title: 'Assessment', value: report.assessment },
    { title: 'Plan', value: report.plan || report.treatment },
    { title: 'Pemeriksaan Penunjang', value: report.supportingExamination },
    { title: 'Evidence Based Practice', value: report.evidenceBasedPractice },
    { title: 'Rekomendasi', value: report.recommendations },
    { title: 'Catatan Tambahan', value: report.additionalNotes || report.notes },
  ].filter((section) => section.value);

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

          <div className="flex gap-4 mb-6 print:hidden">
            <Button onClick={handlePrint} variant="outline" className="gap-2 bg-transparent">
              <Printer className="h-4 w-4" />
              Cetak
            </Button>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Unduh PDF
            </Button>
          </div>

          <div className="print:hidden mb-8">
            <h1 className="text-3xl font-bold text-foreground">Laporan Pemeriksaan</h1>
            <p className="text-muted-foreground mt-2">Tanggal: {reportDate}</p>
          </div>

          <Card className="p-8 bg-white dark:bg-card text-foreground">
            <div className="hidden print:block text-center mb-8">
              <h1 className="text-2xl font-bold">LAPORAN PEMERIKSAAN FISIOTERAPI</h1>
              <p className="text-sm text-muted-foreground mt-2">PhysioApp</p>
            </div>

            <div className="mb-8 pb-8 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Informasi Pasien</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama Pasien</p>
                  <p className="font-medium text-foreground">{booking.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Telepon</p>
                  <p className="font-medium text-foreground">{booking.patientPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jenis Layanan</p>
                  <p className="font-medium text-foreground">{booking.service}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lokasi</p>
                  <p className="font-medium text-foreground">{booking.location}</p>
                </div>
              </div>
            </div>

            {sections.map((section) => (
              <div key={section.title} className="mb-8 pb-8 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">{section.title}</h2>
                <div className="p-4 rounded-lg bg-secondary/30 text-foreground whitespace-pre-wrap">
                  {section.value}
                </div>
              </div>
            ))}

            {consent?.url && (
              <div className="mb-8 pb-8 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground mb-4">Inform Consent</h2>
                <a
                  href={consent.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline"
                >
                  {consent.name || 'Lihat dokumen'}
                </a>
              </div>
            )}

            {visitLabel && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">Waktu Kunjungan</h2>
                <p className="font-medium text-foreground">{visitLabel}</p>
              </div>
            )}

            <div className="hidden print:block mt-12 pt-8 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Laporan ini dibuat oleh sistem PhysioApp pada {reportDate}
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Dokumen ini adalah milik pasien dan harus disimpan dengan baik
              </p>
            </div>
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  );
}
