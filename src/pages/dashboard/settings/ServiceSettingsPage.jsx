import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useTherapistServices from '@/pages/dashboard/hooks/useTherapistServices';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const sameId = (left, right) => left != null && right != null && String(left) === String(right);

export default function ServiceSettingsPage() {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const { services, loading, saving, error, reload, saveActiveService } = useTherapistServices();
  const [selectedId, setSelectedId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const marked = services.find((service) => service.flag === true) || services.find((service) => service.flag === false);
    const activeId = marked?.id ?? null;
    setSelectedId(activeId);
    setSavedId(activeId);
  }, [services]);

  const selectedService = services.find((service) => sameId(service.id, selectedId));
  const dirty = selectedId != null && !sameId(selectedId, savedId);

  const handleSave = async () => {
    if (!selectedService) return;
    setSuccess(false);
    setSaveError('');

    try {
      const saved = await saveActiveService(selectedService.id);
      const nextId = saved?.id ?? selectedService.id;
      setSelectedId(nextId);
      setSavedId(nextId);
      await updateProfile({
        activeServiceId: nextId,
        activeServiceName: saved?.name || selectedService.name,
      });
      setSuccess(true);
    } catch (err) {
      setSaveError(err.message || 'Gagal menyimpan layanan');
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke pengaturan
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Layanan</h1>
            <p className="text-muted-foreground">
              Pilih satu layanan yang akan diaktifkan. Layanan lain otomatis nonaktif.
            </p>
          </div>

          {success && (
            <div className="mb-6 flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-600 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">Layanan aktif berhasil disimpan</p>
            </div>
          )}

          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
              <p>{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={reload} disabled={loading}>
                {loading ? 'Memuat...' : 'Muat ulang'}
              </Button>
            </div>
          )}

          {saveError && (
            <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{saveError}</div>
          )}

          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Memuat layanan...</p>
            </Card>
          ) : services.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-base font-semibold text-foreground">Belum ada layanan</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Layanan yang bisa diaktifkan akan muncul di sini setelah tersedia.
              </p>
            </Card>
          ) : (
            <fieldset>
              <legend className="sr-only">Pilih satu layanan aktif</legend>
              <div className="space-y-3">
                {services.map((service) => {
                  const selected = sameId(service.id, selectedId);
                  const isActive = service.flag === true;
                  const isPending = service.flag === false;

                  return (
                    <label key={service.id} className="block cursor-pointer">
                      <Card
                        className={`flex-row items-start gap-4 p-5 transition-colors ${
                          selected ? 'border-primary' : 'hover:border-primary/60'
                        }`}
                      >
                        <input
                          type="radio"
                          name="active-service"
                          className="mt-1 h-5 w-5 shrink-0 accent-primary"
                          checked={selected}
                          onChange={() => {
                            setSelectedId(service.id);
                            setSuccess(false);
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold text-foreground">{service.name}</span>
                            {isActive && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                Aktif
                              </span>
                            )}
                            {isPending && (
                              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
                                Masih proses
                              </span>
                            )}
                          </span>
                          {service.category && (
                            <span className="mt-1 block text-sm text-muted-foreground">{service.category}</span>
                          )}
                          {service.description && (
                            <span className="mt-2 block text-sm text-muted-foreground">{service.description}</span>
                          )}
                          {(service.durationLabel || service.priceLabel) && (
                            <span className="mt-2 block text-xs font-medium text-foreground">
                              {[service.durationLabel, service.priceLabel].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </span>
                      </Card>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {!loading && services.length > 0 && (
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard/settings')}>
                Batal
              </Button>
              <Button type="button" size="lg" onClick={handleSave} disabled={!dirty || saving}>
                {saving ? 'Menyimpan...' : 'Simpan Layanan'}
              </Button>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
