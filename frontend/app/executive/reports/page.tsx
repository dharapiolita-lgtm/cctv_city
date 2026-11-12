'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { Incident } from '@/types';
import {
  FileBarChart2,
  Calendar,
  Filter,
  Download,
  Search,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function ExecutiveReportsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [keparahanFilter, setKeparahanFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReports = useCallback(async () => {
    try {
      let url = '/incidents?per_page=100';
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (keparahanFilter !== 'all') url += `&keparahan=${keparahanFilter}`;
      const res = await api.get<{ data: Incident[] }>(url);
      setIncidents(res.data || []);
    } catch (err) {
      console.error('Gagal mengambil laporan insiden:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, keparahanFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <AppShell
      title="Laporan & Rekapitulasi Insiden Kota"
      subtitle="Dokumentasi Audit dan Evaluasi Penanganan Kejadian Keamanan Kota Bandar Lampung"
      onRefresh={fetchReports}
      allowedRoles={['pimpinan', 'admin']}
    >
      <div className="space-y-6">
        {/* Filter and Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">Semua Status SOP</option>
              <option value="baru">Baru</option>
              <option value="ditugaskan">Ditugaskan</option>
              <option value="diterima">Diterima</option>
              <option value="di_lokasi">Di Lokasi</option>
              <option value="selesai">Selesai</option>
              <option value="ditutup">Ditutup</option>
            </select>

            <select
              value={keparahanFilter}
              onChange={(e) => setKeparahanFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">Semua Keparahan</option>
              <option value="rendah">Rendah</option>
              <option value="sedang">Sedang</option>
              <option value="tinggi">Tinggi</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total {incidents.length} insiden tercatat dalam database
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">ID Insiden</th>
                  <th className="py-3.5 px-5">Klasifikasi Kejadian</th>
                  <th className="py-3.5 px-5">Lokasi Terpantau</th>
                  <th className="py-3.5 px-5">Tingkat Bahaya</th>
                  <th className="py-3.5 px-5">Status Akhir</th>
                  <th className="py-3.5 px-5">Waktu Lapor</th>
                  <th className="py-3.5 px-5">Waktu Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Tidak ada laporan insiden yang cocok.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5 font-mono text-[11px] text-slate-500 font-bold">
                        {inc.id.substring(0, 8)}...
                      </td>

                      <td className="py-4 px-5 font-bold text-slate-900">{inc.jenis}</td>

                      <td className="py-4 px-5 text-slate-600 max-w-xs truncate">{inc.lokasi}</td>

                      <td className="py-4 px-5">
                        <StatusBadge type="severity" value={inc.keparahan} />
                      </td>

                      <td className="py-4 px-5">
                        <StatusBadge type="incident" value={inc.status} />
                      </td>

                      <td className="py-4 px-5 text-slate-500 text-[11px]">
                        {new Date(inc.dibuat_pada).toLocaleString('id-ID')}
                      </td>

                      <td className="py-4 px-5 text-slate-500 text-[11px]">
                        {inc.selesai_pada ? (
                          <span className="text-emerald-700 font-semibold">
                            {new Date(inc.selesai_pada).toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Dalam penanganan</span>
                        )}
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

