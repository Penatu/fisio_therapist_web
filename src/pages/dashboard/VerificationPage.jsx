import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { DocumentUpload } from '@/components/document-upload';
import { LocationSelector } from '@/components/location-selector';
import { ProtectedRoute } from '@/components/protected-route';
import { CheckCircle2, Clock, FileCheck } from 'lucide-react';

export default function VerificationPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    ktp: user?.ktp || '',
    str: user?.str || '',
    sip: user?.sip || '',
    ijazah: user?.ijazah || '',
    practiceLocations: user?.practiceLocations || [],
    bankAccountName: user?.bankAccountName || '',
    bankAccountNumber: user?.bankAccountNumber || '',
    bankName: user?.bankName || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentChange = (field, file) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const validateForm = () => {
    if (!formData.ktp) { alert('KTP harus diunggah'); return false; }
    if (!formData.str) { alert('STR harus diunggah'); return false; }
    if (!formData.sip) { alert('SIP harus diunggah'); return false; }
    if (!formData.ijazah) { alert('Ijazah harus diunggah'); return false; }
    if (formData.practiceLocations.length === 0) { alert('Minimal pilih satu lokasi praktek'); return false; }
    if (!formData.bankAccountName || !formData.bankAccountNumber) { alert('Data bank harus lengkap'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await updateProfile({
        ...formData,
        verificationStatus: 'pending',
      });
      setSubmitted(true);
      setTimeout(() => {
        navigate('/dashboard/orders');
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Pengajuan gagal');
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
            <h2 className="text-2xl font-bold text-foreground mb-2">Pengajuan Berhasil!</h2>
            <p className="text-muted-foreground mb-4">
              Data Anda sedang diproses oleh admin. Kami akan memberitahu Anda setelah verifikasi selesai.
            </p>
            <p className="text-sm text-muted-foreground">Mengalihkan ke dashboard...</p>
          </Card>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Verifikasi Data Lengkap</h1>
            <p className="text-muted-foreground">
              Lengkapi semua dokumen yang diperlukan untuk verifikasi profil
            </p>
          </div>

          <Card className="p-6 mb-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">Status Pengajuan</p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Setelah Anda menyelesaikan pengajuan, status akan berubah menjadi "Menunggu Verifikasi" dan akan diproses oleh admin kami.
                </p>
              </div>
            </div>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="p-8">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Dokumen Verifikasi
              </h2>

              <div className="space-y-6">
                <DocumentUpload
                  label="KTP (Kartu Tanda Penduduk)"
                  documentType="Foto KTP"
                  value={formData.ktp}
                  onChange={(file) => handleDocumentChange('ktp', file)}
                  required
                  helperText="Unggah foto atau scan KTP Anda yang masih berlaku"
                />

                <DocumentUpload
                  label="STR (Surat Tanda Registrasi)"
                  documentType="Dokumen STR"
                  value={formData.str}
                  onChange={(file) => handleDocumentChange('str', file)}
                  required
                  helperText="Unggah sertifikat STR dari Kementerian Kesehatan"
                />

                <DocumentUpload
                  label="SIP (Surat Izin Praktik)"
                  documentType="Dokumen SIP"
                  value={formData.sip}
                  onChange={(file) => handleDocumentChange('sip', file)}
                  required
                  helperText="Unggah sertifikat SIP dari dinas kesehatan setempat"
                />

                <DocumentUpload
                  label="Ijazah"
                  documentType="Ijazah Pendidikan"
                  value={formData.ijazah}
                  onChange={(file) => handleDocumentChange('ijazah', file)}
                  required
                  helperText="Unggah scan atau foto ijazah terakhir Anda"
                />
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-xl font-bold text-foreground mb-6">Informasi Praktek</h2>

              <div className="space-y-6">
                <LocationSelector
                  locations={formData.practiceLocations}
                  onChange={(locations) =>
                    setFormData((prev) => ({
                      ...prev,
                      practiceLocations: locations,
                    }))
                  }
                />
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-xl font-bold text-foreground mb-6">Informasi Rekening Bank</h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="bankName" className="text-foreground">
                    Nama Bank *
                  </Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    placeholder="Contoh: Bank Central Asia"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="bankAccountName" className="text-foreground">
                    Nama Pemilik Rekening *
                  </Label>
                  <Input
                    id="bankAccountName"
                    name="bankAccountName"
                    placeholder="Nama sesuai rekening bank"
                    value={formData.bankAccountName}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="bankAccountNumber" className="text-foreground">
                    Nomor Rekening *
                  </Label>
                  <Input
                    id="bankAccountNumber"
                    name="bankAccountNumber"
                    placeholder="Nomor rekening"
                    value={formData.bankAccountNumber}
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
                Kembali
              </Button>
              <Button
                type="submit"
                disabled={loading}
                size="lg"
              >
                {loading ? 'Memproses...' : 'Ajukan Verifikasi'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
