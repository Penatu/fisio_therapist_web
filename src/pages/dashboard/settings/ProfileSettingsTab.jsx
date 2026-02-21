import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DocumentUpload } from '@/components/document-upload';
import { LocationSelector } from '@/components/location-selector';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ProfileSettingsTab() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    profilePicture: user?.profilePicture || '',
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

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profilePicture: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (field, file) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      setLoading(true);
      await updateProfile(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="flex gap-3 rounded-lg bg-green-50 dark:bg-green-950 p-4 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">Profil berhasil diperbarui</p>
        </div>
      )}

      {error && (
        <div className="flex gap-3 rounded-lg bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Informasi Pribadi</h3>

        <div className="space-y-4">
          <div>
            <Label className="text-foreground mb-2 block">Foto Profil</Label>
            <div className="flex items-end gap-4">
              <div className="flex-shrink-0">
                {formData.profilePicture ? (
                  <img
                    src={formData.profilePicture}
                    alt="Profile"
                    className="h-20 w-20 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-secondary border-2 border-dashed border-primary flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Foto</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name" className="text-foreground">
              Nama Lengkap
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-foreground">
              Nomor Telepon
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Dokumen Verifikasi</h3>

        <div className="space-y-6">
          <DocumentUpload
            label="KTP"
            documentType="Foto KTP"
            value={formData.ktp}
            onChange={(file) => handleDocumentChange('ktp', file)}
          />

          <DocumentUpload
            label="STR (Surat Tanda Registrasi)"
            documentType="Dokumen STR"
            value={formData.str}
            onChange={(file) => handleDocumentChange('str', file)}
          />

          <DocumentUpload
            label="SIP (Surat Izin Praktik)"
            documentType="Dokumen SIP"
            value={formData.sip}
            onChange={(file) => handleDocumentChange('sip', file)}
          />

          <DocumentUpload
            label="Ijazah"
            documentType="Ijazah Pendidikan"
            value={formData.ijazah}
            onChange={(file) => handleDocumentChange('ijazah', file)}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Informasi Praktek</h3>

        <LocationSelector
          locations={formData.practiceLocations}
          onChange={(locations) =>
            setFormData((prev) => ({
              ...prev,
              practiceLocations: locations,
            }))
          }
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Rekening Bank</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="bankName" className="text-foreground">
              Nama Bank
            </Label>
            <Input
              id="bankName"
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="bankAccountName" className="text-foreground">
              Nama Pemilik Rekening
            </Label>
            <Input
              id="bankAccountName"
              name="bankAccountName"
              value={formData.bankAccountName}
              onChange={handleInputChange}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="bankAccountNumber" className="text-foreground">
              Nomor Rekening
            </Label>
            <Input
              id="bankAccountNumber"
              name="bankAccountNumber"
              value={formData.bankAccountNumber}
              onChange={handleInputChange}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          size="lg"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}
