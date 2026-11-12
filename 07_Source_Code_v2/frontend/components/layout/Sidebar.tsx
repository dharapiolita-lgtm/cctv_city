'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Cctv,
  Video,
  AlertTriangle,
  ClipboardList,
  Users,
  ShieldCheck,
  FileBarChart2,
  LogOut,
  Radio,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    roles: string[];
  }

  const navItems: NavItem[] = [
    {
      label: 'Dashboard Monitoring',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['admin', 'operator'],
    },
    {
      label: 'Live CCTV Analitik',
      href: '/cctv',
      icon: <Cctv className="w-5 h-5" />,
      roles: ['admin', 'operator'],
    },
    {
      label: 'Kelola Kamera',
      href: '/cameras',
      icon: <Video className="w-5 h-5" />,
      roles: ['admin', 'operator'],
    },
    {
      label: 'Deteksi Event',
      href: '/events',
      icon: <AlertTriangle className="w-5 h-5" />,
      roles: ['admin', 'operator'],
    },
    {
      label: 'Daftar Insiden',
      href: '/incidents',
      icon: <ClipboardList className="w-5 h-5" />,
      roles: ['admin', 'operator'],
    },
    {
      label: 'Kelola Pengguna',
      href: '/users',
      icon: <Users className="w-5 h-5" />,
      roles: ['admin'],
    },
    {
      label: 'Audit Log',
      href: '/audit-logs',
      icon: <ShieldCheck className="w-5 h-5" />,
      roles: ['admin'],
    },
    // Officer View
    {
      label: 'Beranda Tugas Lapangan',
      href: '/officer/dashboard',
      icon: <ClipboardList className="w-5 h-5" />,
      roles: ['petugas', 'admin'],
    },
    // Executive View
    {
      label: 'Dashboard Eksekutif',
      href: '/executive/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['pimpinan', 'admin'],
    },
    {
      label: 'Laporan & Rekapitulasi',
      href: '/executive/reports',
      icon: <FileBarChart2 className="w-5 h-5" />,
      roles: ['pimpinan', 'admin'],
    },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-72 bg-[#0B1F3A] text-slate-100 flex flex-col justify-between h-screen sticky top-0 border-r border-slate-800 z-30 select-none shadow-xl">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link href={user.role === 'petugas' ? '/officer/dashboard' : user.role === 'pimpinan' ? '/executive/dashboard' : '/dashboard'} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 shadow-inner">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                WaterWatch
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  CCTV
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">Command Center Kota</p>
            </div>
          </Link>
        </div>

        {/* Navigation List */}
        <div className="px-4 py-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-3">
            Menu Navigasi
          </div>
          <nav className="space-y-1.5">
            {allowedNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-600/90 text-white font-semibold shadow-md shadow-teal-900/40 border border-teal-400/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Footer in Sidebar */}
      <div className="p-4 border-t border-slate-800/80 bg-[#08172c]">
        <div className="flex items-center justify-between mb-3">
          <div className="overflow-hidden pr-2">
            <p className="text-sm font-bold text-white truncate">{user.nama}</p>
            <p className="text-xs text-slate-400 truncate">@{user.username}</p>
          </div>
          <StatusBadge type="role" value={user.role} />
        </div>

        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-900/40 border border-rose-800/40 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar Sistem
        </button>
      </div>
    </aside>
  );
}

