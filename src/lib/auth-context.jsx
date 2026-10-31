import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/lib/endpoints';

const AuthContext = createContext(undefined);

function getErrorMessage(result, fallback) {
  if (!result) return fallback;
  if (typeof result === 'string') return result;
  if (typeof result.message === 'string' && result.message) return result.message;
  if (typeof result.errorServer === 'string' && result.errorServer) return result.errorServer;
  if (typeof result.messageTitle === 'string' && result.messageTitle) return result.messageTitle;
  if (typeof result.error === 'string' && result.error) return result.error;

  if (result.errors && typeof result.errors === 'object') {
    const first = Object.values(result.errors).flat().find(Boolean);
    if (typeof first === 'string') return first;
  }

  return fallback;
}

function sessionFromLogin(email, result) {
  const data = result?.data && typeof result.data === 'object' ? result.data : {};
  const isVerified = Boolean(data.isVerified);

  return {
    id: data.code || email,
    email: data.email || email,
    code: data.code || '',
    lang: data.Lang || '',
    isVerified,
    verificationStatus: isVerified ? 'pending' : 'not_verified',
    token: data.token || '',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const register = async (email, password) => {
    const otp = '123456';
    localStorage.setItem(
      'pendingAuth',
      JSON.stringify({
        email,
        password,
        otp,
        timestamp: Date.now(),
      })
    );
    console.log('[Auth] OTP generated (demo):', otp);
    return otp;
  };

  const verifyOtp = async (email, otp) => {
    const pendingAuth = localStorage.getItem('pendingAuth');
    if (!pendingAuth) throw new Error('Registrasi tidak ditemukan');

    const { otp: savedOtp } = JSON.parse(pendingAuth);
    if (otp !== savedOtp) throw new Error('OTP tidak valid');

    const newUser = {
      id: Date.now().toString(),
      email,
      verificationStatus: 'not_verified',
    };

    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.removeItem('pendingAuth');
  };

  const establishSession = (sessionUser) => {
    setUser(sessionUser);
    localStorage.setItem('user', JSON.stringify(sessionUser));
    if (sessionUser?.token) {
      localStorage.setItem('token', sessionUser.token);
    }
  };

  const login = async (email, password) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success === false || !result?.data?.token) {
        const fallback = response.status === 404
          ? 'Layanan login tidak ditemukan'
          : 'Email atau password salah';
        throw new Error(getErrorMessage(result, fallback));
      }

      const sessionUser = sessionFromLogin(email, result);
      establishSession(sessionUser);
      return sessionUser;
    } catch (err) {
      const message =
        err.name === 'AbortError'
          ? 'Permintaan ke server terlalu lama'
          : err.message === 'Failed to fetch'
            ? 'Tidak dapat terhubung ke server'
            : err.message || 'Login gagal';
      throw new Error(message);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateProfile = async (data) => {
    if (!user) throw new Error('User tidak ditemukan');

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verifyOtp,
        establishSession,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan dalam AuthProvider');
  }
  return context;
}
