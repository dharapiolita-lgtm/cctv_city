import React from 'react';

interface StatusBadgeProps {
  type: 'camera' | 'event' | 'severity' | 'incident' | 'role' | 'active';
  value: string | boolean | null | undefined;
}

export default function StatusBadge({ type, value }: StatusBadgeProps) {
  if (!value && type === 'event') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        MENUNGGU VALIDASI
      </span>
    );
  }

  const val = String(value ?? '').toLowerCase();

  switch (type) {
    case 'camera':
      if (val === 'online') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            ONLINE
          </span>
        );
      }
      if (val === 'offline') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            OFFLINE
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          NONAKTIF
        </span>
      );

    case 'event':
      if (val === 'valid') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            VALID
          </span>
        );
      }
      if (val === 'false_alarm') {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            FALSE ALARM
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          MENUNGGU VALIDASI
        </span>
      );

    case 'severity':
      if (val === 'tinggi') {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            TINGGI
          </span>
        );
      }
      if (val === 'sedang') {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            SEDANG
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          RENDAH
        </span>
      );

    case 'incident':
      const incidentStyles: Record<string, { bg: string; text: string; label: string }> = {
        baru: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'BARU' },
        ditugaskan: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'DITUGASKAN' },
        diterima: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', label: 'DITERIMA' },
        di_lokasi: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'DI LOKASI' },
        selesai: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'SELESAI' },
        ditutup: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-600', label: 'DITUTUP' },
      };
      const style = incidentStyles[val] || { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-600', label: val.toUpperCase() };
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text}`}>
          {style.label}
        </span>
      );

    case 'role':
      const roleColors: Record<string, string> = {
        admin: 'bg-red-50 text-red-700 border-red-200',
        operator: 'bg-teal-50 text-teal-700 border-teal-200',
        petugas: 'bg-blue-50 text-blue-700 border-blue-200',
        pimpinan: 'bg-purple-50 text-purple-700 border-purple-200',
      };
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${roleColors[val] || 'bg-slate-100 text-slate-700'}`}>
          {val.toUpperCase()}
        </span>
      );

    case 'active':
      return val === 'true' || value === true ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">Aktif</span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Nonaktif</span>
      );

    default:
      return <span className="text-xs text-slate-600">{value}</span>;
  }
}
