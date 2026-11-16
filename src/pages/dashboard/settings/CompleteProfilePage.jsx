import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';

export default function CompleteProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    profilePicture: user?.profilePicture || '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateProfile({
        ...formData,
        verificationStatus: 'pending',
      });
      setShowForm(false);
      navigate('/dashboard/verification');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Kelengkapan Data</h1>
            <p className="text-muted-foreground">Lengkapi data untuk melanjutkan verifikasi profil</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card
              className="p-6 cursor-pointer hover:border-primary transition-colors border-2"
              onClick={() => user?.verificationStatus === 'not_verified' && setShowForm(true)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-block mb-3">
                    <div className="rounded-lg bg-red-100 dark:bg-red-950 p-3">
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground">Belum Diverifikasi</h3>
                  <p className="text-sm text-muted-foreground mt-1">Lengkapi data diri Anda</p>
                </div>
                {user?.verificationStatus === 'not_verified' && (
                  <span className="text-xs font-semibold text-primary">→</span>
                )}
              </div>
              {user?.verificationStatus === 'not_verified' && (
                <p className="text-xs text-primary font-medium mt-3">Klik untuk melanjutkan</p>
              )}
            </Card>

            <Card className="p-6 opacity-75">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-block mb-3">
                    <div className="rounded-lg bg-yellow-100 dark:bg-yellow-950 p-3">
                      <Clock className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground">Menunggu Verifikasi</h3>
                  <p className="text-sm text-muted-foreground mt-1">Admin sedang memeriksa dokumen</p>
                </div>
                {user?.verificationStatus === 'pending' && (
                  <span className="text-xs font-semibold text-yellow-600">→</span>
                )}
              </div>
            </Card>

            <Card className="p-6 opacity-75">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-block mb-3">
                    <div className="rounded-lg bg-green-100 dark:bg-green-950 p-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground">Terverifikasi</h3>
                  <p className="text-sm text-muted-foreground mt-1">Profil Anda telah disetujui</p>
                </div>
              </div>
            </Card>
          </div>

          {showForm && (
            <Card className="p-8 border-2 border-primary">
              <h2 className="text-2xl font-bold text-foreground mb-6">Lengkapi Data Pribadi</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                    Nama Lengkap *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Nama lengkap Anda"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-foreground">
                    Nomor Telepon *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.name || !formData.phone}
                  >
                    {loading ? 'Memproses...' : 'Lanjutkan ke Verifikasi'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {!showForm && user?.verificationStatus === 'not_verified' && (
            <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                📋 Klik kartu "Belum Diverifikasi" di atas untuk memulai proses verifikasi profil Anda.
              </p>
            </Card>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
