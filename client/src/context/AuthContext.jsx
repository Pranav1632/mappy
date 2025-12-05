// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { setAuth as setAuthStorage, getAuth as getAuthStorage } from './auth-storage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // update storage (axios uses auth-storage)
  const updateAccess = (token) => {
    setAccessToken(token);
    setAuthStorage({ accessToken: token });
  };

  // fetch profile if token exists
  useEffect(() => {
    let mounted = true;
    const loadMe = async () => {
      if (!accessToken) return;
      try {
        const res = await api.get('/user/me');
        if (mounted) setUser(res.data.user);
      } catch (err) {
        setUser(null);
      }
    };
    loadMe();
    return () => {
      mounted = false;
    };
  }, [accessToken]);

  const requestOtp = async (phone, channel = 'sms') => {
    setLoading(true);
    try {
      // send channel to backend
      await api.post('/auth/request-otp', { phone, channel });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err?.response?.data || err.message };
    } finally {
      setLoading(false);
    }
  };
 const verifyOtp = async ({ phone, code, deviceInfo, channel = 'sms' }) => {
    setLoading(true);
    try {
      // include channel for test-mode matching and backend logs
      const res = await api.post('/auth/verify-otp', { phone, code, deviceInfo, channel });
      const { accessToken: at } = res.data;
      updateAccess(at);
      const me = await api.get('/user/me');
      setUser(me.data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err?.response?.data || err.message };
    } finally {
      setLoading(false);
    }
  };
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore
    } finally {
      updateAccess(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        loading,
        requestOtp,
        verifyOtp,
        logout,
        setAccessToken: updateAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
