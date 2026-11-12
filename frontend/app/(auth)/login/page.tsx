'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';
import GlobalFooter from '@/components/layout/GlobalFooter';
import { Radio, Eye, EyeOff, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('operator');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Demo accounts for rapid one-click selection
  const demoAccounts = [
    { label: 'Operator (Rina)', user: 'operator' },
    { label: 'Admin (Pusat)', user: 'admin' },
    { label: 'Petugas Lapangan', user: 'petugas1' },
    { label: 'Pimpinan (Eksekutif)', user: 'pimpinan' },
  ];

  const handleQuickSelect = (u: string) => {
    setUsername(u);
    setPassword('password123');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMessage('Harap isi nama pengguna dan kata sandi.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response: any = await api.post('/auth/login', { username, password });
      login(response.token, response.user);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal menghubungi server pusat. Pastikan koneksi aktif.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex flex-col justify-between">
      {/* Top institution bar */}
      <div className="bg-[#0B1F3A] py-3 px-6 text-slate-300 text-xs border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span className="font-medium text-slate-200">Sistem Resmi Terenkripsi — Pemerintah Daerah Kota</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          NODE-ID: CC-BDL-01
        </div>
      </div>

      {/* Main Login Container */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">
            {/* Header Area */}
            <div className="p-8 text-center bg-gradient-to-b from-[#0B1F3A] to-[#122b4d] text-white">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 mx-auto mb-4 shadow-lg">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">WaterWatch</h1>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Sistem Monitoring Command Center CCTV Analitik Keamanan Kota
              </p>
            </div>

            {/* Quick Demo Selector */}
            <div className="px-8 pt-6 pb-2">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider text-center">
                Pilih Akun Demo Cepat
              </p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.user}
                    type="button"
                    onClick={() => handleQuickSelect(acc.user)}
                    className={`text-xs py-1.5 px-2.5 rounded-lg border font-medium transition-all ${
                      username === acc.user
                        ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Pengguna / NIP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Masukkan username atau NIP"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memverifikasi Akses...</span>
                    </>
                  ) : (
                    <span>Masuk ke Command Center</span>
                  )}
                </button>
              </div>

              <div className="pt-2 text-center text-[11px] text-slate-400">
                Peringatan: Akses sistem diawasi secara elektronik melalui Audit Trail.
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Global Footer (Mandatory) */}
      <GlobalFooter />
    </div>
  );
}

