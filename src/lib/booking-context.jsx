import React, { createContext, useContext, useState, useEffect } from 'react';

const BookingContext = createContext(undefined);

const MOCK_BOOKINGS = [
  {
    id: '1',
    patientName: 'Andi Wijaya',
    patientPhone: '08123456789',
    patientImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    service: 'Terapi Bahu',
    location: 'Jakarta Selatan',
    patientAddress:
      'Jl. Kemang Raya No. 18, RT 05/RW 02, Kelurahan Bangka, Kecamatan Mampang Prapatan, Jakarta Selatan 12730',
    scheduledTime: '2024-01-27 14:00',
    status: 'new',
    notes: 'Klien mengalami nyeri pada bahu kanan',
  },
  {
    id: '2',
    patientName: 'Siti Nurhaliza',
    patientPhone: '08987654321',
    patientImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    service: 'Terapi Punggung',
    location: 'Jakarta Pusat',
    patientAddress:
      'Jl. Menteng Raya No. 42, RT 03/RW 01, Kelurahan Menteng, Kecamatan Menteng, Jakarta Pusat 10310',
    scheduledTime: '2024-01-27 15:30',
    status: 'new',
    notes: 'Cedera punggung dari olahraga',
  },
];

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('bookings');
    if (stored) {
      const storedBookings = JSON.parse(stored);
      const merged = storedBookings.map((booking) => {
        const mock = MOCK_BOOKINGS.find((item) => item.id === booking.id);
        return {
          ...mock,
          ...booking,
          patientAddress: booking.patientAddress || mock?.patientAddress,
        };
      });
      setBookings(merged);
      localStorage.setItem('bookings', JSON.stringify(merged));
    } else {
      setBookings(MOCK_BOOKINGS);
      localStorage.setItem('bookings', JSON.stringify(MOCK_BOOKINGS));
    }

    const storedReports = localStorage.getItem('reports');
    if (storedReports) {
      setReports(JSON.parse(storedReports));
    }
  }, []);

  const addBooking = (booking) => {
    const updated = [...bookings, booking];
    setBookings(updated);
    localStorage.setItem('bookings', JSON.stringify(updated));
  };

  const updateBooking = (id, data) => {
    const updated = bookings.map((b) => (b.id === id ? { ...b, ...data } : b));
    setBookings(updated);
    localStorage.setItem('bookings', JSON.stringify(updated));
  };

  const getBookingById = (id) => {
    return bookings.find((b) => b.id === id);
  };

  const addReport = (report) => {
    const updated = [...reports, report];
    setReports(updated);
    localStorage.setItem('reports', JSON.stringify(updated));
  };

  const getReportsByBookingId = (bookingId) => {
    return reports.filter((r) => r.bookingId === bookingId);
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        reports,
        addBooking,
        updateBooking,
        getBookingById,
        addReport,
        getReportsByBookingId,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking harus digunakan dalam BookingProvider');
  }
  return context;
}
