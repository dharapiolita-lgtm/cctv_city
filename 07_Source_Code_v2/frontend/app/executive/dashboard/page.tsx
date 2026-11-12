'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import {
  DashboardSummary,
  DashboardIncidents,
  TrendItem,
  Incident,
} from '@/types';
import {
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  Clock,
  AlertTriangle,
  ClipboardList,
  Eye,
  X,
  MapPin,
  Calendar,
} from 'lucide-react';

export default function ExecutiveDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [incidentsStats, setIncidentsStats] = useState<DashboardIncidents | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fetchExecutiveData = useCallback(async () => {
    try {
      const [sumRes, incStatsRes, trendsRes, incListRes] = await Promise.all([
        api.get<DashboardSummary>('/dashboard/summary'),
        api.get<DashboardIncidents>('/dashboard/incidents'),
        api.get<TrendItem[]>('/dashboard/trends'),
        api.get<{ data: Incident[] }>('/incidents?per_page=10'),
      ]);

      setSummary(sumRes);
      setIncidentsStats(incStatsRes);
      setTrends(trendsRes || []);
      setRecentIncidents(incListRes.data || []);
    } catch (err) {
      console.error('Gagal mengambil data eksekutif:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExecutiveData();
    const interval = setInterval(fetchExecutiveData, 20000);
    return () => clearInterval(interval);
  }, [fetchExecutiveData]);

  return (
    <AppShell
      title="Dashboard Eksekutif Pimpinan"
      subtitle="Ringkasan Kinerja Keamanan Wilayah Kota & Analitik Penanganan Insiden (Read-Only)"
      onRefresh={fetchExecutiveData}
      allowedRoles={['pimpinan', 'admin']}
    >
      <div className="space-y-6">
        {/* Executive Banner */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#123055] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-extrabold text-xl shadow-inner">
              PEMDA
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold">Portal Pengawasan Eksekutif</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Pemerintah Daerah Kota Bandar Lampung — Akses Khusus Pimpinan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold bg-teal-600/80 text-white px-3 py-1.5 rounded-lg border border-teal-400/30 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
              MODE READ-ONLY AKTIF
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Insiden Terbuka Saat Ini"
            value={summary?.open_incidents ?? '-'}
            badge="PENANGANAN AKTIF"
            badgeColor="rose"
            subtitle="Sedang ditangani petugas lapangan"
            icon={<ClipboardList className="w-5 h-5 text-rose-500" />}
          />

          <StatCard
            title="Total Event Deteksi"
            value={summary?.events_today ?? '-'}
            badge="HARI INI"
            badgeColor="amber"
            subtitle="Sensor CCTV analitik kota"
            icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          />

          <StatCard
            title="Rata-rata Waktu Respons"
            value={`${summary?.avg_response_time_minutes ?? 0} mnt`}
            badge="TARGET < 15 MNT"
            badgeColor="teal"
            subtitle="Kecepatan respons petugas ke lokasi"
            icon={<Clock className="w-5 h-5 text-teal-600" />}
          />

          <StatCard
            title="False Alarm Rate"
            value={`${summary?.false_alarm_rate_percent ?? 0}%`}
            badge="AKURASI SISTEM"
            badgeColor="blue"
            subtitle="Persentase verifikasi sensor"
            icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          />
        </div>

        {/* Analytics Distribution Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trends 7 Days */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-700" />
                <h3 className="font-extrabold text-base text-[#0B1C30]">
                  Tren Insiden & Event 7 Hari Terakhir
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Berdasarkan data database</span>
            </div>

            <div className="space-y-4">
              {trends.map((t) => (
                <div key={t.tanggal} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{t.tanggal}</span>
                    <span className="text-slate-500">
                      {t.total_events} Event / <strong className="text-teal-700">{t.total_incidents} Insiden</strong>
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      className="bg-teal-600 h-full rounded-l-full"
                      style={{ width: `${Math.min(100, t.total_incidents * 20)}%` }}
                    />
                    <div
                      className="bg-amber-400 h-full rounded-r-full"
                      style={{ width: `${Math.min(100, t.total_events * 10)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Types Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
                <LayoutDashboard className="w-5 h-5 text-teal-700" />
                <h3 className="font-extrabold text-base text-[#0B1C30]">
                  Proporsi Jenis Insiden
                </h3>
              </div>

              <div className="space-y-3">
                {incidentsStats?.by_jenis.map((item) => (
                  <div
                    key={item.name}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-semibold"
                  >
                    <span className="text-slate-800">{item.name}</span>
                    <span className="font-extrabold text-teal-800 px-2 py-0.5 rounded bg-teal-50 border border-teal-200">
                      {item.count} Kasus
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
              Seluruh statistik bersumber dari tabel PostgreSQL secara real-time
            </div>
          </div>
        </div>

        {/* Latest Incidents Table (Read-Only) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-700" />
              <h3 className="font-extrabold text-base text-[#0B1C30]">
                Rekapitulasi Insiden Lapangan Terbaru
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">10 Insiden Terkini</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Jenis Insiden</th>
                  <th className="py-3.5 px-5">Lokasi Kejadian</th>
                  <th className="py-3.5 px-5">Keparahan</th>
                  <th className="py-3.5 px-5">Status Terakhir</th>
                  <th className="py-3.5 px-5">Petugas URC</th>
                  <th className="py-3.5 px-5 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900">{inc.jenis}</td>
                    <td className="py-4 px-5 text-slate-600 max-w-xs truncate">{inc.lokasi}</td>
                    <td className="py-4 px-5">
                      <StatusBadge type="severity" value={inc.keparahan} />
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge type="incident" value={inc.status} />
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-800">
                      {inc.petugas_nama || 'Belum ditugaskan'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Read-Only Modal Detail */}
        {selectedIncident && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900">{selectedIncident.jenis}</h3>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <StatusBadge type="severity" value={selectedIncident.keparahan} />
                  <StatusBadge type="incident" value={selectedIncident.status} />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Deskripsi Kejadian
                  </span>
                  <p className="font-medium text-slate-800 leading-relaxed">
                    {selectedIncident.deskripsi}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Lokasi
                    </span>
                    <p className="font-semibold text-slate-800">{selectedIncident.lokasi}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Petugas Ditugaskan
                    </span>
                    <p className="font-semibold text-slate-800">
                      {selectedIncident.petugas_nama || 'Belum ditugaskan'}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Waktu Dilaporkan: {new Date(selectedIncident.dibuat_pada).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Tutup Tampilan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

