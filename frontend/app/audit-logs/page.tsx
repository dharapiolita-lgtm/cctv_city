'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { AuditLog } from '@/types';
import {
  ShieldCheck,
  Search,
  Filter,
  Lock,
  Eye,
  Calendar,
  X,
  FileCode2,
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [aksiFilter, setAksiFilter] = useState<string>('all');
  const [objekFilter, setObjekFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      let url = '/audit-logs?per_page=100';
      if (aksiFilter !== 'all') url += `&aksi=${aksiFilter}`;
      if (objekFilter !== 'all') url += `&objek_tipe=${objekFilter}`;
      const res = await api.get<{ data: AuditLog[] }>(url);
      setLogs(res.data || []);
    } catch (err) {
      console.error('Gagal mengambil audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [aksiFilter, objekFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <AppShell
      title="Audit Trail & Rekam Jejak Sistem"
      subtitle="Pencatatan Seluruh Transaksi & Aksi Pengguna Command Center Secara Permanen (Insert-Only)"
      onRefresh={fetchLogs}
      allowedRoles={['admin']}
    >
      <div className="space-y-6">
        {/* Integrity Notice Banner */}
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-teal-700 shrink-0" />
            <div>
              <p className="font-extrabold text-sm">Integritas Audit Trail Terjamin</p>
              <p className="text-xs text-teal-700">
                Log ini bersifat insert-only. Tidak tersedia fitur modifikasi atau penghapusan catatan dari aplikasi.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-teal-100 text-teal-800 px-3 py-1 rounded-full border border-teal-300 shrink-0">
            READ-ONLY ARCHIVE
          </span>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={aksiFilter}
              onChange={(e) => setAksiFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">Semua Jenis Aksi</option>
              <option value="LOGIN_SUCCESS">LOGIN SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN FAILED</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="VALIDASI_EVENT">VALIDASI EVENT</option>
              <option value="CREATE_INCIDENT">CREATE INCIDENT</option>
              <option value="ASSIGN_INCIDENT">ASSIGN INCIDENT</option>
              <option value="UPDATE_INCIDENT_STATUS">UPDATE INCIDENT STATUS</option>
              <option value="CREATE_CAMERA">CREATE CAMERA</option>
              <option value="UPDATE_CAMERA">UPDATE CAMERA</option>
              <option value="CREATE_USER">CREATE USER</option>
            </select>

            <select
              value={objekFilter}
              onChange={(e) => setObjekFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <option value="all">Semua Tipe Objek</option>
              <option value="user">User</option>
              <option value="camera">Camera</option>
              <option value="detection_event">Detection Event</option>
              <option value="incident">Incident</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Menampilkan {logs.length} catatan aktivitas terbaru
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Waktu Kejadian</th>
                  <th className="py-3.5 px-5">Pelaku / Aktor</th>
                  <th className="py-3.5 px-5">Aksi / Tindakan</th>
                  <th className="py-3.5 px-5">Objek Entitas</th>
                  <th className="py-3.5 px-5">IP Address</th>
                  <th className="py-3.5 px-5 text-right">Detail Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Tidak ada catatan audit yang cocok.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5 text-slate-500 font-mono text-[11px]">
                        {new Date(log.waktu).toLocaleString('id-ID')}
                      </td>

                      <td className="py-4 px-5">
                        {log.user_nama ? (
                          <div>
                            <span className="font-bold text-slate-900 block">{log.user_nama}</span>
                            <span className="text-[10px] text-slate-400 font-mono">@{log.username}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sistem / Anonim</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {log.aksi}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="text-slate-700 capitalize font-medium">{log.objek_tipe}</span>
                      </td>

                      <td className="py-4 px-5 font-mono text-slate-500 text-[11px]">
                        {log.ip || '127.0.0.1'}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[11px]"
                        >
                          <FileCode2 className="w-3.5 h-3.5" />
                          JSON
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal JSON Detail */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-teal-700" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Audit Payload: {selectedLog.aksi}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto max-h-80 border border-slate-800">
                <pre>{JSON.stringify(selectedLog.detail, null, 2)}</pre>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Objek ID: {selectedLog.objek_id || '-'}</span>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

