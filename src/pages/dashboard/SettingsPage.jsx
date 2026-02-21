import { ProtectedRoute } from '@/components/protected-route';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileSettingsTab from './settings/ProfileSettingsTab';

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Pengaturan</h1>
            <p className="text-muted-foreground">Kelola akun dan profil Anda</p>
          </div>

          <ProfileSettingsTab />
        </div>
      </main>
    </ProtectedRoute>
  );
}
