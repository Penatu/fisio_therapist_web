import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/toaster';
import { useEffect } from 'react';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import VerifyOtpPage from '@/pages/auth/VerifyOtpPage';

import OrdersPage from '@/pages/dashboard/orders/OrdersPage';
import OrderDetailPage from '@/pages/dashboard/orders/OrderDetailPage';
import MedicalHistoryPage from '@/pages/dashboard/orders/MedicalHistoryPage';
import CreateReportPage from '@/pages/dashboard/orders/CreateReportPage';
import ReportPage from '@/pages/dashboard/orders/ReportPage';
import ChatPage from '@/pages/dashboard/chat/ChatPage';
import ChatRoomPage from '@/pages/dashboard/chat/ChatRoomPage';
import PaymentsPage from '@/pages/dashboard/payments/PaymentsPage';
import MonthlyPaymentDetailPage from '@/pages/dashboard/payments/MonthlyPaymentDetailPage';
import NotificationsPage from '@/pages/dashboard/notifications/NotificationsPage';
import SettingsPage from '@/pages/dashboard/settings/SettingsPage';
import ProfilePage from '@/pages/dashboard/settings/ProfilePage';
import PracticeSchedulePage from '@/pages/dashboard/settings/PracticeSchedulePage';
import VerificationPage from '@/pages/dashboard/settings/VerificationPage';
import CompleteProfilePage from '@/pages/dashboard/settings/CompleteProfilePage';

function HomeRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        if (user.verificationStatus === 'not_verified') {
          navigate('/dashboard/complete-profile', { replace: true });
        } else {
          navigate('/dashboard/orders', { replace: true });
        }
      } else {
        navigate('/auth/login', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    </div>
  );
}

function AppLayout() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/dashboard/orders" element={<OrdersPage />} />
        <Route path="/dashboard/orders/:id" element={<OrderDetailPage />} />
        <Route path="/dashboard/orders/:id/medical-history" element={<MedicalHistoryPage />} />
        <Route path="/dashboard/orders/:id/create-report" element={<CreateReportPage />} />
        <Route path="/dashboard/orders/:id/report" element={<ReportPage />} />
        <Route path="/dashboard/chat" element={<ChatPage />} />
        <Route path="/dashboard/chat/room/:id" element={<ChatRoomPage />} />
        <Route path="/dashboard/notifications" element={<NotificationsPage />} />
        <Route path="/dashboard/payments" element={<PaymentsPage />} />
        <Route path="/dashboard/payments/:month" element={<MonthlyPaymentDetailPage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />
        <Route path="/dashboard/settings/profile" element={<ProfilePage />} />
        <Route path="/dashboard/settings/schedule" element={<PracticeSchedulePage />} />
        <Route path="/dashboard/verification" element={<VerificationPage />} />
        <Route path="/dashboard/complete-profile" element={<CompleteProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
      <Toaster />
    </BrowserRouter>
  );
}
