import { useCallback, useState } from "react";
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

function fileUrl(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return value.fullUrl || value.url || value.path || "";
  }
  return "";
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}

function profileSource(result) {
  if (!result || typeof result !== "object") return null;
  const data =
    result.data &&
    typeof result.data === "object" &&
    !Array.isArray(result.data)
      ? result.data
      : result;

  if (data.therapist && typeof data.therapist === "object")
    return data.therapist;
  if (data.profile && typeof data.profile === "object") return data.profile;
  return data;
}

function hasProfileFields(data) {
  return [
    "therapistName",
    "therapistPhone",
    "therapistProfile",
    "fullName",
    "phone",
    "profilePicture",
    "documents",
    "ktpDoc",
    "strDoc",
    "sipDoc",
    "address",
    "bankAccountInformation",
    "bankName",
    "accName",
    "accNumber",
    "educationHistories",
    "educationHistory",
    "workHistories",
    "workHistory",
    "trainings",
    "ktp",
    "str",
    "sip",
    "ukomCertificate",
  ].some((key) => data?.[key] != null);
}

export function mapUserProfile(result) {
  const data = profileSource(result);
  if (!hasProfileFields(data)) return null;

  const addressObject =
    data.address &&
    typeof data.address === "object" &&
    !Array.isArray(data.address)
      ? data.address
      : {};
  const documents =
    data.documents && typeof data.documents === "object" ? data.documents : {};
  const bank =
    data.bankAccountInformation &&
    typeof data.bankAccountInformation === "object"
      ? data.bankAccountInformation
      : {};

  const practiceLocations = asList(
    addressObject.practiceLocations || data.practiceLocations,
  )
    .map((location) => {
      if (typeof location === "string") return location;
      if (location && typeof location === "object") {
        return location.name || location.city || location.label || "";
      }
      return "";
    })
    .filter(Boolean);

  return {
    fullName: textValue(data.therapistName || data.fullName || data.name),
    phone: textValue(data.therapistPhone || data.phone || data.phoneNumber),
    profilePicture: fileUrl(data.therapistProfile || data.profilePicture),
    ktp: fileUrl(data.ktpDoc || documents.ktp || data.ktp),
    str: fileUrl(data.strDoc || documents.str || data.str),
    sip: fileUrl(data.sipDoc || documents.sip || data.sip),
    ukomCertificate: fileUrl(
      data.ukomDoc || documents.ukomCertificate || data.ukomCertificate,
    ),
    workHistory: asList(data.workHistories || data.workHistory).map((item) => ({
      workplace: textValue(item.workplace),
      position: textValue(item.position),
      startYear: textValue(item.startYear),
      endYear: textValue(item.endYear),
      description: textValue(item.description),
    })),
    educationHistory: asList(
      data.educationHistories || data.educationHistory,
    ).map((item) => ({
      institution: textValue(item.institution),
      degree: textValue(item.degree),
      major: textValue(item.major),
      startYear: textValue(item.startYear),
      endYear: textValue(item.endYear),
      ijazah: fileUrl(item.ijazah),
    })),
    trainings: asList(data.trainings).map((item) => ({
      name: textValue(item.name),
      organizer: textValue(item.organizer),
      year: textValue(item.year),
      certificate: fileUrl(item.certificate),
    })),
    address:
      typeof data.address === "string"
        ? data.address
        : textValue(addressObject.fullAddress || addressObject.address),
    latitude: addressObject.latitude ?? data.latitude ?? "",
    longitude: addressObject.longitude ?? data.longitude ?? "",
    practiceLocations,
    bankName: textValue(data.bankName || bank.bankName),
    bankAccountName: textValue(
      data.accName || bank.accountName || bank.bankAccountName || data.bankAccountName,
    ),
    bankAccountNumber: textValue(
      data.accNumber ||
        bank.accountNumber ||
        bank.bankAccountNumber ||
        data.bankAccountNumber,
    ),
  };
}

const useGetUserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getUserProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      const message = "Sesi login tidak ditemukan. Silakan login kembali.";
      setError(message);
      setProfile(null);
      throw new Error(message);
    }

    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(API_ENDPOINTS.GET_USER_PROFILE, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success === false) {
        throw new Error(getErrorMessage(result, "Gagal memuat profil"));
      }

      const mapped = mapUserProfile(result);
      setProfile(mapped);
      return mapped;
    } catch (err) {
      const message =
        err.name === "AbortError"
          ? "Permintaan ke server terlalu lama"
          : err.message === "Failed to fetch"
            ? "Tidak dapat terhubung ke server"
            : err.message || "Gagal memuat profil";
      setError(message);
      setProfile(null);
      throw new Error(message);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  return { profile, loading, error, getUserProfile };
};

export default useGetUserProfile;
