import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(undefined);

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

  const login = async (email, password) => {
    if (email === 'terapis@demo.com' && password === 'password123') {
      const testUser = {
        id: 'demo-user',
        email,
        name: 'Fisioterapis Demo',
        phone: '08123456789',
        verificationStatus: 'pending',
        practiceLocations: ['Jakarta Selatan'],
        bankAccountName: 'Fisioterapis Demo',
        bankAccountNumber: '1234567890',
        bankName: 'Bank Central Asia',
      };
      setUser(testUser);
      localStorage.setItem('user', JSON.stringify(testUser));
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (!storedUser) throw new Error('Email atau password salah');

    const storedUserObj = JSON.parse(storedUser);
    if (storedUserObj.email !== email) throw new Error('Email atau password salah');

    setUser(storedUserObj);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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
