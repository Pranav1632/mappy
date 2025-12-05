// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState('sms'); // 'sms' or 'whatsapp'
  const [msg, setMsg] = useState(null);
  const { requestOtp } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const p = phone.startsWith('+') ? phone : `+91${phone}`;
    const res = await requestOtp(p, channel);
    if (res.ok) {
      // pass phone + channel to otp page so we can show which channel and include it when verifying
      navigate('/otp', { state: { phone: p, channel } });
    } else {
      setMsg(res.error?.error || JSON.stringify(res.error) || 'Failed to send OTP');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-28 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Sign in with Phone</h1>
      <form onSubmit={submit}>
        <label className="block text-sm font-medium mb-2">Phone</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+917499xxxxxx or 7499xxxxx"
          className="w-full px-3 py-2 border rounded mb-4"
        />

        <label className="block text-sm font-medium mb-2">Send OTP via</label>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-4"
        >
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
        </select>

        <button className="w-full bg-blue-600 text-white py-2 rounded">Send OTP</button>
        {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}
      </form>
    </div>
  );
}
