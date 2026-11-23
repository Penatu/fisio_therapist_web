import { useBooking } from "@/lib/booking-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useGetOrderList, { isOrderPaid } from "../hooks/useGetOrderList";
import useConfirmOrder from "../hooks/useConfirmOrder";
import useGetOnboardingStatus from "../hooks/useGetOnboardingStatus";

const ORDER_SUMMARY = [
  { key: "totalBookings", label: "Total Orderan" },
  { key: "new", label: "Orderan Baru" },
  { key: "confirmed", label: "Di Konfirmasi" },
  { key: "visit", label: "Proses Visit" },
  { key: "finished", label: "Selesai" },
  { key: "canceled", label: "Dibatalkan" },
];

const ORDER_FILTERS = [
  { value: "all", label: "Semua", query: "" },
  { value: "new", label: "Orderan Baru", query: "new" },
  { value: "confirmed", label: "Di Konfirmasi", query: "confirmed" },
  { value: "processing", label: "Proses Visit", query: "visit" },
  { value: "finished", label: "Selesai", query: "finished" },
  { value: "cancelled", label: "Dibatalkan", query: "canceled" },
];

function statusQueryFor(filter) {
  return ORDER_FILTERS.find((item) => item.value === filter)?.query || "";
}

function nameInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { upsertBooking } = useBooking();
  const { orders, summary, pagination, loading, error, getOrderList } =
    useGetOrderList();
  const {
    confirmOrder,
    loading: confirming,
    error: confirmError,
    clearError: clearConfirmError,
  } = useConfirmOrder();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [confirmingId, setConfirmingId] = useState("");
  const [confirmNote, setConfirmNote] = useState("");
  const [reportErrorId, setReportErrorId] = useState("");
  const {
    status: onboardingStatus,
    loading: statusLoading,
    error: statusError,
    reload: reloadStatus,
  } = useGetOnboardingStatus();

  const syncBookings = (list) => {
    list.forEach((item) => upsertBooking(item));
  };

  const loadOrders = async (nextFilter = filter, nextPage = page) => {
    try {
      const query = statusQueryFor(nextFilter);
      const list = await getOrderList({ status: query, page: nextPage });
      syncBookings(list);
    } catch {
      // Pesan error ditampilkan dari hook.
    }
  };

  const changeFilter = (value) => {
    setFilter(value);
    setPage(1);
  };

  const openConfirm = (id) => {
    clearConfirmError();
    setConfirmingId(id);
    setConfirmNote("");
  };

  const closeConfirm = () => {
    clearConfirmError();
    setConfirmingId("");
    setConfirmNote("");
  };

  const handleConfirmOrder = async (booking) => {
    try {
      await confirmOrder(booking.id, confirmNote);
      closeConfirm();
      await loadOrders();
    } catch {
      // Pesan error ditampilkan dari hook.
    }
  };

  useEffect(() => {
    let cancelled = false;
    const query = statusQueryFor(filter);

    const load = async () => {
      try {
        const list = await getOrderList({ status: query, page });
        if (cancelled) return;
        list.forEach((item) => upsertBooking(item));
      } catch {
        // Pesan error ditampilkan dari hook.
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [filter, page, getOrderList, upsertBooking]);

  const verificationStatus = onboardingStatus?.verificationStatus || "";
  const hasActiveSchedule = onboardingStatus?.isHavingActiveSchedule === true;

  const getVerificationStatusDisplay = () => {
    if (statusLoading) {
      return {
        text: "Memuat status verifikasi...",
        icon: Clock,
        color: "text-muted-foreground",
        bgColor: "bg-secondary/50",
        action: null,
      };
    }

    if (statusError) {
      return {
        text: statusError,
        icon: AlertCircle,
        color: "text-destructive",
        bgColor: "bg-destructive/10",
        action: { label: "Muat ulang", onClick: reloadStatus },
      };
    }

    if (verificationStatus === "verified" && hasActiveSchedule) {
      return {
        text: "Anda sudah terverifikasi dan sudah memiliki jadwal praktek aktif.",
        icon: ShieldCheck,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950",
        action: null,
      };
    }

    if (verificationStatus === "verified") {
      return {
        text: "Anda sudah terverifikasi, namun belum ada jadwal praktek aktif beberapa hari ke depan.",
        icon: CheckCircle2,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950",
        action: {
          label: "Setting sekarang",
          to: "/dashboard/settings/schedule",
        },
      };
    }

    if (verificationStatus === "pending") {
      return {
        text: "Form verifikasi Anda sedang di-review.",
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950",
        action: null,
      };
    }

    if (verificationStatus === "rejected") {
      return {
        text: "Verifikasi data Anda belum bisa diterima. Perbaharui lalu ajukan kembali.",
        detail:
          onboardingStatus?.verificationNote ||
          onboardingStatus?.rejectionReason ||
          "",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950",
        action: { label: "Edit Profil", to: "/dashboard/settings/profile" },
      };
    }

    return {
      text: "Anda belum terverifikasi. Harap lengkapi data.",
      icon: HelpCircle,
      color: "text-muted-foreground",
      bgColor: "bg-secondary/50",
      action: { label: "Ajukan Verifikasi", to: "/dashboard/verification" },
    };
  };

  const statusDisplay = getVerificationStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  const totalPages = Math.max(
    1,
    Math.ceil(pagination.total / pagination.perPage) || 1,
  );
  const rangeStart =
    pagination.total === 0
      ? 0
      : (pagination.currentPage - 1) * pagination.perPage + 1;
  const rangeEnd = Math.min(
    pagination.currentPage * pagination.perPage,
    pagination.total,
  );

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Orderan Booking
            </h1>
            <p className="text-muted-foreground">
              Kelola orderan dari pasien Anda
            </p>
          </div>

          <Card
            className={`p-4 mb-8 ${statusDisplay.bgColor} border-2 transition-all`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <StatusIcon
                  className={`h-6 w-6 shrink-0 ${statusDisplay.color}`}
                />
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Status Verifikasi
                  </p>
                  <p
                    className={`text-lg font-semibold ${statusDisplay.color} mt-0.5`}
                  >
                    {statusDisplay.text}
                  </p>
                  {statusDisplay.detail ? (
                    <p className="mt-1 text-sm text-foreground">
                      Alasan penolakan: {statusDisplay.detail}
                    </p>
                  ) : null}
                </div>
              </div>
              {statusDisplay.action?.to ? (
                <Link to={statusDisplay.action.to}>
                  <Button className="whitespace-nowrap">
                    {statusDisplay.action.label}
                  </Button>
                </Link>
              ) : statusDisplay.action?.onClick ? (
                <Button
                  type="button"
                  variant="outline"
                  className="whitespace-nowrap"
                  onClick={statusDisplay.action.onClick}
                >
                  {statusDisplay.action.label}
                </Button>
              ) : null}
            </div>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {ORDER_SUMMARY.map((item) => (
              <Card key={item.key} className="p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {summary[item.key] ?? 0}
                </p>
              </Card>
            ))}
          </div>

          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
              <p>{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadOrders()}
                disabled={loading}
              >
                {loading ? "Memuat..." : "Muat ulang"}
              </Button>
            </div>
          )}

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {ORDER_FILTERS.map((item) => (
              <Button
                key={item.value}
                onClick={() => changeFilter(item.value)}
                variant={filter === item.value ? "default" : "outline"}
                className="whitespace-nowrap"
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {loading ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Memuat orderan...</p>
              </Card>
            ) : orders.length > 0 ? (
              orders.map((booking) => (
                <Card
                  key={booking.id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      {booking.patientImage ? (
                        <img
                          src={booking.patientImage}
                          alt={booking.patientName || "Pasien"}
                          className="h-14 w-14 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {nameInitials(booking.patientName)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 flex-wrap">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {booking.patientName || "Pasien"}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              ID: {booking.id}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {booking.service || "Layanan belum diisi"}
                            </p>
                          </div>
                          <StatusBadge
                            status={booking.status}
                            label={booking.statusLabel}
                          />
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>
                              {booking.scheduledTime || "Jadwal belum diisi"}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                              {booking.patientAddress ||
                                booking.location ||
                                "Alamat belum diisi"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 shrink-0" />
                            <span>
                              {booking.patientPhone || "Nomor belum diisi"}
                            </span>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="mt-3 p-2 rounded bg-secondary/30 text-sm text-foreground">
                            <p className="font-medium mb-1">Catatan:</p>
                            <p>{booking.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-col-reverse gap-2 w-full sm:w-auto">
                      {booking.status === "new" &&
                        confirmingId !== booking.id && (
                          <Button
                            type="button"
                            className="w-full sm:w-auto"
                            onClick={() => openConfirm(booking.id)}
                          >
                            Konfirmasi
                          </Button>
                        )}

                      {booking.status === "finished" && booking.reportId && (
                        <Link to={`/dashboard/orders/${booking.id}/report`}>
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto bg-transparent"
                          >
                            Lihat Laporan
                          </Button>
                        </Link>
                      )}

                      {booking.status === "processing" && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto bg-transparent"
                            onClick={() => {
                              if (!isOrderPaid(booking)) {
                                setReportErrorId(booking.id);
                                return;
                              }
                              setReportErrorId("");
                              navigate(
                                `/dashboard/orders/${booking.id}/create-report`,
                              );
                            }}
                          >
                            Buat Laporan
                          </Button>
                          <Link to={`/dashboard/chat/room/${booking.id}`}>
                            <Button className="w-full sm:w-auto gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Chat
                            </Button>
                          </Link>
                        </>
                      )}

                      <Link to={`/dashboard/orders/${booking.id}`}>
                        <Button variant="default" className="w-full sm:w-auto">
                          {booking.status === "new" ? "Lihat Detail" : "Detail"}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {reportErrorId === booking.id && (
                    <div className="mt-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                      Laporan hanya bisa dibuat setelah pasien membayar. Bantu
                      ingatkan pasien untuk membayar.
                    </div>
                  )}

                  {confirmingId === booking.id && (
                    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-semibold text-foreground">
                        Konfirmasi orderan ini?
                      </p>
                      <label
                        htmlFor={`confirm-note-${booking.id}`}
                        className="mt-3 block text-sm font-medium text-foreground"
                      >
                        Catatan
                      </label>
                      <textarea
                        id={`confirm-note-${booking.id}`}
                        value={confirmNote}
                        onChange={(event) => {
                          clearConfirmError();
                          setConfirmNote(event.target.value);
                        }}
                        placeholder="Tuliskan catatan konfirmasi"
                        rows={3}
                        className="mt-2 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      {confirmError && (
                        <p className="mt-2 text-sm text-destructive">
                          {confirmError}
                        </p>
                      )}
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          disabled={confirming}
                          onClick={closeConfirm}
                        >
                          Batal
                        </Button>
                        <Button
                          type="button"
                          className="flex-1"
                          disabled={confirming || !confirmNote.trim()}
                          onClick={() => handleConfirmOrder(booking)}
                        >
                          {confirming ? "Mengonfirmasi..." : "Ya, konfirmasi"}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  Tidak ada orderan untuk status ini
                </p>
              </Card>
            )}
          </div>

          {pagination.total > 0 && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {rangeStart}–{rangeEnd} dari {pagination.total}{" "}
                orderan
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || pagination.previousPage < 1}
                  onClick={() => setPage(pagination.previousPage)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
                <span className="min-w-16 text-center text-sm font-medium text-foreground">
                  {pagination.currentPage}/{totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || pagination.nextPage < 1}
                  onClick={() => setPage(pagination.nextPage)}
                >
                  Berikutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
