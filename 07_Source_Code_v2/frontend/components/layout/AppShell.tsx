'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import GlobalFooter from '@/components/layout/GlobalFooter';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  allowedRoles?: string[];
}

export default function AppShell({
  children,
  title,
  subtitle,
  onRefresh,
  allowedRoles,
}: AppShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] flex flex-col justify-between">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-700">Memuat sesi WaterWatch...</p>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] flex flex-col justify-between">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              !
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Akses Ditolak (403)</h3>
            <p className="text-sm text-slate-600 mb-6">
              Peran Anda ({user.role.toUpperCase()}) tidak memiliki izin mengakses modul ini.
            </p>
            <button
              onClick={() => router.push(user.role === 'petugas' ? '/officer/dashboard' : user.role === 'pimpinan' ? '/executive/dashboard' : '/dashboard')}
              className="px-5 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FF]">
      <div className="flex-1 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar title={title} subtitle={subtitle} onRefresh={onRefresh} />
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}

