import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { DocumentUpload } from "@/components/document-upload";
import { LocationSelector } from "@/components/location-selector";
import { ProtectedRoute } from "@/components/protected-route";
import {
  CheckCircle2,
  Clock,
  FileCheck,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import useVerifyUserProfile from "./hooks/useVerifyUserProfile";
import useUploadFile from "./hooks/useUploadFile";

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
    : [emptyWork()],
  educationHistory: user?.educationHistory?.length
    ? user.educationHistory.map(withId)
    : [emptyEducation()],
  trainings: user?.trainings?.length
    ? user.trainings.map(withId)
    : [emptyTraining()],
  address: user?.address || "",
  latitude: user?.latitude ?? "",
  longitude: user?.longitude ?? "",
  practiceLocations: user?.practiceLocations || [],
  bankAccountName: user?.bankAccountName || "",
  bankAccountNumber: user?.bankAccountNumber || "",
  bankName: user?.bankName || "",
});

export default function VerificationPage() {
  const { user, isLoading, updateProfile } = useAuth();
  const { verifyUserProfile, loading } = useVerifyUserProfile();
  const { uploadFile, uploading } = useUploadFile();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [locating, setLocating] = useState(false);
  const [formData, setFormData] = useState(() =>
    user ? formFromUser(user) : null,
  );

  useEffect(() => {
    if (user && !formData) {
      setFormData(formFromUser(user));
    }
  }, [user, formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDocumentChange = (field, file) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const url = await uploadFile(file);
      setFormData((prev) => ({ ...prev, profilePicture: url }));
    } catch (err) {
      alert(err.message || "Gagal mengunggah foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const updateListItem = (field, id, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addListItem = (field, factory) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], factory()] }));
  };

  const removeListItem = (field, id) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((item) => item.id !== id),
    }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung geolokasi");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert(
          "Gagal mengambil lokasi. Izinkan akses lokasi atau isi koordinat secara manual.",
        );
      },
    );
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      alert("Nama lengkap harus diisi");
      return false;
    }
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      alert("Nomor handphone tidak valid");
      return false;
    }
    if (!formData.profilePicture) {
      alert("Foto profil harus diunggah");
      return false;
    }
    if (!formData.ktp) {
      alert("KTP harus diunggah");
      return false;
    }
    if (!formData.str) {
      alert("STR harus diunggah");
      return false;
    }
    if (!formData.sip) {
      alert("SIP harus diunggah");
      return false;
    }
    if (!formData.ukomCertificate) {
      alert("Sertifikat UKOM harus diunggah");
      return false;
    }

    const workItems = formData.workHistory.filter(
      (item) => item.workplace.trim() || item.position.trim(),
    );
    if (workItems.length === 0) {
      alert("Minimal satu riwayat pekerjaan");
      return false;
    }
    if (
      workItems.some((item) => !item.workplace.trim() || !item.position.trim())
    ) {
      alert("Nama tempat kerja dan jabatan pada riwayat pekerjaan harus diisi");
      return false;
    }

    const educationItems = formData.educationHistory.filter(
      (item) => item.institution.trim() || item.degree.trim() || item.ijazah,
    );
    if (educationItems.length === 0) {
      alert("Minimal satu riwayat pendidikan");
      return false;
    }
    if (
      educationItems.some(
        (item) =>
          !item.institution.trim() || !item.degree.trim() || !item.ijazah,
      )
    ) {
      alert(
        "Institusi, jenjang, dan ijazah pada riwayat pendidikan harus diisi",
      );
      return false;
    }

    const trainingItems = formData.trainings.filter(
      (item) => item.name.trim() || item.organizer.trim() || item.certificate,
    );
    if (trainingItems.length === 0) {
      alert("Minimal satu pelatihan");
      return false;
    }
    if (trainingItems.some((item) => !item.name.trim() || !item.certificate)) {
      alert("Nama pelatihan dan sertifikat harus diisi");
      return false;
    }

    if (!formData.address.trim()) {
      alert("Alamat harus diisi");
      return false;
    }
    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      alert("Latitude tidak valid");
      return false;
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      alert("Longitude tidak valid");
      return false;
    }

    if (formData.practiceLocations.length === 0) {
      alert("Minimal pilih satu lokasi praktek");
      return false;
    }
    if (!formData.bankAccountName || !formData.bankAccountNumber) {
      alert("Data bank harus lengkap");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploading || uploadingPhoto) {
      alert("Tunggu hingga semua file selesai diunggah");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const result = await verifyUserProfile({
        ...formData,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
      });
      await updateProfile({
        ...formData,
        name: formData.fullName.trim(),
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        verificationStatus: "pending",
        onboardingCode: result?.data?.code,
      });
      setSubmitted(true);
      setTimeout(() => {
        navigate("/dashboard/orders");
      }, 2000);
    } catch (err) {
      alert(err.message || "Pengajuan gagal");
    }
  };

  console.log(formData);

  if (!formData) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">
            {isLoading ? "Memuat..." : "Memuat formulir..."}
          </p>
        </div>
      </ProtectedRoute>
    );
  }

  if (submitted) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center py-8">
          <Card className="max-w-md w-full mx-4 p-8 text-center border-2 border-primary">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Pengajuan Berhasil!
            </h2>
            <p className="text-muted-foreground mb-4">
              Data Anda sedang diproses oleh admin. Kami akan memberitahu Anda
              setelah verifikasi selesai.
            </p>
            <p className="text-sm text-muted-foreground">
              Mengalihkan ke dashboard...
            </p>
          </Card>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Verifikasi Data Lengkap
            </h1>
            <p className="text-muted-foreground">
              Lengkapi semua dokumen yang diperlukan untuk verifikasi profil
            </p>
          </div>

          <Card className="p-6 mb-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Status Pengajuan
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Setelah Anda menyelesaikan pengajuan, status akan berubah
                  menjadi "Menunggu Verifikasi" dan akan diproses oleh admin
                  kami.
                </p>
              </div>
            </div>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="p-8">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Informasi Pribadi
              </h2>
              <div className="space-y-6">
                <div>
                  <Label className="text-foreground mb-2 block">
                    Foto Profil <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-end gap-4">
                    <div className="flex-shrink-0">
                      {formData.profilePicture ? (
                        <img
                          src={formData.profilePicture}
                          alt="Foto profil"
                          className="h-20 w-20 rounded-full object-cover border-2 border-primary"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-secondary border-2 border-dashed border-primary flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            Foto
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingPhoto}
                        className="px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm disabled:opacity-60"
                      />
                      {uploadingPhoto && (
                        <p className="text-sm text-muted-foreground">
                          Mengunggah foto...
                        </p>
                      )}
                      {formData.profilePicture && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="self-start"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, profilePicture: "" }))
                          }
                        >
                          Hapus foto
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Unggah foto wajah terbaru dengan latar yang jelas
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="fullName" className="text-foreground">
                      Nama Lengkap <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Nama lengkap sesuai KTP"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-foreground">
                      Nomor Handphone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="08xxxxxxxxxx"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Dokumen Verifikasi
              </h2>

              <div className="space-y-6">
                <DocumentUpload
                  label="KTP (Kartu Tanda Penduduk)"
                  documentType="Foto KTP"
                  value={formData.ktp}
                  onUpload={uploadFile}
                  onChange={(file) => handleDocumentChange("ktp", file)}
                  required
                  helperText="Unggah foto atau scan KTP Anda yang masih berlaku"
                />

                <DocumentUpload
                  label="STR (Surat Tanda Registrasi)"
                  documentType="Dokumen STR"
                  value={formData.str}
                  onUpload={uploadFile}
                  onChange={(file) => handleDocumentChange("str", file)}
                  required
                  helperText="Unggah sertifikat STR dari Kementerian Kesehatan"
                />

                <DocumentUpload
                  label="SIP (Surat Izin Praktik)"
                  documentType="Dokumen SIP"
                  value={formData.sip}
                  onUpload={uploadFile}
                  onChange={(file) => handleDocumentChange("sip", file)}
                  required
                  helperText="Unggah sertifikat SIP dari dinas kesehatan setempat"
                />

                <DocumentUpload
                  label="Sertifikat UKOM"
                  documentType="Sertifikat Uji Kompetensi"
                  value={formData.ukomCertificate}
                  onUpload={uploadFile}
                  onChange={(file) =>
                    handleDocumentChange("ukomCertificate", file)
                  }
                  required
                  helperText="Unggah sertifikat Uji Kompetensi (UKOM) yang masih berlaku"
                />
              </div>
            </Card>

            <Card className="p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  Riwayat Pekerjaan
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addListItem("workHistory", emptyWork)}
                >
                  <Plus className="h-4 w-4" />
                  Tambah
                </Button>
              </div>

              <div className="space-y-4">
                {formData.workHistory.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        Pekerjaan {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeListItem("workHistory", item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-foreground">
                          Tempat Kerja *
                        </Label>
                        <Input
                          placeholder="Nama klinik atau rumah sakit"
                          value={item.workplace}
                          onChange={(e) =>
                            updateListItem(
                              "workHistory",
                              item.id,
                              "workplace",
                              e.target.value,
                            )
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Jabatan *</Label>
                        <Input
                          placeholder="Contoh: Fisioterapis"
                          value={item.position}
                          onChange={(e) =>
                            updateListItem(
                              "workHistory",
                              item.id,
                              "position",
                              e.target.value,
                            )
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Tahun Mulai</Label>
                        <Input
                          placeholder="2020"
                          value={item.startYear}
                          onChange={(e) =>
                            updateListItem(
                              "workHistory",
                              item.id,
                              "startYear",
                              e.target.value,
                            )
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Tahun Selesai</Label>
                        <Input
                          placeholder="2024 atau Sekarang"
                          value={item.endYear}
                          onChange={(e) =>
                            updateListItem(
                              "workHistory",
                              item.id,
                              "endYear",
                              e.target.value,
                            )
                          }
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-foreground">Deskripsi</Label>
                      <textarea
                        placeholder="Tugas atau bidang yang ditangani"
                        value={item.description}
                        onChange={(e) =>
                          updateListItem(
                            "workHistory",
                            item.id,
                            "description",
                            e.target.value,
                          )
                        }
                        className="mt-2 flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      />
                    </div>
                  </div>
                ))}
                {formData.workHistory.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Belum ada riwayat pekerjaan. Tambahkan minimal satu.
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  Riwayat Pendidikan
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    addListItem("educationHistory", emptyEducation)
                  }
                >
                  <Plus className="h-4 w-4" />
                  Tambah
                </Button>
              </div>

              <div className="space-y-4">
                {formData.educationHistory.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        Pendidikan {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeListItem("educationHistory", item.id)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-foreground">Institusi *</Label>
                        <Input
                          placeholder="Nama kampus atau sekolah"
                          value={item.institution}
                          onChange={(e) =>
                            updateListItem(
                              "educationHistory",
                              item.id,
                              "institution",
                              e.target.value,
                            )
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Jenjang *</Label>
                        <Input
                          placeholder="D3, D4, S1, atau S2"
                          value={item.degree}
                          onChange={(e) =>
                            updateListItem(
                              "educationHistory",
                              item.id,
                              "degree",
                              e.target.value,
                            )
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Jurusan</Label>
                        <Input
                          placeholder="Fisioterapi"
                          value={item.major}
                          onChange={(e) =>
                            updateListItem(
                              "educationHistory",
                              item.id,
                              "major",
                              e.target.value,
                            )
                          }
                          className="mt-2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-foreground">Tahun Mulai</Label>
                          <Input
                            placeholder="2016"
                            value={item.startYear}
                            onChange={(e) =>
                              updateListItem(
                                "educationHistory",
                                item.id,
                                "startYear",
                                e.target.value,
                              )
                            }
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground">
                            Tahun Selesai
                          </Label>
                          <Input
                            placeholder="2020"
                            value={item.endYear}
                            onChange={(e) =>
                              updateListItem(
                                "educationHistory",
                                item.id,
                                "endYear",
                                e.target.value,
                              )
                            }
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                    <DocumentUpload
                      label="Ijazah"
                      documentType="Ijazah Pendidikan"
                      value={item.ijazah}
                      onUpload={uploadFile}
                      onChange={(file) =>
                        updateListItem(
                          "educationHistory",
                          item.id,
                          "ijazah",
                          file,
                        )
                      }
                      required
                      helperText="Unggah scan atau foto ijazah untuk pendidikan ini"
                    />
                  </div>
                ))}
                {formData.educationHistory.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Belum ada riwayat pendidikan. Tambahkan minimal satu.
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-foreground">Pelatihan</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addListItem("trainings", emptyTraining)}
                >
                  <Plus className="h-4 w-4" />
                  Tambah
                </Button>
              </div>

              <div className="space-y-4">
                {formData.trainings.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        Pelatihan {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeListItem("trainings", item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-foreground">
                          Nama Pelatihan *
                        </Label>
                        <Input
                          placeholder="Nama pelatihan atau seminar"
                          value={item.name}
                          onChange={(e) =>
                            updateListItem(
                              "trainings",
                              item.id,
                              "name",
                              e.target.value,
                            )
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Penyelenggara</Label>
                        <Input
                          placeholder="Nama lembaga penyelenggara"
                          value={item.organizer}
                          onChange={(e) =>
                            updateListItem(
                              "trainings",
                              item.id,
                              "organizer",
                              e.target.value,
                            )
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Tahun</Label>
                        <Input
                          placeholder="2024"
                          value={item.year}
                          onChange={(e) =>
                            updateListItem(
                              "trainings",
                              item.id,
                              "year",
                              e.target.value,
                            )
                          }
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <DocumentUpload
                      label="Sertifikat Pelatihan"
                      documentType="Sertifikat pelatihan"
                      value={item.certificate}
                      onUpload={uploadFile}
                      onChange={(file) =>
                        updateListItem(
                          "trainings",
                          item.id,
                          "certificate",
                          file,
                        )
                      }
                      required
                      helperText="Unggah sertifikat untuk pelatihan ini"
                    />
                  </div>
                ))}
                {formData.trainings.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Belum ada pelatihan. Tambahkan minimal satu.
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Informasi Praktek
              </h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="address" className="text-foreground">
                    Alamat *
                  </Label>
                  <textarea
                    id="address"
                    name="address"
                    placeholder="Alamat lengkap tempat tinggal atau praktik"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-2 flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="latitude" className="text-foreground">
                      Latitude *
                    </Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      inputMode="decimal"
                      placeholder="-6.200000"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude" className="text-foreground">
                      Longitude *
                    </Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      inputMode="decimal"
                      placeholder="106.816666"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetLocation}
                  disabled={locating}
                >
                  <MapPin className="h-4 w-4" />
                  {locating ? "Mengambil lokasi..." : "Gunakan lokasi saat ini"}
                </Button>

                <LocationSelector
                  locations={formData.practiceLocations}
                  onChange={(locations) =>
                    setFormData((prev) => ({
                      ...prev,
                      practiceLocations: locations,
                    }))
                  }
                />
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Informasi Rekening Bank
              </h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="bankName" className="text-foreground">
                    Nama Bank *
                  </Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    placeholder="Contoh: Bank Central Asia"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="bankAccountName" className="text-foreground">
                    Nama Pemilik Rekening *
                  </Label>
                  <Input
                    id="bankAccountName"
                    name="bankAccountName"
                    placeholder="Nama sesuai rekening bank"
                    value={formData.bankAccountName}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="bankAccountNumber"
                    className="text-foreground"
                  >
                    Nomor Rekening *
                  </Label>
                  <Input
                    id="bankAccountNumber"
                    name="bankAccountNumber"
                    placeholder="Nomor rekening"
                    value={formData.bankAccountNumber}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Kembali
              </Button>
              <Button
                type="submit"
                disabled={loading || uploading || uploadingPhoto}
                size="lg"
              >
                {loading
                  ? "Memproses..."
                  : uploading || uploadingPhoto
                    ? "Mengunggah file..."
                    : "Ajukan Verifikasi"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
