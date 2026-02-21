import { ProtectedRoute } from '@/components/protected-route';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const monthlyPayments = [
  { id: '2024-01', month: 'Januari 2024', totalAmount: 1800000, servicesCount: 12, status: 'Dibayar', paymentDate: '25 Januari 2024' },
  { id: '2023-12', month: 'Desember 2023', totalAmount: 2250000, servicesCount: 15, status: 'Dibayar', paymentDate: '25 Desember 2023' },
  { id: '2023-11', month: 'November 2023', totalAmount: 1650000, servicesCount: 11, status: 'Dibayar', paymentDate: '25 November 2023' },
  { id: '2023-10', month: 'Oktober 2023', totalAmount: 1950000, servicesCount: 13, status: 'Dibayar', paymentDate: '25 Oktober 2023' },
  { id: '2023-09', month: 'September 2023', totalAmount: 1500000, servicesCount: 10, status: 'Dibayar', paymentDate: '25 September 2023' },
  { id: '2023-08', month: 'Agustus 2023', totalAmount: 2100000, servicesCount: 14, status: 'Dibayar', paymentDate: '25 Agustus 2023' },
];

export default function PaymentsPage() {
  const navigate = useNavigate();

  const totalEarnings = monthlyPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  const totalServices = monthlyPayments.reduce((sum, payment) => sum + payment.servicesCount, 0);

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
            <h1 className="text-3xl font-bold text-foreground mb-2">Laporan Pembayaran</h1>
            <p className="text-muted-foreground">Riwayat pembayaran bulanan Anda</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Penghasilan</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    Rp {totalEarnings.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Dari {totalServices} layanan selesai
                  </p>
                </div>
                <div className="rounded-lg bg-green-100 dark:bg-green-950 p-3">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bulan Ini</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    Rp {monthlyPayments[0].totalAmount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Dari {monthlyPayments[0].servicesCount} layanan
                  </p>
                </div>
                <div className="rounded-lg bg-blue-100 dark:bg-blue-950 p-3">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Riwayat Pembayaran Bulanan</h3>

            <div className="space-y-3">
              {monthlyPayments.map((payment) => (
                <Link key={payment.id} to={`/dashboard/payments/${payment.id}`}>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-all hover:border-primary/50 cursor-pointer group">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {payment.month}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {payment.servicesCount} layanan • Dibayar {payment.paymentDate}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg text-foreground">
                          Rp {payment.totalAmount.toLocaleString('id-ID')}
                        </p>
                        <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                          {payment.status}
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 mt-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 Pembayaran diproses setiap tanggal 25 setiap bulan ke rekening bank Anda yang terdaftar.
            </p>
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  );
}
