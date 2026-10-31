export const MEDICAL_HISTORIES = {
  '1': [
    {
      id: 'visit-2',
      date: '12 Januari 2024',
      title: 'Terapi Bahu',
      summary: 'ROM terbatas pada fleksi dan abduksi. Diberikan TENS dan latihan pendulum.',
      chiefComplaint: 'Nyeri bahu kanan sejak 3 minggu, terutama saat mengangkat lengan di atas kepala.',
      presentIllness:
        'Nyeri muncul setelah mengangkat beban di gym. Skala nyeri 6/10 saat aktivitas, 3/10 saat istirahat. Tidak ada kesemutan atau kelemahan lengan.',
      pastHistory: 'Tidak ada riwayat diabetes, hipertensi, atau penyakit jantung. Pernah cedera pergelangan kaki kanan tahun 2022.',
      treatment: 'TENS 15 menit pada bahu kanan, mobilisasi sendi glenohumeral, dan latihan pendulum 3 set.',
      medications: ['Ibuprofen 200 mg bila nyeri', 'Vitamin D 1000 IU setiap hari'],
      allergies: ['Tidak ada alergi obat yang diketahui'],
      notes: 'Pasien diminta mengurangi angkat beban di atas kepala sampai kunjungan berikutnya.',
    },
    {
      id: 'visit-1',
      date: '5 Januari 2024',
      title: 'Asesmen Awal',
      summary: 'Impingement bahu kanan. Edukasi postur dan modifikasi aktivitas angkat beban.',
      chiefComplaint: 'Nyeri bahu kanan yang baru muncul setelah latihan beban.',
      presentIllness: 'Nyeri mulai 2 minggu sebelum kunjungan, memberat saat abduksi di atas 90 derajat.',
      pastHistory: 'Pernah cedera pergelangan kaki kanan tahun 2022. Tidak ada operasi sebelumnya.',
      treatment: 'Pemeriksaan ROM dan tes impingement. Edukasi postur serta modifikasi latihan.',
      medications: ['Ibuprofen 200 mg bila nyeri'],
      allergies: ['Tidak ada alergi obat yang diketahui'],
      notes: 'Rencana terapi 2 kali seminggu selama 3 minggu.',
    },
  ],
  '2': [
    {
      id: 'visit-2',
      date: '18 Januari 2024',
      title: 'Terapi Punggung',
      summary: 'Latihan stabilisasi core dan mobilisasi lumbal. Nyeri turun dari 7/10 menjadi 4/10.',
      chiefComplaint: 'Nyeri punggung bawah setelah olahraga, memberat saat duduk lama.',
      presentIllness:
        'Cedera saat latihan deadlift 10 hari lalu. Nyeri menjalar ringan ke bokong kanan, tanpa baal atau kelemahan kaki.',
      pastHistory: 'Riwayat nyeri punggung bawah berulang sejak 2021. Tidak ada riwayat fraktur.',
      treatment: 'Mobilisasi lumbal, latihan stabilisasi core, dan edukasi posisi duduk.',
      medications: ['Paracetamol 500 mg bila nyeri'],
      allergies: ['Alergi seafood'],
      notes: 'Hindari deadlift dan duduk statis lebih dari 30 menit.',
    },
    {
      id: 'visit-1',
      date: '2 Desember 2023',
      title: 'Asesmen Awal',
      summary: 'Nyeri punggung bawah mekanis. Tidak ada tanda neurologis.',
      chiefComplaint: 'Nyeri pinggang kanan saat bangun dari duduk.',
      presentIllness: 'Keluhan berulang sejak 2021, kali ini muncul setelah duduk lama di kantor.',
      pastHistory: 'Tidak ada riwayat operasi tulang belakang atau fraktur.',
      treatment: 'Pemeriksaan neurologis dasar dan edukasi ergonomi kerja.',
      medications: ['Paracetamol 500 mg bila nyeri'],
      allergies: ['Alergi seafood'],
      notes: 'Disarankan kontrol jika nyeri menjalar ke tungkai.',
    },
  ],
};

export function getMedicalHistoryRecords(bookingId) {
  return MEDICAL_HISTORIES[bookingId] ?? [];
}
