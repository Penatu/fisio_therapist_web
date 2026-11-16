import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';

const BookingContext = createContext(undefined);

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('bookings');
    if (stored) {
      try {
        const storedBookings = JSON.parse(stored);
        if (Array.isArray(storedBookings)) setBookings(storedBookings);
      } catch {
        setBookings([]);
      }
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

  const replaceBookings = useCallback((nextBookings) => {
    const list = Array.isArray(nextBookings) ? nextBookings : [];
    setBookings(list);
    localStorage.setItem('bookings', JSON.stringify(list));
  }, []);

  const upsertBooking = useCallback((booking) => {
    if (!booking?.id) return;
    setBookings((current) => {
      const index = current.findIndex((item) => item.id === booking.id);
      const next =
        index === -1
          ? [...current, booking]
          : current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...booking } : item));
      localStorage.setItem('bookings', JSON.stringify(next));
      return next;
    });
  }, []);

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
        replaceBookings,
        upsertBooking,
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
