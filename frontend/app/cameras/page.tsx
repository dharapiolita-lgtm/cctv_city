'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Camera } from '@/types';
import {
  Video,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  PowerOff,
  MapPin,
  X,
} from 'lucide-react';

export default function CameraManagementPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [cameras, setCameras] = useState<Camera[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [formNama, setFormNama] = useState<string>('');
  const [formAlamat, setFormAlamat] = useState<string>('');
  const [formLat, setFormLat] = useState<string>('-5.4265');
  const [formLng, setFormLng] = useState<string>('105.2582');
  const [formStream, setFormStream] = useState<string>('');
  const [formStatus, setFormStatus] = useState<string>('online');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCameras = useCallback(async () => {
    try {
      let url = '/cameras?per_page=100';
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
  }, [fetchCameras]);

  const openCreateModal = () => {
    setEditingCamera(null);
    setFormNama('');
    setFormAlamat('');
    setFormLat('-5.4265');
    setFormLng('105.2582');
    setFormStream('rtsp://demo-stream/cctv');
    setFormStatus('online');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cam: Camera) => {
    setEditingCamera(cam);
    setFormNama(cam.nama);
    setFormAlamat(cam.alamat);
    setFormLat(cam.lokasi_lat.toString());
    setFormLng(cam.lokasi_lng.toString());
    setFormStream(cam.sumber_stream || cam.sample_video_path || '');
    setFormStatus(cam.status);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formAlamat.trim()) {
      setErrorMsg('Nama kamera dan alamat wajib diisi.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      nama: formNama.trim(),
      alamat: formAlamat.trim(),
      lokasi_lat: parseFloat(formLat) || -5.4265,
      lokasi_lng: parseFloat(formLng) || 105.2582,
      sumber_stream: formStream.trim() || null,
      status: formStatus,
    };

    try {
      if (editingCamera) {
        await api.put(`/cameras/${editingCamera.id}`, payload);
      } else {
        await api.post('/cameras', payload);
      }
      setIsModalOpen(false);
      await fetchCameras();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan kamera.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (cam: Camera) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan kamera "${cam.nama}"?`)) return;
    try {
      await api.patch(`/cameras/${cam.id}/deactivate`);
      await fetchCameras();
    } catch (err: any) {
      alert(`Gagal menonaktifkan kamera: ${err.message}`);
    }
  };

  const handleToggleStatus = async (cam: Camera) => {
    const nextStatus = cam.status === 'online' ? 'offline' : 'online';
    try {
      await api.patch(`/cameras/${cam.id}/status`, { status: nextStatus });
      await fetchCameras();
    } catch (err: any) {
      alert(`Gagal mengubah status kamera: ${err.message}`);
    }
  };

  return (
    <AppShell
      title="Manajemen Kamera CCTV Kota"
      subtitle={
        isAdmin
          ? 'Konfigurasi, Registrasi Titik Kamera, dan Pemeliharaan Sinyal RTSP'
          : 'Daftar Monitoring Status Koneksi Seluruh Kamera Kota (Read-Only)'
      }
      onRefresh={fetchCameras}
      allowedRoles={['admin', 'operator']}
    >
      <div className="space-y-6">
        {/* Controls Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
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
                {st === 'all' ? 'Semua' : st.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau alamat..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            {isAdmin && (
              <button
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Tambah Kamera
              </button>
            )}
          </div>
        </div>

        {/* Cameras Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Nama Kamera</th>
                  <th className="py-3.5 px-5">Alamat / Wilayah</th>
                  <th className="py-3.5 px-5">Koordinat (Lat, Lng)</th>
                  <th className="py-3.5 px-5">Status Koneksi</th>
                  <th className="py-3.5 px-5">Terakhir Aktif</th>
                  {isAdmin && <th className="py-3.5 px-5 text-right">Aksi Kelola</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cameras.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Tidak ada data kamera yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  cameras.map((cam) => (
                    <tr key={cam.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-teal-700 shrink-0" />
                          <span>{cam.nama}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-600 max-w-xs truncate">{cam.alamat}</td>
                      <td className="py-4 px-5 font-mono text-[11px] text-slate-500">
                        {cam.lokasi_lat.toFixed(4)}, {cam.lokasi_lng.toFixed(4)}
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge type="camera" value={cam.status} />
                      </td>
                      <td className="py-4 px-5 text-slate-500 text-[11px]">
                        {cam.last_seen_at ? new Date(cam.last_seen_at).toLocaleString('id-ID') : '-'}
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(cam)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                              title={cam.status === 'online' ? 'Set Offline' : 'Set Online'}
                            >
                              <PowerOff className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditModal(cam)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                              title="Ubah Data Kamera"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {cam.status !== 'nonaktif' && (
                              <button
                                onClick={() => handleDeactivate(cam)}
                                className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                                title="Nonaktifkan Kamera"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form Tambah / Edit Kamera */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingCamera ? 'Ubah Data Kamera CCTV' : 'Tambah Kamera CCTV Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSaveCamera} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Kamera
                  </label>
                  <input
                    type="text"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    required
                    placeholder="Contoh: CCTV-08 Perempatan Mall Boemi Kedaton"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Alamat Lengkap Lokasi
                  </label>
                  <textarea
                    value={formAlamat}
                    onChange={(e) => setFormAlamat(e.target.value)}
                    required
                    rows={2}
                    placeholder="Contoh: Jl. Teuku Umar No. 1, Kedaton, Bandar Lampung"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formLng}
                      onChange={(e) => setFormLng(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Sumber Stream RTSP
                    </label>
                    <input
                      type="text"
                      value={formStream}
                      onChange={(e) => setFormStream(e.target.value)}
                      placeholder="rtsp://demo-stream/cctv08"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Status Kamera
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                    >
                      <option value="online">ONLINE</option>
                      <option value="offline">OFFLINE</option>
                      <option value="nonaktif">NONAKTIF</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold disabled:opacity-60"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan Data Kamera'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

