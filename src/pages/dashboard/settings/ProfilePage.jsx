import { useAuth } from "@/lib/auth-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { DocumentUpload } from "@/components/document-upload";
import { LocationSelector } from "@/components/location-selector";
import { ProtectedRoute } from "@/components/protected-route";
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import useUploadFile from "../hooks/useUploadFile";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { buildOnboardingPayload } from "../hooks/useVerifyUserProfile";

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const withId = (item) => ({ id: item.id || createId(), ...item });

const emptyWork = () => ({
  id: createId(),
  workplace: "",
  position: "",
  startYear: "",
  endYear: "",
  description: "",
});

const emptyEducation = () => ({
  id: createId(),
  institution: "",
  degree: "",
  major: "",
  startYear: "",
  endYear: "",
  ijazah: "",
});

const emptyTraining = () => ({
  id: createId(),
  name: "",
  organizer: "",
  year: "",
  certificate: "",
});

const textareaClass =
  "mt-2 flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

const sectionTitles = {
  personal: "Informasi Pribadi",
  documents: "Dokumen Verifikasi",
  work: "Riwayat Pekerjaan",
  education: "Riwayat Pendidikan",
  training: "Pelatihan",
  practice: "Informasi Praktek",
  bank: "Informasi Rekening Bank",
};

const formFromUser = (user) => ({
  fullName: user?.fullName || user?.name || "",
  phone: user?.phone || "",
  profilePicture: user?.profilePicture || "",
  ktp: user?.ktp || "",
  str: user?.str || "",
  sip: user?.sip || "",
  ukomCertificate: user?.ukomCertificate || "",
  workHistory: user?.workHistory?.length
    ? user.workHistory.map(withId)
    : [],
  educationHistory: user?.educationHistory?.length
    ? user.educationHistory.map(withId)
    : [],
  trainings: user?.trainings?.length ? user.trainings.map(withId) : [],
  address: typeof user?.address === "string" ? user.address : "",
  latitude: user?.latitude ?? "",
  longitude: user?.longitude ?? "",
  practiceLocations: user?.practiceLocations || [],
  bankAccountName: user?.bankAccountName || "",
  bankAccountNumber: user?.bankAccountNumber || "",
  bankName: user?.bankName || "",
});

const clone = (value) => JSON.parse(JSON.stringify(value));

function normalizeValue(value) {
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .filter((key) => key !== "id")
      .sort()
      .reduce((result, key) => {
        result[key] = normalizeValue(value[key]);
        return result;
      }, {});
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim();
  return value ?? "";
}

function hasValueChanges(current, original) {
  if (!current || !original) return false;
  return JSON.stringify(normalizeValue(current)) !== JSON.stringify(normalizeValue(original));
}

function draftFromSection(section, form) {
  if (section === "personal") {
    return {
      fullName: form.fullName,
      phone: form.phone,
      profilePicture: form.profilePicture,
    };
  }
  if (section === "documents") {
    return {
      ktp: form.ktp,
      str: form.str,
      sip: form.sip,
      ukomCertificate: form.ukomCertificate,
    };
  }
  if (section === "work") {
    return {
      workHistory: form.workHistory.length ? clone(form.workHistory) : [emptyWork()],
    };
  }
  if (section === "education") {
    return {
      educationHistory: form.educationHistory.length
        ? clone(form.educationHistory)
        : [emptyEducation()],
    };
  }
  if (section === "training") {
    return {
      trainings: form.trainings.length ? clone(form.trainings) : [emptyTraining()],
    };
  }
  if (section === "practice") {
    return {
      address: form.address,
      latitude: form.latitude,
      longitude: form.longitude,
      practiceLocations: [...(form.practiceLocations || [])],
    };
  }
  return {
    bankName: form.bankName,
    bankAccountName: form.bankAccountName,
    bankAccountNumber: form.bankAccountNumber,
  };
}

