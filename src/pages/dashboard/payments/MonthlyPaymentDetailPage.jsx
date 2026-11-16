import { useParams, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected-route";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  DollarSign,
  TrendingUp,
  ArrowLeft,
  Calendar,
} from "lucide-react";

const monthsData = {
  "2024-01": {
    month: "Januari 2024",
    totalAmount: 1800000,
    servicesCount: 12,
    paymentDate: "25 Januari 2024",
    paymentHistory: [
      {
        id: "1",
        date: "2024-01-25",
        description: "Pembayaran dari 5 layanan",
        amount: 750000,
        status: "Berhasil",
      },
      {
        id: "2",
        date: "2024-01-18",
        description: "Pembayaran dari 4 layanan",
        amount: 600000,
        status: "Berhasil",
      },
      {
        id: "3",
        date: "2024-01-10",
        description: "Pembayaran dari 3 layanan",
        amount: 450000,
        status: "Berhasil",
      },
    ],
  },
  "2023-12": {
    month: "Desember 2023",
    totalAmount: 2250000,
    servicesCount: 15,
    paymentDate: "25 Desember 2023",
    paymentHistory: [
      {
        id: "1",
        date: "2023-12-20",
        description: "Pembayaran dari 6 layanan",
        amount: 900000,
        status: "Berhasil",
      },
      {
        id: "2",
        date: "2023-12-15",
        description: "Pembayaran dari 5 layanan",
        amount: 750000,
        status: "Berhasil",
      },
      {
        id: "3",
        date: "2023-12-08",
        description: "Pembayaran dari 4 layanan",
        amount: 600000,
        status: "Berhasil",
      },
    ],
  },
  "2023-11": {
    month: "November 2023",
    totalAmount: 1650000,
    servicesCount: 11,
    paymentDate: "25 November 2023",
    paymentHistory: [
      {
        id: "1",
        date: "2023-11-22",
        description: "Pembayaran dari 4 layanan",
        amount: 600000,
        status: "Berhasil",
      },
      {
        id: "2",
        date: "2023-11-15",
        description: "Pembayaran dari 4 layanan",
        amount: 600000,
        status: "Berhasil",
      },
      {
        id: "3",
        date: "2023-11-08",
        description: "Pembayaran dari 3 layanan",
        amount: 450000,
        status: "Berhasil",
      },
    ],
  },
  "2023-10": {
    month: "Oktober 2023",
    totalAmount: 1950000,
    servicesCount: 13,
    paymentDate: "25 Oktober 2023",
    paymentHistory: [
      {
        id: "1",
        date: "2023-10-20",
        description: "Pembayaran dari 5 layanan",
        amount: 750000,
        status: "Berhasil",
      },
      {
        id: "2",
        date: "2023-10-12",
        description: "Pembayaran dari 5 layanan",
        amount: 750000,
        status: "Berhasil",
      },
      {
        id: "3",
        date: "2023-10-05",
        description: "Pembayaran dari 3 layanan",
        amount: 450000,
        status: "Berhasil",
      },
    ],
  },
  "2023-09": {
    month: "September 2023",
    totalAmount: 1500000,
    servicesCount: 10,
    paymentDate: "25 September 2023",
    paymentHistory: [
      {
        id: "1",
        date: "2023-09-18",
        description: "Pembayaran dari 4 layanan",
        amount: 600000,
        status: "Berhasil",
      },
      {
        id: "2",
        date: "2023-09-12",
        description: "Pembayaran dari 4 layanan",
        amount: 600000,
        status: "Berhasil",
      },
      {
        id: "3",
        date: "2023-09-05",
        description: "Pembayaran dari 2 layanan",
        amount: 300000,
        status: "Berhasil",
      },
    ],
  },
  "2023-08": {
    month: "Agustus 2023",
    totalAmount: 2100000,
    servicesCount: 14,
    paymentDate: "25 Agustus 2023",
    paymentHistory: [
      {
        id: "1",
        date: "2023-08-22",
        description: "Pembayaran dari 5 layanan",
        amount: 750000,
        status: "Berhasil",
      },
      {
        id: "2",
        date: "2023-08-15",
        description: "Pembayaran dari 5 layanan",
        amount: 750000,
        status: "Berhasil",
      },
      {
        id: "3",
        date: "2023-08-08",
        description: "Pembayaran dari 4 layanan",
        amount: 600000,
        status: "Berhasil",
      },
    ],
  },
};

export default function MonthlyPaymentDetailPage() {
  const { month: monthId } = useParams();
  const navigate = useNavigate();

  const monthData = monthsData[monthId] || monthsData["2024-01"];

  const handleDownloadReport = () => {
    alert(
      `Laporan pembayaran ${monthData.month} dalam format PDF akan diunduh`,
    );
  };

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
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                {monthData.month}
              </h1>
            </div>
            <p className="text-muted-foreground">
              Laporan pembayaran detail untuk bulan ini
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Penghasilan
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      Rp {monthData.totalAmount.toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Dari {monthData.servicesCount} layanan selesai
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
                    <p className="text-sm text-muted-foreground">
                      Layanan Selesai
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {monthData.servicesCount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Total layanan bulan ini
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-100 dark:bg-blue-950 p-3">
                    <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleDownloadReport}
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <Download className="h-4 w-4" />
                Unduh Laporan PDF
              </Button>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Riwayat Pembayaran
              </h3>

              <div className="space-y-3">
                {monthData.paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {payment.description}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {payment.date}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        Rp {payment.amount.toLocaleString("id-ID")}
                      </p>
                      <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Detail Rekening
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama Bank:</span>
                  <span className="font-medium text-foreground">
                    Bank Central Asia
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama Pemilik:</span>
                  <span className="font-medium text-foreground">Nama Anda</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nomor Rekening:</span>
                  <span className="font-medium text-foreground font-mono">
                    1234567890
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 Pembayaran diproses setiap tanggal 25 ke rekening bank Anda
                yang terdaftar.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
