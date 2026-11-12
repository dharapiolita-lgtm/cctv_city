'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { DetectionEvent, UserProfile } from '@/types';
import {
  AlertTriangle,
  Cctv,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Send,
  ArrowLeft,
  ShieldAlert,
  FileCheck2,
} from 'lucide-react';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<DetectionEvent | null>(null);
  const [officers, setOfficers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Validation state
  const [validating, setValidating] = useState<boolean>(false);

  // Form state
  const [jenis, setJenis] = useState<string>('');
  const [keparahan, setKeparahan] = useState<string>('sedang');
  const [petugasId, setPetugasId] = useState<string>('');
  const [lokasi, setLokasi] = useState<string>('');
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);

  const fetchEventAndOfficers = useCallback(async () => {
    try {
      const [ev, offRes] = await Promise.all([
        api.get<DetectionEvent>(`/events/${params.id}`),
        api.get<{ data: UserProfile[] }>('/users?role=petugas&aktif=true'),
      ]);

      setEvent(ev);
      setOfficers(offRes.data || []);

      // Prefill form values
      const jenisNama =
        ev.jenis === 'accident'
          ? 'Kecelakaan Lalu Lintas'
          : ev.jenis === 'fire'
          ? 'Kebakaran / Titik Api'
          : ev.jenis === 'crowd'
          ? 'Kerumunan Tidak Berizin'
          : 'Aktivitas Mencurigakan';

      setJenis(jenisNama);
      setLokasi(ev.camera_alamat);
      setDeskripsi(`[SIMULASI] Terdeteksi kejadian ${ev.jenis} di area pemantauan ${ev.camera_nama}. Tingkat keyakinan sensor ${(ev.skor * 100).toFixed(1)}%.`);
      if (offRes.data && offRes.data.length > 0) {
        setPetugasId(offRes.data[0].id);
      }
    } catch (err: any) {
      console.error('Gagal memuat detail event:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchEventAndOfficers();
  }, [fetchEventAndOfficers]);

  const handleValidate = async (validasi: 'valid' | 'false_alarm') => {
    setValidating(true);
    setFormError(null);
    try {
      await api.post(`/events/${params.id}/validate`, { validasi });
      await fetchEventAndOfficers();
    } catch (err: any) {
      alert(`Validasi gagal: ${err.message}`);
    } finally {
      setValidating(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenis.trim() || !lokasi.trim() || !deskripsi.trim()) {
      setFormError('Semua field wajib diisi.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res: any = await api.post('/incidents', {
        event_id: params.id,
        jenis: jenis.trim(),
        keparahan,
        lokasi: lokasi.trim(),
        deskripsi: deskripsi.trim(),
        ditugaskan_ke: petugasId || null,
      });

      setCreatedIncidentId(res.id);
      await fetchEventAndOfficers();
    } catch (err: any) {
      setFormError(err.message || 'Gagal membuat insiden.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !event) {
    return (
      <AppShell title="Detail Event Deteksi" allowedRoles={['admin', 'operator']}>
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-semibold">Memuat bukti dan detail event...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Detail Event: ${event.jenis.toUpperCase()}`}
      subtitle={`Kamera: ${event.camera_nama}`}
      allowedRoles={['admin', 'operator']}
    >
      <div className="space-y-6">
        {/* Back navigation */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Event
        </Link>

        {/* Success Banner if Incident Created */}
        {createdIncidentId && (
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <FileCheck2 className="w-6 h-6 text-teal-700 shrink-0" />
              <div>
                <p className="font-bold text-sm">Insiden Berhasil Dibuat!</p>
                <p className="text-xs text-teal-700">
                  Tiket telah diterbitkan dan ditugaskan ke petugas lapangan.
                </p>
              </div>
            </div>
            <Link
              href={`/incidents/${createdIncidentId}`}
              className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition-colors shrink-0"
            >
              Lihat Progres Insiden →
            </Link>
          </div>
        )}

        {/* Two Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Evidence & Camera Metadata (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-teal-700" />
                <h3 className="font-extrabold text-base text-[#0B1C30]">
                  Bukti Snapshot & Konteks Deteksi
                </h3>
              </div>
              <StatusBadge type="event" value={event.validasi} />
            </div>

            {/* Snapshot Video Placeholder */}
            <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative border border-slate-200 flex flex-col justify-between p-3 text-white">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]" />
                <div className="border-2 border-dashed border-teal-400/80 rounded-xl px-4 py-3 text-center bg-teal-950/60 backdrop-blur-sm">
                  <p className="text-xs font-mono font-bold text-teal-300 uppercase tracking-wider">
                    DETEKSI SIMULASI: {event.jenis}
                  </p>
                  <p className="text-[11px] font-mono text-slate-300 mt-1">
                    CONFIDENCE: {(event.skor * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="z-10 flex items-center justify-between">
                <span className="text-xs font-bold bg-black/80 px-2.5 py-1 rounded-md">
                  {event.camera_nama}
                </span>
                <span className="text-[10px] font-mono bg-black/80 text-teal-300 px-2 py-0.5 rounded">
                  SNAPSHOT BUKTI [SIMULASI]
                </span>
              </div>

              <div className="z-10 text-[11px] bg-black/80 p-2 rounded-md text-slate-300">
                Waktu Deteksi: {new Date(event.waktu_deteksi).toLocaleString('id-ID')}
              </div>
            </div>

            {/* Camera & Detection Specs */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Titik Lokasi
                </span>
                <p className="font-semibold text-slate-900">{event.camera_alamat}</p>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Koordinat: {event.camera_lokasi_lat.toFixed(4)}, {event.camera_lokasi_lng.toFixed(4)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Tingkat Kepercayaan AI
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-extrabold text-teal-700">
                    {(event.skor * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Ambang: 60.0%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full"
                    style={{ width: `${Math.round(event.skor * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Validation Action Section */}
            {!event.validasi ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-amber-900">Validasi Diperlukan</p>
                  <p className="text-[11px] text-amber-700">
                    Pastikan rekaman visual benar sebelum membuat insiden.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleValidate('valid')}
                    disabled={validating}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Tandai VALID
                  </button>
                  <button
                    onClick={() => handleValidate('false_alarm')}
                    disabled={validating}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    FALSE ALARM
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700">Status Validasi: </span>
                  <span className="font-extrabold uppercase text-slate-900">{event.validasi}</span>
                  {event.validator_nama && <span> oleh {event.validator_nama}</span>}
                </div>
                <span className="text-[11px] text-slate-400">
                  {event.divalidasi_pada ? new Date(event.divalidasi_pada).toLocaleString('id-ID') : ''}
                </span>
              </div>
            )}
          </div>

          {/* Right Panel: Incident Creation Form (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
                <FileCheck2 className="w-5 h-5 text-teal-700" />
                <h3 className="font-extrabold text-base text-[#0B1C30]">
                  Formulir Pembuatan Insiden
                </h3>
              </div>

              {event.has_incident ? (
                <div className="p-6 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-center">
                  <p className="font-bold text-sm mb-1">Event Telah Memiliki Insiden Aktif</p>
                  <p className="text-xs text-purple-700 mb-4">
                    Sesuai aturan PRD, satu event hanya dapat menghasilkan satu tiket insiden.
                  </p>
                  {event.incident_id && (
                    <Link
                      href={`/incidents/${event.incident_id}`}
                      className="inline-block px-4 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition-colors"
                    >
                      Buka Detail Insiden Terkait
                    </Link>
                  )}
                </div>
              ) : event.validasi === 'false_alarm' ? (
                <div className="p-6 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-center">
                  <p className="font-bold text-sm mb-1">Event Ditandai False Alarm</p>
                  <p className="text-xs text-slate-500">
                    Event yang bernilai false alarm tidak dapat dikonversi menjadi insiden lapangan.
                  </p>
                </div>
              ) : !event.validasi ? (
                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-center">
                  <p className="font-bold text-sm mb-1">Menunggu Validasi Operator</p>
                  <p className="text-xs text-amber-700">
                    Silakan klik tombol "Tandai VALID" pada panel kiri terlebih dahulu untuk mengaktifkan form pembuatan insiden.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
                  {formError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Judul / Jenis Insiden
                    </label>
                    <input
                      type="text"
                      value={jenis}
                      onChange={(e) => setJenis(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Tingkat Keparahan
                      </label>
                      <select
                        value={keparahan}
                        onChange={(e) => setKeparahan(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="rendah">RENDAH</option>
                        <option value="sedang">SEDANG</option>
                        <option value="tinggi">TINGGI</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Tugaskan Petugas
                      </label>
                      <select
                        value={petugasId}
                        onChange={(e) => setPetugasId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="">Pilih Petugas Lapangan...</option>
                        {officers.map((off) => (
                          <option key={off.id} value={off.id}>
                            {off.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Lokasi Kejadian
                    </label>
                    <input
                      type="text"
                      value={lokasi}
                      onChange={(e) => setLokasi(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Instruksi & Catatan Lapangan
                    </label>
                    <textarea
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-900/20 transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? 'Memproses Penugasan...' : 'Terbitkan & Tugaskan Insiden'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
              Workflow SOP: BARU → DITUGASKAN → DITERIMA → DI LOKASI → SELESAI → DITUTUP
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