function buildProfileEditPayload(form) {
  const payload = buildOnboardingPayload(form);
  const hasCoordinates =
    form.latitude !== "" &&
    form.latitude != null &&
    form.longitude !== "" &&
    form.longitude != null;
  const hasPractice = Boolean(form.practiceLocations?.length) || hasCoordinates;

  if (!payload.address && (form.address?.trim() || hasPractice)) {
    payload.address = {
      address: form.address || "",
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      practiceLocations: form.practiceLocations || [],
    };
  }

  return payload;
}

function validateSection(section, draft) {
  if (section === "personal") {
    if (!draft.fullName.trim()) return "Nama lengkap harus diisi";
    const phoneDigits = draft.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return "Nomor handphone tidak valid";
    }
    if (!draft.profilePicture) return "Foto profil harus diunggah";
  }

  if (section === "documents") {
    if (!draft.ktp) return "KTP harus diunggah";
    if (!draft.str) return "STR harus diunggah";
    if (!draft.sip) return "SIP harus diunggah";
    if (!draft.ukomCertificate) return "Sertifikat UKOM harus diunggah";
  }

  if (section === "work") {
    const items = draft.workHistory.filter(
      (item) => item.workplace.trim() || item.position.trim(),
    );
    if (items.length === 0) return "Minimal satu riwayat pekerjaan";
    if (items.some((item) => !item.workplace.trim() || !item.position.trim())) {
      return "Nama tempat kerja dan jabatan pada riwayat pekerjaan harus diisi";
    }
  }

  if (section === "education") {
    const items = draft.educationHistory.filter(
      (item) => item.institution.trim() || item.degree.trim() || item.ijazah,
    );
    if (items.length === 0) return "Minimal satu riwayat pendidikan";
    if (
      items.some((item) => !item.institution.trim() || !item.degree.trim() || !item.ijazah)
    ) {
      return "Institusi, jenjang, dan ijazah pada riwayat pendidikan harus diisi";
    }
  }

  if (section === "training") {
    const items = draft.trainings.filter(
      (item) => item.name.trim() || item.organizer.trim() || item.certificate,
    );
    if (items.length === 0) return "Minimal satu pelatihan";
    if (items.some((item) => !item.name.trim() || !item.certificate)) {
      return "Nama pelatihan dan sertifikat harus diisi";
    }
  }

  if (section === "practice") {
    if (!draft.address.trim()) return "Alamat harus diisi";
    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return "Latitude tidak valid";
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return "Longitude tidak valid";
    }
    if (draft.practiceLocations.length === 0) return "Minimal pilih satu lokasi praktek";
  }

  if (section === "bank" && (!draft.bankAccountName || !draft.bankAccountNumber)) {
    return "Data bank harus lengkap";
  }

  return "";
}

function ReadValue({ label, value }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-foreground">
        {value || "Belum diisi"}
      </p>
    </div>
  );
}

function ReadDocument({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {value ? "Sudah diunggah" : "Belum diunggah"}
        </p>
      </div>
      {value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-primary"
        >
          Lihat
        </a>
      ) : null}
    </div>
  );
}

function SectionCard({ title, icon, onEdit, children }) {
  return (
    <Card className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
          {icon}
          {title}
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </div>
      {children}
    </Card>
  );
}

