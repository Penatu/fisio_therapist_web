import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const WEEKDAY_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const WEEKDAY_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const toKey = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const monthPrefix = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}-`;

const normalizeDates = (value) =>
  [...new Set((Array.isArray(value) ? value : []).filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item)))].sort();

const formatDateLabel = (key) => {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return `${WEEKDAY_LONG[date.getDay()]}, ${day} ${MONTHS[month - 1]} ${year}`;
};

export default function PracticeSchedulePage() {
  const { user, isLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [hydrated, setHydrated] = useState(() => Boolean(user));
  const [dates, setDates] = useState(() => normalizeDates(user?.practiceSchedule));

  useEffect(() => {
    if (!hydrated && user) {
      setDates(normalizeDates(user.practiceSchedule));
      setHydrated(true);
    }
  }, [hydrated, user]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const savedDates = useMemo(() => normalizeDates(user?.practiceSchedule), [user?.practiceSchedule]);
  const dirty = savedDates.join('|') !== dates.join('|');
  const prefix = monthPrefix(cursor.year, cursor.month);
  const selectedThisMonth = dates.filter((key) => key.startsWith(prefix));

  const cells = useMemo(() => {
    const firstWeekday = (new Date(cursor.year, cursor.month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const grid = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      grid.push(day);
    }
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [cursor.month, cursor.year]);

  const shiftMonth = (amount) => {
    setCursor((current) => {
      const next = new Date(current.year, current.month + amount, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
    setSuccess(false);
  };

  const toggleDate = (day) => {
    const key = toKey(cursor.year, cursor.month, day);
    setDates((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return normalizeDates([...next]);
    });
    setSuccess(false);
    setError('');
  };

  const selectWeekdays = () => {
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    setDates((current) => {
      const next = new Set(current);
      for (let day = 1; day <= daysInMonth; day += 1) {
        const weekday = new Date(cursor.year, cursor.month, day).getDay();
        if (weekday !== 0 && weekday !== 6) {
          next.add(toKey(cursor.year, cursor.month, day));
        }
      }
      return normalizeDates([...next]);
    });
    setSuccess(false);
  };

  const clearMonth = () => {
    setDates((current) => current.filter((key) => !key.startsWith(prefix)));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await updateProfile({ practiceSchedule: dates });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan jadwal');
    } finally {
      setSaving(false);
    }
  };

  const isCurrentMonth =
    cursor.year === today.getFullYear() && cursor.month === today.getMonth();

  if (!hydrated) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">{isLoading ? 'Memuat...' : 'Memuat jadwal...'}</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-3xl px-4">
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke pengaturan
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Atur Jadwal Praktek</h1>
            <p className="text-muted-foreground">
              Pilih tanggal pada bulan yang ingin Anda buka untuk praktek. Tanggal di bulan lain tetap tersimpan.
            </p>
          </div>

          {success && (
            <div className="mb-6 flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-600 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">Jadwal praktek berhasil disimpan</p>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <Button type="button" variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="Bulan sebelumnya">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">
                  {MONTHS[cursor.month]} {cursor.year}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedThisMonth.length} hari dipilih di bulan ini
                </p>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="Bulan berikutnya">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectWeekdays}>
                Pilih hari kerja
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearMonth}>
                Hapus bulan ini
              </Button>
              {!isCurrentMonth && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCursor({ year: today.getFullYear(), month: today.getMonth() })
                  }
                >
                  Bulan ini
                </Button>
              )}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {WEEKDAY_SHORT.map((label) => (
                <div key={label} className="pb-1 text-center text-xs font-medium text-muted-foreground">
                  {label}
                </div>
              ))}
              {cells.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const key = toKey(cursor.year, cursor.month, day);
                const selected = dates.includes(key);
                const isToday =
                  day === today.getDate() &&
                  cursor.month === today.getMonth() &&
                  cursor.year === today.getFullYear();

                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${formatDateLabel(key)}${selected ? ', dipilih' : ''}`}
                    onClick={() => toggleDate(day)}
                    className={`aspect-square rounded-lg border text-sm font-medium transition-colors ${
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:border-primary/60 hover:bg-primary/5'
                    } ${isToday && !selected ? 'ring-2 ring-primary/40' : ''}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="mt-6 p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Tanggal praktek {MONTHS[cursor.month]} {cursor.year}
            </h2>
            {selectedThisMonth.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Belum ada tanggal yang dipilih. Ketuk tanggal pada kalender untuk menandainya.
              </p>
            ) : (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {selectedThisMonth.map((key) => (
                  <li
                    key={key}
                    className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground"
                  >
                    {formatDateLabel(key)}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Total tanggal dipilih di semua bulan: {dates.length} hari
            </p>
          </Card>

          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/settings')}>
              Batal
            </Button>
            <Button type="button" size="lg" onClick={handleSave} disabled={!dirty || saving}>
              {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
            </Button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
