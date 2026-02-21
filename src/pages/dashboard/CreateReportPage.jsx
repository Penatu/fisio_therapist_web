import { useBooking } from '@/lib/booking-context';
import { useNavigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function CreateReportPage() {
  const navigate = useNavigate();
  const { id: bookingId } = useParams();
  const { getBookingById, updateBooking, addReport } = useBooking();

  const booking = getBookingById(bookingId);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    diagnosis: '',
    treatment: '',
    recommendations: '',
    nextAppointment: '',
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.diagnosis || !formData.treatment) {
      alert('Diagnosis dan treatment harus diisi');
      return;
    }

    try {
      setLoading(true);

      const reportId = Date.now().toString();
      addReport({
        id: reportId,
        bookingId,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        recommendations: formData.recommendations,
        nextAppointment: formData.nextAppointment,
        createdAt: new Date().toISOString(),
      });

      updateBooking(bookingId, {
        status: 'completed',
        reportId,
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate('/dashboard/orders');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center py-8">
          <Card className="max-w-md w-full mx-4 p-8 text-center border-2 border-primary">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Laporan Berhasil Dibuat!</h2>
            <p className="text-muted-foreground mb-4">
              Laporan pemeriksaan telah disimpan dan orderan ditandai selesai.
            </p>
            <p className="text-sm text-muted-foreground">Mengalihkan ke daftar orderan...</p>
          </Card>
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

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Buat Laporan Pemeriksaan</h1>
            <p className="text-muted-foreground">Pasien: {booking.patientName}</p>
          </div>

          <Card className="p-6 mb-8 bg-secondary/30">
            <div className="flex gap-4 items-center">
              <img
                src={booking.patientImage || '/placeholder.png'}
                alt={booking.patientName}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-foreground">{booking.patientName}</p>
                <p className="text-sm text-muted-foreground">{booking.service}</p>
              </div>
            </div>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="diagnosis" className="text-foreground">
                    Diagnosis <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    id="diagnosis"
                    name="diagnosis"
                    placeholder="Masukkan diagnosis hasil pemeriksaan..."
                    value={formData.diagnosis}
                    onChange={handleInputChange}
                    className="mt-2 w-full min-h-24 rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="treatment" className="text-foreground">
                    Tindakan/Terapi <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    id="treatment"
                    name="treatment"
                    placeholder="Jelaskan tindakan dan terapi yang diberikan..."
                    value={formData.treatment}
                    onChange={handleInputChange}
                    className="mt-2 w-full min-h-24 rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="recommendations" className="text-foreground">
                    Rekomendasi/Saran
                  </Label>
                  <textarea
                    id="recommendations"
                    name="recommendations"
                    placeholder="Berikan rekomendasi untuk tindak lanjut pasien..."
                    value={formData.recommendations}
                    onChange={handleInputChange}
                    className="mt-2 w-full min-h-24 rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="nextAppointment" className="text-foreground">
                    Jadwal Kunjungan Berikutnya
                  </Label>
                  <Input
                    id="nextAppointment"
                    name="nextAppointment"
                    type="datetime-local"
                    value={formData.nextAppointment}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Simpan Laporan'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