export default function ProfilePage() {
  const { user, isLoading, updateProfile } = useAuth();
  const { uploadFile, uploading } = useUploadFile();
  const {
    loading: profileLoading,
    error: loadError,
    getUserProfile,
  } = useGetUserProfile();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [locating, setLocating] = useState(false);
  const [formData, setFormData] = useState(null);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const hasChanges = useMemo(() => hasValueChanges(draft, baseline), [draft, baseline]);
  const userRef = useRef(user);
  const updateProfileRef = useRef(updateProfile);
  userRef.current = user;
  updateProfileRef.current = updateProfile;

  const applyLoadedProfile = async () => {
    try {
      const profile = await getUserProfile();
      const source = profile || userRef.current;
      setFormData(formFromUser(source));

      if (profile) {
        await updateProfileRef.current({
          ...profile,
          ...(profile.fullName ? { name: profile.fullName } : {}),
        });
      }
    } catch {
      setFormData((current) => current || formFromUser(userRef.current));
    }
  };

  useEffect(() => {
    if (isLoading) return undefined;

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const profile = await getUserProfile();
        if (cancelled) return;
        const source = profile || userRef.current;
        setFormData(formFromUser(source));
        if (profile) {
          await updateProfileRef.current({
            ...profile,
            ...(profile.fullName ? { name: profile.fullName } : {}),
          });
        }
      } catch {
        if (!cancelled) {
          setFormData((current) => current || formFromUser(userRef.current));
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isLoading, getUserProfile]);

  const openSection = (section) => {
    const nextDraft = draftFromSection(section, formData);
    setError("");
    setSuccess(false);
    setDraft(nextDraft);
    setBaseline(clone(nextDraft));
    setEditing(section);
  };

  const closeSection = () => {
    setEditing(null);
    setDraft(null);
    setBaseline(null);
    setError("");
  };

  const updateDraftField = (name, value) => {
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const updateDraftItem = (field, id, key, value) => {
    setDraft((current) => ({
      ...current,
      [field]: current[field].map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addDraftItem = (field, factory) => {
    setDraft((current) => ({
      ...current,
      [field]: [...current[field], factory()],
    }));
  };

  const removeDraftItem = (field, id) => {
    setDraft((current) => ({
      ...current,
      [field]: current[field].filter((item) => item.id !== id),
    }));
  };

  const handleDraftPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const url = await uploadFile(file);
      updateDraftField("profilePicture", url);
    } catch (err) {
      setError(err.message || "Gagal mengunggah foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDraftLocation = () => {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung geolokasi");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDraft((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Gagal mengambil lokasi. Izinkan akses lokasi atau isi koordinat secara manual.");
      },
    );
  };

  const handleSaveSection = async () => {
    if (uploading || uploadingPhoto) {
      setError("Tunggu hingga semua file selesai diunggah");
      return;
    }

    const message = validateSection(editing, draft);
    if (message) {
      setError(message);
      return;
    }

    const nextForm = {
      ...formData,
      ...draft,
      fullName: (draft.fullName ?? formData.fullName).trim(),
      phone: (draft.phone ?? formData.phone).trim(),
    };
    const payload = buildProfileEditPayload(nextForm);

    setFormData(nextForm);
    await updateProfileRef.current({
      ...nextForm,
      name: nextForm.fullName,
    });
    setEditing(null);
    setDraft(null);
    setBaseline(null);
    setError("");
    setSuccess(true);
    console.log("profile edit payload", payload);
  };

  if (!formData) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">
            {isLoading ? "Memuat..." : "Memuat profil..."}
          </p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <button
            onClick={() => navigate("/dashboard/settings")}
            className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke pengaturan
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Profil</h1>
            <p className="text-muted-foreground">
              Data profil Anda. Pilih Edit pada bagian yang ingin diubah.
            </p>
          </div>

          {success && (
            <div className="mb-6 flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-600 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">Perubahan bagian ini berhasil diperbarui</p>
            </div>
          )}

          {loadError && (
            <div className="mb-6 flex flex-col gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
              <p>{loadError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyLoadedProfile}
                disabled={profileLoading}
              >
                {profileLoading ? "Memuat..." : "Muat ulang"}
              </Button>
            </div>
          )}

          <div className="space-y-8">
            <SectionCard title="Informasi Pribadi" onEdit={() => openSection("personal")}>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {formData.profilePicture ? (
                  <img
                    src={formData.profilePicture}
                    alt="Foto profil"
                    className="h-20 w-20 rounded-full border-2 border-primary object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-primary bg-secondary">
                    <span className="text-xs text-muted-foreground">Foto</span>
                  </div>
                )}
                <div className="grid flex-1 gap-6 sm:grid-cols-2">
                  <ReadValue label="Nama Lengkap" value={formData.fullName} />
                  <ReadValue label="Nomor Handphone" value={formData.phone} />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Dokumen Verifikasi"
              icon={<FileCheck className="h-5 w-5" />}
              onEdit={() => openSection("documents")}
            >
              <div className="space-y-3">
                <ReadDocument label="KTP (Kartu Tanda Penduduk)" value={formData.ktp} />
                <ReadDocument label="STR (Surat Tanda Registrasi)" value={formData.str} />
                <ReadDocument label="SIP (Surat Izin Praktik)" value={formData.sip} />
                <ReadDocument label="Sertifikat UKOM" value={formData.ukomCertificate} />
              </div>
            </SectionCard>

            <SectionCard title="Riwayat Pekerjaan" onEdit={() => openSection("work")}>
              {formData.workHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada riwayat pekerjaan</p>
              ) : (
                <div className="space-y-4">
                  {formData.workHistory.map((item, index) => (
                    <div key={item.id} className="rounded-lg border border-border p-4">
                      <p className="text-sm font-semibold text-foreground">Pekerjaan {index + 1}</p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <ReadValue label="Tempat Kerja" value={item.workplace} />
                        <ReadValue label="Jabatan" value={item.position} />
                        <ReadValue label="Tahun Mulai" value={item.startYear} />
                        <ReadValue label="Tahun Selesai" value={item.endYear} />
                      </div>
                      <div className="mt-4">
                        <ReadValue label="Deskripsi" value={item.description} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Riwayat Pendidikan" onEdit={() => openSection("education")}>
              {formData.educationHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada riwayat pendidikan</p>
              ) : (
                <div className="space-y-4">
                  {formData.educationHistory.map((item, index) => (
                    <div key={item.id} className="rounded-lg border border-border p-4">
                      <p className="text-sm font-semibold text-foreground">Pendidikan {index + 1}</p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <ReadValue label="Institusi" value={item.institution} />
                        <ReadValue label="Jenjang" value={item.degree} />
                        <ReadValue label="Jurusan" value={item.major} />
                        <ReadValue label="Tahun" value={[item.startYear, item.endYear].filter(Boolean).join(" - ")} />
                      </div>
                      <div className="mt-4">
                        <ReadDocument label="Ijazah" value={item.ijazah} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Pelatihan" onEdit={() => openSection("training")}>
              {formData.trainings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada pelatihan</p>
              ) : (
                <div className="space-y-4">
                  {formData.trainings.map((item, index) => (
                    <div key={item.id} className="rounded-lg border border-border p-4">
                      <p className="text-sm font-semibold text-foreground">Pelatihan {index + 1}</p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <ReadValue label="Nama Pelatihan" value={item.name} />
                        <ReadValue label="Penyelenggara" value={item.organizer} />
                        <ReadValue label="Tahun" value={item.year} />
                      </div>
                      <div className="mt-4">
                        <ReadDocument label="Sertifikat Pelatihan" value={item.certificate} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Informasi Praktek" onEdit={() => openSection("practice")}>
              <div className="space-y-4">
                <ReadValue label="Alamat" value={formData.address} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadValue label="Latitude" value={formData.latitude} />
                  <ReadValue label="Longitude" value={formData.longitude} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lokasi Praktek</p>
                  {formData.practiceLocations.length === 0 ? (
                    <p className="mt-1 text-sm font-medium text-foreground">Belum diisi</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.practiceLocations.map((location) => (
                        <span
                          key={location}
                          className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                        >
                          {location}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Informasi Rekening Bank" onEdit={() => openSection("bank")}>
              <div className="grid gap-6 sm:grid-cols-2">
                <ReadValue label="Nama Bank" value={formData.bankName} />
                <ReadValue label="Nama Pemilik Rekening" value={formData.bankAccountName} />
                <ReadValue label="Nomor Rekening" value={formData.bankAccountNumber} />
              </div>
            </SectionCard>
          </div>
        </div>
      </main>

      <Dialog.Root open={Boolean(editing)} onOpenChange={(open) => !open && closeSection()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-card shadow-lg">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <Dialog.Title className="text-xl font-bold text-foreground">
                  Edit {editing ? sectionTitles[editing] : ""}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Ubah data bagian ini. Bagian lain tetap ikut dikirim apa adanya.
                </Dialog.Description>
              </div>
              <Dialog.Close className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Tutup</span>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {draft && editing === "personal" && (
                <div className="space-y-6">
                  <div>
                    <Label>Foto Profil *</Label>
                    <div className="mt-2 flex items-end gap-4">
                      {draft.profilePicture ? (
                        <img
                          src={draft.profilePicture}
                          alt="Foto profil"
                          className="h-20 w-20 rounded-full border-2 border-primary object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-primary bg-secondary">
                          <span className="text-xs text-muted-foreground">Foto</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDraftPhoto}
                        disabled={uploadingPhoto}
                        className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground disabled:opacity-60"
                      />
                    </div>
                    {uploadingPhoto && (
                      <p className="mt-2 text-sm text-muted-foreground">Mengunggah foto...</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="fullName">Nama Lengkap *</Label>
                    <Input
                      id="fullName"
                      value={draft.fullName}
                      onChange={(event) => updateDraftField("fullName", event.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Nomor Handphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      value={draft.phone}
                      onChange={(event) => updateDraftField("phone", event.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}

              {draft && editing === "documents" && (
                <div className="space-y-6">
                  <DocumentUpload
                    label="KTP (Kartu Tanda Penduduk)"
                    documentType="Foto KTP"
                    value={draft.ktp}
                    onUpload={uploadFile}
                    onChange={(file) => updateDraftField("ktp", file)}
                    required
                  />
                  <DocumentUpload
                    label="STR (Surat Tanda Registrasi)"
                    documentType="Dokumen STR"
                    value={draft.str}
                    onUpload={uploadFile}
                    onChange={(file) => updateDraftField("str", file)}
                    required
                  />
                  <DocumentUpload
                    label="SIP (Surat Izin Praktik)"
                    documentType="Dokumen SIP"
                    value={draft.sip}
                    onUpload={uploadFile}
                    onChange={(file) => updateDraftField("sip", file)}
                    required
                  />
                  <DocumentUpload
                    label="Sertifikat UKOM"
                    documentType="Sertifikat Uji Kompetensi"
                    value={draft.ukomCertificate}
                    onUpload={uploadFile}
                    onChange={(file) => updateDraftField("ukomCertificate", file)}
                    required
                  />
                </div>
              )}

              {draft && editing === "work" && (
                <ListEditor
                  items={draft.workHistory}
                  itemLabel="Pekerjaan"
                  onAdd={() => addDraftItem("workHistory", emptyWork)}
                  onRemove={(id) => removeDraftItem("workHistory", id)}
                  renderItem={(item) => (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Tempat Kerja *" value={item.workplace} onChange={(value) => updateDraftItem("workHistory", item.id, "workplace", value)} />
                        <Field label="Jabatan *" value={item.position} onChange={(value) => updateDraftItem("workHistory", item.id, "position", value)} />
                        <Field label="Tahun Mulai" value={item.startYear} onChange={(value) => updateDraftItem("workHistory", item.id, "startYear", value)} />
                        <Field label="Tahun Selesai" value={item.endYear} onChange={(value) => updateDraftItem("workHistory", item.id, "endYear", value)} />
                      </div>
                      <div>
                        <Label>Deskripsi</Label>
                        <textarea
                          value={item.description}
                          onChange={(event) => updateDraftItem("workHistory", item.id, "description", event.target.value)}
                          className={textareaClass}
                        />
                      </div>
                    </>
                  )}
                />
              )}

              {draft && editing === "education" && (
                <ListEditor
                  items={draft.educationHistory}
                  itemLabel="Pendidikan"
                  onAdd={() => addDraftItem("educationHistory", emptyEducation)}
                  onRemove={(id) => removeDraftItem("educationHistory", id)}
                  renderItem={(item) => (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Institusi *" value={item.institution} onChange={(value) => updateDraftItem("educationHistory", item.id, "institution", value)} />
                        <Field label="Jenjang *" value={item.degree} onChange={(value) => updateDraftItem("educationHistory", item.id, "degree", value)} />
                        <Field label="Jurusan" value={item.major} onChange={(value) => updateDraftItem("educationHistory", item.id, "major", value)} />
                        <Field label="Tahun Mulai" value={item.startYear} onChange={(value) => updateDraftItem("educationHistory", item.id, "startYear", value)} />
                        <Field label="Tahun Selesai" value={item.endYear} onChange={(value) => updateDraftItem("educationHistory", item.id, "endYear", value)} />
                      </div>
                      <DocumentUpload
                        label="Ijazah"
                        documentType="Ijazah Pendidikan"
                        value={item.ijazah}
                        onUpload={uploadFile}
                        onChange={(file) => updateDraftItem("educationHistory", item.id, "ijazah", file)}
                        required
                      />
                    </>
                  )}
                />
              )}

              {draft && editing === "training" && (
                <ListEditor
                  items={draft.trainings}
                  itemLabel="Pelatihan"
                  onAdd={() => addDraftItem("trainings", emptyTraining)}
                  onRemove={(id) => removeDraftItem("trainings", id)}
                  renderItem={(item) => (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nama Pelatihan *" value={item.name} onChange={(value) => updateDraftItem("trainings", item.id, "name", value)} />
                        <Field label="Penyelenggara" value={item.organizer} onChange={(value) => updateDraftItem("trainings", item.id, "organizer", value)} />
                        <Field label="Tahun" value={item.year} onChange={(value) => updateDraftItem("trainings", item.id, "year", value)} />
                      </div>
                      <DocumentUpload
                        label="Sertifikat Pelatihan"
                        documentType="Sertifikat pelatihan"
                        value={item.certificate}
                        onUpload={uploadFile}
                        onChange={(file) => updateDraftItem("trainings", item.id, "certificate", file)}
                        required
                      />
                    </>
                  )}
                />
              )}

              {draft && editing === "practice" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Alamat *</Label>
                    <textarea
                      id="address"
                      value={draft.address}
                      onChange={(event) => updateDraftField("address", event.target.value)}
                      className={textareaClass}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Latitude *" value={draft.latitude} onChange={(value) => updateDraftField("latitude", value)} />
                    <Field label="Longitude *" value={draft.longitude} onChange={(value) => updateDraftField("longitude", value)} />
                  </div>
                  <Button type="button" variant="outline" onClick={handleDraftLocation} disabled={locating}>
                    <MapPin className="h-4 w-4" />
                    {locating ? "Mengambil lokasi..." : "Gunakan lokasi saat ini"}
                  </Button>
                  <LocationSelector
                    locations={draft.practiceLocations}
                    onChange={(locations) => updateDraftField("practiceLocations", locations)}
                  />
                </div>
              )}

              {draft && editing === "bank" && (
                <div className="grid gap-4">
                  <Field label="Nama Bank *" value={draft.bankName} onChange={(value) => updateDraftField("bankName", value)} />
                  <Field label="Nama Pemilik Rekening *" value={draft.bankAccountName} onChange={(value) => updateDraftField("bankAccountName", value)} />
                  <Field label="Nomor Rekening *" value={draft.bankAccountNumber} onChange={(value) => updateDraftField("bankAccountNumber", value)} />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <Button type="button" variant="outline" onClick={closeSection}>
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSaveSection}
                disabled={!hasChanges || uploading || uploadingPhoto}
              >
                {uploading || uploadingPhoto ? "Mengunggah file..." : "Simpan"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ProtectedRoute>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="mt-2" />
    </div>
  );
}

function ListEditor({ items, itemLabel, onAdd, onRemove, renderItem }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </div>
      {items.map((item, index) => (
        <div key={item.id} className="space-y-4 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {itemLabel} {index + 1}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(item.id)}>
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
          </div>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
