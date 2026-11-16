import { useBooking } from "@/lib/booking-context";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected-route";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { OrderDetailTabs } from "@/components/order-detail-tabs";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  FileText,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import useGetOrderDetail from "../hooks/useGetOrderDetail";
import useCancelOrder from "../hooks/useCancelOrder";
import useConfirmOrder from "../hooks/useConfirmOrder";
import useVisitOrder from "../hooks/useVisitOrder";
import { isOrderPaid } from "../hooks/useGetOrderList";

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

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { id: bookingId } = useParams();
  const { getBookingById, updateBooking, upsertBooking } = useBooking();
  const { order, loading, error, getOrderDetail } = useGetOrderDetail();
  const {
    cancelOrder,
    loading: cancelling,
    error: cancelError,
    clearError: clearCancelError,
  } = useCancelOrder();
  const {
    confirmOrder,
    loading: confirming,
    error: confirmError,
    clearError: clearConfirmError,
  } = useConfirmOrder();
  const {
    visitOrder,
    loading: visiting,
    error: visitError,
    clearError: clearVisitError,
  } = useVisitOrder();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmOrderOpen, setConfirmOrderOpen] = useState(false);
  const [confirmNote, setConfirmNote] = useState("");
  const [visitNote, setVisitNote] = useState("");
  const [reportError, setReportError] = useState("");
  const upsertRef = useRef(upsertBooking);
  upsertRef.current = upsertBooking;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const detail = await getOrderDetail(bookingId);
        if (!cancelled) upsertRef.current(detail);
      } catch {
        // Pesan error ditampilkan dari hook.
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [bookingId, getOrderDetail]);

  const booking = order || getBookingById(bookingId);

  const loadDetail = async () => {
    try {
      const detail = await getOrderDetail(bookingId);
      upsertBooking(detail);
    } catch {
      // Pesan error ditampilkan dari hook.
    }
  };

  if (!booking) {
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

            {error && (
              <div className="mb-6 flex flex-col gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
                <p>{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadDetail}
                  disabled={loading}
                >
                  {loading ? "Memuat..." : "Muat ulang"}
                </Button>
              </div>
            )}

            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                {loading
                  ? "Memuat detail orderan..."
                  : "Orderan tidak ditemukan"}
              </p>
            </Card>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  const handleConfirmOrder = async () => {
    try {
      await confirmOrder(booking.id, confirmNote);
      updateBooking(booking.id, {
        status: "confirmed",
        statusLabel: "Di Konfirmasi",
      });
      setConfirmOrderOpen(false);
      setConfirmNote("");
      toast({
        title: "Orderan dikonfirmasi",
        description: "Orderan berhasil dikonfirmasi.",
      });
      await loadDetail();
    } catch {
      // Pesan error ditampilkan dari hook.
    }
  };

  const handleVisitOrder = async () => {
    try {
      await visitOrder(booking.id, visitNote);
      updateBooking(booking.id, {
        status: "processing",
        statusLabel: "Proses Visit",
      });
      setVisitNote("");
      toast({
        title: "Visit dilanjutkan",
        description: "Orderan masuk ke proses visit.",
      });
      await loadDetail();
    } catch {
      // Pesan error ditampilkan dari hook.
    }
  };

  const handleCancelOrder = async () => {
    try {
      await cancelOrder(booking.id, cancelReason);
      updateBooking(booking.id, {
        status: "cancelled",
        statusLabel: "Dibatalkan",
      });
      setConfirmCancel(false);
      setCancelReason("");
      await loadDetail();
    } catch {
      // Pesan error ditampilkan dari hook.
    }
  };

  const canCancel = !["finished", "cancelled", "canceled"].includes(
    booking.status,
  );

  const handleCreateReport = () => {
    if (!isOrderPaid(booking)) {
      setReportError(
        "Laporan hanya bisa dibuat setelah pasien membayar. Bantu ingatkan pasien untuk membayar.",
      );
      return;
    }

    setReportError("");
    navigate(`/dashboard/orders/${bookingId}/create-report`);
  };

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

          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
              <p>{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadDetail}
                disabled={loading}
              >
                {loading ? "Memuat..." : "Muat ulang"}
              </Button>
            </div>
          )}

          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Detail Orderan
              </h1>
              <p className="text-muted-foreground">ID: {booking.id}</p>
            </div>
            <StatusBadge status={booking.status} label={booking.statusLabel} />
          </div>

          <OrderDetailTabs bookingId={booking.id} />

          <Card className="p-8 mb-6">
            <div className="flex gap-6 items-start">
              {booking.patientImage ? (
                <img
                  src={booking.patientImage}
                  alt={booking.patientName || "Pasien"}
                  className="h-24 w-24 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {nameInitials(booking.patientName)}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {booking.patientName}
                </h2>
                <p className="text-muted-foreground mb-4">Pasien</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {booking.patientPhone}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {booking.scheduledTime}
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-xs">Alamat lengkap</p>
                      <p className="mt-0.5 text-foreground">
                        {booking.patientAddress || "-"}
                      </p>
                      {booking.location &&
                        booking.location !== booking.patientAddress && (
                          <p className="mt-0.5 text-foreground">
                            {booking.location}
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Informasi Layanan
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Jenis Layanan</p>
                <p className="text-lg font-semibold text-foreground">
                  {booking.service || "-"}
                </p>
              </div>

              {booking.paymentLabel && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Status Pembayaran
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {booking.paymentLabel}
                  </p>
                </div>
              )}

              {booking.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Catatan</p>
                  <div className="p-4 rounded-lg bg-secondary/30 text-foreground">
                    {booking.notes}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {canCancel &&
            (confirmCancel ? (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Batalkan orderan ini?
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Orderan yang dibatalkan tidak dapat dilanjutkan.
                </p>
                <label
                  htmlFor="cancel-reason"
                  className="mt-3 block text-sm font-medium text-foreground"
                >
                  Alasan
                </label>
                <textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(event) => {
                    clearCancelError();
                    setCancelReason(event.target.value);
                  }}
                  placeholder="Tuliskan alasan pembatalan"
                  rows={3}
                  className="mt-2 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
                {cancelError && (
                  <p className="mt-2 text-sm text-destructive">{cancelError}</p>
                )}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={cancelling}
                    onClick={() => {
                      clearCancelError();
                      setConfirmCancel(false);
                      setCancelReason("");
                    }}
                  >
                    Tidak
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    disabled={cancelling || !cancelReason.trim()}
                    onClick={handleCancelOrder}
                  >
                    <X className="h-4 w-4" />
                    {cancelling ? "Membatalkan..." : "Ya, batalkan"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="mb-4 w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={() => {
                  clearCancelError();
                  setConfirmCancel(true);
                }}
              >
                <X className="h-4 w-4" />
                Batalkan Orderan
              </Button>
            ))}

          {booking.status === "new" && confirmOrderOpen && (
            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-foreground">
                Terima orderan ini?
              </p>
              <label
                htmlFor="confirm-note"
                className="mt-3 block text-sm font-medium text-foreground"
              >
                Catatan
              </label>
              <textarea
                id="confirm-note"
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
                <p className="mt-2 text-sm text-destructive">{confirmError}</p>
              )}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={confirming}
                  onClick={() => {
                    clearConfirmError();
                    setConfirmOrderOpen(false);
                    setConfirmNote("");
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={confirming || !confirmNote.trim()}
                  onClick={handleConfirmOrder}
                >
                  {confirming ? "Mengonfirmasi..." : "Ya, terima"}
                </Button>
              </div>
            </div>
          )}

          {booking.status === "confirmed" && (
            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <label
                htmlFor="visit-note"
                className="block text-sm font-medium text-foreground"
              >
                Catatan
              </label>
              <textarea
                id="visit-note"
                value={visitNote}
                onChange={(event) => {
                  clearVisitError();
                  setVisitNote(event.target.value);
                }}
                placeholder="visit hari pada jam 20.00"
                rows={3}
                className="mt-2 w-full resize-none rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
              {visitError && (
                <p className="mt-2 text-sm text-destructive">{visitError}</p>
              )}
              <Button
                type="button"
                size="lg"
                className="mt-3 w-full"
                disabled={visiting || !visitNote.trim()}
                onClick={handleVisitOrder}
              >
                {visiting ? "Memproses..." : "Lanjutkan Visit"}
              </Button>
            </div>
          )}

          {reportError && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              {reportError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            {booking.status === "new" && (
              <Button type="button" size="lg" className="flex-1 gap-2" disabled>
                <MessageSquare className="h-4 w-4" />
                Chat dengan Pasien
              </Button>
            )}

            {booking.status === "confirmed" && (
              <Link to={`/dashboard/chat/room/${bookingId}`} className="flex-1">
                <Button type="button" size="lg" className="w-full gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat dengan Pasien
                </Button>
              </Link>
            )}

            {booking.status === "new" && !confirmOrderOpen && (
              <Button
                type="button"
                onClick={() => {
                  clearConfirmError();
                  setConfirmCancel(false);
                  setConfirmOrderOpen(true);
                }}
                size="lg"
                className="flex-1"
              >
                Terima Orderan
              </Button>
            )}

            {booking.status === "processing" && (
              <>
                <Link
                  to={`/dashboard/chat/room/${bookingId}`}
                  className="flex-1"
                >
                  <Button size="lg" className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat dengan Pasien
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2 bg-transparent"
                  onClick={handleCreateReport}
                >
                  <FileText className="h-4 w-4" />
                  Buat Laporan
                </Button>
              </>
            )}

            {booking.status === "finished" && booking.reportId && (
              <Link
                to={`/dashboard/orders/${bookingId}/report`}
                className="flex-1"
              >
                <Button size="lg" className="w-full gap-2">
                  <FileText className="h-4 w-4" />
                  Lihat Laporan
                </Button>
              </Link>
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              Tutup
            </Button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
