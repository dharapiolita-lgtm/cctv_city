'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Sparkles, RefreshCw, Bell, Shield } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export default function Topbar({ title, subtitle, onRefresh }: TopbarProps) {
  const { user } = useAuth();
  const [time, setTime] = useState<string>('');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async () => {
    if (simulating) return;
    setSimulating(true);
    try {
      const res: any = await api.post('/events/simulate');
      setToastMsg(`Simulasi Sukses: Event terdeteksi di kamera ${res.event?.camera_nama || 'online'}`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setToastMsg(`Simulasi gagal: ${err.message || 'Tidak ada kamera online'}`);
    } finally {
      setSimulating(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/90 px-6 py-4 sticky top-0 z-20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-[#0B1C30] tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs md:text-sm text-slate-500 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center flex-wrap gap-3">
        {/* Toast Notification */}
        {toastMsg && (
          <div className="bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            {toastMsg}
          </div>
        )}

        {/* Live Status indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Pembaruan otomatis aktif
        </div>

        {/* Manual Simulation Button for Admin / Operator */}
        {user && ['admin', 'operator'].includes(user.role) && (
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100/80 text-xs font-semibold transition-colors disabled:opacity-60"
            title="Buat event simulasi instan untuk demo"
          >
            <Sparkles className={`w-3.5 h-3.5 text-teal-600 ${simulating ? 'animate-spin' : ''}`} />
            <span>{simulating ? 'Menstimulasi...' : 'Simulasi Event'}</span>
          </button>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Segarkan Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Time Badge */}
        <div className="text-xs text-slate-600 font-medium px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
          {time || 'Memuat waktu...'}
        </div>
      </div>
    </header>
  );
}

