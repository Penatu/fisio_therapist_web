import { useCallback, useRef, useState } from "react";
import { API_ENDPOINTS } from "@/lib/endpoints";

function getErrorMessage(result, fallback) {
  if (!result) return fallback;
  if (typeof result === "string") return result;
  if (typeof result.message === "string" && result.message)
    return result.message;
  if (typeof result.errorServer === "string" && result.errorServer)
    return result.errorServer;
  if (typeof result.messageTitle === "string" && result.messageTitle)
    return result.messageTitle;
  if (typeof result.error === "string" && result.error) return result.error;

  if (result.errors && typeof result.errors === "object") {
    const first = Object.values(result.errors).flat().find(Boolean);
    if (typeof first === "string") return first;
  }

  return fallback;
}

function textValue(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  return "";
}

const PAID_STATUSES = ["paid", "lunas"];

export function isOrderPaid(order) {
  const status = String(order?.paymentStatus || "")
    .trim()
    .toLowerCase();
  const label = String(order?.paymentLabel || "")
    .trim()
    .toLowerCase();
  return PAID_STATUSES.includes(status) || PAID_STATUSES.includes(label);
}

function fileUrl(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value.fullUrl || value.url || value.path || "";
  }
  return "";
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatSchedule(value) {
  if (value == null || value === "") return "";
  if (typeof value === "object") {
    const date = textValue(
      value.date || value.bookingDate || value.scheduleDate,
    );
    const time = textValue(value.time || value.startTime || value.scheduleTime);
    return [date, time].filter(Boolean).join(" ");
  }

  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ]|$)/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(text)) return text.slice(0, 16);

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const NEW_STATUSES = [
  "new",
  "baru",
  "pending",
  "waiting",
  "booked",
  "created",
  "unconfirmed",
  "requested",
  "orderan_baru",
];
const CONFIRMED_STATUSES = [
  "confirmed",
  "confirm",
  "accepted",
  "dikonfirmasi",
  "di_konfirmasi",
  "konfirmasi",
];
const VISIT_STATUSES = [
  "processing",
  "process",
  "in_progress",
  "inprogress",
  "ongoing",
  "diproses",
  "proses_visit",
  "visit",
  "visiting",
  "on_visit",
];
const FINISHED_STATUS = ["finished", , "done", "finished", "finish", "selesai"];
const CANCELLED_STATUSES = [
  "cancelled",
  "canceled",
  "cancel",
  "dibatalkan",
  "rejected",
];

export function mapOrderStatus(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (!raw) return "new";
  if (NEW_STATUSES.includes(raw)) return "new";
  if (CONFIRMED_STATUSES.includes(raw)) return "confirmed";
  if (VISIT_STATUSES.includes(raw)) return "processing";
  if (FINISHED_STATUS.includes(raw)) return "finished";
  if (CANCELLED_STATUSES.includes(raw)) return "cancelled";
  return raw;
}

function extractList(result) {
  const data = result?.data ?? result;
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const list =
    data.list ||
    data.items ||
    data.rows ||
    data.bookings ||
    data.orders ||
    data.records ||
    data.content ||
    data.data;

  return Array.isArray(list) ? list : [];
}

function personRecord(value) {
  return value && typeof value === "object" ? value : {};
}

function personName(value) {
  if (typeof value === "string" || typeof value === "number")
    return textValue(value);
  const record = personRecord(value);
  return textValue(record.fullName || record.name || record.patientName);
}

export function mapOrder(item, index) {
  const patient = personRecord(item?.patient);
  const service = item?.service || item?.treatment || {};
  const address = item?.address || {};
  const serviceName =
    typeof service === "string"
      ? service
      : textValue(
          service.name ||
            service.serviceName ||
            item?.serviceName ||
            item?.treatmentName,
        );
  const addressText =
    typeof address === "string"
      ? address
      : textValue(address.fullAddress || address.address);
  const location = textValue(
    item?.location || item?.city || address.city || addressText,
  );
  const patientName =
    personName(item?.patient) ||
    textValue(item?.patientName || item?.customerName) ||
    personName(item?.customer) ||
    personName(item?.user);

  return {
    id:
      textValue(
        item?.id ||
          item?.bookingId ||
          item?.bookingCode ||
          item?.code ||
          item?.orderId,
      ) || `order-${index}`,
    patientName,
    patientPhone: textValue(
      item?.patientPhone ||
        item?.phone ||
        item?.customerPhone ||
        patient.phone ||
        patient.phoneNumber,
    ),
    patientImage: fileUrl(
      item?.patientPhoto ||
        patient.patientPhoto ||
        patient.profilePicture ||
        patient.profile_picture ||
        patient.photo ||
        patient.avatar ||
        item?.profilePicture ||
        item?.profile_picture ||
        item?.patientImage ||
        item?.avatar,
    ),
    service: serviceName,
    location,
    patientAddress: textValue(
      item?.patientAddress || item?.fullAddress || addressText || location,
    ),
    scheduledTime:
      formatSchedule(
        item?.schedule ||
          item?.scheduledTime ||
          item?.scheduleTime ||
          item?.bookingTime ||
          item?.appointmentTime ||
          item?.dateTime ||
          item?.scheduleDate ||
          item?.bookingDate,
      ) ||
      [textValue(item?.date), textValue(item?.time)].filter(Boolean).join(", "),
    status: mapOrderStatus(
      item?.status || item?.orderStatus || item?.bookingStatus,
    ),
    statusLabel: textValue(item?.statusLabel),
    paymentStatus: textValue(
      item?.paymentStatus ||
        item?.payment_status ||
        item?.payment?.status ||
        item?.payment?.paymentStatus,
    ),
    paymentLabel: textValue(
      item?.paymentLabel || item?.payment?.label || item?.payment?.paymentLabel,
    ),
    notes: textValue(
      item?.notes || item?.note || item?.complaint || item?.description,
    ),
    reportId: textValue(item?.reportId || item?.report?.id),
  };
}

