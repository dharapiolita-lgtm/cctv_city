'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import {
  DashboardSummary,
  DetectionEvent,
  Camera,
  DashboardIncidents,
  TrendItem,
} from '@/types';
import {
  Cctv,
  AlertTriangle,
  ClipboardList,
  Clock,
  ShieldCheck,
  Video,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<DetectionEvent[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [incidentsStats, setIncidentsStats] = useState<DashboardIncidents | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simToast, setSimToast] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, evRes, camRes, incRes, trendRes] = await Promise.all([
        api.get<DashboardSummary>('/dashboard/summary'),
        api.get<{ data: DetectionEvent[] }>('/events?per_page=6'),
        api.get<{ data: Camera[] }>('/cameras?per_page=6'),
        api.get<DashboardIncidents>('/dashboard/incidents'),
        api.get<TrendItem[]>('/dashboard/trends'),
      ]);

      setSummary(sumRes);
      setRecentEvents(evRes.data || []);
      setCameras(camRes.data || []);
      setIncidentsStats(incRes);
      setTrends(trendRes || []);
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto polling every 15 seconds for real-time monitoring
    const timer = setInterval(fetchData, 15000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleSimulate = async () => {
    if (simulating) return;
    setSimulating(true);
    setSimToast(null);
    try {
      const res: any = await api.post('/events/simulate');
      setSimToast(`Simulasi Sukses: Terdeteksi event baru pada ${res.event?.camera_nama || 'Kamera Online'} (Skor: ${Math.round((res.event?.skor || 0.8) * 100)}%)`);
      await fetchData();
    } catch (err: any) {
      setSimToast(`Gagal: ${err.message || 'Tidak ada kamera aktif'}`);
    } finally {
      setSimulating(false);
      setTimeout(() => setSimToast(null), 5000);
    }
  };

  const handleValidate = async (id: string, validasi: 'valid' | 'false_alarm') => {
    setValidatingId(id);
    try {
      await api.post(`/events/${id}/validate`, { validasi });
      await fetchData();
    } catch (err: any) {
      alert(`Validasi gagal: ${err.message || 'Konflik validasi'}`);
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <AppShell
      title="Dashboard Monitoring Command Center"
      subtitle="Pemantauan CCTV Analitik & Manajemen Insiden Keamanan Kota"
      onRefresh={fetchData}
      allowedRoles={['admin', 'operator']}
    >
      <div className="space-y-6">
        {/* Interactive Simulation Mode Banner */}
        <div className="bg-gradient-to-r from-[#0B1F3A] via-[#10335c] to-teal-900 rounded-2xl p-5 text-white shadow-lg border border-teal-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shrink-0 mt-0.5 shadow-sm">
              <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  Mode Simulasi Interaktif CCTV Analitik Aktif
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold tracking-wider uppercase">
                  Zero Database • Serverless In-Memory
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Aplikasi berjalan mandiri tanpa database eksternal. Seluruh 7 kamera CCTV, generator event, validasi operator, penugasan petugas, hingga penutupan insiden 6 tahap dapat disimulasikan secara real-time.
              </p>
              {simToast && (
                <div className="mt-2 text-xs font-semibold text-teal-200 bg-teal-950/60 border border-teal-500/40 px-3 py-1 rounded-lg inline-flex items-center gap-1.5 animate-fadeIn">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                  {simToast}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs shadow-md hover:shadow-teal-500/20 transition-all disabled:opacity-50"
              title="Picu event deteksi baru secara instan pada kamera online"
            >
              <Sparkles className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
              <span>{simulating ? 'Menstimulasi Event...' : 'Picu Simulasi Event Baru'}</span>
            </button>
          </div>
        </div>

        {/* KPI Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Kamera Aktif"
            value={summary?.total_cameras ?? '-'}
            badge={`${summary?.online_cameras ?? 0} ONLINE`}
            badgeColor="emerald"
            subtitle={`${summary?.offline_cameras ?? 0} kamera offline`}
            icon={<Cctv className="w-5 h-5 text-teal-600" />}
          />

          <StatCard
            title="Event Deteksi Hari Ini"
            value={summary?.events_today ?? '-'}
            badge={summary?.pending_events ? `${summary.pending_events} MENUNGGU` : 'TERVERIFIKASI'}
            badgeColor={summary?.pending_events ? 'amber' : 'emerald'}
            subtitle="Diperbarui otomatis dari sensor CCTV"
            icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          />

          <StatCard
            title="Insiden Terbuka"
            value={summary?.open_incidents ?? '-'}
            badge="AKTIF"
            badgeColor="rose"
            subtitle="Memerlukan tindakan petugas lapangan"
            icon={<ClipboardList className="w-5 h-5 text-rose-500" />}
          />

          <StatCard
            title="Rata-rata Respon"
            value={`${summary?.avg_response_time_minutes ?? 0} mnt`}
            badge={`FA Rate: ${summary?.false_alarm_rate_percent ?? 0}%`}
            badgeColor="blue"
            subtitle="Waktu tanggap petugas lapangan"
            icon={<Clock className="w-5 h-5 text-blue-500" />}
          />
        </div>

        {/* Live CCTV Grid Preview (3x2 or responsive) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-teal-700" />
              <h3 className="font-extrabold text-base text-[#0B1C30]">
                Live Grid CCTV Analitik Terpilih
              </h3>
            </div>
            <Link
              href="/cctv"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors"
            >
              Lihat Semua Kamera ({cameras.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameras.slice(0, 6).map((cam) => (
              <div
                key={cam.id}
                className="group rounded-xl border border-slate-200 overflow-hidden bg-slate-900 relative aspect-video flex flex-col justify-between p-3 text-white shadow-sm"
              >
                {/* Simulated CCTV Stream Background */}
                <div className="absolute inset-0 bg-slate-950 flex items-center justify-center -z-10">
                  {cam.status === 'online' ? (
                    <div className="w-full h-full relative overflow-hidden bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                      {/* Grid Lines Overlay */}
                      <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                      {/* Simulation Reticle */}
                      <div className="absolute w-28 h-20 border border-teal-400/50 rounded flex items-start justify-end p-1">
                        <span className="text-[9px] font-mono text-teal-300 bg-teal-950/80 px-1 rounded">
                          DETECTION: 94%
                        </span>
                      </div>
                      <Cctv className="w-12 h-12 text-slate-700/60" />
                      <div className="absolute bottom-2 left-2 text-[10px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded">
                        ● LIVE STREAM [SIMULASI]
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900 p-4 text-center">
                      <Cctv className="w-8 h-8 mb-2 text-slate-600" />
                      <span className="text-xs font-semibold text-slate-400">
                        {cam.status === 'offline' ? 'Koneksi Kamera Terputus (Offline)' : 'Kamera Nonaktif'}
                      </span>
                      <span className="text-[10px] text-slate-600 mt-1">Bukti stream tidak tersedia</span>
                    </div>
                  )}
                </div>

                {/* Top Info */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-xs font-bold bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded-md truncate max-w-[70%]">
                    {cam.nama}
                  </span>
                  <StatusBadge type="camera" value={cam.status} />
                </div>

                {/* Bottom Address */}
                <div className="z-10 bg-black/70 backdrop-blur-sm p-2 rounded-lg text-[11px] text-slate-300 truncate">
                  {cam.alamat}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Layout: Recent Events & Incident Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Detection Events Feed (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-base text-[#0B1C30]">
                    Peringatan & Event Deteksi Terbaru
                  </h3>
                </div>
                <Link
                  href="/events"
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                >
                  Buka Modul Validasi <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {recentEvents.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Belum ada event deteksi yang tercatat.
                  </div>
                ) : (
                  recentEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            ev.jenis === 'accident'
                              ? 'bg-rose-100 text-rose-700'
                              : ev.jenis === 'fire'
                              ? 'bg-red-100 text-red-700'
                              : ev.jenis === 'crowd'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-sm text-slate-900 capitalize">
                              {ev.jenis.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              Skor: {(ev.skor * 100).toFixed(1)}%
                            </span>
                            <StatusBadge type="event" value={ev.validasi} />
                          </div>
                          <p className="text-xs text-slate-600 font-medium">{ev.camera_nama}</p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(ev.waktu_deteksi).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!ev.validasi && (
                          <>
                            <button
                              onClick={() => handleValidate(ev.id, 'valid')}
                              disabled={validatingId === ev.id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Valid
                            </button>
                            <button
                              onClick={() => handleValidate(ev.id, 'false_alarm')}
                              disabled={validatingId === ev.id}
                              className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              False
                            </button>
                          </>
                        )}

                        <Link
                          href={`/events/${ev.id}`}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-500 font-medium">
                Label Data: Seluruh event deteksi bersumber dari Simulator & Video Sampel [SIMULASI]
              </span>
            </div>
          </div>

          {/* Incident Type & Status Distribution (1 Col) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <TrendingUp className="w-5 h-5 text-teal-700" />
                <h3 className="font-extrabold text-base text-[#0B1C30]">
                  Distribusi Insiden Terbuka
                </h3>
              </div>

              {/* By Status */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Berdasarkan Status SOP
                </p>
                <div className="space-y-2">
                  {incidentsStats?.by_status.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <StatusBadge type="incident" value={item.name} />
                      </div>
                      <span className="text-slate-800 font-extrabold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Severity */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Berdasarkan Tingkat Keparahan
                </p>
                <div className="space-y-2">
                  {incidentsStats?.by_keparahan.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                      <StatusBadge type="severity" value={item.name} />
                      <span className="text-slate-800 font-extrabold">{item.count} Insiden</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/incidents"
              className="w-full text-center py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              Kelola Seluruh Insiden Lapangan
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

