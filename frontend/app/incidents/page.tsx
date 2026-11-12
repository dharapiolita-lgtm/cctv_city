'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { Incident } from '@/types';
import {
  ClipboardList,
  Filter,
  Eye,
  Search,
  UserCheck,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [keparahanFilter, setKeparahanFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchIncidents = useCallback(async () => {
    try {
      let url = '/incidents?per_page=50';
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (keparahanFilter !== 'all') url += `&keparahan=${keparahanFilter}`;

      const res = await api.get<{ data: Incident[] }>(url);
      setIncidents(res.data || []);
    } catch (err) {
      console.error('Gagal mengambil daftar insiden:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, keparahanFilter]);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  return (
    <AppShell
      title="Daftar Insiden dan Tindak Lanjut"
      subtitle="Manajemen Penugasan Petugas Lapangan dan Pemantauan Status Penanganan SOP"
      onRefresh={fetchIncidents}
      allowedRoles={['admin', 'operator']}
    >
      <div className="space-y-6">
        {/* Filter and Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status SOP:
            </span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'baru', label: 'Baru' },
              { id: 'ditugaskan', label: 'Ditugaskan' },
              { id: 'diterima', label: 'Diterima' },
              { id: 'di_lokasi', label: 'Di Lokasi' },
              { id: 'selesai', label: 'Selesai' },
              { id: 'ditutup', label: 'Ditutup' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                  statusFilter === st.id
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
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
        </div>

        {/* Incidents Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Jenis Insiden</th>
                  <th className="py-3.5 px-5">Lokasi / Sektor</th>
                  <th className="py-3.5 px-5">Keparahan</th>
                  <th className="py-3.5 px-5">Status Alur SOP</th>
                  <th className="py-3.5 px-5">Petugas Ditugaskan</th>
                  <th className="py-3.5 px-5">Waktu Lapor</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Tidak ada insiden yang memenuhi kriteria filter.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-teal-700 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900 block">{inc.jenis}</span>
                            <span className="text-[10px] text-slate-400 font-mono truncate block max-w-[150px]">
                              ID: {inc.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-slate-600 max-w-xs truncate font-medium">
                        {inc.lokasi}
                      </td>

                      <td className="py-4 px-5">
                        <StatusBadge type="severity" value={inc.keparahan} />
                      </td>

                      <td className="py-4 px-5">
                        <StatusBadge type="incident" value={inc.status} />
                      </td>

                      <td className="py-4 px-5">
                        {inc.petugas_nama ? (
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                            {inc.petugas_nama}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Belum Ditugaskan</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-slate-500 font-medium text-[11px]">
                        {new Date(inc.dibuat_pada).toLocaleString('id-ID')}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/incidents/${inc.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Timeline
                        </Link>
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

