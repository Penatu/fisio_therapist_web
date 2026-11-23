import { useNavigate, useParams } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import useGetPayrollDetail from "../hooks/useGetPayrollDetail";
import { ArrowLeft, Calendar, DollarSign, TrendingUp } from "lucide-react";

function money(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

export default function MonthlyPaymentDetailPage() {
  const navigate = useNavigate();
  const { payrollCode = "" } = useParams();
  const { payment, loading, error, reload } = useGetPayrollDetail(payrollCode);

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

          {loading ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Memuat detail pembayaran...</p>
            </Card>
          ) : error ? (
            <Card className="flex flex-col items-center gap-4 p-8 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={reload}>
                Muat ulang
              </Button>
            </Card>
          ) : !payment ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Data pembayaran tidak ditemukan</p>
            </Card>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground">{payment.payslipCode || payment.month}</h1>
                </div>
                <p className="text-muted-foreground">
                  {payment.paymentDate ? `Dibayar ${payment.paymentDate}` : "Detail pembayaran"}
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Penghasilan</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{money(payment.totalAmount)}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Dari {payment.servicesCount || 0} sesi
                        </p>
                      </div>
                      <div className="rounded-lg bg-green-100 dark:bg-green-950 p-3">
                        <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Sesi</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{payment.servicesCount || 0}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {payment.paymentDate ? `Dibayar ${payment.paymentDate}` : "Belum ada tanggal pembayaran"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-blue-100 dark:bg-blue-950 p-3">
                        <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Booking</h3>
                  {payment.paymentHistory?.length ? (
                    <div className="space-y-3">
                      {payment.paymentHistory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{item.description}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {[item.bookCode, item.date].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">{money(item.amount)}</p>
                            {item.status ? (
                              <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                                {item.status}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">Belum ada rincian pembayaran</p>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
