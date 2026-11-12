'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Incident } from '@/types';
import {
  ClipboardList,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
  RefreshCw,
} from 'lucide-react';

export default function OfficerDashboardPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [catatan, setCatatan] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchMyIncidents = useCallback(async () => {
    try {
      const res = await api.get<{ data: Incident[] }>('/incidents?per_page=50');
      setIncidents(res.data || []);
      if (res.data && res.data.length > 0 && !selectedIncident) {
        setSelectedIncident(res.data[0]);
      }
    } catch (err) {
      console.error('Gagal mengambil penugasan petugas:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedIncident]);

  useEffect(() => {
    fetchMyIncidents();
    const timer = setInterval(fetchMyIncidents, 15000);
    return () => clearInterval(timer);
  }, [fetchMyIncidents]);

  const handleAdvanceStatus = async (targetStatus: string, defaultNote: string) => {
    if (!selectedIncident) return;
    setUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const noteToSend = catatan.trim() || defaultNote;

    try {
      await api.patch(`/incidents/${selectedIncident.id}/status`, {
        status: targetStatus,
        catatan: noteToSend,
      });
      setCatatan('');
      setSuccessMsg(`Status berhasil diperbarui ke: ${targetStatus.toUpperCase().replace('_', ' ')}`);
      await fetchMyIncidents();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui status. Periksa jaringan Anda dan coba lagi.');
    } finally {
      setUpdating(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <AppShell
      title="Beranda Penugasan Lapangan"
      subtitle={`Petugas Siaga: ${user?.nama || 'Petugas'} (Satpol PP / Unit Reaksi Cepat)`}
      onRefresh={fetchMyIncidents}
      allowedRoles={['petugas', 'admin']}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Officer Status Card */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#16375f] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 font-extrabold text-lg">
              URC
            </div>
            <div>
              <h2 className="text-lg font-extrabold">{user?.nama}</h2>
              <p className="text-xs text-slate-300">Unit Siaga Keamanan Kota Bandar Lampung</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-teal-300 block">Tugas Aktif</span>
              <span className="text-2xl font-black text-white">
                {incidents.filter((i) => i.status !== 'ditutup').length}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Notifications */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-900 font-bold ml-2 underline"
            >
              Tutup
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-teal-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Assigned Incidents List */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-base text-[#0B1C30] flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-700" />
            Daftar Insiden yang Ditugaskan
          </h3>

          {incidents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="font-bold text-slate-800 text-sm">Tidak ada insiden yang ditugaskan saat ini.</p>
              <p className="text-xs text-slate-500 mt-1">
                Kondisi wilayah kota aman dan terkendali. Tetap pantau sistem jika ada peringatan baru.
              </p>
            </div>
          ) : (
            incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`bg-white rounded-2xl border p-5 shadow-sm transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-md'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{inc.jenis}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {inc.lokasi}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge type="severity" value={inc.keparahan} />
                      <StatusBadge type="incident" value={inc.status} />
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200/70 mb-3">
                    {inc.deskripsi}
                  </p>

                  {/* Actions inside active incident */}
                  {isSelected && inc.status !== 'ditutup' && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Catatan Lapangan (Opsional):
                        </label>
                        <input
                          type="text"
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                          placeholder="Contoh: Tiba di simpang jalan, situasi kondusif..."
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {inc.status === 'ditugaskan' && (
                          <button
                            onClick={() => handleAdvanceStatus('diterima', 'Penugasan diterima oleh petugas lapangan.')}
                            disabled={updating}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Terima Penugasan
                          </button>
                        )}

                        {inc.status === 'diterima' && (
                          <button
                            onClick={() => handleAdvanceStatus('di_lokasi', 'Petugas telah sampai di tempat kejadian.')}
                            disabled={updating}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                          >
                            <MapPin className="w-4 h-4" />
                            Update: Tiba di Lokasi
                          </button>
                        )}

                        {inc.status === 'di_lokasi' && (
                          <button
                            onClick={() => handleAdvanceStatus('selesai', 'Penanganan insiden di lokasi telah selesai tuntas.')}
                            disabled={updating}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Selesaikan Insiden
                          </button>
                        )}

                        {inc.status === 'selesai' && (
                          <div className="w-full p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-bold">
                            Penanganan telah dilaporkan selesai. Menunggu penutupan tiket oleh Operator Command Center.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}

