// src/pages/OtpPage.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OtpPage() {
  const loc = useLocation();
  const navigate = useNavigate();
  const phone = loc.state?.phone || '';
  const channel = loc.state?.channel || 'sms'; // read channel passed from login
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const { verifyOtp } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const res = await verifyOtp({
      phone,
      code,
      deviceInfo: { model: 'web', os: navigator.userAgent },
      channel, // pass channel to backend (helpful for test-mode)
    });
    if (res.ok) {
      navigate('/map');
    } else {
      setMsg(res.error?.error || JSON.stringify(res.error) || 'Verification failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-28 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Enter OTP</h1>
      <div className="mb-3 text-sm text-gray-600">
        Code sent to <strong>{phone}</strong> via <strong>{channel.toUpperCase()}</strong>
      </div>
      <form onSubmit={submit}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          className="w-full px-3 py-2 border rounded mb-4"
        />
        <button className="w-full bg-green-600 text-white py-2 rounded">Verify</button>
        {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}
      </form>
    </div>
  );
}
