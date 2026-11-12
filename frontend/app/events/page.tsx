'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { DetectionEvent, Camera } from '@/types';
import {
  AlertTriangle,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  FilePlus,
  RefreshCw,
  Search,
} from 'lucide-react';

export default function DetectionEventsPage() {
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [validasiFilter, setValidasiFilter] = useState<string>('all');
  const [jenisFilter, setJenisFilter] = useState<string>('all');
  const [cameraFilter, setCameraFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      let url = '/events?per_page=50';
      if (validasiFilter !== 'all') url += `&validasi=${validasiFilter}`;
      if (jenisFilter !== 'all') url += `&jenis=${jenisFilter}`;
      if (cameraFilter !== 'all') url += `&camera_id=${cameraFilter}`;

      const [evRes, camRes] = await Promise.all([
        api.get<{ data: DetectionEvent[] }>(url),
        api.get<{ data: Camera[] }>('/cameras?per_page=100'),
      ]);

      setEvents(evRes.data || []);
      setCameras(camRes.data || []);
    } catch (err) {
      console.error('Gagal mengambil daftar event:', err);
    } finally {
      setLoading(false);
    }
  }, [validasiFilter, jenisFilter, cameraFilter]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const handleValidate = async (id: string, validasi: 'valid' | 'false_alarm') => {
    setValidatingId(id);
    try {
      await api.post(`/events/${id}/validate`, { validasi });
      await fetchEvents();
    } catch (err: any) {
      alert(`Validasi gagal: ${err.message || 'Konflik validasi'}`);
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <AppShell
      title="Daftar Deteksi Event CCTV Analitik"
      subtitle="Verifikasi Peringatan Masuk, Tentukan Validitas, dan Teruskan Menjadi Insiden Lapangan"
      onRefresh={fetchEvents}
      allowedRoles={['admin', 'operator']}
    >
      <div className="space-y-6">
        {/* Filters and Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Validasi:
            </span>
            {[
              { id: 'all', label: 'Semua Event' },
              { id: 'pending', label: 'Menunggu' },
              { id: 'valid', label: 'VALID' },
              { id: 'false_alarm', label: 'FALSE ALARM' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setValidasiFilter(v.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  validasiFilter === v.id
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Filter Jenis */}
            <select
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">Semua Jenis Kejadian</option>
              <option value="accident">Kecelakaan (Accident)</option>
              <option value="fire">Kebakaran (Fire)</option>
              <option value="crowd">Kerumunan (Crowd)</option>
              <option value="suspicious_activity">Aktivitas Mencurigakan</option>
            </select>

            {/* Filter Kamera */}
            <select
              value={cameraFilter}
              onChange={(e) => setCameraFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 max-w-[200px] truncate"
            >
              <option value="all">Semua Titik Kamera</option>
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Jenis Kejadian</th>
                  <th className="py-3.5 px-5">Kamera Sumber</th>
                  <th className="py-3.5 px-5">Waktu Deteksi</th>
                  <th className="py-3.5 px-5">Confidence Score</th>
                  <th className="py-3.5 px-5">Status Validasi</th>
                  <th className="py-3.5 px-5">Status Insiden</th>
                  <th className="py-3.5 px-5 text-right">Aksi Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Tidak ada event deteksi yang memenuhi filter.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              ev.jenis === 'accident'
                                ? 'bg-rose-100 text-rose-700'
                                : ev.jenis === 'fire'
                                ? 'bg-red-100 text-red-700'
                                : ev.jenis === 'crowd'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                          <span className="font-bold text-slate-900 capitalize">
                            {ev.jenis.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <p className="font-semibold text-slate-800">{ev.camera_nama}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{ev.camera_alamat}</p>
                      </td>

                      <td className="py-4 px-5 text-slate-600 font-medium">
                        {new Date(ev.waktu_deteksi).toLocaleString('id-ID')}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span className="w-12 h-1.5 rounded-full bg-slate-200 overflow-hidden inline-block">
                            <span
                              className="h-full bg-teal-600 block rounded-full"
                              style={{ width: `${Math.round(ev.skor * 100)}%` }}
                            />
                          </span>
                          <span>{(ev.skor * 100).toFixed(1)}%</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <StatusBadge type="event" value={ev.validasi} />
                        {ev.validator_nama && (
                          <p className="text-[10px] text-slate-400 mt-0.5">Oleh: {ev.validator_nama}</p>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {ev.has_incident ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                            Sudah Jadi Insiden
                          </span>
                        ) : ev.validasi === 'valid' ? (
                          <Link
                            href={`/events/${ev.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full hover:bg-teal-100"
                          >
                            <FilePlus className="w-3 h-3" /> Buat Insiden
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!ev.validasi && (
                            <>
                              <button
                                onClick={() => handleValidate(ev.id, 'valid')}
                                disabled={validatingId === ev.id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Valid
                              </button>
                              <button
                                onClick={() => handleValidate(ev.id, 'false_alarm')}
                                disabled={validatingId === ev.id}
                                className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                False
                              </button>
                            </>
                          )}

                          <Link
                            href={`/events/${ev.id}`}
                            className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                            title="Buka Detail & Form Insiden"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

