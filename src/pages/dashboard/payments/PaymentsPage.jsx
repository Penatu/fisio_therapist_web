import { ProtectedRoute } from "@/components/protected-route";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Calendar, ChevronRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import useGetPayrollList from "../hooks/useGetPayrollList";

function money(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function isPaid(status) {
  return String(status || "").toLowerCase() === "dibayar";
}

export default function PaymentsPage() {
  const navigate = useNavigate();
  const {
    payments,
    totalAmount,
    totalServices,
    currentAmount,
    currentServices,
    loading,
    error,
    reload,
  } = useGetPayrollList();

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
              Laporan Pembayaran
            </h1>
            <p className="text-muted-foreground">Riwayat pembayaran</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Penghasilan
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {loading ? "..." : money(totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Dari {loading ? "..." : totalServices} layanan selesai
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
                    {loading ? "..." : money(currentAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Dari {loading ? "..." : currentServices} layanan
                  </p>
                </div>
                <div className="rounded-lg bg-blue-100 dark:bg-blue-950 p-3">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>
          </div>

          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
              <p>{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reload}
                disabled={loading}
              >
                {loading ? "Memuat..." : "Muat ulang"}
              </Button>
            </div>
          )}

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Riwayat Pembayaran
            </h3>

            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Memuat pembayaran...
              </p>
            ) : payments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada riwayat pembayaran
              </p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <Link
                    key={payment.id}
                    to={`/dashboard/payments/${encodeURIComponent(payment.id)}`}
                    state={{ payment }}
                  >
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
                              {payment.servicesCount} layanan
                              {payment.paymentDate
                                ? ` • Dibayar ${payment.paymentDate}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg text-foreground">
                            {money(payment.totalAmount)}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              isPaid(payment.status)
                                ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                                : "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </ProtectedRoute>
  );
}
