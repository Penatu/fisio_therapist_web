import { useBooking } from "@/lib/booking-context";
import { isOrderPaid } from "./hooks/useGetOrderList";
import { useNavigate, useParams } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected-route";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Upload, FileText, X } from "lucide-react";
import { useState, useRef } from "react";

export default function CreateReportPage() {
  const navigate = useNavigate();
  const { id: bookingId } = useParams();
  const { getBookingById, updateBooking, addReport } = useBooking();

  const booking = getBookingById(bookingId);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [informConsentFile, setInformConsentFile] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    visitDate: "",
    visitTime: "",
    notes: "",
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

  if (!isOrderPaid(booking)) {
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

            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              Laporan hanya bisa dibuat setelah pasien membayar. bantu ingatkan
              pasien untuk membayar.
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInformConsentFile(file);
    }
  };

  const handleRemoveFile = () => {
    setInformConsentFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOrderPaid(booking)) {
      alert("Laporan hanya bisa dibuat setelah pasien membayar.");
      return;
    }

    if (!formData.subjective || !formData.assessment) {
      alert("Subjective dan Assessment harus diisi");
      return;
    }

    try {
      setLoading(true);

      const reportId = Date.now().toString();
      addReport({
        id: reportId,
        bookingId,
        subjective: formData.subjective,
        objective: formData.objective,
        assessment: formData.assessment,
        plan: formData.plan,
        informConsent: informConsentFile ? informConsentFile.name : null,
        nextAppointment:
          formData.visitDate && formData.visitTime
            ? `${formData.visitDate}T${formData.visitTime}`
            : formData.visitDate,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
      });

      updateBooking(bookingId, {
        status: "completed",
        reportId,
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate("/dashboard/orders");
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
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Laporan Berhasil Dibuat!
            </h2>
            <p className="text-muted-foreground mb-4">
              Laporan pemeriksaan telah disimpan dan orderan ditandai selesai.
            </p>
            <p className="text-sm text-muted-foreground">
              Mengalihkan ke daftar orderan...
            </p>
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
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Buat Laporan Pemeriksaan
            </h1>
            <p className="text-muted-foreground">
              Pasien: {booking.patientName}
            </p>
          </div>

          <Card className="p-6 mb-8 bg-secondary/30">
            <div className="flex gap-4 items-center">
              <img
                src={booking.patientImage || "/placeholder.png"}
                alt={booking.patientName}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-foreground">
                  {booking.patientName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.service}
                </p>
              </div>
            </div>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SOAP Section */}
            <Card className="p-8">
              <h2 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-border">
                Catatan SOAP
              </h2>
              <div className="space-y-6">
                {/* Subjective */}
                <div>
                  <Label
                    htmlFor="subjective"
                    className="text-foreground font-medium"
                  >
                    S — Subjective <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    Keluhan utama pasien (apa yang dirasakan, lokasi, skala
                    nyeri, durasi)
                  </p>
                  <textarea
                    id="subjective"
                    name="subjective"
                    placeholder="Contoh: Pasien mengeluh nyeri punggung bawah skala 6/10, sudah 3 hari, memburuk saat membungkuk..."
                    value={formData.subjective}
                    onChange={handleInputChange}
                    className="w-full min-h-24 rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    required
                  />
                </div>

                {/* Objective */}
                <div>
                  <Label
                    htmlFor="objective"
                    className="text-foreground font-medium"
                  >
                    O — Objective
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    Hasil pemeriksaan fisik, ROM, kekuatan otot, observasi
                    terapis
                  </p>
                  <textarea
                    id="objective"
                    name="objective"
                    placeholder="Contoh: ROM fleksi lumbal 60°, ekstensi 15°, SLR positif kanan, kekuatan otot core 3/5..."
                    value={formData.objective}
                    onChange={handleInputChange}
                    className="w-full min-h-24 rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                {/* Assessment */}
                <div>
                  <Label
                    htmlFor="assessment"
                    className="text-foreground font-medium"
                  >
                    A — Assessment <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    Diagnosis fisioterapi, analisis kondisi, dan perkembangan
                    pasien
                  </p>
                  <textarea
                    id="assessment"
                    name="assessment"
                    placeholder="Contoh: Low back pain kronik dengan kelemahan otot core, nyeri berkurang dari skala 8 menjadi 6..."
                    value={formData.assessment}
                    onChange={handleInputChange}
                    className="w-full min-h-24 rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    required
                  />
                </div>

                {/* Plan */}
                <div>
                  <Label htmlFor="plan" className="text-foreground font-medium">
                    P — Plan
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    Rencana tindakan, terapi, dan program latihan selanjutnya
                  </p>
                  <textarea
                    id="plan"
                    name="plan"
                    placeholder="Contoh: Lanjutkan TENS 20 menit, core stabilization exercise 3x seminggu, edukasi ergonomi..."
                    value={formData.plan}
                    onChange={handleInputChange}
                    className="w-full min-h-24 rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </Card>

            {/* Inform Consent & Schedule */}
            <Card className="p-8">
              <h2 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-border">
                Dokumen & Jadwal
              </h2>
              <div className="space-y-6">
                {/* Upload Inform Consent */}
                <div>
                  <Label className="text-foreground font-medium">
                    Upload Inform Consent
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    Upload dokumen persetujuan tindakan fisioterapi (PDF, JPG,
                    PNG)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="informConsent"
                  />
                  {!informConsentFile ? (
                    <label
                      htmlFor="informConsent"
                      className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-lg cursor-pointer bg-secondary/20 hover:bg-secondary/40 transition-colors"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-primary">
                          Klik untuk upload
                        </span>{" "}
                        atau drag & drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, JPG, PNG (maks. 5 MB)
                      </p>
                    </label>
                  ) : (
                    <div className="mt-2 flex items-center gap-3 p-4 border border-input rounded-lg bg-secondary/20">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground truncate flex-1">
                        {informConsentFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Next Appointment */}
                <div>
                  <Label className="text-foreground font-medium">
                    Waktu Kunjungan
                  </Label>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label
                        htmlFor="visitDate"
                        className="text-sm text-muted-foreground"
                      >
                        Tanggal
                      </Label>
                      <Input
                        id="visitDate"
                        name="visitDate"
                        type="date"
                        value={formData.visitDate}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="visitTime"
                        className="text-sm text-muted-foreground"
                      >
                        Jam
                      </Label>
                      <Input
                        id="visitTime"
                        name="visitTime"
                        type="time"
                        value={formData.visitTime}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label
                    htmlFor="notes"
                    className="text-foreground font-medium"
                  >
                    Catatan Tambahan
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    Informasi lain yang perlu dicatat untuk sesi berikutnya
                  </p>
                  <textarea
                    id="notes"
                    name="notes"
                    placeholder="Catatan tambahan untuk terapis atau pasien..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full min-h-20 rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
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
              <Button type="submit" disabled={loading}>
                {loading ? "Memproses..." : "Simpan Laporan"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
