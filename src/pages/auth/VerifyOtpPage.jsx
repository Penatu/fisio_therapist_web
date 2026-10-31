import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import useVerifyOtp from './hooks/useVerifyOtp';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyOtp, error, loading, setError } = useVerifyOtp();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const otpCode = otp.join('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email tidak ditemukan');
      return;
    }

    if (otpCode.length !== 6) {
      setError('OTP harus 6 digit');
      return;
    }

    try {
      await verifyOtp({ email, otp: otpCode });
      toast({
        title: 'Verifikasi OTP berhasil',
        description: 'Silakan login untuk melanjutkan.',
      });
      navigate('/auth/login');
    } catch {
      // Pesan error sudah diisi oleh hook.
    }
  };

  const handleResend = () => {
    setTimer(120);
    setCanResend(false);
    setError('');
    console.log('[Auth] OTP dikirim ulang ke', email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          <div className="mb-8 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold mb-4">
              P
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verifikasi OTP</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Kami telah mengirim kode ke{' '}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 flex gap-3 rounded-lg bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <Label className="text-foreground mb-4 block text-center">
                Masukkan 6 digit OTP
              </Label>
              <div className="flex gap-3 justify-center">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="h-12 w-12 text-center text-lg font-semibold"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full h-10"
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            {!canResend ? (
              <p className="text-sm text-muted-foreground">
                Kirim ulang dalam{' '}
                <span className="font-semibold text-foreground">
                  {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                </span>
              </p>
            ) : (
              <Button
                onClick={handleResend}
                variant="ghost"
                className="text-sm"
              >
                Kirim ulang OTP
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