export function mapOrderList(result) {
  return extractList(result)
    .filter((item) => item && typeof item === "object")
    .map(mapOrder);
}

const DEFAULT_PER_PAGE = 10;

export const EMPTY_ORDER_SUMMARY = {
  totalBookings: 0,
  confirmed: 0,
  new: 0,
  canceled: 0,
  visit: 0,
  finished: 0,
};

export const EMPTY_ORDER_PAGINATION = {
  perPage: DEFAULT_PER_PAGE,
  total: 0,
  currentPage: 1,
  previousPage: 0,
  nextPage: 0,
};

function countValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function mapOrderSummary(source) {
  const summary = source && typeof source === "object" ? source : {};
  return {
    totalBookings: countValue(summary.totalBookings),
    confirmed: countValue(summary.confirmed),
    new: countValue(summary.new),
    canceled: countValue(summary.canceled),
    visit: countValue(summary.visit),
    finished: countValue(summary.finished),
  };
}

export function mapOrderPagination(source, fallback = {}) {
  const pagination = source && typeof source === "object" ? source : {};
  const perPage =
    countValue(pagination.perPage || fallback.perPage) || DEFAULT_PER_PAGE;
  const currentPage =
    countValue(pagination.currentPage || fallback.currentPage) || 1;

  return {
    perPage,
    total: countValue(pagination.total ?? fallback.total),
    currentPage,
    previousPage: countValue(pagination.previousPage),
    nextPage: countValue(pagination.nextPage),
  };
}

function orderListUrl({ status, page, perPage }) {
  const url = new URL(API_ENDPOINTS.GET_ORDER_LIST);
  url.searchParams.set("page", String(page || 1));
  url.searchParams.set("perPage", String(perPage || DEFAULT_PER_PAGE));
  if (status) url.searchParams.set("status", status);
  return url.toString();
}

async function requestOrderList({ status, page, perPage }) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(orderListUrl({ status, page, perPage }), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || result?.success === false) {
      throw new Error(getErrorMessage(result, "Gagal memuat orderan"));
    }

    return result;
  } catch (err) {
    if (err.name === "AbortError")
      throw new Error("Permintaan ke server terlalu lama");
    if (err.message === "Failed to fetch")
      throw new Error("Tidak dapat terhubung ke server");
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

const useGetOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(EMPTY_ORDER_SUMMARY);
  const [pagination, setPagination] = useState(EMPTY_ORDER_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const getOrderList = useCallback(
    async ({ status = "", page = 1, perPage = DEFAULT_PER_PAGE } = {}) => {
      const currentRequest = requestId.current + 1;
      requestId.current = currentRequest;
      setLoading(true);
      setError("");

      try {
        const result = await requestOrderList({ status, page, perPage });
        const mapped = mapOrderList(result);
        const data =
          result?.data &&
          typeof result.data === "object" &&
          !Array.isArray(result.data)
            ? result.data
            : {};

        if (requestId.current === currentRequest) {
          setOrders(mapped);
          if (!status && data.summary && typeof data.summary === "object") {
            setSummary(mapOrderSummary(data.summary));
          }
          setPagination(
            mapOrderPagination(data.pagination, {
              perPage,
              currentPage: page,
              total: mapped.length,
            }),
          );
        }
        return mapped;
      } catch (err) {
        const message = err.message || "Gagal memuat orderan";
        if (requestId.current === currentRequest) setError(message);
        throw new Error(message);
      } finally {
        if (requestId.current === currentRequest) setLoading(false);
      }
    },
    [],
  );

  return { orders, summary, pagination, loading, error, getOrderList };
};

export default useGetOrderList;
