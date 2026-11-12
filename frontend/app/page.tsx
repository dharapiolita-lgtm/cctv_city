'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import GlobalFooter from '@/components/layout/GlobalFooter';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        switch (user.role) {
          case 'petugas':
            router.push('/officer/dashboard');
            break;
          case 'pimpinan':
            router.push('/executive/dashboard');
            break;
          case 'admin':
          case 'operator':
          default:
            router.push('/dashboard');
            break;
        }
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8F9FF]">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-700">Mengarahkan ke dashboard WaterWatch...</p>
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}

