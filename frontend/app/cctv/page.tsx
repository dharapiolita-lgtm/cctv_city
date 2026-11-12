'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { Camera } from '@/types';
import {
  Cctv,
  Video,
  Search,
  Filter,
  Maximize2,
  RefreshCw,
  AlertCircle,
  MapPin,
  Calendar,
} from 'lucide-react';

export default function LiveCctvPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCam, setSelectedCam] = useState<Camera | null>(null);

  const fetchCameras = useCallback(async () => {
    try {
      let url = '/cameras?per_page=50';
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (search.trim()) url += `&q=${encodeURIComponent(search.trim())}`;
      const res = await api.get<{ data: Camera[] }>(url);
      setCameras(res.data || []);
    } catch (err) {
      console.error('Gagal mengambil data kamera:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 20000);
    return () => clearInterval(interval);
  }, [fetchCameras]);

  return (
    <AppShell
      title="Live CCTV Analitik Keamanan Kota"
      subtitle="Grid Pemantauan Aliran Kamera dan Deteksi Simulasi Wilayah Kota"
      onRefresh={fetchCameras}
      allowedRoles={['admin', 'operator']}
    >
      <div className="space-y-6">
        {/* Filters and Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Status:
            </span>
            {['all', 'online', 'offline', 'nonaktif'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? 'Semua Kamera' : st.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau lokasi CCTV..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Camera Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cameras.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <Cctv className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="font-bold text-slate-700">Tidak ada kamera yang cocok dengan kriteria.</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
            </div>
          ) : (
            cameras.map((cam) => (
              <div
                key={cam.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {/* 16:9 Video Simulation Area */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden flex flex-col justify-between p-3 text-white">
                  {cam.status === 'online' ? (
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                      {/* Grid simulation lines */}
                      <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]" />

                      {/* AI Bounding Box Simulator */}
                      <div className="absolute border border-teal-400/60 rounded px-2 py-1 text-[10px] font-mono text-teal-300 bg-teal-950/70">
                        ANALYTICS: ACTIVE
                      </div>

                      <Cctv className="w-14 h-14 text-slate-700/50" />

                      <div className="absolute bottom-2 left-2 text-[10px] font-mono text-emerald-400 bg-black/70 px-2 py-0.5 rounded flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        LIVE STREAM [SIMULASI]
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-4">
                      <AlertCircle className="w-8 h-8 text-rose-500/80 mb-2" />
                      <span className="text-xs font-bold text-slate-300">
                        {cam.status === 'offline' ? 'Kamera Terputus (Offline)' : 'Kamera Dinonaktifkan'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        Diagnostic: Sinyal RTSP tidak terdeteksi
                      </span>
                    </div>
                  )}

                  {/* Top Overlay */}
                  <div className="flex items-center justify-between z-10">
                    <span className="text-xs font-bold bg-black/80 px-2.5 py-1 rounded-md max-w-[70%] truncate">
                      {cam.nama}
                    </span>
                    <StatusBadge type="camera" value={cam.status} />
                  </div>

                  {/* Bottom Expand Button */}
                  <div className="z-10 flex justify-end">
                    <button
                      onClick={() => setSelectedCam(cam)}
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-slate-300 hover:text-white transition-colors"
                      title="Lihat Detail Metadata"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Camera Card Info */}
                <div className="p-4">
                  <div className="flex items-start gap-2 text-xs text-slate-600 mb-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{cam.alamat}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
                    <span>
                      Koordinat: {cam.lokasi_lat.toFixed(4)}, {cam.lokasi_lng.toFixed(4)}
                    </span>
                    <button
                      onClick={() => setSelectedCam(cam)}
                      className="font-bold text-teal-700 hover:text-teal-900"
                    >
                      Konfigurasi Stream
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Detail / Inspect */}
        {selectedCam && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Cctv className="w-5 h-5 text-teal-700" />
                  <h3 className="font-extrabold text-base text-slate-900">{selectedCam.nama}</h3>
                </div>
                <StatusBadge type="camera" value={selectedCam.status} />
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Alamat Lengkap
                  </span>
                  <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-medium">
                    {selectedCam.alamat}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Latitude</span>
                    <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono">
                      {selectedCam.lokasi_lat}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Longitude</span>
                    <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono">
                      {selectedCam.lokasi_lng}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Sumber Stream / Video Sampel
                  </span>
                  <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] truncate">
                    {selectedCam.sumber_stream || selectedCam.sample_video_path || 'rtsp://demo-stream/cctv'}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedCam(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
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

