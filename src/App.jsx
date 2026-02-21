import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/header';
import { useEffect } from 'react';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import VerifyOtpPage from '@/pages/auth/VerifyOtpPage';

import OrdersPage from '@/pages/dashboard/OrdersPage';
import OrderDetailPage from '@/pages/dashboard/OrderDetailPage';
import CreateReportPage from '@/pages/dashboard/CreateReportPage';
import ReportPage from '@/pages/dashboard/ReportPage';
import ChatPage from '@/pages/dashboard/ChatPage';
import ChatRoomPage from '@/pages/dashboard/ChatRoomPage';
import PaymentsPage from '@/pages/dashboard/PaymentsPage';
import MonthlyPaymentDetailPage from '@/pages/dashboard/MonthlyPaymentDetailPage';
import SettingsPage from '@/pages/dashboard/SettingsPage';
import VerificationPage from '@/pages/dashboard/VerificationPage';
import CompleteProfilePage from '@/pages/dashboard/CompleteProfilePage';

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
        <Route path="/dashboard/orders/:id/create-report" element={<CreateReportPage />} />
        <Route path="/dashboard/orders/:id/report" element={<ReportPage />} />
        <Route path="/dashboard/chat" element={<ChatPage />} />
        <Route path="/dashboard/chat/room/:id" element={<ChatRoomPage />} />
        <Route path="/dashboard/payments" element={<PaymentsPage />} />
        <Route path="/dashboard/payments/:month" element={<MonthlyPaymentDetailPage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />
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
    </BrowserRouter>
  );
}
